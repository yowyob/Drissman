"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Users, Trophy } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * CTAVariant2 — "Spotlight Focus" Concept
 * 
 * Design Philosophy:
 * - CENTERED layout (no 2-column split) → all attention on the action
 * - Large glowing CTA button as the visual anchor
 * - Minimal text, maximum impact
 * - Animated rings/pulses suggesting "action needed now"
 * - Social proof inline (small avatars + number) instead of stats grid
 */
export default function CTAVariant2() {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Main content fade in
            gsap.from(".cta2-content", {
                y: 60,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: { trigger: sectionRef.current, start: "top 80%" }
            });

            // Shimmer sweep animation
            gsap.to(".shimmer-effect", {
                x: "200%",
                duration: 2,
                repeat: -1,
                repeatDelay: 3,
                ease: "power2.inOut"
            });

            // Floating particles around the button
            gsap.to(".float-particle", {
                y: -15,
                duration: 2,
                repeat: -1,
                yoyo: true,
                stagger: 0.3,
                ease: "sine.inOut"
            });

            // Button glow pulse (kept) + Light bulb intensity variation
            gsap.to(".cta-glow", {
                boxShadow: "0 0 100px rgba(255,193,7,0.7), 0 0 150px rgba(255,193,7,0.4)",
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            // Light bulb breathing effect on button background
            gsap.to(".cta-glow", {
                filter: "brightness(1.2)",
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-32 bg-asphalt relative overflow-hidden">
            {/* Background: Radial gradient spotlight */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-signal/10 rounded-full blur-[200px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-signal/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Decorative large number in background - GO restored, bigger */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[350px] md:text-[500px] font-black text-white/[0.03] select-none pointer-events-none leading-none tracking-tighter">
                GO
            </div>

            <div className="container-wide relative z-10">
                <div className="cta2-content flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">

                    {/* Badge with sparkle */}
                    <div className="inline-flex items-center gap-2 bg-signal/10 border border-signal/20 px-5 py-2 rounded-full">
                        <Sparkles className="w-4 h-4 text-signal" />
                        <span className="text-signal text-sm font-semibold tracking-wide">Le moment est venu</span>
                    </div>

                    {/* Main headline */}
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05]">
                        Passez votre permis<br />
                        <span className="text-signal">sans stress.</span>
                    </h2>

                    {/* Subtext */}
                    <p className="text-mist text-lg md:text-xl max-w-xl leading-relaxed">
                        Rejoignez les milliers d&apos;élèves qui ont déjà fait confiance à DRISSMAN pour décrocher leur permis du premier coup.
                    </p>

                    {/* CTA Button with shimmer + floating particles */}
                    <div className="relative pt-6">
                        {/* Floating particles around button */}
                        <div className="absolute -top-2 left-1/4 w-2 h-2 bg-signal/60 rounded-full float-particle"></div>
                        <div className="absolute top-1/2 -left-4 w-1.5 h-1.5 bg-signal/40 rounded-full float-particle"></div>
                        <div className="absolute -top-3 right-1/4 w-1.5 h-1.5 bg-signal/50 rounded-full float-particle"></div>
                        <div className="absolute top-1/2 -right-3 w-2 h-2 bg-signal/60 rounded-full float-particle"></div>
                        <div className="absolute bottom-0 left-1/3 w-1 h-1 bg-signal/30 rounded-full float-particle"></div>
                        <div className="absolute bottom-2 right-1/3 w-1.5 h-1.5 bg-signal/40 rounded-full float-particle"></div>

                        <Link
                            href="/search"
                            className="cta-glow relative inline-flex items-center justify-center gap-3 bg-signal hover:bg-signal-dark text-asphalt font-black text-lg py-5 px-12 rounded-2xl transition-all duration-300 hover:scale-105 shadow-[0_0_50px_rgba(255,193,7,0.3)] overflow-hidden"
                        >
                            {/* Shimmer sweep effect */}
                            <div className="shimmer-effect absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"></div>

                            <span className="relative z-10">Commencer maintenant</span>
                            <ArrowRight className="w-6 h-6 relative z-10" />
                        </Link>
                    </div>

                    {/* Social proof inline */}
                    <div className="flex items-center gap-4 pt-4">
                        {/* Stacked avatars placeholder */}
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-signal/80 to-signal/40 border-2 border-asphalt flex items-center justify-center"
                                >
                                    <Users className="w-4 h-4 text-asphalt" />
                                </div>
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="text-white font-bold">+25 000 élèves</div>
                            <div className="text-mist text-sm flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-signal" /> 92% de réussite
                            </div>
                        </div>
                    </div>

                    {/* Trust badges - Enhanced visibility */}
                    <div className="flex flex-wrap justify-center gap-6 pt-6 text-mist text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                            <span className="text-signal">✓</span> Sans engagement
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-signal">✓</span> Paiement sécurisé
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-signal">✓</span> Annulation gratuite
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
