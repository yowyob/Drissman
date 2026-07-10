"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone, Building2, Car, GraduationCap, ArrowLeft, Compass } from "lucide-react";

type AccountType = "VISITOR" | "CANDIDAT" | "SCHOOL_ADMIN" | "SUPER_ADMIN";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [step, setStep] = useState<"choose" | "form">("choose");
    const [accountType, setAccountType] = useState<AccountType>("VISITOR");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChoose = (type: AccountType) => {
        setAccountType(type);
        setStep("form");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas");
            return;
        }
        if (password.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères");
            return;
        }
        setLoading(true);
        try {
            const response = await register({
                email,
                password,
                firstName,
                lastName,
                phone: phone || undefined,
                role: accountType,
                schoolName: accountType === "SCHOOL_ADMIN" ? schoolName : undefined,
                secretCode: accountType === "SUPER_ADMIN" ? secretCode : undefined,
            });
            toast.success("Compte créé avec succès !");
            switch (response.user.role) {
                case "SCHOOL_ADMIN":
                    router.push("/admin");
                    break;
                case "SUPER_ADMIN":
                    router.push("/superadmin");
                    break;
                case "CANDIDAT":
                    router.push("/candidat");
                    break;
                case "VISITOR":
                    router.push("/visitor");
                    break;
                default:
                    router.push("/");
            }
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de l'inscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-asphalt flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-signal/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-signal/3 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-10 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-signal/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                        <div className="relative bg-gradient-to-br from-signal to-amber-400 p-3 rounded-2xl">
                            <Car className="h-7 w-7 text-asphalt" />
                        </div>
                    </div>
                    <span className="text-2xl font-black text-snow tracking-tight">
                        DRISS<span className="text-signal">MAN</span>
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06] p-8 shadow-2xl">
                    {step === "choose" ? (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-black text-snow mb-2">Créer un compte</h1>
                                <p className="text-mist text-sm">Choisissez votre type de compte</p>
                            </div>

                            <div className="space-y-4">
                                {/* Visitor option */}
                                <button
                                    onClick={() => handleChoose("VISITOR")}
                                    className="w-full group bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-signal/40 hover:bg-signal/5 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="bg-emerald-500/10 p-3 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                            <Compass className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-snow font-bold mb-1">Visiteur</h3>
                                            <p className="text-mist/70 text-xs leading-relaxed">
                                                J&apos;explore la plateforme et je choisis plus tard entre élève ou auto-école.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* Eleve option */}
                                <button
                                    onClick={() => handleChoose("CANDIDAT")}
                                    className="w-full group bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-signal/40 hover:bg-signal/5 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                            <GraduationCap className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-snow font-bold mb-1">Élève</h3>
                                            <p className="text-mist/70 text-xs leading-relaxed">
                                                Je cherche une auto-école pour passer mon permis de conduire.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* School Admin option */}
                                <button
                                    onClick={() => handleChoose("SCHOOL_ADMIN")}
                                    className="w-full group bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-signal/40 hover:bg-signal/5 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="bg-signal/10 p-3 rounded-xl group-hover:bg-signal/20 transition-colors">
                                            <Building2 className="h-6 w-6 text-signal" />
                                        </div>
                                        <div>
                                            <h3 className="text-snow font-bold mb-1">Gérant d&apos;auto-école</h3>
                                            <p className="text-mist/70 text-xs leading-relaxed">
                                                Je souhaite inscrire mon auto-école sur la plateforme et gérer mes élèves.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* Super Admin option (Hidden but accessible) */}
                                <button
                                    onClick={() => handleChoose("SUPER_ADMIN")}
                                    className="w-full group bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-rose-500/40 hover:bg-rose-500/5 transition-all mt-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="bg-rose-500/10 p-3 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                                            <Lock className="h-6 w-6 text-rose-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-snow font-bold mb-1">Super Administrateur</h3>
                                            <p className="text-mist/70 text-xs leading-relaxed">
                                                Code d'accès secret requis.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Back button */}
                            <button
                                onClick={() => setStep("choose")}
                                className="flex items-center gap-1.5 text-mist/60 hover:text-mist text-xs mb-6 transition-colors"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Changer de type
                            </button>

                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-2 bg-signal/10 text-signal text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                                    {accountType === "VISITOR" ? (
                                        <><Compass className="h-3.5 w-3.5" /> Compte Visiteur</>
                                    ) : accountType === "CANDIDAT" ? (
                                        <><GraduationCap className="h-3.5 w-3.5" /> Compte Élève</>
                                    ) : accountType === "SCHOOL_ADMIN" ? (
                                        <><Building2 className="h-3.5 w-3.5" /> Compte Gérant auto-école</>
                                    ) : (
                                        <><Lock className="h-3.5 w-3.5" /> Compte Super Admin</>
                                    )}
                                </div>
                                <h1 className="text-2xl font-black text-snow">Inscription</h1>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Prénom</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="Jean"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Nom</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Dupont"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* School name (only for SCHOOL_ADMIN) */}
                                {accountType === "SCHOOL_ADMIN" && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Nom de l&apos;auto-école</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                            <input
                                                type="text"
                                                value={schoolName}
                                                onChange={(e) => setSchoolName(e.target.value)}
                                                placeholder="Mon Auto-École"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Secret Code (only for SUPER_ADMIN) */}
                                {accountType === "SUPER_ADMIN" && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Code Secret</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={secretCode}
                                                onChange={(e) => setSecretCode(e.target.value)}
                                                placeholder="Code secret"
                                                className="w-full bg-white/5 border border-rose-500/30 rounded-xl pl-10 pr-3 py-3 text-snow placeholder:text-mist/40 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-mist uppercase tracking-wider">E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="vous@exemple.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-mist uppercase tracking-wider">Téléphone <span className="text-mist/30">(optionnel)</span></label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+237 6XX XXX XXX"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Passwords */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Mot de passe</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Confirmer</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Show password toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="flex items-center gap-1.5 text-mist/50 hover:text-mist text-xs transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    {showPassword ? "Masquer" : "Afficher"} les mots de passe
                                </button>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-signal to-amber-400 text-asphalt font-black py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-signal/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Création du compte...
                                        </>
                                    ) : (
                                        "Créer mon compte"
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Separator */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-mist/50">ou</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Login link */}
                    <p className="text-center text-sm text-mist">
                        Déjà un compte ?{" "}
                        <Link href="/login" className="text-signal font-bold hover:underline">
                            Se connecter
                        </Link>
                    </p>
                </div>

                {/* Back to home */}
                <p className="text-center mt-6">
                    <Link href="/" className="text-xs text-mist/50 hover:text-mist transition-colors">
                        ← Retour à l&apos;accueil
                    </Link>
                </p>
            </div>
        </div>
    );
}
