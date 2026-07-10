"use client";

import { useState, useMemo } from "react";
import { useSchools } from "@/hooks";
import { Search, MapPin, Star, ShieldCheck, Car, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion";

function formatPrice(n: number) { return new Intl.NumberFormat("fr-FR").format(n); }

export default function CataloguePage() {
    const [city, setCity] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const { schools, loading, error } = useSchools(city || undefined);

    const processed = useMemo(() => {
        return schools
            .map(school => ({
                ...school,
                price: (school as any).offers?.[0]?.price || 0,
                offersCount: (school as any).offers?.length || 0,
                features: (school as any).offers?.map((o: any) => o.name).slice(0, 3) || [],
            }))
            .filter(s => {
                if (searchQuery) {
                    return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.city.toLowerCase().includes(searchQuery.toLowerCase());
                }
                return true;
            });
    }, [schools, searchQuery]);

    return (
        <PageTransition className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-snow">Catalogue</h1>
                <p className="text-sm text-mist mt-0.5">Trouvez votre auto-école et inscrivez-vous à une offre</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/30" />
                    <input type="text" placeholder="Rechercher une auto-école..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.06] text-snow text-sm placeholder:text-mist/30 focus:border-signal/30 focus:outline-none transition-all" />
                </div>
                <div className="flex gap-2">
                    {["", "Yaoundé", "Douala"].map(c => (
                        <button key={c} onClick={() => setCity(c)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${city === c ? "bg-signal/10 text-signal border-signal/20" : "bg-white/5 text-mist border-white/10 hover:text-snow"}`}>
                            {c || "Toutes"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 text-signal animate-spin mb-3" />
                    <p className="text-sm text-mist/50">Chargement des auto-écoles...</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Results */}
            {!loading && !error && processed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Car className="h-16 w-16 text-mist/15 mb-4" />
                    <h3 className="text-lg font-bold text-snow/60 mb-1">Aucune auto-école trouvée</h3>
                    <p className="text-sm text-mist/40">Essayez de changer de ville ou de recherche</p>
                </div>
            )}

            {!loading && !error && processed.length > 0 && (
                <StaggerContainer className="grid sm:grid-cols-2 gap-4">
                    {processed.map(school => (
                        <StaggerItem key={school.id}>
                            <Link href={`/candidat/catalogue/${school.id}`}
                                className="block bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden hover:border-signal/20 transition-all group">
                                {/* Image */}
                                <div className="relative h-40 overflow-hidden bg-white/[0.02]">
                                    {school.imageUrl ? (
                                        <img src={school.imageUrl} alt={school.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Car className="h-12 w-12 text-mist/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-asphalt/80 to-transparent" />
                                    {school.isVerified && (
                                        <div className="absolute top-3 left-3 bg-signal text-asphalt text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3" /> VÉRIFIÉ
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                        <div>
                                            <h3 className="text-base font-black text-snow group-hover:text-signal transition-colors">{school.name}</h3>
                                            <p className="text-[10px] text-white/60 flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-signal" /> {school.city}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-lg">
                                            <Star className="h-3 w-3 text-signal fill-signal" />
                                            <span className="text-xs font-bold text-white">{school.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Info */}
                                <div className="p-4">
                                    {school.features.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {school.features.map((f: string) => (
                                                <span key={f} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-mist/60 border border-white/[0.04]">{f}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {school.price > 0 ? (
                                                <>
                                                    <span className="text-lg font-black text-signal">{formatPrice(school.price)}</span>
                                                    <span className="text-[10px] text-mist/40 ml-1">FCFA</span>
                                                </>
                                            ) : (
                                                <span className="text-xs text-mist/40">Prix sur demande</span>
                                            )}
                                        </div>
                                        <span className="flex items-center gap-1 text-xs font-bold text-signal group-hover:underline">
                                            Voir l&apos;offre <ArrowRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}
        </PageTransition>
    );
}
