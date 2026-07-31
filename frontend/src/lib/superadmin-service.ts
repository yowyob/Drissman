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

export interface SchoolMonitor {
    id: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    licenseNumber?: string;
    phoneNumber?: string;
    status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
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

// Le backend MOBILE (cible de prod) n'expose PAS la revue KYC super-admin
// (rejet d'école + revue documentaire des écoles/moniteurs). Ces méthodes
// dégradent proprement pour que l'écran super-admin fonctionne sans planter :
// lectures -> liste vide (état "aucune pièce"), écritures -> message clair.
// La validation/toggle des écoles et des utilisateurs reste pleinement supportée.
const KYC_UNAVAILABLE = "Revue documentaire indisponible sur ce backend.";

export const superAdminService = {
    getStats: (token: string) =>
        apiClient.get<GlobalStatsDto>("/superadmin/stats", token),

    getPendingSchools: (token: string) =>
        apiClient.get<School[]>("/superadmin/schools/pending", token),

    validateSchool: (id: string, token: string) =>
        apiClient.put<School>(`/superadmin/schools/${id}/validate`, undefined, token),

    rejectSchool: async (id: string, reason: string, token: string) => {
        try {
            return await apiClient.put<School>(`/superadmin/schools/${id}/reject`, { reason }, token);
        } catch {
            throw new Error(KYC_UNAVAILABLE);
        }
    },

    getAllSchools: (token: string) =>
        apiClient.get<School[]>("/superadmin/schools", token),

    toggleSchoolVerification: (id: string, token: string) =>
        apiClient.put<School>(`/superadmin/schools/${id}/toggle-verify`, undefined, token),

    getAllUsers: (token: string) =>
        apiClient.get<User[]>("/superadmin/users", token),

    toggleUserActive: (id: string, token: string) =>
        apiClient.put<User>(`/superadmin/users/${id}/toggle-active`, undefined, token),

    /** Checklist documentaire d'une école (pour la revue super-admin). */
    getSchoolDocuments: async (schoolId: string, token: string) => {
        try {
            return await apiClient.get<DocumentChecklistItem[]>(`/superadmin/schools/${schoolId}/documents`, token);
        } catch {
            return [] as DocumentChecklistItem[];
        }
    },

    /** Moniteurs d'une école (pour accéder à leur revue documentaire). */
    getSchoolMonitors: async (schoolId: string, token: string) => {
        try {
            return await apiClient.get<SchoolMonitor[]>(`/superadmin/schools/${schoolId}/monitors`, token);
        } catch {
            return [] as SchoolMonitor[];
        }
    },

    /** Checklist documentaire d'un moniteur. */
    getMonitorDocuments: async (monitorId: string, token: string) => {
        try {
            return await apiClient.get<DocumentChecklistItem[]>(`/superadmin/monitors/${monitorId}/documents`, token);
        } catch {
            return [] as DocumentChecklistItem[];
        }
    },

    /** Revue d'une pièce : decision = "APPROVE" | "REJECT". Renvoie la checklist à jour. */
    reviewDocument: async (documentId: string, decision: "APPROVE" | "REJECT", notes: string | undefined, token: string) => {
        try {
            return await apiClient.put<DocumentChecklistItem[]>(
                `/superadmin/documents/${documentId}/review`,
                { decision, notes },
                token
            );
        } catch {
            throw new Error(KYC_UNAVAILABLE);
        }
    },
};
