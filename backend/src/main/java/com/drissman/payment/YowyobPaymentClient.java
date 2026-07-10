package com.drissman.payment;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Client du service Yowyob Payment (paiement en ligne).
 *
 * État v1 constaté le 2026-07-10 : MOMO/PAYPAL déclarés mais non supportés
 * (« Méthode de paiement non supportée en v1 ») ; STRIPE opérationnel via
 * Checkout. Modèle marketplace : la recharge crédite le wallet plateforme
 * Drissman, l'école est réglée ensuite (facturation Drissman↔école).
 *
 * Auth : compte de service (login → JWT ~24 h, mis en cache).
 */
@Component
@Slf4j
public class YowyobPaymentClient {

    private final WebClient webClient;
    private final String email;
    private final String password;
    private final String walletId;

    private record CachedToken(String token, Instant expiresAt) {
    }

    private final AtomicReference<CachedToken> cachedToken = new AtomicReference<>();

    public YowyobPaymentClient(
            WebClient.Builder builder,
            @Value("${payment.base-url:https://payment-dev.yowyob.com}") String baseUrl,
            @Value("${payment.email:}") String email,
            @Value("${payment.password:}") String password,
            @Value("${payment.wallet-id:}") String walletId) {
        this.webClient = builder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.email = email;
        this.password = password;
        this.walletId = walletId;
    }

    public boolean isConfigured() {
        return !email.isBlank() && !password.isBlank() && !walletId.isBlank();
    }

    /**
     * Démarre un paiement Stripe Checkout du montant donné (FCFA).
     * Retourne le JsonNode transaction : reference, status, stripeCheckoutUrl.
     */
    public Mono<JsonNode> startCardPayment(long amount) {
        return token().flatMap(t -> webClient.post()
                .uri("/api/v1/transactions/recharge")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + t)
                .bodyValue(Map.of("walletId", walletId, "amount", amount, "method", "STRIPE"))
                .retrieve()
                .bodyToMono(JsonNode.class));
    }

    /** Statut courant d'une transaction par sa référence. */
    public Mono<JsonNode> getByReference(String reference) {
        return token().flatMap(t -> webClient.get()
                .uri("/api/v1/transactions/reference/{ref}", reference)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + t)
                .retrieve()
                .bodyToMono(JsonNode.class));
    }

    private Mono<String> token() {
        CachedToken cached = cachedToken.get();
        if (cached != null && Instant.now().isBefore(cached.expiresAt())) {
            return Mono.just(cached.token());
        }
        return webClient.post()
                .uri("/api/v1/auth/login")
                .bodyValue(Map.of("email", email, "password", password))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(r -> {
                    String token = r.path("token").asText();
                    long ttlMs = r.path("expiresIn").asLong(3_600_000);
                    // Marge de 5 min sur l'expiration.
                    cachedToken.set(new CachedToken(token,
                            Instant.now().plusMillis(Math.max(ttlMs - 300_000, 60_000))));
                    return token;
                });
    }
}
