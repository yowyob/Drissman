"use client";

import { useRouter } from "next/navigation";
import { Star, MapPin, ShieldCheck, Car } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { DrivingSchool } from "@/lib/data";


interface SchoolCardProps {
    school: DrivingSchool;
}

export function SchoolCard({ school }: SchoolCardProps) {
    const router = useRouter();

    const handleViewOffer = (e: React.MouseEvent) => {
        e.preventDefault();
        router.push(`/school/${school.id}`);
    };

    return (
        <div className="group bg-white/[0.07] backdrop-blur-md rounded-3xl border border-white/5 hover:border-signal/40 hover:bg-white/[0.08] transition-all duration-500 overflow-hidden flex flex-col h-auto min-h-[220px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_30px_rgba(255,193,7,0.08)]">
            <div className="flex flex-col sm:flex-row h-full">
                {/* Image Section */}
                <div className="relative w-full sm:w-56 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-steel/20">
                    {school.imageUrl ? (
                        <img
                            src={school.imageUrl}
                            alt={school.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-16 w-16 text-mist/30" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent sm:hidden" />

                    {school.isVerified && (
                        <div className="absolute top-3 left-3 bg-signal text-asphalt text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xl">
                            <ShieldCheck className="h-3 w-3" />
                            VÉRIFIÉ
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <h3 className="text-xl font-black text-snow group-hover:text-signal transition-colors line-clamp-1">{school.name}</h3>
                            <div className="flex items-center gap-1.5 bg-signal/10 px-2.5 py-1 rounded-xl border border-signal/20 flex-shrink-0">
                                <Star className="h-3.5 w-3.5 text-signal fill-signal" />
                                <span className="text-sm font-black text-snow">{school.rating}</span>
                                <span className="text-[10px] text-mist/60 font-bold hidden xs:inline">({school.reviewCount})</span>
                            </div>
                        </div>

                        <div className="flex items-center text-mist text-xs font-bold mb-4 tracking-wide">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-signal" />
                            <span className="line-clamp-1">{school.address}, {school.city}</span>
                        </div>

                        {/* Feature badges - Enhanced styling */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {school.features.slice(0, 3).map((feature, index) => (
                                <span
                                    key={`${feature}-${index}`}
                                    className="text-[10px] bg-white/5 text-mist/90 px-3 py-1.5 rounded-lg border border-white/10 font-bold uppercase tracking-wider hover:border-signal/20 hover:text-snow transition-colors"
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-mist font-black uppercase tracking-widest mb-0.5 opacity-60">Pack Initial</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-signal">{formatPrice(school.price)}</span>
                                <span className="text-[10px] text-mist/40 font-bold">/ total</span>
                            </div>
                        </div>

                        <button
                            onClick={handleViewOffer}
                            className="bg-white/5 hover:bg-signal text-snow hover:text-asphalt font-black py-3 px-6 rounded-2xl text-xs transition-all duration-300 border border-white/10 hover:border-signal shadow-lg hover:shadow-[0_10px_30px_rgba(255,193,7,0.3)] active:scale-95"
                        >
                            VOIR L&apos;OFFRE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
