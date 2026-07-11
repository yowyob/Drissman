"use client";

import { useAuth } from "@/hooks";
import { User, Mail, Phone, BookOpen, LogOut, Shield, School } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/motion";
import { enrollmentService, type EnrollmentDto } from "@/lib/enrollment-service";
import { PasswordChangeModal } from "@/components/profile/password-change-modal";

export default function CandidatProfilePage() {
    const { user, token, logout } = useAuth();
    const router = useRouter();
    const [active, setActive] = useState<EnrollmentDto | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) return;
        void enrollmentService.getMyEnrollments(token)
            .then((list) => {
                // Formation en cours = inscription ACTIVE, sinon la plus récente.
                const activeOne = list.find((e) => e.status === "ACTIVE") ?? list[0] ?? null;
                setActive(activeOne);
            })
            .catch(() => { /* pas d'inscription chargée */ });
    }, [token]);

    return (
        <PageTransition className="space-y-8">
            <div>
                <h1 className="text-2xl font-black text-snow">Mon Profil</h1>
                <p className="text-sm text-mist mt-0.5">Vos informations personnelles</p>
            </div>

            {/* Profile card */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-signal/20 to-blue-500/20 flex items-center justify-center text-signal font-black text-xl">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-snow">{user?.firstName} {user?.lastName}</h2>
                        <p className="text-xs text-mist/40">Eleve</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                        <Mail className="h-4 w-4 text-mist/40" />
                        <div>
                            <p className="text-[10px] text-mist/30 uppercase tracking-wider font-bold">Email</p>
                            <p className="text-sm text-snow">{user?.email || "—"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                        <Phone className="h-4 w-4 text-mist/40" />
                        <div>
                            <p className="text-[10px] text-mist/30 uppercase tracking-wider font-bold">Téléphone</p>
                            <p className="text-sm text-snow">{"Non renseigné"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                        <Shield className="h-4 w-4 text-mist/40" />
                        <div>
                            <p className="text-[10px] text-mist/30 uppercase tracking-wider font-bold">Rôle</p>
                            <p className="text-sm text-snow">Eleve</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auto-école info */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                <div className="flex items-center gap-2 mb-4">
                    <School className="h-4 w-4 text-signal" />
                    <h2 className="text-sm font-bold text-snow">Mon Auto-École</h2>
                </div>
                {active ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-mist/50">Auto-école</span>
                            <span className="text-snow font-bold">{active.schoolName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-mist/50">Formation</span>
                            <span className="text-snow font-bold">{active.offerName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-mist/50">Statut</span>
                            <span className="text-signal font-bold">{active.status}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <School className="h-8 w-8 text-mist/15 mb-2" />
                        <p className="text-sm text-mist/50">Aucune inscription en cours</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <button onClick={() => setShowPassword(true)} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-sm font-bold text-snow hover:border-signal/20 hover:bg-signal/[0.02] transition-all">
                    <Shield className="h-4 w-4 text-mist/40" />
                    Modifier mon mot de passe
                </button>
                <button onClick={() => { logout(); router.push("/"); }}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                </button>
            </div>

            {showPassword && <PasswordChangeModal onClose={() => setShowPassword(false)} />}
        </PageTransition>
    );
}
