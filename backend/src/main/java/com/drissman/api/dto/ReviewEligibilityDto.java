package com.drissman.api.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Éligibilité d'un utilisateur à laisser un avis sur une auto-école.
 * Sert au frontend à afficher (ou non) le formulaire d'avis.
 */
@Data
@Builder
public class ReviewEligibilityDto {
    /** true = l'utilisateur peut soumettre un avis maintenant. */
    private boolean canReview;
    /** true = il a une inscription ACTIVE/COMPLETED dans cette auto-école. */
    private boolean hasEnrollment;
    /** true = il a déjà laissé un avis pour cette auto-école. */
    private boolean alreadyReviewed;
    /** Raison lisible quand canReview = false (sinon null). */
    private String reason;
}
