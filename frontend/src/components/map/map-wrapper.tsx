
"use client";

import dynamic from "next/dynamic";
import { DrivingSchool } from "@/lib/data";

const MapClient = dynamic(() => import("./map-client"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center animate-pulse">
            <span className="text-gray-400 font-medium">Chargement de la carte...</span>
        </div>
    )
});

interface MapWrapperProps {
    schools: DrivingSchool[];
    center?: [number, number];
    zoom?: number;
}

export function MapWrapper(props: MapWrapperProps) {
    return <MapClient {...props} />;
}
