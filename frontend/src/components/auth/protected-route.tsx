"use client";

import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/login");
        } else if (!isLoading && isAuthenticated && user && !allowedRoles.includes(user.role)) {
            // Redirect to the correct dashboard for their role
            switch (user.role) {
                case "SCHOOL_ADMIN":
                    router.replace("/admin");
                    break;
                case "CANDIDAT":
                    router.replace("/candidat");
                    break;
                case "MONITOR":
                    router.replace("/monitor");
                    break;
                case "VISITOR":
                    router.replace("/visitor");
                    break;
                case "SUPER_ADMIN":
                    router.replace("/superadmin");
                    break;
                default:
                    router.replace("/");
            }
        }
    }, [isLoading, isAuthenticated, user, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-asphalt flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 text-signal animate-spin mx-auto mb-3" />
                    <p className="text-mist text-sm">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
