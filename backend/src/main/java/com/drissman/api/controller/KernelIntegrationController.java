package com.drissman.api.controller;

import com.drissman.kernel.KernelClient;
import com.drissman.kernel.KernelOrganization;
import com.drissman.kernel.YowyobSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * État de l'intégration kernel, lisible depuis l'application (sans accès SSH).
 *
 * Répond à la question « le kernel est-il réellement consommé ? » avec les deux
 * conditions qui déterminent si le mirroring org-scopé peut fonctionner :
 *   - le kernel est-il joignable avec notre identité machine ?
 *   - l'organisation Drissman (MODÈLE A) est-elle configurée ?
 *
 * Ne renvoie que des booléens : aucun secret ni identifiant n'est exposé.
 * Réservé aux utilisateurs authentifiés.
 */
@RestController
@RequestMapping("/api/kernel")
@RequiredArgsConstructor
public class KernelIntegrationController {

    private final KernelClient kernelClient;
    private final KernelOrganization kernelOrganization;
    private final YowyobSearchService yowyobSearchService;

    @Value("${kernel.client-id:}")
    private String clientId;

    @Value("${kernel.tenant-id:}")
    private String tenantId;

    @Value("${kernel.payment.service-code:}")
    private String paymentServiceCode;

    /**
     * DIAGNOSTIC yowyob-search : renvoie la réponse BRUTE du moteur interrogé
     * avec nos identifiants et notre tenant. Permet de vérifier si nos écoles
     * sont réellement indexées, sans dépendre de l'interface publique.
     */
    @GetMapping("/search-check")
    public Mono<String> searchCheck(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "auto") String q,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String collection) {
        return yowyobSearchService.searchRaw(q, collection);
    }

    /**
     * DIAGNOSTIC : services réellement souscrits par l'organisation Drissman.
     *
     * KSM n'expose pas cet écran ; or sans souscription au service concerné
     * (ACCOUNTING, HRM, KYC…), l'organisation existe mais le module reste
     * inaccessible. Renvoie la réponse du kernel telle quelle.
     */
    @GetMapping("/services")
    public Mono<Object> organizationServices() {
        String orgId = kernelOrganization.idAsString();
        if (orgId == null) {
            return Mono.just(Map.of(
                    "error", "KERNEL_ORGANIZATION_ID non configuré",
                    "hint", "renseigner la variable puis redémarrer le backend"));
        }
        return kernelClient.get("/api/organizations/" + orgId + "/services",
                        Map.of("X-Organization-Id", orgId))
                .timeout(Duration.ofSeconds(10))
                .map(r -> (Object) r)
                .onErrorResume(e -> Mono.just(Map.of(
                        "error", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName(),
                        "organizationId", orgId)));
    }

    @GetMapping("/integration")
    public Mono<Map<String, Object>> integration() {
        boolean orgConfigured = kernelOrganization.isConfigured();

        return kernelClient.post("/api/auth/identify", Map.of("principal", "healthcheck@drissman.local"))
                .timeout(Duration.ofSeconds(10))
                .map(r -> build(true, orgConfigured))
                .onErrorResume(e -> Mono.just(build(false, orgConfigured)));
    }

    private Map<String, Object> build(boolean reachable, boolean orgConfigured) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("kernelReachable", reachable);
        out.put("organizationConfigured", orgConfigured);
        // Le mirroring org-scopé (compta, document-hub, ressources) exige les deux.
        out.put("mirroringOperational", reachable && orgConfigured);
        out.put("summary", summary(reachable, orgConfigured));
        // Config EFFECTIVE de production, autrement illisible sans accès SSH.
        // Ni clé ni identifiant complet : seulement de quoi diagnostiquer un
        // mauvais préfixe d'URL ou un tenant inattendu.
        out.put("config", config());
        return out;
    }

    /** Configuration kernel effective (sans secret) — diagnostic sans SSH. */
    private Map<String, Object> config() {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("baseUrl", kernelClient.getBaseUrl());
        cfg.put("clientIdConfigured", clientId != null && !clientId.isBlank());
        // Préfixe seul : suffit à distinguer l'ancien tenant (11111111…)
        // du nouveau (94b5ac75…) sans divulguer l'identifiant complet.
        cfg.put("tenantPrefix", prefix(tenantId));
        cfg.put("organizationPrefix", prefix(kernelOrganization.idAsString()));
        cfg.put("paymentServiceCode",
                paymentServiceCode == null || paymentServiceCode.isBlank()
                        ? "(omis)" : paymentServiceCode);
        return cfg;
    }

    private static String prefix(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim();
        return (v.length() <= 8 ? v : v.substring(0, 8)) + "…";
    }

    private String summary(boolean reachable, boolean orgConfigured) {
        if (!reachable && !orgConfigured) {
            return "Kernel injoignable et organisation non configurée — fonctionnement 100% local.";
        }
        if (!reachable) {
            return "Kernel injoignable — les données restent locales et seront à resynchroniser.";
        }
        if (!orgConfigured) {
            // Les pièces PERSONNELLES (CNI, permis) s'attachent sans organisation :
            // l'archivage est donc partiel, pas nul.
            return "Kernel joignable. Les pièces personnelles (CNI, permis) sont archivées ; "
                    + "les pièces d'entreprise attendent la configuration de l'organisation "
                    + "(KERNEL_ORGANIZATION_ID).";
        }
        return "Kernel joignable et organisation configurée — mirroring opérationnel.";
    }
}
