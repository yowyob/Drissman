"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks";
import { superAdminService, School } from "@/lib/superadmin-service";
import { 
    Loader2, CheckCircle2, XCircle, Building2, MapPin, 
    Search, Globe, Phone, Mail, Star, ShieldCheck, ShieldAlert
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

    const filteredSchools = useMemo(() => {
        return schools.filter((school) => {
            const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (school.city && school.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (school.address && school.address.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = 
                statusFilter === "all" || 
                (statusFilter === "verified" && school.isVerified) || 
                (statusFilter === "pending" && !school.isVerified);

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

                                <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        {school.isVerified ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                <ShieldCheck className="h-3 w-3" />
                                                Vérifié
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                <ShieldAlert className="h-3 w-3" />
                                                En attente
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleToggleVerification(school.id, school.isVerified, school.name)}
                                        disabled={actionId === school.id}
                                        className={`px-4 py-2 font-black rounded-xl text-xs transition-all flex items-center gap-2 border ${
                                            school.isVerified
                                                ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                        }`}
                                    >
                                        {actionId === school.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : school.isVerified ? (
                                            <>
                                                <XCircle className="h-3.5 w-3.5" />
                                                Bloquer
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Valider
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}
        </PageTransition>
    );
}
