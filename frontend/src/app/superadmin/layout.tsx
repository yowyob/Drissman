"use client";

import { useAuth } from "@/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Loader2, LayoutDashboard, Building2, Users,
    Settings, LogOut, Menu, X, Car, ChevronRight, Lock
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navGroups = [
    {
        label: null,
        items: [
            { name: "Vue d'ensemble", href: "/superadmin", icon: LayoutDashboard },
        ],
    },
    {
        label: "Administration",
        items: [
            { name: "Auto-écoles", href: "/superadmin/schools", icon: Building2 },
            { name: "Utilisateurs", href: "/superadmin/users", icon: Users },
        ],
    },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "SUPER_ADMIN")) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading || !isAuthenticated || user?.role !== "SUPER_ADMIN") {
        return (
            <div className="min-h-screen bg-asphalt flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-signal animate-spin" />
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-asphalt flex">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen w-72 bg-white/[0.02] backdrop-blur-xl
                border-r border-white/[0.06] flex flex-col z-50
                transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <Link href="/superadmin" className="flex items-center gap-3 group">
                        <div className="bg-gradient-to-br from-rose-500 to-amber-400 p-2.5 rounded-xl shadow-lg shadow-rose-500/10">
                            <Car className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-black text-snow">
                            DRISS<span className="text-rose-500">MAN</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-mist hover:text-snow transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mx-4 mb-2 p-3 bg-gradient-to-br from-rose-500/5 to-transparent rounded-xl border border-rose-500/10">
                    <div className="flex items-center gap-2 mb-1">
                        <Lock className="h-3.5 w-3.5 text-rose-500" />
                        <p className="text-[10px] text-rose-500/80 uppercase tracking-wider font-bold">Super Admin</p>
                    </div>
                    <p className="text-sm font-bold text-snow truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-mist/40">{user.email}</p>
                </div>

                <nav className="flex-1 px-3 overflow-y-auto space-y-4 pt-2">
                    {navGroups.map((group, gi) => (
                        <div key={gi}>
                            {group.label && (
                                <p className="text-[10px] font-bold text-mist/30 uppercase tracking-wider px-4 mb-1.5">{group.label}</p>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                                                ${isActive
                                                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                                    : "text-mist hover:bg-white/5 hover:text-snow border border-transparent"
                                                }
                                            `}
                                        >
                                            <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-rose-500" : "text-mist/60 group-hover:text-mist"}`} />
                                            <span className="flex-1">{item.name}</span>
                                            {isActive && <ChevronRight className="h-3.5 w-3.5 text-rose-500/60" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-3 space-y-0.5 border-t border-white/[0.06]">
                    <div className="px-4 py-2 flex justify-end">
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                        <LogOut className="h-[18px] w-[18px]" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            <div className="flex-1 min-h-screen">
                <header className="lg:hidden sticky top-0 z-30 bg-asphalt/80 backdrop-blur-lg border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl bg-white/5 text-mist hover:text-snow transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-black text-snow">
                        DRISS<span className="text-rose-500">MAN</span>
                    </span>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </header>

                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
