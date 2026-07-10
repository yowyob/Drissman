"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { vehicleService, type VehicleDto } from "@/lib/vehicle-service";

// Icône voiture (divIcon emoji : aucun asset externe à charger)
const carIcon = L.divIcon({
    className: "",
    html: '<div style="font-size:26px;line-height:26px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))">🚗</div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
});

function FitToFleet({ vehicles }: { vehicles: VehicleDto[] }) {
    const map = useMap();
    useEffect(() => {
        const points = vehicles
            .filter((v) => v.latitude != null && v.longitude != null)
            .map((v) => [v.latitude as number, v.longitude as number] as [number, number]);
        if (points.length > 0) {
            map.fitBounds(L.latLngBounds(points).pad(0.3), { maxZoom: 15 });
        }
        // Cadre uniquement au premier rendu avec des positions — pas à chaque
        // mise à jour SSE, pour ne pas arracher la carte des mains de l'utilisateur.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicles.length > 0, map]);
    return null;
}

interface LiveFleetMapClientProps {
    schoolId: string;
    height?: string;
}

export default function LiveFleetMapClient({ schoolId, height = "420px" }: LiveFleetMapClientProps) {
    const [vehicles, setVehicles] = useState<Record<string, VehicleDto>>({});
    const [live, setLive] = useState(false);

    useEffect(() => {
        let cancelled = false;

        // Positions initiales
        vehicleService
            .bySchool(schoolId)
            .then((list) => {
                if (cancelled) return;
                setVehicles(Object.fromEntries(list.map((v) => [v.id, v])));
            })
            .catch(() => {
                /* la carte reste vide */
            });

        // Mises à jour temps réel
        const unsubscribe = vehicleService.subscribe(schoolId, (vehicle) => {
            setLive(true);
            setVehicles((prev) => ({ ...prev, [vehicle.id]: vehicle }));
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [schoolId]);

    const positioned = Object.values(vehicles).filter(
        (v) => v.latitude != null && v.longitude != null,
    );

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ height }}>
            <MapContainer
                center={[3.848, 11.5021]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitToFleet vehicles={positioned} />
                {positioned.map((v) => (
                    <Marker key={v.id} position={[v.latitude as number, v.longitude as number]} icon={carIcon}>
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-sm mb-0.5">{v.name}</p>
                                <p className="text-xs text-gray-600">{v.plateNumber}</p>
                                {v.lastPositionAt && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Vu à {new Date(v.lastPositionAt).toLocaleTimeString("fr-FR")}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Badge état du flux */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold text-white">
                <span className={`h-2 w-2 rounded-full ${live ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                {live ? "En direct" : "En attente de positions"}
            </div>

            {positioned.length === 0 && (
                <div className="absolute inset-x-0 bottom-3 z-[1000] flex justify-center pointer-events-none">
                    <span className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-white">
                        Aucun véhicule positionné pour le moment
                    </span>
                </div>
            )}
        </div>
    );
}
