import { apiClient } from "@/lib/api-client";

export interface AdminMonitorDto {
  id: string;
  schoolId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phoneNumber: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
}

export interface CreateAdminMonitorPayload {
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export const adminMonitorService = {
  list: (token: string) => apiClient.get<AdminMonitorDto[]>("/schools/admin/monitors", token),
  create: (payload: CreateAdminMonitorPayload, token: string) =>
    apiClient.post<AdminMonitorDto>("/schools/admin/monitors", payload, token),
  remove: (id: string, token: string) => apiClient.delete<void>(`/schools/admin/monitors/${id}`, token),
};
