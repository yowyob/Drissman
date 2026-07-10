import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";


export function RegistrationPreview() {
    return (
        <section className="py-24 bg-asphalt overflow-hidden">
            <div className="container-wide">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="h-px w-8 bg-signal"></span>
                            <span className="text-signal font-bold uppercase tracking-wider text-sm">Rejoignez le réseau</span>
                        </div>
                        <h2 className="text-4xl font-bold text-snow mb-6 leading-tight">
                            Commencez à recevoir des élèves en <span className="text-signal">moins de 5 minutes</span>
                        </h2>
                        <div className="space-y-8">
                            {[
                                {
                                    step: "1",
                                    title: "Créez votre compte",
                                    desc: "Remplissez les informations de base de votre auto-école."
                                },
                                {
                                    step: "2",
                                    title: "Configurez vos offres",
                                    desc: "Ajoutez vos forfaits, prix et horaires d'ouverture."
                                },
                                {
                                    step: "3",
                                    title: "Validez votre identité",
                                    desc: "Envoyez votre agrément pour obtenir le badge Vérifié."
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-signal/30 bg-signal/10 text-signal font-bold flex items-center justify-center text-xl">
                                        {item.step}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-snow mb-1">{item.title}</h3>
                                        <p className="text-mist leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10">
                            <Link href="/register" className="inline-flex items-center bg-signal hover:bg-signal-dark text-asphalt font-bold py-4 px-8 rounded-xl text-lg shadow-[0_0_25px_rgba(255,193,7,0.3)] transition-all">
                                Créer mon compte partenaire <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    <div className="relative hidden lg:block">
                        <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 p-8 max-w-md mx-auto rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                <h3 className="font-bold text-lg text-snow">Inscription Partenaire</h3>
                                <Lock className="h-4 w-4 text-mist" />
                            </div>

                            <div className="space-y-4 opacity-50 pointer-events-none">
                                <div>
                                    <label className="block text-sm font-medium text-mist mb-1">Nom de l&apos;auto-école</label>
                                    <div className="h-10 bg-white/5 rounded-md w-full border border-white/10"></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mist mb-1">Ville</label>
                                    <div className="h-10 bg-white/5 rounded-md w-full border border-white/10"></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-mist mb-1">Email professionnel</label>
                                    <div className="h-10 bg-white/5 rounded-md w-full border border-white/10"></div>
                                </div>
                                <div className="h-12 bg-signal rounded-md w-full mt-6"></div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center bg-asphalt/50 backdrop-blur-[2px] rounded-2xl">
                                <div className="bg-asphalt/90 px-6 py-3 rounded-full shadow-lg border border-signal/30 text-signal font-bold animate-pulse">
                                    Aperçu du formulaire
                                </div>
                            </div>
                        </div>

                        {/* Decorative glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-signal/10 rounded-full blur-[100px] -z-10"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
