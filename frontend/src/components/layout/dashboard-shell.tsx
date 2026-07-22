"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, ChevronRight, Settings, PanelLeftClose, PanelLeft, Home, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo, LogoMark } from "@/components/layout/logo";

export interface DashboardNavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    badge?: boolean;
}

export interface DashboardNavGroup {
    label: string | null;
    items: DashboardNavItem[];
}

interface DashboardShellProps {
    /** Lien du logo + racine servant à calculer l'élément actif. */
    homeHref: string;
    /** Petit libellé au-dessus du nom dans la carte utilisateur (ex : "Élève"). */
    roleLabel: string;
    navGroups: DashboardNavGroup[];
    /** Lien "Paramètres" dédié en bas de sidebar (optionnel). */
    settingsHref?: string;
    settingsLabel?: string;
    /** Contenu rendu au-dessus de la zone principale (ex : <OfflineBar/>). */
    topSlot?: React.ReactNode;
    children: React.ReactNode;
}

const COLLAPSE_KEY = "drissman_sidebar_collapsed";

/**
 * Coquille de tableau de bord commune (sidebar verticale) — modèle unique
 * partagé par les espaces Admin, Élève et Moniteur. Sidebar rétractable
 * (desktop) : l'état réduit est mémorisé dans localStorage. Le contrôle d'accès
 * (rôle) reste dans chaque layout appelant.
 */
export function DashboardShell({
    homeHref,
    roleLabel,
    navGroups,
    settingsHref,
    settingsLabel = "Paramètres",
    topSlot,
    children,
}: DashboardShellProps) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false); // overlay mobile
    const [collapsed, setCollapsed] = useState(false); // réduit (desktop)

    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
        } catch { /* localStorage indisponible */ }
    }, []);

    const toggleCollapsed = () => {
        setCollapsed((c) => {
            const next = !c;
            try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
            return next;
        });
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const isItemActive = (href: string) =>
        pathname === href || (href !== homeHref && pathname.startsWith(href));

    // Classe pour masquer un contenu uniquement en mode réduit SUR DESKTOP
    // (l'overlay mobile reste toujours complet).
    const hideOnCollapsed = collapsed ? "lg:hidden" : "";

    return (
        <div className="min-h-screen bg-asphalt flex">
            {/* Sidebar overlay (mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen w-72 ${collapsed ? "lg:w-20" : "lg:w-72"} bg-white/[0.02] backdrop-blur-xl
                border-r border-white/[0.06] flex flex-col z-50
                transition-[transform,width] duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                {/* Logo */}
                <div className={`p-6 flex items-center ${collapsed ? "lg:justify-center lg:px-3" : "justify-between"}`}>
                    <Link href={homeHref} className="flex items-center gap-3 group" title={roleLabel}>
                        <Logo className={`h-9 w-auto ${hideOnCollapsed}`} />
                        <LogoMark className={`h-8 w-auto ${collapsed ? "hidden lg:block" : "hidden"}`} />
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-mist hover:text-snow transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* User info card (masquée en mode réduit desktop) */}
                <div className={`mx-4 mb-2 p-3 bg-gradient-to-br from-signal/5 to-transparent rounded-xl border border-signal/10 ${hideOnCollapsed}`}>
                    <p className="text-[10px] text-signal/60 uppercase tracking-wider font-bold">{roleLabel}</p>
                    <p className="text-sm font-bold text-snow truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] text-mist/40 truncate">{user?.email}</p>
                </div>

                {/* Grouped Nav */}
                <nav className={`flex-1 overflow-y-auto space-y-4 pt-2 ${collapsed ? "lg:px-2 px-3" : "px-3"}`}>
                    {navGroups.map((group, gi) => (
                        <div key={gi}>
                            {group.label && (
                                <p className={`text-[10px] font-bold text-mist/30 uppercase tracking-wider px-4 mb-1.5 ${hideOnCollapsed}`}>{group.label}</p>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = isItemActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            title={item.name}
                                            className={`
                                                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                                                ${collapsed ? "lg:justify-center lg:px-0" : ""}
                                                ${isActive
                                                    ? "bg-signal/10 text-signal border border-signal/20"
                                                    : "text-mist hover:bg-white/5 hover:text-snow border border-transparent"
                                                }
                                            `}
                                        >
                                            <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-signal" : "text-mist/60 group-hover:text-mist"}`} />
                                            <span className={`flex-1 ${hideOnCollapsed}`}>{item.name}</span>
                                            {isActive && <ChevronRight className={`h-3.5 w-3.5 text-signal/60 ${hideOnCollapsed}`} />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Settings (optional) + Logout + toggle */}
                <div className="p-3 space-y-0.5 border-t border-white/[0.06]">
                    <div className={`px-4 py-2 flex ${collapsed ? "lg:justify-center" : "justify-between"} items-center`}>
                        {/* Bouton réduire/agrandir (desktop uniquement) */}
                        <button
                            onClick={toggleCollapsed}
                            className="hidden lg:inline-flex text-mist/60 hover:text-snow transition-colors"
                            title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
                            aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
                        >
                            {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
                        </button>
                        <span className={hideOnCollapsed}><ThemeToggle /></span>
                    </div>
                    {settingsHref && (
                        <Link href={settingsHref}
                            onClick={() => setSidebarOpen(false)}
                            title={settingsLabel}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${collapsed ? "lg:justify-center lg:px-0" : ""} ${pathname === settingsHref ? "bg-signal/10 text-signal border border-signal/20" : "text-mist hover:bg-white/5 hover:text-snow border border-transparent"}`}>
                            <Settings className={`h-[18px] w-[18px] shrink-0 ${pathname === settingsHref ? "text-signal" : "text-mist/60 group-hover:text-mist"}`} />
                            <span className={hideOnCollapsed}>{settingsLabel}</span>
                        </Link>
                    )}
                    {/* Retour vers le site public (accessible depuis tout dashboard) */}
                    <Link href="/"
                        onClick={() => setSidebarOpen(false)}
                        title="Accueil du site"
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-mist hover:bg-white/5 hover:text-snow border border-transparent transition-all group ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
                        <Home className="h-[18px] w-[18px] shrink-0 text-mist/60 group-hover:text-mist" />
                        <span className={hideOnCollapsed}>Accueil du site</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        title="Déconnexion"
                        className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                    >
                        <LogOut className="h-[18px] w-[18px] shrink-0" />
                        <span className={hideOnCollapsed}>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-h-screen min-w-0">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 bg-asphalt/80 backdrop-blur-lg border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl bg-white/5 text-mist hover:text-snow transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Logo className="h-7 w-auto" />
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </header>

                {topSlot}

                {/* Page content */}
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
