"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks";
import { GraduationCap, DollarSign, CalendarDays, Clock, BookOpen, Users2, Activity, Layers, Loader2 } from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import Link from "next/link";
import { enrollmentService, type AdminDashboardDto } from "@/lib/enrollment-service";

function StatCard({ title, value, icon: Icon, color, subtitle }: { title: string; value: string | number; icon: React.ElementType; color: string; subtitle?: string }) {
    const colorMap: Record<string, string> = {
        blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400",
        green: "from-green-500/10 to-green-600/5 border-green-500/20 text-green-400",
        signal: "from-signal/10 to-amber-500/5 border-signal/20 text-signal",
        purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400",
    };
    const classes = colorMap[color] || colorMap.blue;

    return (
        <div className={`bg-gradient-to-br ${classes} rounded-2xl border p-5`}>
            <Icon className="h-5 w-5 opacity-60 mb-2" />
            <p className="text-2xl font-black text-snow">{value}</p>
            <p className="text-xs text-mist/60">{title}</p>
            {subtitle && <p className="text-[10px] text-mist/30 mt-0.5">{subtitle}</p>}
        </div>
    );
}

export default function AdminDashboardPage() {
    const { token } = useAuth();
    const [stats, setStats] = useState<AdminDashboardDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const load = async () => {
            setLoading(true);
            try {
                const remote = await enrollmentService.getAdminDashboard(token);
                setStats(remote);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        void load();
        const intervalId = window.setInterval(() => void load(), 15000);
        return () => window.clearInterval(intervalId);
    }, [token]);

    const today = new Date().toISOString().split("T")[0];
    const todaySessions = useMemo(
        () => (stats?.upcomingSessions ?? []).filter((s) => s.date === today).slice(0, 5),
        [stats, today],
    );
    const recentActivities = stats?.recentActivities ?? [];

    return (
        <PageTransition className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-snow">Tableau de Bord</h1>
                <p className="text-sm text-mist mt-0.5">Vue synthetique de votre auto-ecole</p>
            </div>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StaggerItem><StatCard title="Eleves actifs" value={stats?.activeCandidates ?? 0} icon={GraduationCap} color="blue" subtitle="Inscriptions ACTIVES/PENDING" /></StaggerItem>
                <StaggerItem><StatCard title="CA Global" value={`${new Intl.NumberFormat("fr-FR").format(stats?.totalRevenue ?? 0)} F`} icon={DollarSign} color="green" subtitle="Chiffre d'affaires total" /></StaggerItem>
                <StaggerItem><StatCard title="Seances du jour" value={stats?.todaySessions ?? 0} icon={CalendarDays} color="signal" subtitle="Sessions programmees" /></StaggerItem>
                <StaggerItem><StatCard title="En attente" value={stats?.pendingValidations ?? 0} icon={Clock} color="purple" subtitle="Validations sessions en retard" /></StaggerItem>
            </StaggerContainer>

            {loading && (
                <div className="flex items-center gap-2 text-xs text-mist/50">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Synchronisation des statistiques...
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-signal" />
                            <h2 className="text-sm font-bold text-snow">Seances du jour</h2>
                        </div>
                        <Link href="/admin/planning" className="text-[10px] font-bold text-signal hover:underline">Voir planning</Link>
                    </div>
                    {todaySessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CalendarDays className="h-10 w-10 text-mist/20 mb-3" />
                            <p className="text-sm text-mist/50">Aucune seance programmee aujourd&apos;hui</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {todaySessions.map((slot) => (
                                <div key={slot.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
                                    <span className="text-xs font-mono text-signal bg-signal/10 px-2 py-1 rounded-lg">{slot.startTime}-{slot.endTime}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-snow truncate">{slot.studentName}</p>
                                        <p className="text-[10px] text-mist/40 truncate">{slot.monitorName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-signal" />
                            <h2 className="text-sm font-bold text-snow">Activite recente</h2>
                        </div>
                        <Link href="/admin/students" className="text-[10px] font-bold text-signal hover:underline">Gerer</Link>
                    </div>
                    {recentActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Activity className="h-10 w-10 text-mist/20 mb-3" />
                            <p className="text-sm text-mist/50">Aucune activite recente</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <p className="text-xs font-bold text-snow">{activity.title}</p>
                                    <p className="text-[10px] text-mist/40">{activity.description} · {new Date(activity.timestamp).toLocaleDateString("fr-FR")}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                <h2 className="text-sm font-bold text-snow mb-4">Guide de demarrage</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { step: "1", label: "Creer des modules", href: "/admin/modules", icon: Layers, desc: "Blocs pedagogiques" },
                        { step: "2", label: "Creer une offre", href: "/admin/offers", icon: BookOpen, desc: "Formule commerciale" },
                        { step: "3", label: "Ajouter un moniteur", href: "/admin/monitors", icon: Users2, desc: "Sous-compte moniteur" },
                        { step: "4", label: "Planifier des seances", href: "/admin/planning", icon: CalendarDays, desc: "Creneaux horaires" },
                    ].map((item) => (
                        <a key={item.step} href={item.href}
                            className="group p-4 rounded-xl border border-white/[0.06] hover:border-signal/20 hover:bg-signal/[0.02] transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="h-6 w-6 rounded-full bg-signal/10 text-signal text-[10px] font-black flex items-center justify-center">{item.step}</span>
                                <span className="text-sm font-bold text-snow group-hover:text-signal transition-colors">{item.label}</span>
                            </div>
                            <p className="text-[10px] text-mist/40">{item.desc}</p>
                        </a>
                    ))}
                </div>
            </div>
        </PageTransition>
    );
}
