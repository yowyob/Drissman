"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks";
import { superAdminService, GlobalStatsDto, RecentActivityDto } from "@/lib/superadmin-service";
import { 
    Loader2, Users, Building2, AlertCircle, DollarSign, 
    GraduationCap, TrendingUp, Activity, CheckCircle2, Clock, 
    ArrowUpRight, Landmark, ShoppingBag
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem, AnimatedNumber } from "@/components/ui/motion";
import { toast } from "sonner";
import Link from "next/link";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell
} from "recharts";

function StatCard({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle 
}: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    color: "rose" | "amber" | "emerald" | "indigo" | "violet"; 
    subtitle?: string; 
}) {
    const colorMap = {
        rose: "from-rose-500/10 to-rose-600/5 border-rose-500/20 text-rose-400",
        amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400",
        emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
        indigo: "from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-400",
        violet: "from-violet-500/10 to-violet-600/5 border-violet-500/20 text-violet-400",
    };

    const iconBgMap = {
        rose: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        indigo: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
        violet: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    };

    return (
        <div className={`bg-gradient-to-br ${colorMap[color]} rounded-2xl border p-5 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`${iconBgMap[color]} p-2.5 rounded-xl`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div>
                <p className="text-3xl font-black text-snow tracking-tight leading-none mb-1.5">{value}</p>
                <p className="text-xs font-bold text-mist/70 tracking-wide uppercase">{title}</p>
                {subtitle && <p className="text-[10px] text-mist/40 mt-1 font-medium">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function SuperAdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<GlobalStatsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [validatingId, setValidatingId] = useState<string | null>(null);

    const loadStats = useCallback(async (isSilent = false) => {
        if (!token) return;
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        try {
            const data = await superAdminService.getStats(token);
            setStats(data);
        } catch (err: any) {
            toast.error(err.message || "Erreur lors du chargement des statistiques");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        setMounted(true);
        loadStats();

        const intervalId = setInterval(() => {
            loadStats(true);
        }, 20000);

        return () => clearInterval(intervalId);
    }, [loadStats]);

    const handleQuickValidate = async (schoolId: string, name: string) => {
        if (!token) return;
        setValidatingId(schoolId);
        try {
            await superAdminService.validateSchool(schoolId, token);
            toast.success(`L'auto-école "${name}" a été validée avec succès`);
            await loadStats(true);
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de la validation");
        } finally {
            setValidatingId(null);
        }
    };

    const formatRelativeTime = (timestampStr: string) => {
        try {
            const date = new Date(timestampStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return "À l'instant";
            if (diffMins < 60) return `Il y a ${diffMins} min`;
            if (diffHours < 24) return `Il y a ${diffHours} h`;
            if (diffDays === 1) return "Hier";
            return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        } catch (e) {
            return "Récemment";
        }
    };

    const roleColors = {
        SUPER_ADMIN: "#f43f5e",
        SCHOOL_ADMIN: "#3b82f6",
        MONITOR: "#8b5cf6",
        CANDIDAT: "#10b981",
        VISITOR: "#64748b",
    };

    const roleLabels: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        SCHOOL_ADMIN: "Gérant Auto-école",
        MONITOR: "Moniteur",
        CANDIDAT: "Élève / Candidat",
        VISITOR: "Visiteur / Public",
    };

    const userPieData = useMemo(() => {
        if (!stats?.usersByRole) return [];
        return Object.entries(stats.usersByRole).map(([role, count]) => ({
            name: roleLabels[role] || role,
            value: count,
            color: roleColors[role as keyof typeof roleColors] || "#e2e8f0"
        }));
    }, [stats]);

    const formattedRevenue = useMemo(() => {
        if (!stats?.totalRevenue) return "0 FCFA";
        return new Intl.NumberFormat("fr-FR").format(stats.totalRevenue) + " FCFA";
    }, [stats]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
                <p className="text-xs text-mist/60 font-bold uppercase tracking-wider">Chargement des données globales...</p>
            </div>
        );
    }

    if (!stats) return null;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const isRevenue = payload[0].name === "Revenue";
            const formattedVal = isRevenue 
                ? new Intl.NumberFormat("fr-FR").format(payload[0].value) + " FCFA"
                : `${payload[0].value} auto-école(s)`;
            return (
                <div className="bg-asphalt/95 border border-white/[0.08] backdrop-blur-md p-3 rounded-xl shadow-xl">
                    <p className="text-[10px] font-bold text-mist/60 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-xs font-black text-snow">{formattedVal}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <PageTransition className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-snow mb-1 tracking-tight">Vue d'ensemble</h1>
                    <p className="text-mist text-sm font-medium">Statistiques globales et activités de la plateforme Drissman.</p>
                </div>
                <div className="flex items-center gap-3">
                    {refreshing && (
                        <div className="flex items-center gap-1.5 text-xs text-mist/40 font-bold uppercase tracking-wider">
                            <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
                            Mise à jour...
                        </div>
                    )}
                    <Link
                        href="/superadmin/schools"
                        className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-xl text-xs hover:opacity-95 transition-all shadow-md shadow-rose-500/10 flex items-center gap-2"
                    >
                        <Building2 className="h-4 w-4" />
                        Gérer les validations
                    </Link>
                </div>
            </div>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StaggerItem>
                    <StatCard 
                        title="Chiffre d'Affaires" 
                        value={formattedRevenue} 
                        icon={DollarSign} 
                        color="emerald" 
                        subtitle="Revenus totaux générés"
                    />
                </StaggerItem>
                <StaggerItem>
                    <StatCard 
                        title="Total Utilisateurs" 
                        value={stats.totalUsers} 
                        icon={Users} 
                        color="indigo" 
                        subtitle="Utilisateurs inscrits sur la plateforme"
                    />
                </StaggerItem>
                <StaggerItem>
                    <StatCard 
                        title="Auto-écoles Inscrites" 
                        value={stats.totalSchools} 
                        icon={Building2} 
                        color="rose" 
                        subtitle="Établissements partenaires enregistrés"
                    />
                </StaggerItem>
                <StaggerItem>
                    <StatCard 
                        title="En attente de validation" 
                        value={stats.pendingSchools} 
                        icon={AlertCircle} 
                        color="amber" 
                        subtitle="Auto-écoles nécessitant une vérification"
                    />
                </StaggerItem>
            </StaggerContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Evolution du CA */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-snow">Évolution du Chiffre d'Affaires</h3>
                            <p className="text-[10px] text-mist/40">Revenus cumulés par mois</p>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        {mounted && stats.revenueByMonth?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.revenueByMonth} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="rgba(255,255,255,0.2)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="rgba(255,255,255,0.2)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `${value / 1000}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        name="Revenue"
                                        stroke="#10b981" 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <DollarSign className="h-10 w-10 text-mist/20 mb-2" />
                                <p className="text-xs text-mist/50">Aucune donnée financière disponible</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Croissance des Auto-écoles */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-snow">Croissance des Auto-écoles</h3>
                            <p className="text-[10px] text-mist/40">Inscriptions d'auto-écoles par mois</p>
                        </div>
                        <div className="bg-rose-500/10 text-rose-400 p-2 rounded-xl border border-rose-500/20">
                            <Landmark className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        {mounted && stats.schoolsTrend?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.schoolsTrend} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="rgba(255,255,255,0.2)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="rgba(255,255,255,0.2)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                                    <Bar 
                                        dataKey="count" 
                                        name="Auto-écoles"
                                        fill="url(#schoolGradient)"
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {stats.schoolsTrend.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="url(#schoolGradient)" />
                                        ))}
                                    </Bar>
                                    <defs>
                                        <linearGradient id="schoolGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" />
                                            <stop offset="95%" stopColor="#f59e0b" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <Building2 className="h-10 w-10 text-mist/20 mb-2" />
                                <p className="text-xs text-mist/50">Aucune donnée d'inscription disponible</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Utilisateurs par rôle */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 lg:col-span-1">
                    <h3 className="text-sm font-bold text-snow mb-1">Rôles des Utilisateurs</h3>
                    <p className="text-[10px] text-mist/40 mb-6">Répartition par type de compte</p>
                    
                    <div className="flex flex-col items-center">
                        <div className="h-[180px] w-full flex items-center justify-center">
                            {mounted && userPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={userPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {userPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-xs text-mist/50">Aucun utilisateur enregistré</p>
                            )}
                        </div>

                        <div className="w-full space-y-2 mt-4">
                            {userPieData.map((role) => (
                                <div key={role.name} className="flex justify-between items-center p-2 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: role.color }} />
                                        <span className="text-[11px] font-bold text-snow">{role.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-mist">{role.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Flux d'activité récent */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 lg:col-span-2 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-snow">Activités Récentes</h3>
                            <p className="text-[10px] text-mist/40">Flux des événements en temps réel</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl border border-white/[0.06]">
                            <Activity className="h-4 w-4 text-mist" />
                        </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1 flex-1">
                        {stats.recentActivities?.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-center">
                                <Activity className="h-8 w-8 text-mist/20 mb-2" />
                                <p className="text-xs text-mist/50">Aucune activité enregistrée</p>
                            </div>
                        ) : (
                            stats.recentActivities.map((activity, index) => {
                                const isPendingSchool = activity.type === "SCHOOL" && activity.status === "PENDING";
                                
                                return (
                                    <div 
                                        key={index} 
                                        className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all flex items-center justify-between gap-4 flex-wrap"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                            <div className={`p-2.5 rounded-xl shrink-0 ${
                                                activity.type === "SCHOOL" 
                                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                                                    : activity.type === "INVOICE"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                            }`}>
                                                {activity.type === "SCHOOL" ? (
                                                    <Building2 className="h-4 w-4" />
                                                ) : activity.type === "INVOICE" ? (
                                                    <DollarSign className="h-4 w-4" />
                                                ) : (
                                                    <GraduationCap className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-snow leading-tight mb-0.5">{activity.description}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-mist/30 uppercase tracking-wider">
                                                        {activity.type === "SCHOOL" ? "Auto-école" : activity.type === "INVOICE" ? "Paiement" : "Inscription"}
                                                    </span>
                                                    <span className="text-[9px] text-mist/30">•</span>
                                                    <span className="text-[10px] text-mist/40 font-medium">{formatRelativeTime(activity.timestamp)}</span>
                                                    {activity.schoolName && (
                                                        <>
                                                            <span className="text-[9px] text-mist/30">•</span>
                                                            <span className="text-[10px] font-bold text-rose-400/70 truncate">{activity.schoolName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isPendingSchool ? (
                                                <button
                                                    onClick={() => handleQuickValidate(activity.resourceId || "", activity.schoolName || "Auto-école")}
                                                    disabled={validatingId === activity.resourceId}
                                                    className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-black rounded-lg transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                                                >
                                                    {validatingId === activity.resourceId ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    )}
                                                    Valider
                                                </button>
                                            ) : (
                                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-wider border shrink-0 ${
                                                    activity.status === "PAID" || activity.status === "VERIFIED" || activity.status === "ACTIVE" || activity.status === "COMPLETED"
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : activity.status === "PENDING"
                                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                                }`}>
                                                    {activity.status === "VERIFIED" ? "Vérifié" : activity.status === "PENDING" ? "En attente" : activity.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
