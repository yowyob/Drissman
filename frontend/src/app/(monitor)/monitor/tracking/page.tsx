"use client";

import { useEffect, useRef, useState } from "react";
import { Car, Navigation, Square, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { monitorService } from "@/lib/monitor-service";
import { vehicleService, type VehicleDto } from "@/lib/vehicle-service";

/** Intervalle minimal entre deux envois de position (ms). */
const SEND_INTERVAL_MS = 10_000;

export default function TrackingPage() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [geoError, setGeoError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSendRef = useRef(0);

  // Charge la flotte de l'école du moniteur
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const profile = await monitorService.getProfile(token);
        const fleet = await vehicleService.bySchool(profile.schoolId);
        setVehicles(fleet);
        if (fleet.length === 1) setSelectedId(fleet[0].id);
      } catch {
        toast.error("Impossible de charger la flotte de votre école");
      }
    })();
  }, [token]);

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  };

  // Coupe le partage au démontage de la page
  useEffect(() => stopSharing, []);

  const startSharing = () => {
    if (!token || !selectedId) return toast.error("Sélectionnez un véhicule");
    if (!("geolocation" in navigator)) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setGeoError(null);
    setSentCount(0);
    lastSendRef.current = 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSendRef.current < SEND_INTERVAL_MS) return;
        lastSendRef.current = now;

        vehicleService
          .sendPosition(selectedId, pos.coords.latitude, pos.coords.longitude, token)
          .then(() => {
            setLastSentAt(new Date());
            setSentCount((c) => c + 1);
          })
          .catch((err: Error) => {
            // Refus métier (pas de séance de conduite en cours) : on arrête.
            if (err.message && err.message.includes("séance")) {
              setGeoError(err.message);
              stopSharing();
            }
            /* autre échec réseau : le prochain point réessaiera */
          });
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Autorisation refusée : activez la localisation pour ce site."
            : "Position introuvable, vérifiez le GPS de l'appareil.",
        );
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    setSharing(true);
    toast.success("Partage de position démarré");
  };

  const selected = vehicles.find((v) => v.id === selectedId);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-snow">Suivi GPS</h1>
        <p className="text-sm text-mist mt-0.5">
          Partagez la position du véhicule pendant vos leçons de conduite.
        </p>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-5">
        {/* Choix du véhicule */}
        <div>
          <label className="text-xs font-bold text-mist/60 uppercase tracking-wider">Véhicule</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={sharing}
            className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm focus:outline-none focus:border-signal/50 disabled:opacity-50"
          >
            <option value="" className="bg-asphalt">— Choisir un véhicule —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id} className="bg-asphalt">
                {v.name} ({v.plateNumber})
              </option>
            ))}
          </select>
        </div>

        {/* État du partage */}
        {sharing && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-green-400">
                Position partagée — {selected?.name}
              </p>
              <p className="text-xs text-mist/60">
                {sentCount} point{sentCount > 1 ? "s" : ""} envoyé{sentCount > 1 ? "s" : ""}
                {lastSentAt && ` · dernier à ${lastSentAt.toLocaleTimeString("fr-FR")}`}
              </p>
            </div>
          </div>
        )}

        {geoError && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {geoError}
          </div>
        )}

        {/* Bouton principal */}
        {sharing ? (
          <button
            onClick={stopSharing}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all"
          >
            <Square className="h-4 w-4" /> Arrêter le partage
          </button>
        ) : (
          <button
            onClick={startSharing}
            disabled={!selectedId}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-signal to-amber-400 text-asphalt font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Navigation className="h-4 w-4" /> Démarrer la leçon (partager ma position)
          </button>
        )}

        <p className="text-xs text-mist/40 flex items-start gap-1.5">
          <Car className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          La position est envoyée toutes les 10 secondes tant que cette page reste ouverte.
          L'école et les élèves la voient en direct sur la carte.
        </p>
      </div>
    </div>
  );
}
