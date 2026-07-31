import { apiClient } from "@/lib/api-client";

export interface AvailableOfferDto {
  offerId: string;
  offerName: string;
  permitType: string;
  price: number;
}

export interface SessionEnrollmentOptionDto {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CANCELLED";
  hoursPurchased: number;
  hoursConsumed: number;
}

// Modèle mobile : une séance est rattachée à des OFFRES (groupe), pas à une
// inscription individuelle. Le backend notifie automatiquement tous les élèves
// inscrits aux offres liées. offerIds / monitorIds sont donc des LISTES.
export interface SessionDto {
  id: string;
  offerIds: string[];
  monitorIds: string[];
  moduleId?: string;
  lessonId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  meetingPoint: string;
  pedagogicalNotes?: string;
  durationHours: number;
}

export interface CreateSessionPayload {
  offerIds: string[];
  monitorIds?: string[];
  moduleId?: string;
  lessonId?: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingPoint?: string;
}

export const adminSessionService = {
  availableOffers: (date: string, token: string) =>
    apiClient.get<AvailableOfferDto[]>(`/schools/admin/sessions/available-offers?date=${date}`, token),
  availableEnrollments: (offerId: string, date: string, token: string) =>
    apiClient.get<SessionEnrollmentOptionDto[]>(
      `/schools/admin/sessions/available-enrollments?offerId=${offerId}&date=${date}`,
      token,
    ),
  create: (payload: CreateSessionPayload, token: string) =>
    apiClient.post<SessionDto>("/schools/admin/sessions", payload, token),
  bySchool: (token: string) =>
    apiClient.get<SessionDto[]>("/schools/admin/sessions", token),
  byEnrollment: (enrollmentId: string, token: string) =>
    apiClient.get<SessionDto[]>(`/schools/admin/sessions/enrollment/${enrollmentId}`, token),
};
