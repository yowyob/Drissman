"use client";

import { useState, useEffect } from "react";

/**
 * A useState replacement that persists data in localStorage.
 * Data survives page refreshes until backend APIs are connected.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const storageKey = `drissman_${key}`;
    const legacyKey = key;

    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const primaryRaw = localStorage.getItem(storageKey);
            const legacyRaw = localStorage.getItem(legacyKey);

            if (!primaryRaw && !legacyRaw) return initialValue;
            if (!primaryRaw && legacyRaw) return JSON.parse(legacyRaw) as T;
            if (primaryRaw && !legacyRaw) return JSON.parse(primaryRaw) as T;

            const primaryValue = JSON.parse(primaryRaw!) as T;
            const legacyValue = JSON.parse(legacyRaw!) as T;

            // Migration safety: if one side is a non-empty array and the other is empty,
            // keep the non-empty source to avoid "all stats = 0" regressions.
            if (Array.isArray(primaryValue) && Array.isArray(legacyValue)) {
                if (primaryValue.length === 0 && legacyValue.length > 0) return legacyValue;
                if (legacyValue.length === 0 && primaryValue.length > 0) return primaryValue;
            }

            return primaryValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(value));
            // Keep legacy key in sync while the app migrates to drissman_* keys.
            localStorage.setItem(legacyKey, JSON.stringify(value));
        } catch {
            // localStorage full or unavailable - ignore
        }
    }, [legacyKey, storageKey, value]);

    return [value, setValue];
}
