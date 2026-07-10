"use client";

import { useAuth } from "@/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LayoutDashboard, CalendarDays, TrendingUp, User, LogOut, Car, Menu, X, BookOpen, Receipt } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
    { name: "Accueil", href: "/candidat", icon: LayoutDashboard },
    { name: "Catalogue", href: "/candidat/catalogue", icon: BookOpen },
    { name: "Mon Planning", href: "/candidat/planning", icon: CalendarDays },
    { name: "Ma Progression", href: "/candidat/progression", icon: TrendingUp },
    { name: "Mes Paiements", href: "/candidat/payments", icon: Receipt },
    { name: "Mon Profil", href: "/candidat/profile", icon: User },
];

export default function CandidatLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "CANDIDAT")) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading || !isAuthenticated || user?.role !== "CANDIDAT") {
        return <div className="min-h-screen bg-asphalt flex items-center justify-center"><Loader2 className="h-10 w-10 text-signal animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-asphalt pb-20 sm:pb-0">
            {/* Top nav */}
            <header className="sticky top-0 z-30 bg-asphalt/80 backdrop-blur-lg border-b border-white/[0.06]">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/candidat" className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-signal to-amber-400 p-2 rounded-xl shadow-lg shadow-signal/10">
                            <Car className="h-4 w-4 text-asphalt" />
                        </div>
                        <span className="text-sm font-black text-snow">DRISS<span className="text-signal">MAN</span></span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden sm:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? "bg-signal/10 text-signal" : "text-mist hover:text-snow"}`}>
                                    <item.icon className="h-3.5 w-3.5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        {/* User card */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-signal/20 to-blue-500/20 flex items-center justify-center text-signal font-bold text-[10px]">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <span className="text-xs font-bold text-snow">{user.firstName}</span>
                        </div>

                        {/* Mobile hamburger */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden p-2 rounded-xl text-mist hover:text-snow hover:bg-white/5 transition-all">
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                        <ThemeToggle />

                        <button onClick={() => { logout(); router.push("/"); }}
                            className="hidden sm:block p-2 rounded-xl text-mist hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                    <div className="sm:hidden bg-asphalt/95 backdrop-blur-lg border-t border-white/[0.06] px-4 py-3 space-y-1">
                        <div className="flex items-center gap-2 px-3 py-2 mb-2">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-signal/20 to-blue-500/20 flex items-center justify-center text-signal font-bold text-xs">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-snow">{user.firstName} {user.lastName}</p>
                                <p className="text-[10px] text-mist/40">{user.email}</p>
                            </div>
                        </div>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-signal/10 text-signal" : "text-mist hover:text-snow"}`}>
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        <button onClick={() => { logout(); router.push("/"); }}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all mt-2">
                            <LogOut className="h-4 w-4" />
                            Déconnexion
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-6xl mx-auto p-6">{children}</main>

            {/* Mobile bottom tab bar */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-asphalt/90 backdrop-blur-lg border-t border-white/[0.06] px-2 py-1.5 flex items-center justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? "text-signal" : "text-mist/50"}`}>
                            <item.icon className={`h-5 w-5 ${isActive ? "text-signal" : ""}`} />
                            <span className="text-[9px] font-bold">{item.name.replace("Mon ", "").replace("Ma ", "")}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
