"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { LogoLink } from "@/components/layout/logo";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }
        setLoading(true);
        try {
            const response = await login({ email, password });
            toast.success("Connexion réussie !");
            // Role-based redirect
            switch (response.user.role) {
                case "SCHOOL_ADMIN":
                    router.push("/admin");
                    break;
                case "CANDIDAT":
                    router.push("/candidat");
                    break;
                case "MONITOR":
                    router.push("/monitor");
                    break;
                case "VISITOR":
                    router.push("/visitor");
                    break;
                default:
                    router.push("/");
            }
        } catch (err: any) {
            toast.error(err.message || "Identifiants incorrects");
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
                <div className="flex justify-center mb-10">
                    <LogoLink href="/" className="h-11 w-auto" wordmarkClassName="text-2xl" />
                </div>

                {/* Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06] p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-snow mb-2">Connexion</h1>
                        <p className="text-mist text-sm">
                            Accédez à votre espace personnel
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-mist uppercase tracking-wider">
                                Adresse e-mail
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vous@exemple.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-mist uppercase tracking-wider">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/50" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-mist/50 hover:text-mist transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-signal to-amber-400 text-asphalt font-black py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-signal/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Connexion...
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </button>
                    </form>

                    {/* Separator */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-mist/50">ou</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Register link */}
                    <p className="text-center text-sm text-mist">
                        Pas encore de compte ?{" "}
                        <Link href="/register" className="text-signal font-bold hover:underline">
                            Créer un compte
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
