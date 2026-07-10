"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks";
import { superAdminService, User } from "@/lib/superadmin-service";
import { 
    Loader2, Users, Search, CheckCircle2, AlertTriangle, Shield, 
    Smartphone, Mail, Calendar, Power, PowerOff, ShieldCheck
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { toast } from "sonner";

export default function SuperAdminUsersPage() {
    const { token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const fetchUsers = async () => {
        if (!token) return;
        try {
            const data = await superAdminService.getAllUsers(token);
            setUsers(data);
        } catch (err: any) {
            toast.error(err.message || "Erreur lors du chargement des utilisateurs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleToggleStatus = async (userId: string, currentActive: boolean, name: string) => {
        if (!token) return;
        setActionId(userId);
        try {
            const updated = await superAdminService.toggleUserActive(userId, token);
            toast.success(
                updated.isActive 
                    ? `Le compte de "${name}" a été réactivé.` 
                    : `Le compte de "${name}" a été désactivé.`
            );
            setUsers(users.map((u) => u.id === userId ? updated : u));
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de la modification de l'état du compte");
        } finally {
            setActionId(null);
        }
    };

    const roleColors = {
        SUPER_ADMIN: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        SCHOOL_ADMIN: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        MONITOR: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        CANDIDAT: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        VISITOR: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    };

    const roleLabels: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        SCHOOL_ADMIN: "Gérant Auto-école",
        MONITOR: "Moniteur",
        CANDIDAT: "Élève / Candidat",
        VISITOR: "Visiteur / Public",
    };

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phone && user.phone.includes(searchTerm));
            
            const matchesRole = roleFilter === "all" || user.role === roleFilter;

            const matchesStatus = 
                statusFilter === "all" || 
                (statusFilter === "active" && user.isActive) || 
                (statusFilter === "inactive" && !user.isActive);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
                <p className="text-xs text-mist/60 font-bold uppercase tracking-wider">Chargement des utilisateurs...</p>
            </div>
        );
    }

    return (
        <PageTransition className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-snow mb-1 tracking-tight">Gestion des Utilisateurs</h1>
                <p className="text-mist text-sm font-medium">Visualisez les comptes utilisateurs, filtrez par rôle et gérez leur accès.</p>
            </div>

            {/* Barre de Recherche et Filtres */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/40" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-snow placeholder:text-mist/30 focus:outline-none focus:border-rose-500/40 focus:bg-white/[0.04] transition-all"
                    />
                </div>

                <div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-asphalt border border-white/[0.06] rounded-xl text-sm text-snow focus:outline-none focus:border-rose-500/40 transition-all appearance-none"
                    >
                        <option value="all">Tous les rôles</option>
                        {Object.entries(roleLabels).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-asphalt border border-white/[0.06] rounded-xl text-sm text-snow focus:outline-none focus:border-rose-500/40 transition-all appearance-none"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Comptes actifs</option>
                        <option value="inactive">Comptes désactivés</option>
                    </select>
                </div>
            </div>

            {filteredUsers.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-16 text-center">
                    <Users className="h-12 w-12 text-mist/20 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-snow mb-1">Aucun utilisateur trouvé</h3>
                    <p className="text-sm text-mist/50">Essayez de modifier vos critères de recherche ou vos filtres.</p>
                </div>
            ) : (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredUsers.map((user) => {
                        const userName = `${user.firstName} ${user.lastName}`;
                        return (
                            <StaggerItem key={user.id}>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-5 flex flex-col justify-between h-full hover:border-white/[0.1] hover:bg-white/[0.03] transition-all relative overflow-hidden group">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-black text-snow leading-tight mb-1 truncate">{userName}</h3>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg tracking-wider border ${
                                                    roleColors[user.role as keyof typeof roleColors] || roleColors.VISITOR
                                                }`}>
                                                    {roleLabels[user.role] || user.role}
                                                </span>
                                            </div>

                                            <div className="shrink-0">
                                                {user.isActive ? (
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500 block shadow shadow-emerald-500/50" />
                                                ) : (
                                                    <span className="h-2 w-2 rounded-full bg-red-500 block shadow shadow-red-500/50" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2 text-xs text-mist/60 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-mist/40 shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="h-3.5 w-3.5 text-mist/40 shrink-0" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                            {user.createdAt && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-mist/40 shrink-0" />
                                                    <span>Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
                                        <span className={`text-[10px] font-bold ${user.isActive ? "text-emerald-400" : "text-red-400"}`}>
                                            {user.isActive ? "Compte actif" : "Compte suspendu"}
                                        </span>

                                        {user.role !== "SUPER_ADMIN" && (
                                            <button
                                                onClick={() => handleToggleStatus(user.id, user.isActive, userName)}
                                                disabled={actionId === user.id}
                                                className={`p-2 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 border ${
                                                    user.isActive
                                                        ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                                }`}
                                                title={user.isActive ? "Désactiver le compte" : "Activer le compte"}
                                            >
                                                {actionId === user.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : user.isActive ? (
                                                    <>
                                                        <PowerOff className="h-4 w-4" />
                                                        Désactiver
                                                    </>
                                                ) : (
                                                    <>
                                                        <Power className="h-4 w-4" />
                                                        Activer
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </StaggerItem>
                        );
                    })}
                </StaggerContainer>
            )}
        </PageTransition>
    );
}
