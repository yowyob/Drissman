"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useLocalStorage, useSchools } from "@/hooks";
import { toast } from "sonner";
import { Compass, Search, Building2, GraduationCap, ArrowRight, Loader2, Sparkles, UserPlus, BookOpen, CalendarDays, School } from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion";

export default function VisitorDashboardPage() {
    const { user, upgradeVisitor } = useAuth();
    const router = useRouter();
    const { schools } = useSchools();
    const [offers] = useLocalStorage<{ id: string; status: "ACTIVE" | "DRAFT" | "ARCHIVED" }[]>("offers", []);
    const [sessions] = useLocalStorage<{ id: string; status: string }[]>("sessions", []);
    const [loadingTarget, setLoadingTarget] = useState<"CANDIDAT" | "SCHOOL_ADMIN" | null>(null);
    const [schoolName, setSchoolName] = useState("");

    const activeOffers = offers.filter(o => o.status === "ACTIVE").length;
    const activeSessions = sessions.filter(s => s.status !== "CANCELLED").length;

    const becomeStudent = async () => {
        setLoadingTarget("CANDIDAT");
        try {
            await upgradeVisitor({ targetRole: "CANDIDAT" });
            toast.success("Votre compte est maintenant un compte eleve.");
            router.push("/candidat");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Conversion impossible";
            toast.error(message);
        } finally {
            setLoadingTarget(null);
        }
    };

    const becomeSchoolAdmin = async () => {
        setLoadingTarget("SCHOOL_ADMIN");
        try {
            await upgradeVisitor({
                targetRole: "SCHOOL_ADMIN",
                schoolName: schoolName.trim() || undefined,
            });
            toast.success("Votre compte est maintenant un compte auto-ecole.");
            router.push("/admin");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Conversion impossible";
            toast.error(message);
        } finally {
            setLoadingTarget(null);
        }
    };

    return (
        <PageTransition className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-snow">Bienvenue, {user?.firstName}</h1>
                <p className="text-mist mt-1">Votre compte visiteur vous permet d explorer les catalogues avant de choisir votre parcours.</p>
            </div>

            <StaggerContainer className="grid sm:grid-cols-3 gap-4">
                <StaggerItem>
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl border border-blue-500/20 p-5">
                        <School className="h-5 w-5 text-blue-400 opacity-70 mb-2" />
                        <p className="text-2xl font-black text-snow">{schools.length}</p>
                        <p className="text-xs text-mist/60">Auto-ecoles visibles</p>
                    </div>
                </StaggerItem>
                <StaggerItem>
                    <div className="bg-gradient-to-br from-signal/10 to-amber-500/5 rounded-2xl border border-signal/20 p-5">
                        <BookOpen className="h-5 w-5 text-signal opacity-70 mb-2" />
                        <p className="text-2xl font-black text-snow">{activeOffers}</p>
                        <p className="text-xs text-mist/60">Offres actives</p>
                    </div>
                </StaggerItem>
                <StaggerItem>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl border border-emerald-500/20 p-5">
                        <CalendarDays className="h-5 w-5 text-emerald-400 opacity-70 mb-2" />
                        <p className="text-2xl font-black text-snow">{activeSessions}</p>
                        <p className="text-xs text-mist/60">Sessions ouvertes</p>
                    </div>
                </StaggerItem>
            </StaggerContainer>

            <StaggerContainer className="grid sm:grid-cols-3 gap-4">
                <StaggerItem>
                    <Link href="/search" className="block bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl border border-blue-500/20 p-5 hover:border-blue-400/40 transition-all">
                        <Search className="h-5 w-5 text-blue-400 opacity-70 mb-2" />
                        <p className="text-lg font-black text-snow">Catalogue</p>
                        <p className="text-xs text-mist/60">Comparer les auto-ecoles et les offres disponibles.</p>
                    </Link>
                </StaggerItem>
                <StaggerItem>
                    <Link href="/partners" className="block bg-gradient-to-br from-signal/10 to-amber-500/5 rounded-2xl border border-signal/20 p-5 hover:border-signal/40 transition-all">
                        <Building2 className="h-5 w-5 text-signal opacity-70 mb-2" />
                        <p className="text-lg font-black text-snow">Partenaires</p>
                        <p className="text-xs text-mist/60">Decouvrir les avantages du mode auto-ecole partenaire.</p>
                    </Link>
                </StaggerItem>
                <StaggerItem>
                    <Link href="/code" className="block bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl border border-emerald-500/20 p-5 hover:border-emerald-400/40 transition-all">
                        <Compass className="h-5 w-5 text-emerald-400 opacity-70 mb-2" />
                        <p className="text-lg font-black text-snow">Code Route</p>
                        <p className="text-xs text-mist/60">Acceder au contenu code et voir l experience plateforme.</p>
                    </Link>
                </StaggerItem>
            </StaggerContainer>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="h-4 w-4 text-blue-400" />
                        <h2 className="text-sm font-bold text-snow">Devenir eleve</h2>
                    </div>
                    <p className="text-sm text-mist/70 mb-5">
                        Convertissez ce compte visiteur en compte eleve pour reserver une formule et suivre votre progression.
                    </p>
                    <button
                        onClick={becomeStudent}
                        disabled={loadingTarget !== null}
                        className="w-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold py-3 rounded-xl hover:bg-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loadingTarget === "CANDIDAT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        Activer mon espace eleve
                    </button>
                </div>

                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-4 w-4 text-signal" />
                        <h2 className="text-sm font-bold text-snow">Devenir auto-ecole</h2>
                    </div>
                    <p className="text-sm text-mist/70 mb-3">
                        Ouvrez votre espace administrateur et gerez vos modules, offres, moniteurs et sessions.
                    </p>
                    <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Nom de l auto-ecole (optionnel)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm mb-3"
                    />
                    <button
                        onClick={becomeSchoolAdmin}
                        disabled={loadingTarget !== null}
                        className="w-full bg-signal/15 border border-signal/30 text-signal font-bold py-3 rounded-xl hover:bg-signal/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loadingTarget === "SCHOOL_ADMIN" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        Activer mon espace auto-ecole
                    </button>
                </div>
            </div>

            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-snow">Mode visiteur</h2>
                </div>
                <p className="text-xs text-mist/60">
                    Vous pouvez rester visiteur aussi longtemps que necessaire. Les fonctions de reservation et de gestion deviennent disponibles apres conversion.
                </p>
            </div>
        </PageTransition>
    );
}
