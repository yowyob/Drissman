import { apiClient } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export type DocumentStatus = "MISSING" | "PENDING" | "VERIFIED" | "REJECTED";

export interface DocumentChecklistItem {
    category: string;
    label: string;
    required: boolean;
    status: DocumentStatus;
    documentId?: string | null;
    fileUrl?: string | null;
    reviewNotes?: string | null;
    uploadedAt?: string | null;
}

export const schoolDocumentService = {
    /** Checklist documentaire de l'école du gérant connecté. */
    getChecklist: (token: string) =>
        apiClient.get<DocumentChecklistItem[]>("/schools/admin/documents", token),

    /** Téléverse une pièce pour une catégorie ; renvoie la checklist à jour. */
    upload: async (file: File, category: string, token: string): Promise<DocumentChecklistItem[]> => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(
            `${API_BASE_URL}/schools/admin/documents?category=${encodeURIComponent(category)}`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            }
        );
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Échec de l'upload du document");
        }
        return res.json();
    },
};
