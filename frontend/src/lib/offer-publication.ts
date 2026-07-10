export interface AdminOfferLite {
    id: string;
    status: "ACTIVE" | "DRAFT" | "ARCHIVED";
}

export interface TrainingSessionLite {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    enrollmentDeadline: string;
    maxStudents: number;
    status: "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    formations: Array<{
        offerId: string;
        offerName: string;
        permitType: string;
        price: number;
        priceOverride?: number;
        enrolledCount: number;
    }>;
    totalEnrolled: number;
}

export function isOfferLinkedToAnySession(offerId: string, sessions: TrainingSessionLite[]): boolean {
    return sessions.some((session) => session.formations?.some((formation) => formation.offerId === offerId));
}

export function syncOfferPublication<T extends AdminOfferLite>(offers: T[], sessions: TrainingSessionLite[]): T[] {
    return offers.map((offer) => {
        if (offer.status === "ARCHIVED") {
            return offer;
        }
        return {
            ...offer,
            status: isOfferLinkedToAnySession(offer.id, sessions) ? "ACTIVE" : "DRAFT",
        };
    });
}

export function makeAutoSessionForOffer(offer: {
    id: string;
    name: string;
    permitType: string;
    price: number;
}): TrainingSessionLite {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate() + 1);

    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    return {
        id: crypto.randomUUID(),
        name: `Session ${offer.name}`,
        description: "Session creee automatiquement lors de la creation de l'offre.",
        startDate,
        endDate,
        enrollmentDeadline: startDate,
        maxStudents: 30,
        status: "DRAFT",
        totalEnrolled: 0,
        formations: [
            {
                offerId: offer.id,
                offerName: offer.name,
                permitType: offer.permitType,
                price: offer.price,
                enrolledCount: 0,
            },
        ],
    };
}
