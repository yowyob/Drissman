import { apiClient } from "./api-client";

export interface PaymentDto {
    id: string;
    enrollmentId: string;
    studentName?: string;
    offerName?: string;
    amount: number;
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    method: string;
    phone: string | null;
    reference: string;
    createdAt: string;
    paidAt: string | null;
    /** URL Stripe Checkout (paiement carte en attente). */
    checkoutUrl?: string | null;
}

export const paymentMethodLabels: Record<string, string> = {
    ORANGE_MONEY: "Orange Money",
    MTN_MOMO: "MTN MoMo",
    CARD: "Carte",
    CASH: "Espèces",
};

/** Mappe les libellés UI vers les codes backend (Invoice.PaymentMethod). */
export function toPaymentMethodCode(label: string): string {
    const normalized = label.trim().toLowerCase();
    if (normalized.includes("orange")) return "ORANGE_MONEY";
    if (normalized.includes("mtn") || normalized.includes("momo")) return "MTN_MOMO";
    if (normalized.includes("carte") || normalized.includes("card")) return "CARD";
    return "CASH";
}

export const paymentService = {
    initiate: (enrollmentId: string, method: string, phone: string, token: string) =>
        apiClient.post<PaymentDto>(
            "/payments/initiate",
            { enrollmentId, method: toPaymentMethodCode(method), phone },
            token,
        ),

    getMyPayments: (token: string) =>
        apiClient.get<PaymentDto[]>("/payments/me", token),

    listForSchool: (token: string) =>
        apiClient.get<PaymentDto[]>("/schools/admin/payments", token),

    /** Interroge le prestataire carte et retourne le statut à jour. */
    refresh: (invoiceId: string, token: string) =>
        apiClient.get<PaymentDto>(`/payments/${invoiceId}/refresh`, token),

    confirm: (invoiceId: string, token: string) =>
        apiClient.post<PaymentDto>(`/schools/admin/payments/${invoiceId}/confirm`, undefined, token),
};
