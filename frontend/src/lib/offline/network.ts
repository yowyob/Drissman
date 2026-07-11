"use client";

/**
 * Détection de l'état réseau. `navigator.onLine` n'est qu'un indice (il peut
 * être vrai avec un backend injoignable) : la disponibilité réelle est vérifiée
 * par une sonde légère sur /api/health avec délai court.
 */

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const PROBE_TIMEOUT_MS = 4000;
const PROBE_INTERVAL_MS = 25_000;

export async function probeBackend(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

type Listener = (online: boolean) => void;
const listeners = new Set<Listener>();
let lastKnown = true;

export function notifyBackendState(online: boolean) {
  if (online !== lastKnown) {
    lastKnown = online;
    listeners.forEach((l) => l(online));
  }
}

/** État réseau réactif : événements navigateur + sonde périodique du backend. */
export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const update = (v: boolean) => {
      if (!cancelled) setOnline(v);
      notifyBackendState(v);
    };

    const check = () => probeBackend().then(update);
    check();
    const interval = setInterval(check, PROBE_INTERVAL_MS);

    const onUp = () => check();
    const onDown = () => update(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    const sub: Listener = (v) => !cancelled && setOnline(v);
    listeners.add(sub);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
      listeners.delete(sub);
    };
  }, []);

  return online;
}
