"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks";
import {
    schoolDocumentService,
    DocumentChecklistItem,
    DocumentStatus,
    KernelIntegrationStatus,
} from "@/lib/school-document-service";
import { backendImageUrl } from "@/lib/admin-offer-service";
import {
    Loader2, FileCheck, Upload, CheckCircle2, Clock, XCircle,
    FileWarning, ExternalLink, Cloud, CloudOff,
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { toast } from "sonner";

const STATUS_META: Record<DocumentStatus, { label: string; cls: string; Icon: any }> = {
    VERIFIED: { label: "Vérifié", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircle2 },
    PENDING: { label: "En vérification", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20", Icon: Clock },
    REJECTED: { label: "Rejeté", cls: "text-red-400 bg-red-500/10 border-red-500/20", Icon: XCircle },
    MISSING: { label: "Manquant", cls: "text-mist/60 bg-white/[0.03] border-white/[0.08]", Icon: FileWarning },
};

export default function SchoolDocumentsPage() {
    const { token } = useAuth();
    const [items, setItems] = useState<DocumentChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingCat, setUploadingCat] = useState<string | null>(null);
    const [integration, setIntegration] = useState<KernelIntegrationStatus | null>(null);
    const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

    const fetchChecklist = async () => {
        if (!token) return;
        try {
            setItems(await schoolDocumentService.getChecklist(token));
        } catch (err: any) {
            toast.error(err.message || "Erreur lors du chargement des documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChecklist();
        // État d'intégration Kernel — informatif, n'empêche jamais l'affichage.
        if (token) {
            schoolDocumentService.getKernelIntegration(token)
                .then(setIntegration)
                .catch(() => setIntegration(null));
        }
    }, [token]);

    const handleFile = async (category: string, file: File | undefined) => {
        if (!token || !file) return;
        setUploadingCat(category);
        try {
            const updated = await schoolDocumentService.upload(file, category, token);
            setItems(updated);
            toast.success("Document téléversé. Vérification en cours.");
        } catch (err: any) {
            toast.error(err.message || "Échec du téléversement");
        } finally {
            setUploadingCat(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 text-signal animate-spin" />
                <p className="text-xs text-mist/60 font-bold uppercase tracking-wider">Chargement des documents...</p>
            </div>
        );
    }

    const requiredCount = items.filter((i) => i.required).length;
    const requiredOk = items.filter((i) => i.required && i.status === "VERIFIED").length;

    return (
        <PageTransition className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-snow mb-1 tracking-tight">Documents & Conformité</h1>
                <p className="text-mist text-sm font-medium">
                    Téléversez les pièces justificatives de votre auto-école. Elles sont vérifiées
                    par la plateforme (KYC) avant validation.
                </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-signal shrink-0" />
                <p className="text-sm text-mist">
                    <span className="font-black text-snow">{requiredOk}/{requiredCount}</span> pièce(s)
                    obligatoire(s) vérifiée(s).
                </p>
            </div>

            {/* État réel de l'archivage Kernel — visible sans accès serveur. */}
            {integration && (
                <div
                    className={`rounded-2xl px-5 py-3.5 flex items-start gap-3 border ${
                        integration.mirroringOperational
                            ? "bg-emerald-500/[0.06] border-emerald-500/20"
                            : "bg-amber-500/[0.06] border-amber-500/20"
                    }`}
                >
                    {integration.mirroringOperational ? (
                        <Cloud className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                        <CloudOff className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                        <p className={`text-xs font-black uppercase tracking-wider ${
                            integration.mirroringOperational ? "text-emerald-400" : "text-amber-400"
                        }`}>
                            {integration.mirroringOperational
                                ? "Archivage Kernel actif"
                                : "Archivage Kernel indisponible"}
                        </p>
                        <p className="text-xs text-mist/70 mt-0.5 leading-relaxed">{integration.summary}</p>
                        {!integration.mirroringOperational && (
                            <p className="text-xs text-mist/50 mt-1">
                                Vos dépôts restent enregistrés normalement — ils seront archivés dès le rétablissement.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {items.map((item) => {
                    const meta = STATUS_META[item.status];
                    const busy = uploadingCat === item.category;
                    const fileHref = backendImageUrl(item.fileUrl);
                    return (
                        <StaggerItem key={item.category}>
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 h-full flex flex-col justify-between hover:border-white/[0.1] transition-all">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-base font-black text-snow leading-tight">
                                                {item.label}
                                            </h3>
                                            {item.required ? (
                                                <span className="text-[10px] font-black text-signal uppercase tracking-wider">Obligatoire</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-mist/40 uppercase tracking-wider">Optionnel</span>
                                            )}
                                        </div>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-black rounded-lg uppercase tracking-wider shrink-0 ${meta.cls}`}>
                                            <meta.Icon className="h-3 w-3" />
                                            {meta.label}
                                        </span>
                                    </div>

                                    {item.status === "REJECTED" && item.reviewNotes && (
                                        <p className="text-[11px] text-red-400/80 bg-red-500/[0.06] border border-red-500/15 rounded-xl px-3 py-2 leading-relaxed">
                                            <span className="font-black uppercase tracking-wider">Motif : </span>
                                            {item.reviewNotes}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        {fileHref ? (
                                            <a
                                                href={fileHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-mist/70 hover:text-snow transition-colors"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Voir le fichier envoyé
                                            </a>
                                        ) : <span />}

                                        {/* Archivage Kernel réel de CETTE pièce */}
                                        {item.documentId && (
                                            <span
                                                title={item.kernelSynced
                                                    ? "Pièce archivée dans le Document-hub du Kernel"
                                                    : "Enregistrée localement ; pas encore archivée dans le Kernel"}
                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                                    item.kernelSynced
                                                        ? "text-emerald-400/90 bg-emerald-500/[0.08] border-emerald-500/20"
                                                        : "text-mist/50 bg-white/[0.03] border-white/[0.08]"
                                                }`}
                                            >
                                                {item.kernelSynced
                                                    ? <Cloud className="h-3 w-3" />
                                                    : <CloudOff className="h-3 w-3" />}
                                                {item.kernelSynced ? "Kernel" : "Local"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-5 border-t border-white/[0.06]">
                                    <input
                                        ref={(el) => { inputsRef.current[item.category] = el; }}
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={(e) => handleFile(item.category, e.target.files?.[0])}
                                    />
                                    <button
                                        onClick={() => inputsRef.current[item.category]?.click()}
                                        disabled={busy}
                                        className="w-full px-4 py-2.5 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 border bg-signal/10 text-signal border-signal/20 hover:bg-signal/20 disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Upload className="h-3.5 w-3.5" />
                                        )}
                                        {item.status === "MISSING" ? "Téléverser" : "Remplacer"}
                                    </button>
                                </div>
                            </div>
                        </StaggerItem>
                    );
                })}
            </StaggerContainer>
        </PageTransition>
    );
}
