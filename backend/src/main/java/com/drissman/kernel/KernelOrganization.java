package com.drissman.kernel;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Organisation kernel de Drissman — MODÈLE A.
 *
 * Drissman est une application ORGANISATIONNELLE : elle consomme les services
 * du kernel au nom d'UNE SEULE organisation (l'opérateur de la marketplace),
 * et non d'une organisation par auto-école.
 *
 * Raison : le provisioning d'une organisation kernel est un parcours HUMAIN sur
 * https://ksm.yowyob.com (business actor + NIU/RCCM + validation admin manuelle).
 * Impossible à automatiser par école, et non scalable pour une marketplace.
 * Les auto-écoles restent donc un concept interne à Drissman.
 *
 * L'identifiant est fourni une fois pour toutes par la variable d'environnement
 * KERNEL_ORGANIZATION_ID. Tant qu'elle est absente, les appels org-scopés sont
 * ignorés proprement (KERNEL_MIRROR outcome=SKIP) au lieu d'échouer.
 */
@Component
public class KernelOrganization {

    private final UUID organizationId;

    public KernelOrganization(@Value("${kernel.organization-id:}") String rawId) {
        UUID parsed = null;
        if (rawId != null && !rawId.isBlank()) {
            try {
                parsed = UUID.fromString(rawId.trim());
            } catch (IllegalArgumentException e) {
                parsed = null;
            }
        }
        this.organizationId = parsed;
    }

    /** Identifiant de l'organisation Drissman, vide si non configuré. */
    public Optional<UUID> id() {
        return Optional.ofNullable(organizationId);
    }

    public boolean isConfigured() {
        return organizationId != null;
    }

    /** Valeur en chaîne pour l'en-tête X-Organization-Id. */
    public String idAsString() {
        return organizationId != null ? organizationId.toString() : null;
    }
}
