"use client";

import dynamic from "next/dynamic";

const LiveFleetMapClient = dynamic(() => import("./live-fleet-map-client"), {
    ssr: false,
    loading: () => (
        <div className="h-[420px] w-full bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-mist/50 text-sm font-medium">Chargement de la carte...</span>
        </div>
    ),
});

interface LiveFleetMapProps {
    schoolId: string;
    height?: string;
}

export function LiveFleetMap(props: LiveFleetMapProps) {
    return <LiveFleetMapClient {...props} />;
}
