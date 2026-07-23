package com.drissman.domain.entity;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Catégories de pièces justificatives (KYC).
 *
 * Le code sert de `documentCategory` côté Document-hub kernel ; le libellé et
 * l'obligation pilotent la checklist affichée. La PORTÉE distingue les pièces
 * de l'auto-école de celles d'un moniteur.
 *
 * Rappel MODÈLE A : les pièces sont archivées sous l'organisation UNIQUE de
 * Drissman ; le verdict (VERIFIED/REJECTED) est rendu par le super-admin.
 */
public enum DocumentCategory {

    // --- Pièces de l'auto-école ---
    BUSINESS_LICENSE("Autorisation d'exploitation", true, Scope.SCHOOL),
    TRADE_REGISTER("Registre de commerce (RCCM)", true, Scope.SCHOOL),
    OWNER_ID("CNI du gérant", true, Scope.SCHOOL),
    TAX_CLEARANCE("Attestation de non-redevance fiscale", false, Scope.SCHOOL),

    // --- Pièces d'un moniteur (déposées par le gérant) ---
    MONITOR_ID("CNI du moniteur", true, Scope.MONITOR),
    MONITOR_LICENSE("Permis de conduire", true, Scope.MONITOR),
    MONITOR_TEACHING_CERT("Agrément de moniteur", true, Scope.MONITOR),
    MONITOR_MEDICAL("Certificat médical", false, Scope.MONITOR);

    /** Portée d'une pièce : l'auto-école elle-même, ou un de ses moniteurs. */
    public enum Scope {
        SCHOOL,
        MONITOR
    }

    private final String label;
    private final boolean required;
    private final Scope scope;

    DocumentCategory(String label, boolean required, Scope scope) {
        this.label = label;
        this.required = required;
        this.scope = scope;
    }

    public String label() {
        return label;
    }

    public boolean required() {
        return required;
    }

    public Scope scope() {
        return scope;
    }

    /** Catégories attendues pour une portée donnée (ordre de déclaration). */
    public static List<DocumentCategory> of(Scope scope) {
        return Arrays.stream(values()).filter(c -> c.scope == scope).toList();
    }

    /** Parse tolérant ; null si le code n'est pas une catégorie connue. */
    public static DocumentCategory fromCode(String code) {
        if (code == null) return null;
        try {
            return DocumentCategory.valueOf(code.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
