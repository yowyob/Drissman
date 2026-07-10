import { apiClient } from "@/lib/api-client";

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "VISITOR" | "SCHOOL_ADMIN" | "CANDIDAT" | "MONITOR" | "SUPER_ADMIN";
    schoolId?: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export interface RegisterPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: "VISITOR" | "CANDIDAT" | "SCHOOL_ADMIN" | "SUPER_ADMIN";
    schoolName?: string;
    secretCode?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface UpgradeVisitorPayload {
    targetRole: "CANDIDAT" | "SCHOOL_ADMIN";
    schoolName?: string;
}

export const authService = {
    register: (payload: RegisterPayload) =>
        apiClient.post<AuthResponse>("/auth/register", payload),

    login: (payload: LoginPayload) =>
        apiClient.post<AuthResponse>("/auth/login", payload),

    upgradeVisitor: (payload: UpgradeVisitorPayload, token: string) =>
        apiClient.post<AuthResponse>("/auth/upgrade-visitor", payload, token),
};
