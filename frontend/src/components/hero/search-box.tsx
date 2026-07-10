"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MapPin, GraduationCap } from "lucide-react";

export function SearchBox() {
    const router = useRouter();

    const handleSearch = () => {
        router.push(`/search?city=Yaounde`);
    };

    return (
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Location Input */}
            <div className="flex-1 w-full relative group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block group-focus-within:text-primary transition-colors">
                    Où cherchez-vous ?
                </label>
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-3">
                    <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-primary mr-3 transition-colors" />
                    <input
                        type="text"
                        placeholder="Ville, Quartier... (ex: Yaoundé)"
                        className="bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-full font-medium"
                    />
                </div>
            </div>

            <div className="hidden md:block w-px h-12 bg-gray-200" />

            {/* License Type */}
            <div className="flex-1 w-full relative group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block group-focus-within:text-primary transition-colors">
                    Quel Permis ?
                </label>
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-3">
                    <GraduationCap className="h-5 w-5 text-gray-400 group-focus-within:text-primary mr-3 transition-colors" />
                    <select className="bg-transparent border-none outline-none text-gray-900 w-full font-medium appearance-none cursor-pointer">
                        <option>Permis B (Voiture)</option>
                        <option>Permis A (Moto)</option>
                        <option>Permis C (Poids Lourd)</option>
                        <option>Code de la route</option>
                    </select>
                </div>
            </div>

            {/* Submit */}
            <div className="w-full md:w-auto mt-2 md:mt-6">
                <Button
                    onClick={handleSearch}
                    size="lg"
                    variant="secondary"
                    className="w-full md:w-auto font-bold text-lg px-8 shadow-orange-500/20"
                >
                    Comparer
                </Button>
            </div>
        </div>
    );
}
