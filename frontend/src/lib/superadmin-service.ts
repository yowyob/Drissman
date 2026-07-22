import { apiClient } from "@/lib/api-client";
import type { DocumentChecklistItem } from "@/lib/school-document-service";

export interface School {
    id: string;
    name: string;
    address?: string;
    city?: string;
    description?: string;
    isVerified: boolean;
    governanceStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
    governanceReason?: string | null;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: "VISITOR" | "CANDIDAT" | "SCHOOL_ADMIN" | "MONITOR" | "SUPER_ADMIN";
    schoolId?: string;
    avatarUrl?: string;
    isActive: boolean;
    createdAt?: string;
}

export interface MonthlyRevenue {
    month: string;
    revenue: number;
}

export interface SchoolRegistrationTrend {
    month: string;
    count: number;
}

export interface RecentActivityDto {
    type: "SCHOOL" | "INVOICE" | "ENROLLMENT";
    description: string;
    timestamp: string;
    status: string;
    schoolName?: string;
    resourceId?: string;
}

export interface GlobalStatsDto {
    totalUsers: number;
    totalSchools: number;
    pendingSchools: number;
    totalEnrollments: number;
    totalRevenue: number;
    usersByRole: Record<string, number>;
    enrollmentsByStatus: Record<string, number>;
    revenueByMonth: MonthlyRevenue[];
    schoolsTrend: SchoolRegistrationTrend[];
    recentActivities: RecentActivityDto[];
}

export const superAdminService = {
    getStats: (token: string) =>
        apiClient.get<GlobalStatsDto>("/superadmin/stats", token),

    getPendingSchools: (token: string) =>
        apiClient.get<School[]>("/superadmin/schools/pending", token),

    validateSchool: (id: string, token: string) =>
        apiClient.put<School>(`/superadmin/schools/${id}/validate`, undefined, token),

    rejectSchool: (id: string, reason: string, token: string) =>
        apiClient.put<School>(`/superadmin/schools/${id}/reject`, { reason }, token),

    getAllSchools: (token: string) =>
        apiClient.get<School[]>("/superadmin/schools", token),

    toggleSchoolVerification: (id: string, token: string) =>
        apiClient.put<School>(`/superadmin/schools/${id}/toggle-verify`, undefined, token),

    getAllUsers: (token: string) =>
        apiClient.get<User[]>("/superadmin/users", token),

    toggleUserActive: (id: string, token: string) =>
        apiClient.put<User>(`/superadmin/users/${id}/toggle-active`, undefined, token),

    /** Checklist documentaire d'une école (pour la revue super-admin). */
    getSchoolDocuments: (schoolId: string, token: string) =>
        apiClient.get<DocumentChecklistItem[]>(`/superadmin/schools/${schoolId}/documents`, token),

    /** Revue d'une pièce : decision = "APPROVE" | "REJECT". Renvoie la checklist à jour. */
    reviewDocument: (documentId: string, decision: "APPROVE" | "REJECT", notes: string | undefined, token: string) =>
        apiClient.put<DocumentChecklistItem[]>(
            `/superadmin/documents/${documentId}/review`,
            { decision, notes },
            token
        ),
};
