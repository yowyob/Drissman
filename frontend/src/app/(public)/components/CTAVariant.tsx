"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap, Shield } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CTAVariant() {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".cta-content", {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
            });

            gsap.from(".cta-feature", {
                x: -30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                delay: 0.3,
                ease: "power2.out",
                scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 bg-asphalt relative overflow-hidden group">
            {/* Option 3: Global Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/assets/city-skyline.png"
                    alt="Background Texture"
                    className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-[2s] ease-in-out"
                />
                {/* Heavy overlay to blend with theme */}
                <div className="absolute inset-0 bg-asphalt/90"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-asphalt via-asphalt/95 to-asphalt/80"></div>
            </div>

            {/* Abstract geometric background (kept but subtle) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-signal/5 -skew-x-12 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-signal/10 blur-[150px] rounded-full"></div>
            </div>

            <div className="container-wide relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left: Content */}
                    <div className="cta-content space-y-8">
                        <div>
                            <span className="inline-block text-signal text-xs font-bold tracking-[0.2em] uppercase mb-4">
                                Prêt à démarrer ?
                            </span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1]">
                                Votre permis,{" "}
                                <span className="text-signal">simplifié.</span>
                            </h2>
                        </div>

                        <p className="text-mist text-lg max-w-md leading-relaxed">
                            Trouvez l&apos;auto-école parfaite, réservez en ligne, et suivez votre progression jusqu&apos;au permis.
                        </p>

                        {/* Features list */}
                        <div className="space-y-4 pt-2">
                            <div className="cta-feature flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-signal/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-signal" />
                                </div>
                                <span className="text-white font-medium">Inscription en 2 minutes</span>
                            </div>
                            <div className="cta-feature flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-signal/10 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-signal" />
                                </div>
                                <span className="text-white font-medium">Paiement 100% sécurisé</span>
                            </div>
                            <div className="cta-feature flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-signal/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-signal" />
                                </div>
                                <span className="text-white font-medium">Annulation gratuite 24h avant</span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link
                                href="/search"
                                className="inline-flex items-center justify-center gap-2 bg-signal hover:bg-signal-dark text-asphalt font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-[0_0_30px_rgba(255,193,7,0.2)]"
                            >
                                Trouver mon auto-école
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/partners"
                                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-4 px-8 rounded-xl border border-white/10 transition-all"
                            >
                                Devenir partenaire
                            </Link>
                        </div>
                    </div>

                    {/* Right: Visual Card (Stats Grid preserved) */}
                    <div className="hidden lg:block relative">
                        {/* More transparent glass effect to show background texture subtly */}
                        <div className="relative bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
                            {/* Decorative badge */}
                            <div className="absolute -top-4 -right-4 bg-signal text-asphalt text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                                +10 000 utilisateurs
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="text-4xl font-black text-signal mb-1">92%</div>
                                    <div className="text-sm text-mist">Taux de réussite</div>
                                </div>
                                <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="text-4xl font-black text-white mb-1">500+</div>
                                    <div className="text-sm text-mist">Auto-écoles</div>
                                </div>
                                <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="text-4xl font-black text-white mb-1">4.8</div>
                                    <div className="text-sm text-mist">Note moyenne</div>
                                </div>
                                <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="text-4xl font-black text-white mb-1">24/7</div>
                                    <div className="text-sm text-mist">Support client</div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative floating elements */}
                        <div className="absolute -bottom-6 -left-6 w-full h-full border border-signal/20 rounded-3xl -z-10"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
