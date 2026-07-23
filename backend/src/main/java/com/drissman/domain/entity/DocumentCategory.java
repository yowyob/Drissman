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

    // --- Pièces de l'auto-école (personne morale) ---
    BUSINESS_LICENSE("Autorisation d'exploitation", true, Scope.SCHOOL, false),
    TRADE_REGISTER("Registre de commerce (RCCM)", true, Scope.SCHOOL, false),
    TAX_CLEARANCE("Attestation de non-redevance fiscale", false, Scope.SCHOOL, false),
    // Pièce d'identité du gérant : document PERSONNEL.
    OWNER_ID("CNI du gérant", true, Scope.SCHOOL, true),

    // --- Pièces d'un moniteur (déposées par le gérant) : toutes personnelles ---
    MONITOR_ID("CNI du moniteur", true, Scope.MONITOR, true),
    MONITOR_LICENSE("Permis de conduire", true, Scope.MONITOR, true),
    MONITOR_TEACHING_CERT("Agrément de moniteur", true, Scope.MONITOR, true),
    MONITOR_MEDICAL("Certificat médical", false, Scope.MONITOR, true);

    /** Portée d'une pièce : l'auto-école elle-même, ou un de ses moniteurs. */
    public enum Scope {
        SCHOOL,
        MONITOR
    }

    private final String label;
    private final boolean required;
    private final Scope scope;
    private final boolean personal;

    DocumentCategory(String label, boolean required, Scope scope, boolean personal) {
        this.label = label;
        this.required = required;
        this.scope = scope;
        this.personal = personal;
    }

    /**
     * true = pièce rattachée à une PERSONNE (cible kernel USER), qui s'attache
     * SANS organisation — donc archivable même sans KERNEL_ORGANIZATION_ID.
     * false = pièce de la personne morale (cible ORGANIZATION).
     */
    public boolean personal() {
        return personal;
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
