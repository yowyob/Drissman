import { apiClient } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface AdminOfferDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  hours: number;
  permitType: string;
  imageUrl?: string | null;
}

/** Résout une URL d'image servie par le backend (/api/images/...). */
export function backendImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/")) return API_BASE_URL.replace(/\/api$/, "") + url;
  return url;
}

export interface OfferModuleDto {
  moduleId: string;
  moduleName: string;
  moduleCategory: "CODE" | "CONDUITE" | "EXAMEN_BLANC";
  moduleRequiredHours: number;
  orderIndex: number;
}

export interface CreateAdminOfferPayload {
  name: string;
  description?: string;
  price: number;
  hours: number;
  permitType: string;
  imageUrl?: string;
}

export const adminOfferService = {
  /**
   * Upload d'une image de cours : stockée par le backend et archivée dans le
   * file-core du kernel. Retourne l'URL à mettre dans imageUrl.
   */
  uploadImage: async (file: File, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE_URL}/images/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Échec de l'upload de l'image");
    const data = await res.json();
    return data.url as string;
  },

  list: (token: string) => apiClient.get<AdminOfferDto[]>("/schools/admin/offers", token),
  create: (payload: CreateAdminOfferPayload, token: string) =>
    apiClient.post<AdminOfferDto>("/schools/admin/offers", payload, token),
  update: (offerId: string, payload: Partial<CreateAdminOfferPayload>, token: string) =>
    apiClient.patch<AdminOfferDto>(`/schools/admin/offers/${offerId}`, payload, token),
  remove: (offerId: string, token: string) => apiClient.delete<void>(`/schools/admin/offers/${offerId}`, token),
  getModules: (offerId: string, token: string) => apiClient.get<OfferModuleDto[]>(`/offers/${offerId}/modules`, token),
  setModules: (offerId: string, moduleIds: string[], token: string) =>
    apiClient.put<OfferModuleDto[]>(
      `/schools/admin/offers/${offerId}/modules`,
      { modules: moduleIds.map((moduleId, idx) => ({ moduleId, orderIndex: idx })) },
      token,
    ),
};
