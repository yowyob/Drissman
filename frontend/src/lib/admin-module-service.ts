import { apiClient } from "@/lib/api-client";

export interface AdminModuleDto {
  id: string;
  name: string;
  category: "CODE" | "CONDUITE" | "EXAMEN_BLANC";
  description?: string;
  orderIndex: number;
  requiredHours: number;
}

export interface UpsertAdminModulePayload {
  name: string;
  category: "CODE" | "CONDUITE" | "EXAMEN_BLANC";
  description?: string;
  orderIndex?: number;
  requiredHours?: number;
}

export const adminModuleService = {
  list: (token: string) => apiClient.get<AdminModuleDto[]>("/schools/admin/modules", token),
  create: (payload: UpsertAdminModulePayload, token: string) =>
    apiClient.post<AdminModuleDto>("/schools/admin/modules", payload, token),
  update: (moduleId: string, payload: UpsertAdminModulePayload, token: string) =>
    apiClient.put<AdminModuleDto>(`/schools/admin/modules/${moduleId}`, payload, token),
  remove: (moduleId: string, token: string) => apiClient.delete<void>(`/schools/admin/modules/${moduleId}`, token),
};
