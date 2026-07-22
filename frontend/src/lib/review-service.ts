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

    /** L'utilisateur courant peut-il laisser un avis ? (élève inscrit, non doublon) */
    getEligibility: (schoolId: string, token: string) =>
        apiClient.get<ReviewEligibility>(`/reviews/eligibility/${schoolId}`, token),

    /** Soumet un avis (le backend re-valide l'inscription — sécurité serveur). */
    create: (schoolId: string, rating: number, comment: string, token: string) =>
        apiClient.post<ReviewDto>("/reviews", { schoolId, rating, comment }, token),
};
