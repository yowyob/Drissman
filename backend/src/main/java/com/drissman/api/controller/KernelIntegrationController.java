package com.drissman.api.controller;

import com.drissman.kernel.KernelClient;
import com.drissman.kernel.KernelOrganization;
import com.drissman.kernel.YowyobSearchService;
import lombok.RequiredArgsConstructor;
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
        return out;
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
