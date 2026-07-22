package com.drissman.domain.entity;

/**
 * Catégories de pièces justificatives attendues d'une auto-école (KYC).
 * Le code sert de `documentCategory` côté Document-hub kernel ; le libellé
 * et l'obligation pilotent la checklist affichée au gérant.
 */
public enum DocumentCategory {

    BUSINESS_LICENSE("Autorisation d'exploitation", true),
    TRADE_REGISTER("Registre de commerce (RCCM)", true),
    OWNER_ID("CNI du gérant", true),
    TAX_CLEARANCE("Attestation de non-redevance fiscale", false);

    private final String label;
    private final boolean required;

    DocumentCategory(String label, boolean required) {
        this.label = label;
        this.required = required;
    }

    public String label() {
        return label;
    }

    public boolean required() {
        return required;
    }

    /** Parse tolérant ; null si le code n'est pas une catégorie connue. */
    public static DocumentCategory fromCode(String code) {
        if (code == null) return null;
        try {
            return DocumentCategory.valueOf(code.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
