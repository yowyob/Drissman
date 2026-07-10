"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, BadgeCheck } from "lucide-react";
import gsap from "gsap";
import { useTheme } from "@/components/theme-provider";

// Volumetric Dust Particles Component
function DustParticles() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const particles: HTMLDivElement[] = [];
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.className = "dust-particle";
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: radial-gradient(circle, rgba(255,215,150,0.8) 0%, rgba(255,193,7,0.3) 100%);
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * 60 + 20}%;
                top: ${Math.random() * 70 + 15}%;
                opacity: 0;
                filter: blur(${Math.random() * 0.5}px);
                will-change: transform, opacity;
                transform: translateZ(0);
                backface-visibility: hidden;
            `;
            containerRef.current.appendChild(particle);
            particles.push(particle);

            gsap.to(particle, {
                y: `${Math.random() * 40 - 20}`,
                x: `${Math.random() * 30 - 15}`,
                opacity: Math.random() * 0.6 + 0.2,
                duration: Math.random() * 4 + 3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: Math.random() * 2,
                force3D: true,
            });
        }

        return () => {
            particles.forEach(p => p.remove());
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-[9] pointer-events-none overflow-hidden"
            style={{
                maskImage: 'radial-gradient(ellipse at 40% 55%, black 0%, transparent 50%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 40% 55%, black 0%, transparent 50%)'
            }}
        />
    );
}

export default function Hero() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isLight = theme === "light";
    const router = useRouter();
    const [searchCity, setSearchCity] = useState("");

    const handleSearch = () => {
        if (searchCity.trim()) {
            // Redirect to search page with city parameter
            router.push(`/search?city=${encodeURIComponent(searchCity.trim())}`);
        } else {
            // If no city, just go to search page
            router.push('/search');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".hero-content", { y: 50, opacity: 0, duration: 1, delay: 0.5, ease: "power3.out" });
        }, heroRef);
        return () => ctx.revert();
    }, []);

    // Combined gradient + texture for DARK mode
    const texturedGradient = `
        url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='5'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.3'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E"),
        radial-gradient(ellipse at 85% 80%, #ffc107 0%, #e6a800 12%, #b8860b 25%, #7a5c08 40%, #4a3805 55%, #2a2003 70%, #1a1502 85%, #0d0a01 100%)
    `;

    // Light mode gradient - warm amber tones
    const lightModeGradient = `
        url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='5'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.8'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.2'/%3E%3C/svg%3E\"),
        radial-gradient(ellipse at 85% 80%, #d97706 0%, #b45309 20%, #92400e 40%, #78350f 60%, #451a03 100%)
    `;

    return (
        <section ref={heroRef} className={`relative min-h-[100vh] overflow-hidden transition-colors duration-500`}>

            {/* === DARK MODE VIDEO BACKGROUND === */}
            {!isLight && (
                <>
                    {/* Video Background */}
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
                        style={{
                            transform: 'translate(10%,-20%)',
                            filter: 'brightness(1.1) contrast(1.1)',
                            maskImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, black 40%, transparent 90%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, black 40%, transparent 90%)'
                        }}>
                        <source src="/assets/hero-video.mp4" type="video/mp4" />
                    </video>

                    {/* Dark overlays */}
                    <div className="absolute inset-0 z-[5] pointer-events-none" style={{ background: 'radial-gradient(circle at 70% 50%, rgba(0,0,0,0.2), rgba(0,0,0,0.9))' }}></div>
                    <div className="absolute inset-0 z-[6] pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 85%, rgba(10,15,20,0.95) 0%, rgba(10,15,20,0.8) 40%, transparent 70%)' }}></div>
                    <div className="absolute inset-0 z-[7] pointer-events-none" style={{ background: 'radial-gradient(circle at 0% 100%, rgba(0,0,0,0.7) 0%, transparent 100%)' }}></div>
                    <div className="absolute inset-0 z-[8] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(255,193,7,0.08) 0%, transparent 45%)' }}></div>

                    {/* Left headlight cone */}
                    <div
                        className="absolute inset-0 z-[9] pointer-events-none"
                        style={{
                            background: `
                                conic-gradient(from 200deg at 58% 42%, 
                                    transparent 0deg,
                                    rgba(255, 220, 100, 0.08) 15deg,
                                    rgba(255, 200, 80, 0.18) 35deg,
                                    rgba(255, 193, 7, 0.15) 50deg,
                                    rgba(255, 180, 60, 0.08) 65deg,
                                    transparent 85deg,
                                    transparent 360deg
                                )
                            `,
                            maskImage: 'radial-gradient(ellipse 50% 60% at 45% 55%, black 0%, transparent 70%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 50% 60% at 45% 55%, black 0%, transparent 70%)',
                            filter: 'blur(20px)',
                            opacity: 0.9
                        }}
                    ></div>

                    {/* Right headlight cone */}
                    <div
                        className="absolute inset-0 z-[9] pointer-events-none"
                        style={{
                            background: `
                                conic-gradient(from 195deg at 68% 38%, 
                                    transparent 0deg,
                                    rgba(255, 220, 100, 0.06) 12deg,
                                    rgba(255, 200, 80, 0.14) 30deg,
                                    rgba(255, 193, 7, 0.12) 45deg,
                                    rgba(255, 180, 60, 0.06) 60deg,
                                    transparent 80deg,
                                    transparent 360deg
                                )
                            `,
                            maskImage: 'radial-gradient(ellipse 45% 55% at 55% 50%, black 0%, transparent 65%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 45% 55% at 55% 50%, black 0%, transparent 65%)',
                            filter: 'blur(18px)',
                            opacity: 0.85
                        }}
                    ></div>

                    <DustParticles />
                </>
            )}

            {/* === LIGHT MODE BACKGROUND IMAGE === */}
            {isLight && (
                <>
                    {/* Hero Background Image - Light */}
                    {/* Hero Background Video - Light */}
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        style={{
                            filter: 'brightness(1) contrast(1.05)',
                            maskImage: 'radial-gradient(ellipse 80% 90% at 50% 50%, black 40%, transparent 100%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 80% 90% at 50% 50%, black 40%, transparent 100%)'
                        }}>
                        <source src="/assets/hero-light-video.mp4" type="video/mp4" />
                    </video>

                    {/* Subtle overlay to ensure text readability on left */}
                    <div className="absolute inset-0 z-[5] pointer-events-none"
                        style={{
                            background: 'linear-gradient(to right, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)'
                        }}
                    />
                </>
            )}

            {/* Synced with Variant */}
            <div className="hero-content relative z-20 container-wide pt-8 md:pt-16 pb-4 md:px-12 flex flex-col md:items-left text-left">
                <div className="max-w-2xl space-y-4 md:flex md:flex-col md:items-center">
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium tracking-wide">
                        <div className={`flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 rounded-full border transition-colors ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                            <Star className="h-4 w-4 text-signal fill-signal" />
                            <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-snow'}`}>4.8/5</span>
                            <span className={isLight ? 'text-slate-600' : 'text-mist'}>· 12 000 élèves</span>
                        </div>
                        <div className={`flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-mist'}`}>
                            <BadgeCheck className="h-4 w-4 text-signal" />
                            <span>+500 auto-écoles partenaires</span>
                        </div>
                    </div>

                    {/* UNIFIED GRADIENT WRAPPER - Theme aware */}
                    <div className="space-y-4" style={{
                        backgroundImage: isLight
                            ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E"), linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)`
                            : texturedGradient,
                        backgroundSize: '60px 60px, 100% 100%',
                        backgroundBlendMode: 'overlay, normal',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
                            <span className="block text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2">Votre permis</span>
                            COMMENCE<br />ICI.
                        </h1>

                        <p className="text-xl md:text-2xl font-light tracking-tight max-w-md leading-snug" style={{
                            backgroundImage: isLight
                                ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.4'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E"), linear-gradient(135deg, #475569 0%, #334155 100%)`
                                : 'none',
                            backgroundSize: isLight ? '60px 60px, 100% 100%' : undefined,
                            backgroundBlendMode: isLight ? 'overlay, normal' : undefined,
                            WebkitBackgroundClip: isLight ? 'text' : undefined,
                            backgroundClip: isLight ? 'text' : undefined,
                            color: isLight ? 'transparent' : undefined,
                        }}>
                            Comparez. Choisissez. Réservez.<br />
                            <span className={`text-base md:text-lg font-normal mt-2 block ${isLight ? '' : 'opacity-80'}`} style={{
                                color: isLight ? '#64748b' : undefined,
                                backgroundImage: 'none',
                                WebkitBackgroundClip: 'unset',
                                backgroundClip: 'unset',
                            }}>La route vers votre liberté, simplifiée.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar - Centered relative to full section with floating effect */}
            <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center px-4 animate-float"
                style={{
                    animation: 'float 4s ease-in-out infinite'
                }}>
                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-8px); }
                    }
                `}</style>
                <div className="w-full max-w-xl">
                    {/* Liquid Glass / Glassmorphism container - Theme aware */}
                    <div
                        className="rounded-3xl p-5 transition-all duration-500 hover:scale-[1.01]"
                        style={{
                            background: isLight
                                ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.8) 100%)'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                            border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.18)',
                            boxShadow: isLight
                                ? '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 40px rgba(217,119,6,0.08)'
                                : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(255,193,7,0.05)'
                        }}
                    >
                        <p className={`text-sm mb-3 flex items-center gap-2 font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <MapPin className="h-4 w-4 text-signal" /> Où cherchez-vous ?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div
                                className="flex-1 flex items-center rounded-xl px-4 py-3.5 transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(255,193,7,0.2)]"
                                style={{
                                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.12)',
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Entrez votre ville (ex : Douala)"
                                    value={searchCity}
                                    onChange={(e) => setSearchCity(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className={`flex-1 bg-transparent outline-none text-sm font-medium ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-snow placeholder:text-white/40'}`}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="bg-signal hover:bg-signal-dark text-asphalt font-bold py-3.5 px-7 rounded-xl shadow-[0_4px_20px_rgba(255,193,7,0.4)] flex items-center justify-center gap-2 shrink-0 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_30px_rgba(255,193,7,0.5)] active:scale-[0.98]">
                                <Search className="h-4 w-4" />
                                <span className="text-sm">Rechercher</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
