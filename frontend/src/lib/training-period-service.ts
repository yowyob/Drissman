import { apiClient } from "@/lib/api-client";

export interface TrainingPeriodFormationDto {
  offerId: string;
  offerName: string;
  permitType: string;
  price: number;
}

export interface TrainingPeriodViewDto {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  enrollmentDeadline: string;
  maxStudents: number;
  status: "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  totalEnrolled: number;
  formations: TrainingPeriodFormationDto[];
}

export interface CreateTrainingPeriodPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  enrollmentDeadline?: string;
  maxStudents: number;
  offerIds: string[];
}

export const trainingPeriodService = {
  list: (token: string) => apiClient.get<TrainingPeriodViewDto[]>("/schools/admin/training-periods", token),
  create: (payload: CreateTrainingPeriodPayload, token: string) =>
    apiClient.post<TrainingPeriodViewDto>(
      "/schools/admin/training-periods",
      {
        ...payload,
        offerId: payload.offerIds[0],
      },
      token,
    ),
  updateStatus: (id: string, status: TrainingPeriodViewDto["status"], token: string) =>
    apiClient.patch<TrainingPeriodViewDto>(`/schools/admin/training-periods/${id}/status`, { status }, token),
  remove: (id: string, token: string) => apiClient.delete<void>(`/schools/admin/training-periods/${id}`, token),
};
