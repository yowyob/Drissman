"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks";
import { superAdminService, School } from "@/lib/superadmin-service";
import {
    Loader2, CheckCircle2, XCircle, Building2, MapPin,
    Search, Globe, Phone, Mail, Star, ShieldCheck, ShieldAlert, Ban
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { toast } from "sonner";

export default function SuperAdminSchoolsPage() {
    const { token } = useAuth();
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified">("all");
    const [rejectTarget, setRejectTarget] = useState<School | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const fetchSchools = async () => {
        if (!token) return;
        try {
            const data = await superAdminService.getAllSchools(token);
            setSchools(data);
        } catch (err: any) {
            toast.error(err.message || "Erreur lors du chargement des auto-écoles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, [token]);

    const handleToggleVerification = async (schoolId: string, currentStatus: boolean, name: string) => {
        if (!token) return;
        setActionId(schoolId);
        try {
            const updated = await superAdminService.toggleSchoolVerification(schoolId, token);
            toast.success(
                updated.isVerified
                    ? `L'auto-école "${name}" a été vérifiée.`
                    : `La vérification de "${name}" a été retirée.`
            );
            setSchools(schools.map((s) => s.id === schoolId ? updated : s));
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de la modification du statut");
        } finally {
            setActionId(null);
        }
    };

    // Approbation : passe par le flux gouvernance (miroité vers le kernel côté backend).
    const handleValidate = async (school: School) => {
        if (!token) return;
        setActionId(school.id);
        try {
            const updated = await superAdminService.validateSchool(school.id, token);
            toast.success(`L'auto-école "${school.name}" a été approuvée.`);
            setSchools(schools.map((s) => s.id === school.id ? updated : s));
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de l'approbation");
        } finally {
            setActionId(null);
        }
    };

    // Rejet motivé : le motif est obligatoire et transmis au kernel (gouvernance).
    const confirmReject = async () => {
        if (!token || !rejectTarget) return;
        if (!rejectReason.trim()) {
            toast.error("Un motif de rejet est requis.");
            return;
        }
        setActionId(rejectTarget.id);
        try {
            const updated = await superAdminService.rejectSchool(rejectTarget.id, rejectReason.trim(), token);
            toast.success(`L'auto-école "${rejectTarget.name}" a été rejetée.`);
            setSchools(schools.map((s) => s.id === rejectTarget.id ? updated : s));
            setRejectTarget(null);
            setRejectReason("");
        } catch (err: any) {
            toast.error(err.message || "Erreur lors du rejet");
        } finally {
            setActionId(null);
        }
    };

    const isRejected = (s: School) => s.governanceStatus === "REJECTED";

    const filteredSchools = useMemo(() => {
        return schools.filter((school) => {
            const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (school.city && school.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (school.address && school.address.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "verified" && school.isVerified) ||
                (statusFilter === "pending" && !school.isVerified && school.governanceStatus !== "REJECTED");

            return matchesSearch && matchesStatus;
        });
    }, [schools, searchTerm, statusFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
                <p className="text-xs text-mist/60 font-bold uppercase tracking-wider">Chargement des auto-écoles...</p>
            </div>
        );
    }

    return (
        <PageTransition className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-snow mb-1 tracking-tight">Gestion des Auto-écoles</h1>
                    <p className="text-mist text-sm font-medium">Visualisez, filtrez et validez les établissements inscrits.</p>
                </div>
            </div>

            {/* Barre d'outils (Recherche & Filtres) */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/40" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, ville, adresse..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-snow placeholder:text-mist/30 focus:outline-none focus:border-rose-500/40 focus:bg-white/[0.04] transition-all"
                    />
                </div>

                <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl w-full md:w-auto">
                    {[
                        { value: "all", label: "Toutes" },
                        { value: "pending", label: "En attente" },
                        { value: "verified", label: "Vérifiées" },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value as any)}
                            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === tab.value
                                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    : "text-mist hover:bg-white/5 hover:text-snow"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {filteredSchools.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-16 text-center">
                    <Building2 className="h-12 w-12 text-mist/20 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-snow mb-1">Aucune auto-école trouvée</h3>
                    <p className="text-sm text-mist/50">Essayez de modifier vos critères de recherche ou de filtre.</p>
                </div>
            ) : (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredSchools.map((school) => (
                        <StaggerItem key={school.id}>
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between h-full hover:border-white/[0.1] hover:bg-white/[0.03] transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all pointer-events-none" />
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex gap-3.5 min-w-0">
                                            <div className="bg-rose-500/10 text-rose-500 border border-rose-500/20 p-3 rounded-2xl shrink-0">
                                                <Building2 className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-base font-black text-snow leading-tight mb-1 truncate">{school.name}</h3>
                                                <div className="flex items-center gap-1.5 text-mist/50 text-xs">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span className="truncate">{school.address || "Adresse non renseignée"}, {school.city}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-mist/70 text-xs leading-relaxed line-clamp-3">
                                        {school.description || "Aucune description renseignée pour cette auto-école."}
                                    </p>
                                </div>

                                {isRejected(school) && school.governanceReason && (
                                    <p className="mt-4 text-[11px] text-red-400/80 bg-red-500/[0.06] border border-red-500/15 rounded-xl px-3 py-2 leading-relaxed">
                                        <span className="font-black uppercase tracking-wider">Motif du rejet : </span>
                                        {school.governanceReason}
                                    </p>
                                )}

                                <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        {school.isVerified ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                <ShieldCheck className="h-3 w-3" />
                                                Vérifié
                                            </span>
                                        ) : isRejected(school) ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                <Ban className="h-3 w-3" />
                                                Rejeté
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                <ShieldAlert className="h-3 w-3" />
                                                En attente
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {school.isVerified ? (
                                            <button
                                                onClick={() => handleToggleVerification(school.id, school.isVerified, school.name)}
                                                disabled={actionId === school.id}
                                                className="px-4 py-2 font-black rounded-xl text-xs transition-all flex items-center gap-2 border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                            >
                                                {actionId === school.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Bloquer
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <>
                                                {!isRejected(school) && (
                                                    <button
                                                        onClick={() => { setRejectTarget(school); setRejectReason(""); }}
                                                        disabled={actionId === school.id}
                                                        className="px-4 py-2 font-black rounded-xl text-xs transition-all flex items-center gap-2 border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                                    >
                                                        <Ban className="h-3.5 w-3.5" />
                                                        Rejeter
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleValidate(school)}
                                                    disabled={actionId === school.id}
                                                    className="px-4 py-2 font-black rounded-xl text-xs transition-all flex items-center gap-2 border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                                >
                                                    {actionId === school.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            {isRejected(school) ? "Reconsidérer" : "Valider"}
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}

            {/* Modal de rejet motivé */}
            {rejectTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => { if (actionId !== rejectTarget.id) setRejectTarget(null); }}
                >
                    <div
                        className="w-full max-w-md bg-[#0d0d12] border border-white/[0.08] rounded-3xl p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-2.5 rounded-2xl">
                                <Ban className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-snow leading-tight">Rejeter l'auto-école</h3>
                                <p className="text-xs text-mist/50">{rejectTarget.name}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-mist/70 uppercase tracking-wider">
                                Motif du rejet <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder="Ex : documents non conformes, informations manquantes…"
                                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-snow placeholder:text-mist/30 focus:outline-none focus:border-red-500/40 focus:bg-white/[0.04] transition-all resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={() => setRejectTarget(null)}
                                disabled={actionId === rejectTarget.id}
                                className="px-4 py-2 font-black rounded-xl text-xs text-mist hover:bg-white/5 hover:text-snow transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={actionId === rejectTarget.id || !rejectReason.trim()}
                                className="px-4 py-2 font-black rounded-xl text-xs flex items-center gap-2 border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {actionId === rejectTarget.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Ban className="h-3.5 w-3.5" />
                                )}
                                Confirmer le rejet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
