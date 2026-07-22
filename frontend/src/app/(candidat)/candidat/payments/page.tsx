"use client";

import { useEffect, useState } from "react";
import { Receipt, Clock, CheckCircle2, XCircle, RotateCcw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { paymentService, paymentMethodLabels, type PaymentDto } from "@/lib/payment-service";
import { PageTransition } from "@/components/ui/motion";

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock; hint: string }> = {
    PENDING: {
        label: "En attente",
        class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        icon: Clock,
        hint: "L'auto-école vérifie votre paiement. Votre inscription sera activée dès confirmation.",
    },
    PAID: {
        label: "Payé",
        class: "bg-green-500/10 text-green-400 border-green-500/20",
        icon: CheckCircle2,
        hint: "Paiement confirmé — votre inscription est active.",
    },
    FAILED: {
        label: "Échoué",
        class: "bg-red-500/10 text-red-400 border-red-500/20",
        icon: XCircle,
        hint: "Ce paiement n'a pas abouti. Contactez l'auto-école si besoin.",
    },
    REFUNDED: {
        label: "Remboursé",
        class: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        icon: RotateCcw,
        hint: "Ce paiement vous a été remboursé.",
    },
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-FR").format(amount);
}

export default function MyPaymentsPage() {
    const { token } = useAuth();
    const [payments, setPayments] = useState<PaymentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshingId, setRefreshingId] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                setPayments((await paymentService.getMyPayments(token)) || []);
            } catch {
                toast.error("Impossible de charger vos paiements");
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    // Paiement carte : vérifie le statut chez le prestataire ; si toujours en
    // attente, rouvre la page Stripe Checkout.
    const handleRefresh = async (p: PaymentDto) => {
        if (!token) return;
        setRefreshingId(p.id);
        try {
            const updated = await paymentService.refresh(p.id, token);
            setPayments((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
            if (updated.status === "PAID") {
                toast.success("Paiement confirmé — votre inscription est active !");
            } else if (updated.checkoutUrl) {
                window.open(updated.checkoutUrl, "_blank", "noopener");
            } else {
                toast.info("Paiement toujours en attente.");
            }
        } catch (error: any) {
            toast.error(error.message || "Vérification impossible");
        } finally {
            setRefreshingId(null);
        }
    };

    return (
        <PageTransition className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-snow">Mes paiements</h1>
                <p className="text-sm text-mist mt-0.5">
                    Historique et suivi de vos paiements de formation.
                </p>
            </div>

            {loading ? (
                <p className="text-sm text-mist/60">Chargement...</p>
            ) : payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Receipt className="h-16 w-16 text-mist/15 mb-4" />
                    <h3 className="text-lg font-bold text-snow/60 mb-1">Aucun paiement</h3>
                    <p className="text-sm text-mist/40 max-w-sm">
                        Inscrivez-vous à une formation depuis le catalogue : votre paiement
                        apparaîtra ici avec son statut.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {payments.map((p) => {
                        const st = statusConfig[p.status] || statusConfig.PENDING;
                        const Icon = st.icon;
                        return (
                            <div key={p.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold text-signal">{p.reference}</span>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${st.class}`}>
                                                <Icon className="h-3 w-3" /> {st.label}
                                            </span>
                                        </div>
                                        <p className="text-lg font-black text-snow mt-1.5">{formatCurrency(p.amount)} FCFA</p>
                                        <div className="flex items-center gap-1.5 text-xs text-mist/50 mt-1">
                                            <Smartphone className="h-3 w-3" />
                                            {paymentMethodLabels[p.method] || p.method}
                                            {p.phone && <span className="font-mono">· {p.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-mist/40">
                                        <p>Initié le {new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
                                        {p.paidAt && <p className="text-green-400/70">Confirmé le {new Date(p.paidAt).toLocaleDateString("fr-FR")}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/5">
                                    <p className="text-xs text-mist/40">{st.hint}</p>
                                    {p.status === "PENDING" && (p.method === "CARD" || p.method === "MTN_MOMO" || p.method === "ORANGE_MONEY") && (
                                        <button
                                            onClick={() => void handleRefresh(p)}
                                            disabled={refreshingId === p.id}
                                            className="shrink-0 text-xs font-bold text-signal border border-signal/30 bg-signal/10 hover:bg-signal/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            {refreshingId === p.id ? "Vérification..." : "Vérifier le paiement"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageTransition>
    );
}
