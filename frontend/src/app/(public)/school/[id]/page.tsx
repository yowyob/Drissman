"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SchoolDetailView } from "@/components/school/school-detail-view";
import { useSchool } from "@/hooks";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function SchoolDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const { school, loading, error } = useSchool(id);

    if (loading) {
        return (
            <div className="min-h-screen bg-asphalt flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-signal animate-spin mx-auto mb-4" />
                    <p className="text-mist">Chargement...</p>
                </div>
            </div>
        );
    }

    if (error || !school) {
        notFound();
    }

    const schoolData = {
        ...school,
        price: school.offers?.[0]?.price || 150000,
        reviewCount: 25,
        features: ["Permis B", "Conduite accompagnée", "Code en ligne"],
        isVerified: true,
        imageUrl: school.imageUrl || "/hero_student_dark.png",
        coordinates: [3.8480, 11.5021] as [number, number],
    };

    return <SchoolDetailView school={schoolData} />;
}
