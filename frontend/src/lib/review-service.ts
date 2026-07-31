import { apiClient } from "./api-client";

export interface ReviewDto {
    id: string;
    userId: string;
    userName: string;
    schoolId: string;
    rating: number;
    comment: string;
    verified: boolean;
    createdAt: string;
}

export interface ReviewEligibility {
    canReview: boolean;
    hasEnrollment: boolean;
    alreadyReviewed: boolean;
    reason?: string | null;
}

export const reviewService = {
    /** Avis publics d'une auto-école. */
    getForSchool: (schoolId: string) =>
        apiClient.get<ReviewDto[]>(`/reviews/school/${schoolId}`),

    /**
     * L'utilisateur courant peut-il laisser un avis ? (élève inscrit, non doublon)
     *
     * Le backend MOBILE (cible de prod) n'expose PAS cet endpoint. Dégradation
     * optimiste : on autorise l'affichage du formulaire, car `create` re-valide
     * l'inscription côté serveur (sécurité maintenue) — un non-éligible sera
     * rejeté au POST avec un message.
     */
    getEligibility: async (schoolId: string, token: string): Promise<ReviewEligibility> => {
        try {
            return await apiClient.get<ReviewEligibility>(`/reviews/eligibility/${schoolId}`, token);
        } catch {
            return { canReview: true, hasEnrollment: true, alreadyReviewed: false, reason: null };
        }
    },

    /** Soumet un avis (le backend re-valide l'inscription — sécurité serveur). */
    create: (schoolId: string, rating: number, comment: string, token: string) =>
        apiClient.post<ReviewDto>("/reviews", { schoolId, rating, comment }, token),
};
