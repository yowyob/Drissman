"use client";

import { useEffect } from "react";

/** Enregistre le Service Worker (PWA) — sans effet si non supporté. */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* PWA indisponible : l'application reste fonctionnelle en ligne */
      });
    }
  }, []);
  return null;
}
