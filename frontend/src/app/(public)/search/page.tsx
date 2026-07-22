"use client";

import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Menu, X, Map as MapIcon, Loader2, SlidersHorizontal } from "lucide-react";
import { SchoolCard } from "@/components/search/school-card";
import { MapWrapper } from "@/components/map/map-wrapper";
import { SearchFilters } from "@/components/search/search-filters";
import { useSchools, useGeolocation, type GeoCoords } from "@/hooks";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoLink } from "@/components/layout/logo";
import { UserLocationPin } from "@/components/layout/user-location-pin";

interface FilterState {
    city: "Yaoundé" | "Douala" | "Tous";
    maxPrice: number;
    ratings: number[];
    permitType: string;
}

// Villes supportées par le filtre + leur ancrage GPS.
const CITY_ANCHORS: { name: "Yaoundé" | "Douala"; lat: number; lng: number }[] = [
    { name: "Yaoundé", lat: 3.848, lng: 11.5021 },
    { name: "Douala", lat: 4.0511, lng: 9.7679 },
];

/** Ville supportée la plus proche des coordonnées (rayon 60 km), sinon "Tous". */
function cityFromCoords(coords: GeoCoords): "Yaoundé" | "Douala" | "Tous" {
    const km = (b: { lat: number; lng: number }) => {
        const R = 6371;
        const dLat = ((b.lat - coords.lat) * Math.PI) / 180;
        const dLng = ((b.lng - coords.lng) * Math.PI) / 180;
        const s =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((coords.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.asin(Math.sqrt(s));
    };
    let best: { name: "Yaoundé" | "Douala"; d: number } | null = null;
    for (const c of CITY_ANCHORS) {
        const d = km(c);
        if (!best || d < best.d) best = { name: c.name, d };
    }
    return best && best.d <= 60 ? best.name : "Tous";
}

function SearchPageContent() {
    const searchParams = useSearchParams();
    const cityFromUrl = searchParams.get('city');

    // Map user input to valid filter values
    const getValidCity = (input: string | null): "Yaoundé" | "Douala" | "Tous" => {
        if (!input) return "Tous"; // AUCUN filtre ville actif par défaut
        const normalized = input.toLowerCase().trim();
        if (normalized.includes("douala")) return "Douala";
        if (normalized.includes("yaounde") || normalized.includes("yaoundé")) return "Yaoundé";
        return "Tous"; // For any other city, show all
    };

    const [filters, setFilters] = useState<FilterState>({
        city: getValidCity(cityFromUrl),
        maxPrice: 500000,
        ratings: [],
        permitType: "Tous"
    });

    // Position utilisateur : si détectée (et sans ville imposée par l'URL ni
    // filtre modifié manuellement), on pré-cadre STRICTEMENT sur sa ville.
    const { coords } = useGeolocation();
    const filterTouched = useRef(false);

    useEffect(() => {
        if (cityFromUrl || filterTouched.current || !coords) return;
        const detected = cityFromCoords(coords);
        if (detected !== "Tous") {
            setFilters((f) => ({ ...f, city: detected }));
        }
    }, [coords, cityFromUrl]);

    const [showMapMobile, setShowMapMobile] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // API Filter logic
    const cityParam = filters.city === "Tous" ? undefined : filters.city;
    const { schools, loading, error } = useSchools(cityParam);


    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const processedSchools = useMemo(() => {
        return schools
            .map(school => ({
                ...school,
                price: (school as any).offers?.[0]?.price || (school as any).minPrice || 0, // Utiliser le vrai prix ou 0
                features: (school as any).offers?.map((o: any) => o.name).slice(0, 3) || [], // Utiliser les vrais noms d'offres
                imageUrl: school.imageUrl || "/hero_student_dark.png",
            }))
            .filter(school => {
                // Filtrer: L'école doit avoir au moins une offre (prix > 0)
                if ((school.price === 0 || school.price === undefined) && !school.offers?.length) return false;

                const matchesPrice = filters.maxPrice ? school.price <= filters.maxPrice : true;
                const matchesRating = filters.ratings.length === 0 ||
                    filters.ratings.some(r => school.rating >= r);
                const matchesPermit = filters.permitType === "Tous" ||
                    school.offers?.some((o: any) => o.permitType === filters.permitType);
                return matchesPrice && matchesRating && matchesPermit;
            });
    }, [schools, filters]);

    const handleFilterChange = useCallback((newFilters: FilterState) => {
        filterTouched.current = true;
        setFilters(newFilters);
    }, []);

    const mapCenter: [number, number] = filters.city === "Douala"
        ? [4.0511, 9.7679]
        : [3.8480, 11.5021];

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-asphalt text-snow">
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-asphalt/90 backdrop-blur-xl shadow-2xl border-b border-white/5" : "bg-asphalt/80 backdrop-blur-md"}`}>
                <nav className="container-wide flex justify-between items-center py-4">
                    <div className="z-50">
                        <LogoLink href="/" className="h-9 w-auto" wordmarkClassName="text-xl" />
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/search" className="text-sm text-signal font-bold">Auto-écoles</Link>
                        <Link href="/code" className="text-sm text-mist hover:text-signal transition-colors">Code</Link>
                        <Link href="/partners" className="text-sm text-mist hover:text-signal transition-colors">Partenaires</Link>

                        <ThemeToggle />

                        <div className="flex items-center gap-3">
                            <Link href="/login" className="text-xs font-bold text-mist hover:text-signal transition-colors">
                                Connexion
                            </Link>
                            <Link href="/register" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-snow hover:border-signal/30 transition-all">
                                Inscription
                            </Link>
                        </div>
                    </div>

                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 z-50">
                        {menuOpen ? <X className="h-6 w-6 text-signal" /> : <Menu className="h-6 w-6 text-snow" />}
                    </button>
                </nav>

                {/* Mobile Menu Overlay */}
                <div className={`fixed inset-0 bg-asphalt/98 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-8 md:hidden transition-all duration-500 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
                    <Link href="/search" onClick={() => setMenuOpen(false)} className="text-4xl font-black text-signal">Auto-écoles</Link>
                    <Link href="/code" onClick={() => setMenuOpen(false)} className="text-4xl font-black text-snow">Code</Link>
                    <Link href="/partners" onClick={() => setMenuOpen(false)} className="text-4xl font-black text-snow">Partenaires</Link>
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-4xl font-black text-snow">Dashboard</Link>
                    <div className="mt-4">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="bg-asphalt/95 backdrop-blur-xl border-b border-white/5 z-20 shadow-lg pt-20 flex-shrink-0">
                <div className="container-wide py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-snow flex items-center gap-3">
                            <span className="px-3 py-1 bg-signal text-asphalt rounded-full text-sm">
                                {processedSchools.length}
                            </span>
                            Auto-écoles
                            {filters.city !== "Tous" && <span className="text-signal hidden sm:inline">à {filters.city}</span>}
                        </h1>
                        {/* Live pulse indicator + position détectée */}
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                                </span>
                                <p className="text-[10px] text-green-400/80 font-bold uppercase tracking-widest">En temps réel</p>
                            </div>
                            <UserLocationPin />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <SearchFilters initialFilters={filters} onApply={handleFilterChange} />
                    </div>
                </div>
            </div>

            {/* Main Content View */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Scrollable Result List */}
                <div className={`w-full md:w-[480px] lg:w-[540px] h-full overflow-y-auto p-4 bg-asphalt pb-28 md:pb-6 border-r border-white/5 scrollbar-hide ${showMapMobile ? 'hidden md:block' : 'block'}`}>
                    <div className="space-y-4 max-w-xl mx-auto">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-32">
                                <div className="relative h-16 w-16 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-signal/10"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-signal border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-mist font-bold tracking-tight animate-pulse italic">Analyse des meilleures offres...</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-10 rounded-3xl bg-red-500/5 border border-red-500/10 text-center">
                                <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="h-6 w-6 text-red-400" />
                                </div>
                                <h3 className="text-red-400 font-bold mb-1">Erreur de connexion</h3>
                                <p className="text-xs text-mist leading-relaxed">{error}</p>
                            </div>
                        )}

                        {!loading && !error && processedSchools.map((school) => (
                            <SchoolCard key={school.id} school={school as any} />
                        ))}

                        {!loading && !error && processedSchools.length === 0 && (
                            <div className="text-center py-28 px-8 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
                                <div className="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
                                    <SlidersHorizontal className="h-8 w-8 text-mist" />
                                </div>
                                <h3 className="text-snow text-xl font-black mb-2">Aucun résultat trouvé</h3>
                                <p className="text-mist text-sm mb-10 max-w-[280px] mx-auto leading-relaxed">
                                    Nous n&apos;avons pas d&apos;auto-école correspondant à ces filtres. Essayez de réinitialiser votre recherche.
                                </p>
                                <button
                                    onClick={() => handleFilterChange({ city: "Tous", maxPrice: 500000, ratings: [], permitType: "Tous" })}
                                    className="px-10 py-4 rounded-2xl bg-signal text-asphalt font-black text-sm shadow-[0_10px_30px_rgba(255,193,7,0.3)] hover:scale-105 active:scale-95 transition-all"
                                >
                                    VOIR TOUT
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Interactive Column */}
                <div className={`flex-1 h-full bg-asphalt/50 relative ${showMapMobile ? 'block' : 'hidden md:block'}`}>
                    <MapWrapper schools={processedSchools as any} center={mapCenter} zoom={13} />
                </div>

                {/* Mobile Display Switcher */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:hidden z-[1000]">
                    <button
                        onClick={() => setShowMapMobile(!showMapMobile)}
                        className="bg-signal text-asphalt font-black py-4 px-10 rounded-2xl shadow-[0_15px_50px_rgba(255,193,7,0.5)] flex items-center gap-3 active:scale-90 transition-all border-4 border-charcoal/20"
                    >
                        {showMapMobile ? (
                            <><SlidersHorizontal className="h-5 w-5" /> LISTE</>
                        ) : (
                            <><MapIcon className="h-5 w-5" /> CARTE</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-asphalt">
                <Loader2 className="h-10 w-10 text-signal animate-spin" />
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
