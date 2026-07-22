"use client";

import { useCallback, useEffect, useState } from "react";

export type GeoStatus = "idle" | "prompting" | "granted" | "denied" | "unsupported";
export interface GeoCoords {
    lat: number;
    lng: number;
}

const STORAGE_KEY = "drissman_geo";
const TTL_MS = 1000 * 60 * 30; // 30 min : évite de re-demander à chaque visite

/**
 * Géolocalisation navigateur, pensée pour une UX « à l'ouverture du site » :
 * - réhydrate une position récente en cache (pas de nouvelle demande),
 * - sinon déclenche la demande native au montage (si `autoRequest`),
 * - expose `request()` pour un déclenchement manuel (bouton « Activer »).
 *
 * Ne bloque jamais : un refus laisse simplement `coords = null`.
 */
export function useGeolocation(autoRequest = true) {
    const [coords, setCoords] = useState<GeoCoords | null>(null);
    const [status, setStatus] = useState<GeoStatus>("idle");

    const request = useCallback(() => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setStatus("unsupported");
            return;
        }
        setStatus("prompting");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCoords(c);
                setStatus("granted");
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...c, t: Date.now() }));
                } catch {
                    /* stockage indisponible : sans effet */
                }
            },
            () => setStatus("denied"),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 1000 * 60 * 10 },
        );
    }, []);

    useEffect(() => {
        // 1) Réhydratation d'une position récente.
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const cached = JSON.parse(raw) as GeoCoords & { t: number };
                if (cached && Date.now() - cached.t < TTL_MS) {
                    setCoords({ lat: cached.lat, lng: cached.lng });
                    setStatus("granted");
                    return;
                }
            }
        } catch {
            /* cache illisible : on ignore */
        }
        // 2) Sinon, demande automatique au montage.
        if (autoRequest) request();
    }, [autoRequest, request]);

    return { coords, status, request };
}
