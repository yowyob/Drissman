"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Car, MapPin, ArrowRight, Navigation, Loader2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSchools, useGeolocation } from "@/hooks";

gsap.registerPlugin(ScrollTrigger);

// Skeleton Card Component
function SkeletonCard() {
    return (
        <div className="bg-asphalt border border-steel/20 p-6 rounded-xl animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="h-6 w-20 bg-steel/20 rounded"></div>
                <div className="h-5 w-16 bg-steel/20 rounded"></div>
            </div>
            <div className="h-32 mb-4 bg-steel/20 rounded-lg"></div>
            <div className="h-5 w-3/4 bg-steel/20 rounded mb-2"></div>
            <div className="h-4 w-1/2 bg-steel/20 rounded mb-4"></div>
            <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                <div className="h-6 w-24 bg-steel/20 rounded"></div>
                <div className="h-8 w-8 bg-steel/20 rounded-full"></div>
            </div>
        </div>
    );
}

export default function SelectionPopulaireVariant() {
    const sectionRef = useRef<HTMLDivElement>(null);
    // Géolocalisation demandée dès l'ouverture (avec cache) : on trie les
    // auto-écoles par proximité si la position est connue.
    const { coords, status, request } = useGeolocation();
    const { schools, loading } = useSchools(undefined, coords);
    const router = useRouter();
    const located = coords != null;

    useEffect(() => {
        if (loading || !schools.length) return;

        const ctx = gsap.context(() => {
            gsap.from(".selection-card", {
                y: 40,
                opacity: 0,
                duration: 0.7,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 75%",
                    toggleActions: "play none none reverse"
                }
            });
        }, sectionRef);
        return () => ctx.revert();
    }, [loading, schools]);

    // Handle school card click
    const handleSchoolClick = (id: string | number) => {
        router.push(`/school/${id}`);
    };

    // Filter and process schools to show
    const displaySchools = schools.slice(0, 3).map(school => ({
        ...school,
        minPrice: school.offers?.[0]?.price || 150000,
        badge: school.rating >= 4.7 ? "PREMIUM" : school.rating >= 4.5 ? "POPULAIRE" : "-10%",
        formattedPrice: new Intl.NumberFormat('fr-FR').format(school.offers?.[0]?.price || 150000).replace(/ /g, ' ')
    }));

    return (
        <section ref={sectionRef} className="py-24 bg-concrete relative overflow-hidden">
            <div className="container-wide relative z-10">
                <div className="flex flex-wrap justify-between items-end gap-4 mb-12">
                    <div>
                        <span className="text-signal text-xs font-bold tracking-[0.15em] uppercase mb-2 block">
                            {located ? "Autour de vous" : "Nos partenaires"}
                        </span>
                        <h2 className="text-3xl font-black">
                            {located ? "Auto-écoles proches de vous" : "Sélection Populaire"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Pastille géolocalisation (UX type search.yowyob.com) */}
                        {status === "prompting" && (
                            <span className="flex items-center gap-2 text-xs text-mist/70 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Localisation…
                            </span>
                        )}
                        {located && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-signal bg-signal/10 border border-signal/20 px-3 py-1.5 rounded-full">
                                <Navigation className="w-3.5 h-3.5 fill-signal" /> Position activée
                            </span>
                        )}
                        {(status === "denied" || status === "idle" || status === "unsupported") && (
                            <button
                                onClick={request}
                                disabled={status === "unsupported"}
                                className="flex items-center gap-1.5 text-xs font-bold text-signal border border-signal/30 bg-signal/10 hover:bg-signal/20 px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
                            >
                                <Navigation className="w-3.5 h-3.5" />
                                {status === "unsupported" ? "Géoloc indisponible" : "Activer ma position"}
                            </button>
                        )}
                        <Link href="/search" className="group flex items-center gap-2 text-signal text-sm hover:underline">
                            TOUT VOIR
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        displaySchools.map((school) => (
                            <div
                                key={school.id}
                                onClick={() => handleSchoolClick(school.id)}
                                className="selection-card card-product bg-asphalt border border-steel/20 p-6 rounded-xl group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-asphalt/80 block"
                            >
                                {/* Header avec badge et rating */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="badge-sparkle relative overflow-hidden bg-signal/10 text-signal text-xs font-bold px-2 py-1 rounded">
                                            {school.badge}
                                            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                        </div>
                                        {school.distanceKm != null && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-signal/90 bg-white/5 border border-white/10 px-2 py-1 rounded">
                                                <Navigation className="w-3 h-3" /> {school.distanceKm.toFixed(1)} km
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-signal fill-signal" />
                                        <span className="text-sm font-bold text-white">{school.rating}</span>
                                        <span className="text-xs text-mist/60">({school.reviewCount})</span>
                                    </div>
                                </div>

                                {/* Image placeholder */}
                                <div className="h-32 mb-4 bg-gradient-to-br from-steel/20 to-transparent rounded-lg flex items-center justify-center overflow-hidden relative">
                                    {school.imageUrl ? (
                                        <img
                                            src={school.imageUrl}
                                            alt={school.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <Car className="h-12 w-12 text-mist/20 group-hover:text-signal group-hover:scale-110 transition-all duration-300" />
                                    )}
                                </div>

                                {/* Info */}
                                <h3 className="font-bold text-lg mb-1 text-white group-hover:text-signal transition-colors line-clamp-1">{school.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-mist mb-4">
                                    <MapPin className="w-3 h-3" />
                                    <span>{school.city}, {school.address}</span>
                                </div>

                                {/* Footer avec prix */}
                                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                    <div>
                                        <span className="text-[10px] text-mist/50 block">À partir de</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">
                                                {school.formattedPrice} <span className="text-xs font-normal text-mist">FCFA</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-signal/10 flex items-center justify-center group-hover:bg-signal transition-colors">
                                        <ArrowRight className="w-4 h-4 text-signal group-hover:text-asphalt transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Shimmer animation styles */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 3s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
}
