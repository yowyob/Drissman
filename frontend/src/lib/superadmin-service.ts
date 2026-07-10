import { apiClient } from "@/lib/api-client";

export interface School {
    id: string;
    name: string;
    address?: string;
    city?: string;
    description?: string;
    isVerified: boolean;
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

    getAllSchools: (token: string) =>
        apiClient.get<School[]>("/superadmin/schools", token),

    toggleSchoolVerification: (id: string, token: string) =>
        apiClient.put<School>(`/superadmin/schools/${id}/toggle-verify`, undefined, token),

    getAllUsers: (token: string) =>
        apiClient.get<User[]>("/superadmin/users", token),

    toggleUserActive: (id: string, token: string) =>
        apiClient.put<User>(`/superadmin/users/${id}/toggle-active`, undefined, token),
};
