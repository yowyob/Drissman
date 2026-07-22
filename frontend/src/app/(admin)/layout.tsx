"use client";

import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
    Loader2, LayoutDashboard, BookOpen, Layers, Users2,
    CalendarDays, CalendarClock, GraduationCap, Receipt, Car,
} from "lucide-react";
import { DashboardShell, type DashboardNavGroup } from "@/components/layout/dashboard-shell";

const navGroups: DashboardNavGroup[] = [
    {
        label: null,
        items: [{ name: "Tableau de Bord", href: "/admin", icon: LayoutDashboard }],
    },
    {
        label: "Gestion",
        items: [
            { name: "Offres", href: "/admin/offers", icon: BookOpen },
            { name: "Modules", href: "/admin/modules", icon: Layers },
        ],
    },
    {
        label: "Opérations",
        items: [
            { name: "Planning", href: "/admin/planning", icon: CalendarClock },
            { name: "Promotions", href: "/admin/sessions", icon: CalendarDays },
            { name: "Véhicules", href: "/admin/vehicles", icon: Car },
        ],
    },
    {
        label: "Personnes",
        items: [
            { name: "Moniteurs", href: "/admin/monitors", icon: Users2 },
            { name: "Élèves", href: "/admin/students", icon: GraduationCap, badge: true },
        ],
    },
    {
        label: "Finance",
        items: [
            { name: "Factures", href: "/admin/invoices", icon: Receipt },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "SCHOOL_ADMIN")) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading || !isAuthenticated || user?.role !== "SCHOOL_ADMIN") {
        return (
            <div className="min-h-screen bg-asphalt flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-signal animate-spin" />
            </div>
        );
    }

    return (
        <DashboardShell
            homeHref="/admin"
            roleLabel="Auto-école"
            navGroups={navGroups}
            settingsHref="/admin/settings"
            settingsLabel="Paramètres"
        >
            {children}
        </DashboardShell>
    );
}
