"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks";

/**
 * Petit indicateur de la position détectée de l'utilisateur : « 📍 Ville, Pays ».
 * Reverse-geocoding via BigDataCloud (endpoint client public, sans clé). En cas
 * d'échec ou de refus de géoloc, dégradation gracieuse (rien ou libellé neutre).
 */
export function UserLocationPin({ className = "" }: { className?: string }) {
    const { coords, status } = useGeolocation();
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        if (!coords) return;
        let cancelled = false;
        (async () => {
            try {
                const r = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lng}&localityLanguage=fr`,
                );
                const d = await r.json();
                const city = d.city || d.locality || d.principalSubdivision || "";
                const country = d.countryName || "";
                if (!cancelled) setLabel([city, country].filter(Boolean).join(", ") || null);
            } catch {
                if (!cancelled) setLabel(null);
            }
        })();
        return () => { cancelled = true; };
    }, [coords]);

    if (status === "prompting" && !coords) {
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs text-mist/60 ${className}`}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Localisation…
            </span>
        );
    }
    if (!coords) return null; // refus / non demandé : on n'affiche rien d'intrusif

    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold text-signal bg-signal/10 border border-signal/20 px-2.5 py-1 rounded-full ${className}`}
            title="Position détectée"
        >
            <MapPin className="h-3.5 w-3.5" /> {label || "Position détectée"}
        </span>
    );
}
