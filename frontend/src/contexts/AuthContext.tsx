"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService, AuthUser, RegisterPayload, LoginPayload, AuthResponse, UpgradeVisitorPayload } from "@/lib/auth-service";

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginPayload) => Promise<AuthResponse>;
    register: (payload: RegisterPayload) => Promise<AuthResponse>;
    upgradeVisitor: (payload: UpgradeVisitorPayload) => Promise<AuthResponse>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "drissman_token";
const USER_KEY = "drissman_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem(TOKEN_KEY);
            const savedUser = localStorage.getItem(USER_KEY);
            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            }
        } catch {
            // Corrupted storage — clear
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveSession = useCallback((response: AuthResponse) => {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }, []);

    const login = useCallback(async (payload: LoginPayload): Promise<AuthResponse> => {
        const response = await authService.login(payload);
        saveSession(response);
        return response;
    }, [saveSession]);

    const register = useCallback(async (payload: RegisterPayload): Promise<AuthResponse> => {
        const response = await authService.register(payload);
        saveSession(response);
        return response;
    }, [saveSession]);

    const upgradeVisitor = useCallback(async (payload: UpgradeVisitorPayload): Promise<AuthResponse> => {
        if (!token) {
            throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
        const response = await authService.upgradeVisitor(payload, token);
        saveSession(response);
        return response;
    }, [token, saveSession]);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user && !!token,
                isLoading,
                login,
                register,
                upgradeVisitor,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
