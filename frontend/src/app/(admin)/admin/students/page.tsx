"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks";
import { Search, GraduationCap, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { enrollmentService, type EnrollmentDto } from "@/lib/enrollment-service";

const statusConfig: Record<string, { label: string; class: string }> = {
    ACTIVE: { label: "Actif", class: "bg-green-500/10 text-green-400" },
    PENDING: { label: "En attente", class: "bg-yellow-500/10 text-yellow-400" },
    COMPLETED: { label: "Termine", class: "bg-blue-500/10 text-blue-400" },
    CANCELLED: { label: "Refuse", class: "bg-red-500/10 text-red-400" },
};

export default function StudentsPage() {
    const { token } = useAuth();
    const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const load = async () => {
            setLoading(true);
            try {
                const remote = await enrollmentService.getAdminEnrollments(token);
                setEnrollments(remote);
            } catch (error) {
                console.error(error);
                toast.error("Impossible de charger les inscriptions");
            } finally {
                setLoading(false);
            }
        };

        void load();
        const intervalId = window.setInterval(() => void load(), 15000);
        return () => window.clearInterval(intervalId);
    }, [token]);

    const filtered = useMemo(
        () =>
            enrollments.filter((e) => {
                const matchSearch = e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.offerName.toLowerCase().includes(searchQuery.toLowerCase());
                const normalizedStatus = e.status === "CANCELLED" ? "CANCELLED" : e.status;
                const matchStatus = filterStatus === "ALL" || normalizedStatus === filterStatus;
                return matchSearch && matchStatus;
            }),
        [enrollments, searchQuery, filterStatus],
    );

    const pendingCount = enrollments.filter((e) => e.status === "PENDING").length;
    const activeCount = enrollments.filter((e) => e.status === "ACTIVE").length;

    const handleValidate = async (id: string) => {
        if (!token) return;
        try {
            const updated = await enrollmentService.updateEnrollmentStatus(id, "ACTIVE", token);
            setEnrollments((prev) => prev.map((item) => (item.id === id ? updated : item)));
            toast.success("Inscription validee");
        } catch (error) {
            console.error(error);
            toast.error("Validation impossible");
        }
    };

    const handleRefuse = async (id: string) => {
        if (!token) return;
        try {
            const updated = await enrollmentService.updateEnrollmentStatus(id, "CANCELLED", token);
            setEnrollments((prev) => prev.map((item) => (item.id === id ? updated : item)));
            toast.success("Inscription refusee");
        } catch (error) {
            console.error(error);
            toast.error("Refus impossible");
        }
    };

    function formatPrice(n: number) {
        return new Intl.NumberFormat("fr-FR").format(n);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-snow">Eleves & Inscriptions</h1>
                    <p className="text-sm text-mist mt-0.5">
                        {enrollments.length} inscription{enrollments.length > 1 ? "s" : ""}
                        {pendingCount > 0 && <> · <span className="text-yellow-400">{pendingCount} en attente</span></>}
                        {activeCount > 0 && <> · <span className="text-green-400">{activeCount} actif{activeCount > 1 ? "s" : ""}</span></>}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/40" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un eleve ou une offre..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["ALL", "PENDING", "ACTIVE", "COMPLETED", "CANCELLED"].map((st) => (
                        <button key={st} onClick={() => setFilterStatus(st)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${filterStatus === st ? "bg-signal/10 text-signal border-signal/20" : "bg-white/5 text-mist border-white/10 hover:text-snow"}`}>
                            {st === "ALL" ? "Tous" : statusConfig[st]?.label}
                            {st === "PENDING" && pendingCount > 0 && <span className="ml-1 bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-md text-[9px]">{pendingCount}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-mist/60">Chargement...</p>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <GraduationCap className="h-16 w-16 text-mist/15 mb-4" />
                    <h3 className="text-lg font-bold text-snow/60 mb-1">Aucune inscription</h3>
                    <p className="text-sm text-mist/40 max-w-sm">Les inscriptions apparaitront ici en temps reel.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((enrollment) => {
                        const st = statusConfig[enrollment.status] || statusConfig.ACTIVE;
                        const nameParts = enrollment.studentName.split(" ");
                        const initials = (nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "");
                        return (
                            <div key={enrollment.id} className={`bg-white/[0.03] rounded-2xl border transition-all ${enrollment.status === "PENDING" ? "border-yellow-500/20" : "border-white/[0.06]"}`}>
                                <div className="p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-signal/20 to-blue-500/20 flex items-center justify-center text-signal font-bold text-xs shrink-0">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-snow">{enrollment.studentName}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${st.class}`}>{st.label}</span>
                                        </div>
                                        <p className="text-xs text-mist/50 mt-0.5">
                                            {enrollment.offerName} · Permis {enrollment.permitType} · {formatPrice(enrollment.price)} F · {enrollment.hours}h
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {enrollment.status === "PENDING" && (
                                            <div className="flex gap-1">
                                                <button onClick={() => void handleValidate(enrollment.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all">
                                                    <CheckCircle className="h-3 w-3" /> Valider
                                                </button>
                                                <button onClick={() => void handleRefuse(enrollment.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                                                    <XCircle className="h-3 w-3" /> Refuser
                                                </button>
                                            </div>
                                        )}
                                        <span className="text-xs text-mist/30">
                                            {new Date(enrollment.enrolledAt).toLocaleDateString("fr-FR")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
