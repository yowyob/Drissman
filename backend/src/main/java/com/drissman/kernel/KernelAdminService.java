package com.drissman.kernel;

import com.drissman.domain.entity.School;
import com.drissman.domain.repository.SchoolRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Poste de pilotage administrateur du kernel : login MFA en deux temps,
 * puis provisionnement d'une école Drissman en organisation kernel
 * (business actor -> organisation -> souscription des services).
 *
 * La session admin (token 15 min) est conservée en mémoire du backend :
 * le frontend ne voit jamais les identifiants ni le token kernel.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelAdminService {

    private static final List<String> SERVICES = List.of("ACCOUNTING", "BILLING", "CASHIER", "HRM");

    private final KernelClient kernelClient;
    private final SchoolRepository schoolRepository;

    private volatile String pendingMfaToken;
    private volatile String adminToken;
    private volatile Instant adminTokenExpiry = Instant.EPOCH;

    /** Étape 1 : login kernel. Déclenche l'envoi du code MFA par email. */
    public Mono<Map<String, Object>> login(String principal, String password) {
        return kernelClient.post("/api/auth/login", Map.of(
                        "principal", principal,
                        "password", password))
                .map(response -> {
                    JsonNode data = response.getData();
                    if (data != null && "CONFIRM_MFA".equals(data.path("nextStep").asText(""))) {
                        pendingMfaToken = data.path("mfaToken").asText(null);
                        return Map.of(
                                "status", "MFA_REQUIRED",
                                "channel", data.path("channel").asText("EMAIL"),
                                "expiresInSeconds", data.path("expiresInSeconds").asLong(300),
                                "next", "POST /api/kernel/admin/mfa/confirm { \"code\": \"XXXXXX\" }");
                    }
                    return storeAdminToken(data);
                });
    }

    /** Étape 2 : confirmation du code MFA reçu par email. */
    public Mono<Map<String, Object>> confirmMfa(String code) {
        String mfaToken = pendingMfaToken;
        if (mfaToken == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aucun défi MFA en attente — appelez d'abord /api/kernel/admin/login"));
        }
        return kernelClient.post("/api/auth/login/mfa/confirm", Map.of(
                        "mfaToken", mfaToken,
                        "code", code))
                .map(response -> {
                    pendingMfaToken = null;
                    return storeAdminToken(response.getData());
                });
    }

    public Map<String, Object> status() {
        boolean connected = adminToken != null && Instant.now().isBefore(adminTokenExpiry);
        long remaining = connected ? Instant.now().until(adminTokenExpiry, java.time.temporal.ChronoUnit.SECONDS) : 0;
        return Map.of("connected", connected, "expiresInSeconds", remaining);
    }

    /**
     * Provisionne une école Drissman en organisation kernel :
     * business actor -> organisation -> souscription des services -> mapping local.
     * En cas de 403 (organizations:write manquant), attribue OWNER au compte
     * admin puis demande une reconnexion (le token doit être ré-émis).
     */
    public Mono<Map<String, Object>> createOrganizationForSchool(UUID schoolId) {
        String token = requireAdminToken();
        Map<String, String> bearer = KernelClient.bearer(token);

        return schoolRepository.findById(schoolId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "École introuvable")))
                .flatMap(school -> {
                    if (school.getKernelOrganizationId() != null) {
                        return Mono.just(Map.<String, Object>of(
                                "status", "ALREADY_PROVISIONED",
                                "organizationId", school.getKernelOrganizationId().toString()));
                    }
                    return provision(school, bearer);
                });
    }

    private Mono<Map<String, Object>> provision(School school, Map<String, String> bearer) {
        // Idempotence : si une organisation au même code existe déjà côté kernel
        // (ex. retry après un échec local), on la réutilise au lieu de dupliquer.
        return findExistingOrganization(organizationCode(school), bearer)
                .flatMap(existingOrgId -> subscribeServices(existingOrgId, bearer)
                        .flatMap(services -> {
                            school.setKernelOrganizationId(UUID.fromString(existingOrgId));
                            return schoolRepository.save(school)
                                    .thenReturn(buildResult(school, existingOrgId, services));
                        }))
                .switchIfEmpty(Mono.defer(() -> createFromScratch(school, bearer)));
    }

    /** Cherche dans /api/organizations/my une organisation portant ce code. */
    private Mono<String> findExistingOrganization(String code, Map<String, String> bearer) {
        return kernelClient.get("/api/organizations/my", bearer)
                .flatMap(resp -> {
                    JsonNode array = resp.getData() != null && resp.getData().isArray()
                            ? resp.getData()
                            : (resp.getData() != null ? resp.getData().path("content") : null);
                    if (array != null) {
                        for (JsonNode org : array) {
                            if (code.equals(org.path("code").asText(""))) {
                                log.info("Organisation kernel existante réutilisée : {} ({})",
                                        code, org.path("id").asText(""));
                                return Mono.just(org.path("id").asText());
                            }
                        }
                    }
                    return Mono.empty();
                })
                .onErrorResume(e -> {
                    log.warn("Lecture /api/organizations/my impossible : {}", e.getMessage());
                    return Mono.empty();
                });
    }

    private Mono<Map<String, Object>> createFromScratch(School school, Map<String, String> bearer) {
        Map<String, Object> actorBody = Map.of(
                "name", school.getName() + " Owner",
                "businessId", "SCH-" + school.getId().toString().substring(0, 8),
                "role", "OWNER",
                "type", "BUSINESS",
                "isIndividual", true,
                "isActive", true);

        return kernelClient.post("/api/actors/onboarding", actorBody, bearer)
                .flatMap(actorResp -> {
                    String actorId = actorResp.getData().path("id").asText(null);
                    Map<String, Object> orgBody = Map.of(
                            "businessActorId", actorId,
                            "code", organizationCode(school),
                            "legalName", school.getName(),
                            "displayName", school.getName(),
                            "organizationType", "PRIVATE_COMPANY");
                    return kernelClient.post("/api/organizations", orgBody, bearer);
                })
                .flatMap(orgResp -> {
                    String orgId = orgResp.getData().path("id").asText(null);
                    return subscribeServices(orgId, bearer)
                            .flatMap(services -> {
                                school.setKernelOrganizationId(UUID.fromString(orgId));
                                return schoolRepository.save(school)
                                        .thenReturn(buildResult(school, orgId, services));
                            });
                })
                .onErrorResume(WebClientResponseException.Forbidden.class, e -> attemptOwnerSelfAssign());
    }

    private Mono<Map<String, String>> subscribeServices(String orgId, Map<String, String> bearer) {
        String token = bearer.get("Authorization").substring("Bearer ".length());
        return Flux.fromIterable(SERVICES)
                .concatMap(service -> kernelClient.post(
                                "/api/organizations/" + orgId + "/services",
                                Map.of("serviceCode", service,
                                        "requestQuotaLimit", 10000,
                                        "requestQuotaWindowSeconds", 3600),
                                KernelClient.bearerWithOrganization(token, orgId))
                        .map(r -> Map.entry(service, r.isSuccess() ? "OK" : String.valueOf(r.getErrorCode())))
                        .onErrorResume(e -> Mono.just(Map.entry(service, "ERREUR: " + e.getMessage()))))
                .collectMap(Map.Entry::getKey, Map.Entry::getValue, LinkedHashMap::new);
    }

    /** 403 organizations:write : attribue OWNER au compte admin courant. */
    private Mono<Map<String, Object>> attemptOwnerSelfAssign() {
        String token = requireAdminToken();
        Map<String, String> bearer = KernelClient.bearer(token);
        return kernelClient.get("/api/users/me", bearer)
                .flatMap(me -> {
                    String userId = me.getData().path("id").asText(null);
                    return kernelClient.get("/api/administration/roles", bearer)
                            .flatMap(roles -> {
                                JsonNode roleArray = roles.getData().isArray()
                                        ? roles.getData()
                                        : roles.getData().path("content");
                                String ownerRoleId = null;
                                for (JsonNode role : roleArray) {
                                    if ("OWNER".equals(role.path("code").asText(""))) {
                                        ownerRoleId = role.path("id").asText(null);
                                        break;
                                    }
                                }
                                if (ownerRoleId == null) {
                                    return Mono.error(new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                                            "Rôle OWNER introuvable sur le kernel"));
                                }
                                return kernelClient.post("/api/administration/users/" + userId + "/roles",
                                        Map.of("roleId", ownerRoleId, "scopeType", "TENANT", "scope", "TENANT"),
                                        bearer);
                            });
                })
                .map(r -> Map.<String, Object>of(
                        "status", "OWNER_ASSIGNED_RECONNECT",
                        "message", "Le rôle OWNER vient d'être attribué au compte admin. "
                                + "Reconnectez-vous (login + MFA) puis relancez la création : "
                                + "le kernel ne recalcule les permissions qu'à l'émission d'un nouveau token."));
    }

    private Map<String, Object> storeAdminToken(JsonNode data) {
        String token = data != null ? data.path("accessToken").asText(null) : null;
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Le kernel n'a pas renvoyé d'accessToken");
        }
        long ttl = data.path("expiresInSeconds").asLong(900);
        adminToken = token;
        adminTokenExpiry = Instant.now().plusSeconds(Math.max(ttl - 30, 60));
        log.info("Session admin kernel ouverte ({} s)", ttl);
        return Map.of("status", "CONNECTED", "expiresInSeconds", ttl);
    }

    private String requireAdminToken() {
        if (adminToken == null || Instant.now().isAfter(adminTokenExpiry)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Session admin kernel absente ou expirée — refaites login + MFA "
                            + "(POST /api/kernel/admin/login puis /mfa/confirm)");
        }
        return adminToken;
    }

    private Map<String, Object> buildResult(School school, String orgId, Map<String, String> services) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "PROVISIONED");
        result.put("schoolId", school.getId().toString());
        result.put("organizationId", orgId);
        result.put("organizationCode", organizationCode(school));
        result.put("services", services);
        return result;
    }

    private String organizationCode(School school) {
        String base = school.getName() != null
                ? school.getName().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "").substring(0,
                        Math.min(12, school.getName().replaceAll("[^A-Za-z0-9]", "").length()))
                : "ECOLE";
        return "ORG-" + base + "-" + school.getId().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }
}
