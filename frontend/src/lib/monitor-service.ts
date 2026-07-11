import { apiClient } from "@/lib/api-client";

export interface MonitorSessionViewDto {
  sessionId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  offerId: string;
  offerName: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingPoint: string;
  pedagogicalNotes?: string;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  durationHours: number;
}

export interface MonitorStudentProgressDto {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  offerId: string;
  offerName: string;
  hoursPurchased: number;
  hoursConsumed: number;
  hoursRemaining: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CANCELLED";
}

export const monitorService = {
  getProfile: (token: string) => apiClient.get<{ id: string; userId: string; schoolId: string; schoolName?: string; firstName: string; lastName: string }>(
    "/monitors/me",
    token,
  ),

  getMySessions: (token: string) => apiClient.get<MonitorSessionViewDto[]>("/monitors/me/sessions", token),

  completeSession: (sessionId: string, notes: string | undefined, token: string) =>
    apiClient.patch(`/monitors/me/sessions/${sessionId}/complete${notes ? `?notes=${encodeURIComponent(notes)}` : ""}`, undefined, token),

  getMyStudents: (token: string) => apiClient.get<MonitorStudentProgressDto[]>("/monitors/me/students", token),
};
