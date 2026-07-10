import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function PricingSection() {
    return (
        <section className="py-24 bg-asphalt">
            <div className="container-wide">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-snow mb-4">Une tarification simple et transparente</h2>
                    <p className="text-mist text-lg">
                        Choisissez le modèle qui convient le mieux à votre activité. Sans engagement de durée.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Commission Model */}
                    <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
                        <h3 className="text-xl font-bold text-snow mb-2">À la commission</h3>
                        <p className="text-mist text-sm mb-6">Idéal pour débuter sans frais fixes</p>

                        <div className="mb-8">
                            <span className="text-4xl font-extrabold text-snow">0 FCFA</span>
                            <span className="text-mist"> / mois</span>
                            <p className="text-sm text-mist mt-2">+ 10% par inscription confirmée</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                "Inscription et référencement gratuits",
                                "Accès complet au tableau de bord",
                                "Support client standard",
                                "Paiement sécurisé des élèves"
                            ].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-mist">
                                    <CheckCircle2 className="h-5 w-5 text-mist/60 shrink-0" />
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <Link href="/register?plan=commission" className="w-full text-center bg-white/5 border border-white/10 hover:border-signal/30 text-snow font-bold py-3 rounded-xl transition-all">
                            Commencer Gratuitement
                        </Link>
                    </div>

                    {/* Pro Subscription */}
                    <div className="bg-signal/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-signal/30 relative overflow-hidden flex flex-col scale-105 transform z-10 shadow-[0_0_40px_rgba(255,193,7,0.15)]">
                        <div className="absolute top-0 right-0 bg-signal text-asphalt text-xs font-bold px-3 py-1 rounded-bl-lg">
                            POPULAIRE
                        </div>
                        <h3 className="text-xl font-bold text-signal mb-2">Abonnement Pro</h3>
                        <p className="text-mist text-sm mb-6">Pour les auto-écoles établies</p>

                        <div className="mb-8">
                            <span className="text-4xl font-extrabold text-snow">25.000</span>
                            <span className="text-mist font-medium"> FCFA</span>
                            <span className="text-mist/60 text-sm"> / mois</span>
                            <p className="text-sm text-green-400 font-medium mt-2">0% de commission sur les inscriptions</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                "Visibilité prioritaire dans les résultats (+3x de vues)",
                                "Badge 'Vérifié' et 'Recommandé'",
                                "Gestion multi-moniteurs",
                                "Support prioritaire par téléphone",
                                "Outils marketing avancés"
                            ].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-snow font-medium">
                                    <ShieldCheck className="h-5 w-5 text-signal shrink-0" />
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <Link href="/register?plan=pro" className="w-full text-center bg-signal hover:bg-signal-dark text-asphalt font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all">
                            Essayer 30 jours gratuits
                        </Link>
                    </div>
                </div>

                <div className="mt-12 text-center text-sm text-mist">
                    <p>Besoin d&apos;une offre sur mesure pour un réseau ? <Link href="/contact" className="text-signal underline">Contactez-nous</Link></p>
                </div>
            </div>
        </section>
    );
}
