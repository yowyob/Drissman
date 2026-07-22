"use client";

import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LayoutDashboard, CalendarDays, Users, User, Car } from "lucide-react";
import { DashboardShell, type DashboardNavGroup } from "@/components/layout/dashboard-shell";
import { OfflineBar } from "@/components/offline/offline-bar";

const navGroups: DashboardNavGroup[] = [
    {
        label: null,
        items: [{ name: "Accueil", href: "/monitor", icon: LayoutDashboard }],
    },
    {
        label: "Opérations",
        items: [
            { name: "Mon Planning", href: "/monitor/planning", icon: CalendarDays },
            { name: "Suivi GPS", href: "/monitor/tracking", icon: Car },
        ],
    },
    {
        label: "Personnes",
        items: [
            { name: "Mes Élèves", href: "/monitor/students", icon: Users },
        ],
    },
    {
        label: "Compte",
        items: [
            { name: "Mon Profil", href: "/monitor/profile", icon: User },
        ],
    },
];

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "MONITOR")) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading || !isAuthenticated || user?.role !== "MONITOR") {
        return <div className="min-h-screen bg-asphalt flex items-center justify-center"><Loader2 className="h-10 w-10 text-signal animate-spin" /></div>;
    }

    return (
        <DashboardShell
            homeHref="/monitor"
            roleLabel="Moniteur"
            navGroups={navGroups}
            topSlot={<OfflineBar />}
        >
            {children}
        </DashboardShell>
    );
}
