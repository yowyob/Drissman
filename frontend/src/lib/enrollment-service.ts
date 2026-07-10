import { apiClient } from "@/lib/api-client";

export interface EnrollmentDto {
    id: string;
    offerId: string;
    offerName: string;
    price: number;
    hours: number;
    hoursConsumed: number;
    hoursRemaining: number;
    permitType: string;
    schoolId: string;
    schoolName: string;
    studentId: string;
    studentName: string;
    status: "PENDING" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CANCELLED";
    enrolledAt: string;
}

export interface CandidateSessionDto {
    sessionId: string;
    enrollmentId: string;
    offerId: string;
    offerName: string;
    monitorName: string;
    date: string;
    startTime: string;
    endTime: string;
    meetingPoint: string;
    status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    durationHours: number;
}

export interface InvoiceDto {
    id: string;
    enrollmentId: string;
    invoiceNumber: string;
    studentName: string;
    offer: string;
    amount: number;
    status: "PENDING" | "PAID" | "OVERDUE";
    dueDate: string;
    paidAt: string | null;
}

export interface AdminDashboardDto {
    activeCandidates: number;
    totalOffers: number;
    totalModules: number;
    todaySessions: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingValidations: number;
    recentActivities: Array<{
        id: string;
        title: string;
        description: string;
        type: string;
        timestamp: string;
    }>;
    upcomingSessions: Array<{
        id: string;
        monitorName: string;
        studentName: string;
        date: string;
        startTime: string;
        endTime: string;
        meetingPoint: string;
        status: string;
    }>;
}

export const enrollmentService = {
    createEnrollment: (offerId: string, token: string) =>
        apiClient.post<EnrollmentDto>("/enrollments", { offerId }, token),

    getMyEnrollments: (token: string) =>
        apiClient.get<EnrollmentDto[]>("/enrollments/me", token),

    getMySessions: (token: string) =>
        apiClient.get<CandidateSessionDto[]>("/enrollments/me/sessions", token),

    getAdminEnrollments: (token: string) =>
        apiClient.get<EnrollmentDto[]>("/schools/admin/enrollments", token),

    updateEnrollmentStatus: (id: string, status: "PENDING" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CANCELLED", token: string) =>
        apiClient.patch<EnrollmentDto>(`/schools/admin/enrollments/${id}/status`, { status }, token),

    getAdminInvoices: (token: string) =>
        apiClient.get<InvoiceDto[]>("/schools/admin/invoices", token),

    getAdminDashboard: (token: string) =>
        apiClient.get<AdminDashboardDto>("/schools/admin/dashboard", token),
};
