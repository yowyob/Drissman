"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MousePointerClick, CalendarCheck, Car } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

gsap.registerPlugin(ScrollTrigger);

// Floating particles component for images
function ImageParticles() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const particles: HTMLDivElement[] = [];
        const particleCount = 8; // Fewer particles, more subtle

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: radial-gradient(circle, rgba(255,215,100,0.9) 0%, rgba(255,193,7,0.4) 100%);
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: 0;
                filter: blur(${Math.random() * 0.5}px);
            `;
            containerRef.current.appendChild(particle);
            particles.push(particle);

            gsap.to(particle, {
                y: `${Math.random() * 30 - 15}`,
                x: `${Math.random() * 20 - 10}`,
                opacity: Math.random() * 0.7 + 0.3,
                duration: Math.random() * 3 + 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: Math.random() * 2,
            });
        }

        return () => {
            particles.forEach(p => p.remove());
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-[5] pointer-events-none overflow-hidden"
        />
    );
}

export default function WorkflowVariant() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isLight = theme === "light";

    useEffect(() => {
        const ctx = gsap.context(() => {
            // === TIMELINE + CIRCLES: Synchronized animation ===
            // Timeline line grows from top to bottom
            const timelineTl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 60%",
                    end: "bottom 80%",
                    scrub: 0.5 // Smooth, tied to scroll
                }
            });

            timelineTl.from(".timeline-line", {
                scaleY: 0,
                ease: "none"
            });

            // Circles appear as timeline grows (synchronized)
            timelineTl.from(".step-marker", {
                scale: 0,
                opacity: 0,
                stagger: 0.3,
                ease: "power2.out"
            }, 0.1); // Slight offset so they appear as line reaches them

            // === IMAGES: Pop-up animation (scale) ===
            gsap.utils.toArray(".workflow-image").forEach((img) => {
                gsap.from(img as Element, {
                    scale: 0,
                    opacity: 0,
                    duration: 0.8,
                    ease: "back.out(1.4)",
                    scrollTrigger: {
                        trigger: img as Element,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                });
            });

            // === TEXT: Slide animation (alternating left/right) ===
            gsap.utils.toArray(".workflow-text").forEach((text, i) => {
                gsap.from(text as Element, {
                    x: i % 2 === 0 ? -60 : 60,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: text as Element,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                });
            });

            // === DECORATIVE NUMBERS: NO animation (static, embedded in background) ===
            // They are already visible, no animation needed

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    const steps = [
        {
            img: "/assets/step-choose.png?v=final",
            imgLight: "/assets/position.png",
            num: "1",
            title: "Choisissez",
            icon: MousePointerClick,
            desc: "Comparez les auto-écoles selon vos critères : prix, avis, disponibilités. Trouvez celle qui correspond parfaitement à vos besoins."
        },
        {
            img: "/assets/step-book.png?v=final",
            imgLight: "/assets/agenda.png",
            num: "2",
            title: "Réservez",
            icon: CalendarCheck,
            desc: "Sélectionnez votre créneau en temps réel. Confirmation instantanée, paiement sécurisé. C'est simple et rapide."
        },
        {
            img: "/assets/step-drive.png?v=final",
            imgLight: "/assets/wheel.png",
            num: "3",
            title: "Conduisez",
            icon: Car,
            desc: "Suivez votre progression jusqu'au permis avec votre tableau de bord personnalisé. Votre réussite, notre priorité."
        }
    ];

    return (
        <section ref={sectionRef} id="workflow" className={`py-32 relative overflow-hidden ${isLight ? 'bg-slate-50' : 'bg-asphalt'}`}>
            {/* Section separator */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${isLight ? 'via-black/10' : 'via-white/10'} to-transparent`}></div>

            {/* Subtle background texture overlay (CSS-based instead of missing png) */}
            <div className={`absolute inset-0 opacity-[0.01] pointer-events-none ${isLight ? 'bg-black' : 'bg-white'}`} style={{ mixBlendMode: 'overlay' }}></div>

            {/* Horizontal gradient suggesting left→right progression */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-signal/[0.03] to-transparent pointer-events-none"></div>

            <div className="container-wide relative z-10">
                {/* Header */}
                <div className="text-center mb-24">
                    <span className={`inline-block py-1.5 px-4 rounded-full text-signal text-xs font-bold tracking-[0.2em] uppercase mb-6 ${isLight ? 'bg-black/5 border border-black/10' : 'bg-white/5 border border-white/10'}`}>
                        Comment ça marche
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                        {isLight ? (
                            <span className="text-slate-800">
                                Votre permis en <span className="text-signal">3 étapes</span>
                            </span>
                        ) : (
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50">
                                Votre permis en 3 étapes
                            </span>
                        )}
                    </h2>
                </div>

                {/* Timeline Layout - NOT cards */}
                <div className="relative max-w-5xl mx-auto">
                    {/* Central Timeline Line (Desktop) */}
                    <div className="timeline-line hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-signal/50 via-signal/30 to-signal/10 origin-top overflow-hidden">
                        {/* Pulse traveling down the timeline */}
                        <div
                            className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-signal to-transparent opacity-60"
                            style={{
                                animation: 'pulse-travel 4s ease-in-out infinite'
                            }}
                        ></div>
                    </div>

                    {/* Steps */}
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className={`workflow-step relative flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-24 last:mb-0 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                        >
                            {/* Step Marker on Timeline - FILLED circle (no number) */}
                            <div className="step-marker hidden md:flex absolute left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-signal z-10 shadow-[0_0_20px_rgba(255,193,7,0.5)]"></div>

                            {/* Image Side */}
                            <div className={`workflow-image flex-1 flex ${i % 2 === 0 ? 'justify-end md:pr-16' : 'justify-start md:pl-16'}`}>
                                <div className="relative group cursor-pointer">
                                    {/* Floating particles around image */}
                                    <ImageParticles />

                                    {/* Glow behind image */}
                                    <div className="absolute inset-0 bg-signal/20 blur-[60px] rounded-full scale-75 group-hover:bg-signal/30 transition-all duration-500"></div>

                                    {/* Floating image with hover zoom */}
                                    <div className="animate-float relative z-10" style={{ animationDelay: `${i * 0.3}s` }}>
                                        <img
                                            src={isLight ? step.imgLight : step.img}
                                            alt={step.title}
                                            width={280}
                                            height={280}
                                            className={`object-contain rounded-lg transition-transform duration-500 ease-out group-hover:scale-110 ${isLight ? 'drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)]' : 'drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Text Side - wrapper with static number behind */}
                            <div className={`flex-1 relative ${i % 2 === 0 ? 'md:pl-16' : 'md:pr-16'}`}>
                                {/* Large decorative number - STATIC, no animation */}
                                <span
                                    className={`decorative-number hidden md:block absolute text-[280px] font-black leading-none text-transparent opacity-[0.15] pointer-events-none ${i % 2 === 0 ? 'left-16' : 'right-16'}`}
                                    style={{
                                        WebkitTextStroke: '3px rgba(255, 193, 7, 0.4)',
                                        top: '-40px'
                                    }}
                                >
                                    {step.num}
                                </span>

                                {/* Animated text content */}
                                <div className={`workflow-text group/text relative z-10 cursor-default ${i % 2 === 0 ? 'text-center md:text-left' : 'text-center md:text-right'}`}>
                                    {/* Mobile step number */}
                                    <div className="md:hidden inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-signal mb-4">
                                        <span className="text-signal font-black">{step.num}</span>
                                    </div>

                                    <h3 className={`text-3xl md:text-4xl font-black mb-4 flex items-center gap-3 transition-all duration-300 group-hover/text:text-signal ${isLight ? 'text-slate-800' : 'text-white'} ${i % 2 === 0 ? 'justify-center md:justify-start' : 'justify-center md:justify-end'}`}>
                                        <step.icon className="w-7 h-7 text-signal transition-transform duration-300 group-hover/text:scale-110" />
                                        {step.title}
                                    </h3>

                                    <p className={`text-base md:text-lg leading-relaxed max-w-sm mx-auto md:mx-0 ${isLight ? 'text-slate-600' : 'text-mist'}`}>
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Keyframes for floating animation */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                @keyframes pulse-travel {
                    0% { top: -80px; opacity: 0; }
                    10% { opacity: 0.6; }
                    90% { opacity: 0.6; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </section>
    );
}
