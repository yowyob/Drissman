package com.drissman.kernel;

import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Synchronisation des comptes Drissman vers le kernel-core (comptes-miroirs).
 *
 * Chaque utilisateur Drissman possède un compte-miroir kernel dont le mot de
 * passe est DÉRIVÉ du secret serveur (HMAC) : rien n'est stocké, le mot de
 * passe est recalculable à la demande et toujours conforme à la politique
 * kernel (≥10 caractères, majuscule, minuscule, chiffre, symbole).
 *
 * La synchronisation est best-effort : une panne kernel ne bloque jamais
 * l'authentification locale Drissman.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelAuthService {

    private final KernelClient kernelClient;
    private final KernelTokenStore tokenStore;
    private final UserRepository userRepository;

    @Value("${jwt.secret}")
    private String derivationSecret;

    @Value("${kernel.tenant-id}")
    private String tenantId;

    /** Lance la synchronisation kernel sans bloquer le flux d'authentification. */
    public void syncUserInBackground(User user) {
        syncUser(user)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        v -> {
                        },
                        e -> log.warn("Sync kernel échouée pour {} : {}", user.getEmail(), e.getMessage()));
    }

    /**
     * Token kernel de l'utilisateur : depuis le cache, sinon re-login du
     * miroir (mot de passe dérivé). Mono vide si le kernel est indisponible
     * ou le miroir non vérifié — l'appelant doit traiter ce cas en best-effort.
     */
    public Mono<String> ensureToken(User user) {
        return Mono.justOrEmpty(tokenStore.get(user.getId()))
                .switchIfEmpty(
                        syncUser(user)
                                .then(Mono.defer(() -> Mono.justOrEmpty(tokenStore.get(user.getId()))))
                                .onErrorResume(e -> {
                                    log.debug("Token kernel indisponible pour {} : {}", user.getEmail(),
                                            e.getMessage());
                                    return Mono.empty();
                                }));
    }

    /**
     * Stratégie login-first : tente le login kernel avec le mot de passe dérivé ;
     * si le compte n'existe pas encore, le crée (sign-up) puis stocke le token.
     */
    Mono<Void> syncUser(User user) {
        String kernelPassword = derivedPassword(user.getId());
        return kernelLogin(user.getEmail(), kernelPassword)
                .onErrorResume(e -> {
                    log.info("Login kernel impossible pour {} ({}), tentative de sign-up",
                            user.getEmail(), e.getMessage());
                    return kernelSignUp(user, kernelPassword);
                })
                .flatMap(response -> storeSession(user, response))
                .then();
    }

    private Mono<KernelResponse> kernelLogin(String email, String password) {
        return kernelClient.post("/api/auth/login", Map.of(
                "principal", email,
                "password", password));
    }

    private Mono<KernelResponse> kernelSignUp(User user, String password) {
        Map<String, Object> body = new HashMap<>();
        body.put("tenantId", tenantId);
        body.put("firstName", user.getFirstName() != null ? user.getFirstName() : "Utilisateur");
        body.put("lastName", user.getLastName() != null ? user.getLastName() : "Drissman");
        body.put("username", kernelUsername(user));
        body.put("email", user.getEmail());
        body.put("password", password);
        body.put("accountType", "BUSINESS");
        body.put("businessType", "RETAIL");
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            body.put("phoneNumber", user.getPhone());
        }
        return kernelClient.post("/api/auth/sign-up", body);
    }

    /** Extrait token + id kernel de la réponse, persiste l'id et met le token en cache. */
    private Mono<User> storeSession(User user, KernelResponse response) {
        if (response.getData() == null) {
            log.warn("Réponse kernel sans data pour {} : {}", user.getEmail(), response.getMessage());
            return Mono.just(user);
        }

        String accessToken = response.getData().path("accessToken").asText(null);
        long ttl = response.getData().path("expiresInSeconds").asLong(900);
        if (accessToken != null && !accessToken.isBlank()) {
            tokenStore.put(user.getId(), accessToken, ttl);
        } else if ("EMAIL_VERIFICATION_REQUIRED".equals(response.getData().path("status").asText(""))) {
            // Compte-miroir créé mais en attente de vérification email côté kernel.
            // Le token sera obtenu au prochain login une fois l'email vérifié
            // (ou la vérification désactivée pour notre ClientApplication).
            log.info("Compte-miroir kernel créé pour {} — en attente de vérification email", user.getEmail());
        } else {
            log.warn("Pas d'accessToken kernel pour {} (nextStep={}, status={})",
                    user.getEmail(),
                    response.getData().path("nextStep").asText(""),
                    response.getData().path("status").asText(""));
        }

        String kernelId = response.getData().path("id").asText(null);
        if (kernelId != null && user.getKernelUserId() == null) {
            user.setKernelUserId(UUID.fromString(kernelId));
            return userRepository.save(user);
        }
        return Mono.just(user);
    }

    /**
     * Mot de passe du compte-miroir : HMAC-SHA256(secret serveur, userId).
     * Déterministe, jamais stocké, conforme à la politique kernel grâce au
     * suffixe garantissant chaque classe de caractères.
     */
    String derivedPassword(UUID userId) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(derivationSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(userId.toString().getBytes(StandardCharsets.UTF_8));
            String base = Base64.getUrlEncoder().withoutPadding().encodeToString(digest).substring(0, 20);
            return base + "!Aa1";
        } catch (Exception e) {
            throw new IllegalStateException("Dérivation du mot de passe kernel impossible", e);
        }
    }

    /** Username kernel unique et stable : partie locale de l'email + fragment de l'id. */
    private String kernelUsername(User user) {
        String local = user.getEmail().split("@")[0].replaceAll("[^a-zA-Z0-9._-]", "");
        return local + "-" + user.getId().toString().substring(0, 8);
    }
}
