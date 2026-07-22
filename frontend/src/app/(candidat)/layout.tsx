"use client";

import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LayoutDashboard, CalendarDays, TrendingUp, User, BookOpen, Receipt } from "lucide-react";
import { DashboardShell, type DashboardNavGroup } from "@/components/layout/dashboard-shell";

const navGroups: DashboardNavGroup[] = [
    {
        label: null,
        items: [{ name: "Accueil", href: "/candidat", icon: LayoutDashboard }],
    },
    {
        label: "Formation",
        items: [
            { name: "Catalogue", href: "/candidat/catalogue", icon: BookOpen },
            { name: "Mon Planning", href: "/candidat/planning", icon: CalendarDays },
            { name: "Ma Progression", href: "/candidat/progression", icon: TrendingUp },
        ],
    },
    {
        label: "Compte",
        items: [
            { name: "Mes Paiements", href: "/candidat/payments", icon: Receipt },
            { name: "Mon Profil", href: "/candidat/profile", icon: User },
        ],
    },
];

export default function CandidatLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "CANDIDAT")) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading || !isAuthenticated || user?.role !== "CANDIDAT") {
        return <div className="min-h-screen bg-asphalt flex items-center justify-center"><Loader2 className="h-10 w-10 text-signal animate-spin" /></div>;
    }

    return (
        <DashboardShell homeHref="/candidat" roleLabel="Élève" navGroups={navGroups}>
            {children}
        </DashboardShell>
    );
}
