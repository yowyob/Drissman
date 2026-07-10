
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DrivingSchool } from "@/lib/data";
import L from "leaflet";

// Fix for default marker icon in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface MapClientProps {
    schools: DrivingSchool[];
    center?: [number, number];
    zoom?: number;
}

// Helper to update map view when center changes
function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function MapClient({ schools, center = [3.8480, 11.5021], zoom = 13 }: MapClientProps) {
    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Recenter center={center} zoom={zoom} />

                {schools.map((school) => (
                    <Marker
                        key={school.id}
                        position={school.coordinates}
                        icon={customIcon}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm mb-1">{school.name}</h3>
                                <p className="text-xs text-gray-600 mb-2">{school.price.toLocaleString()} FCFA</p>
                                <a href={`/school/${school.id}`} className="bg-primary text-white text-xs px-2 py-1 rounded block text-center">
                                    Voir
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
