"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

interface FilterState {
    city: "Yaoundé" | "Douala" | "Tous";
    maxPrice: number;
    ratings: number[];
    permitType: string;
}

interface SearchFiltersProps {
    initialFilters: FilterState;
    onApply: (filters: FilterState) => void;
}

export function SearchFilters({ initialFilters, onApply }: SearchFiltersProps) {
    const [city, setCity] = useState(initialFilters.city);
    const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
    const [ratings, setRatings] = useState<number[]>(initialFilters.ratings);
    const [permitType, setPermitType] = useState(initialFilters.permitType || "Tous");
    const [open, setOpen] = useState(false);

    // Sync with props ONLY when the sheet opens
    useEffect(() => {
        if (open) {
            setCity(initialFilters.city);
            setMaxPrice(initialFilters.maxPrice);
            setRatings(initialFilters.ratings);
            setPermitType(initialFilters.permitType || "Tous");
        }
    }, [open, initialFilters.city, initialFilters.maxPrice, initialFilters.ratings, initialFilters.permitType]);

    const handleRatingToggle = (rating: number) => {
        setRatings(prev =>
            prev.includes(rating)
                ? prev.filter(r => r !== rating)
                : [...prev, rating]
        );
    };

    const handleReset = () => {
        const defaultFilters: FilterState = {
            city: "Tous",
            maxPrice: 500000,
            ratings: [],
            permitType: "Tous"
        };
        setCity(defaultFilters.city);
        setMaxPrice(defaultFilters.maxPrice);
        setRatings(defaultFilters.ratings);
        setPermitType(defaultFilters.permitType);
        onApply(defaultFilters);
        setOpen(false);
    };

    const handleApply = () => {
        onApply({ city, maxPrice, ratings, permitType });
        setOpen(false);
    };

    const activeFilterCount = (city !== "Tous" ? 1 : 0) + (ratings.length > 0 ? 1 : 0) + (maxPrice < 500000 ? 1 : 0) + (permitType !== "Tous" ? 1 : 0);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="relative px-4 py-2 rounded-xl text-sm font-bold bg-white/5 text-mist border border-white/10 hover:border-signal/30 transition-all duration-300 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtres
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-signal text-asphalt text-[10px] font-black flex items-center justify-center border-2 border-charcoal shadow-lg">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-asphalt border-l border-white/10 flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <SheetTitle className="text-2xl font-black text-snow">Filtres</SheetTitle>
                        <button
                            onClick={handleReset}
                            className="text-xs font-bold text-mist hover:text-signal flex items-center gap-1 transition-colors"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Réinitialiser
                        </button>
                    </div>
                    <SheetDescription className="text-mist">
                        Affinez vos critères pour trouver l'auto-école parfaite.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                    {/* Ville */}
                    <div className="space-y-4">
                        <Label className="text-base font-bold text-snow">Ville</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["Yaoundé", "Douala", "Tous"] as const).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCity(c)}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${city === c
                                        ? "bg-signal text-asphalt border-signal shadow-[0_0_10px_rgba(255,193,7,0.2)]"
                                        : "bg-white/5 text-mist border-white/10 hover:border-signal/30"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-bold text-snow">Budget maximum</Label>
                            <span className="text-sm font-black text-signal px-2 py-1 bg-signal/10 rounded-lg border border-signal/20">
                                {maxPrice.toLocaleString()} FCFA
                            </span>
                        </div>
                        <div className="px-2">
                            <Slider
                                value={[maxPrice]}
                                max={500000}
                                min={50000}
                                step={5000}
                                onValueChange={(val) => setMaxPrice(val[0])}
                                className="[&_[role=slider]]:bg-signal [&_[role=slider]]:border-signal"
                            />
                            <div className="flex justify-between text-[10px] text-mist/50 font-medium mt-2">
                                <span>50k FCFA</span>
                                <span>500k FCFA</span>
                            </div>
                        </div>
                    </div>

                    {/* Type de permis */}
                    <div className="space-y-4">
                        <Label className="text-base font-bold text-snow">Type de Permis</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["Tous", "A", "B", "C", "D"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPermitType(p)}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${permitType === p
                                        ? "bg-signal text-asphalt border-signal shadow-[0_0_10px_rgba(255,193,7,0.2)]"
                                        : "bg-white/5 text-mist border-white/10 hover:border-signal/30"
                                        }`}
                                >
                                    {p === "Tous" ? "Tous" : `Permis ${p}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-4">
                        <Label className="text-base font-bold text-snow">Note minimale</Label>
                        <div className="grid grid-cols-1 gap-3">
                            {[4, 3, 2].map((r) => (
                                <div
                                    key={r}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${ratings.includes(r) ? "bg-white/10 border-signal/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                        }`}
                                    onClick={() => handleRatingToggle(r)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id={`rating-${r}`}
                                            checked={ratings.includes(r)}
                                            className="border-white/30 data-[state=checked]:bg-signal data-[state=checked]:border-signal shadow-none"
                                        />
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < r ? "text-signal" : "text-white/10"}>★</span>
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium text-snow">{r}+ Étoiles</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-charcoal/50 border-t border-white/5 mt-auto">
                    <button
                        onClick={handleApply}
                        className="w-full bg-signal hover:bg-signal-dark text-asphalt font-black py-4 rounded-xl shadow-[0_4px_20px_rgba(255,193,7,0.3)] transition-all active:scale-[0.98]"
                    >
                        Appliquer les filtres
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
