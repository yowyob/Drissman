"use client";

import { useAuth } from "@/hooks";
import { Mail, Shield, LogOut, Car } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/motion";
import { monitorService } from "@/lib/monitor-service";
import { cachedGet } from "@/lib/offline/offline-fetch";
import { PasswordChangeModal } from "@/components/profile/password-change-modal";

export default function MonitorProfilePage() {
    const { user, token, logout } = useAuth();
    const router = useRouter();
    const [schoolName, setSchoolName] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) return;
        void cachedGet(user?.id ?? "anon", "monitor-profile", () => monitorService.getProfile(token))
            .then((r) => setSchoolName((r.data as any).schoolName ?? null))
            .catch(() => { /* hors ligne : nom d'école indisponible */ });
    }, [token, user?.id]);

    return (
        <PageTransition className="space-y-8">
            <div>
                <h1 className="text-2xl font-black text-snow">Mon Profil</h1>
                <p className="text-sm text-mist mt-0.5">Vos informations personnelles</p>
            </div>

            {/* Profile card */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-signal/20 to-green-500/20 flex items-center justify-center text-signal font-black text-xl">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-snow">{user?.firstName} {user?.lastName}</h2>
                        <p className="text-xs text-signal/60 font-bold">Moniteur</p>
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
                        <Shield className="h-4 w-4 text-mist/40" />
                        <div>
                            <p className="text-[10px] text-mist/30 uppercase tracking-wider font-bold">Rôle</p>
                            <p className="text-sm text-snow">Moniteur d&apos;auto-école</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                        <Car className="h-4 w-4 text-mist/40" />
                        <div>
                            <p className="text-[10px] text-mist/30 uppercase tracking-wider font-bold">Auto-École</p>
                            <p className="text-sm text-snow">{schoolName || "—"}</p>
                        </div>
                    </div>
                </div>
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
