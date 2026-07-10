"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks";
import { Search, Receipt, DollarSign, Clock, CheckCircle, Smartphone } from "lucide-react";
import { paymentService, paymentMethodLabels, type PaymentDto } from "@/lib/payment-service";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; class: string }> = {
    PAID: { label: "Payé", class: "bg-green-500/10 text-green-400" },
    PENDING: { label: "En attente", class: "bg-yellow-500/10 text-yellow-400" },
    FAILED: { label: "Échoué", class: "bg-red-500/10 text-red-400" },
    REFUNDED: { label: "Remboursé", class: "bg-blue-500/10 text-blue-400" },
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-FR").format(amount);
}

export default function InvoicesPage() {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [payments, setPayments] = useState<PaymentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const load = async () => {
            try {
                setPayments((await paymentService.listForSchool(token)) || []);
            } catch (error) {
                console.error(error);
                toast.error("Impossible de charger les paiements");
            } finally {
                setLoading(false);
            }
        };

        void load();
        const intervalId = window.setInterval(() => void load(), 15000);
        return () => window.clearInterval(intervalId);
    }, [token]);

    const handleConfirm = async (payment: PaymentDto) => {
        if (!token) return;
        setConfirmingId(payment.id);
        try {
            const updated = await paymentService.confirm(payment.id, token);
            setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, ...updated } : p)));
            toast.success(`Paiement de ${formatCurrency(payment.amount)} F confirmé — inscription activée`);
        } catch (error: any) {
            toast.error(error.message || "Échec de la confirmation");
        } finally {
            setConfirmingId(null);
        }
    };

    const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + (p.amount || 0), 0);
    const totalPending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + (p.amount || 0), 0);
    const pendingCount = payments.filter((p) => p.status === "PENDING").length;

    const filtered = useMemo(
        () =>
            payments.filter((p) =>
                `${p.studentName || ""} ${p.reference || ""} ${p.offerName || ""}`
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
            ),
        [payments, searchQuery],
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-snow">Factures & Finances</h1>
                <p className="text-sm text-mist mt-0.5">
                    {payments.length} paiement{payments.length > 1 ? "s" : ""} — données réelles
                </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl border border-green-500/20 p-5">
                    <DollarSign className="h-5 w-5 text-green-400 opacity-60 mb-2" />
                    <p className="text-2xl font-black text-snow">{formatCurrency(totalPaid)} F</p>
                    <p className="text-xs text-mist/60">Encaissé (confirmé)</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-2xl border border-yellow-500/20 p-5">
                    <Clock className="h-5 w-5 text-yellow-400 opacity-60 mb-2" />
                    <p className="text-2xl font-black text-snow">{formatCurrency(totalPending)} F</p>
                    <p className="text-xs text-mist/60">En attente de confirmation</p>
                </div>
                <div className="bg-gradient-to-br from-signal/10 to-amber-600/5 rounded-2xl border border-signal/20 p-5">
                    <CheckCircle className="h-5 w-5 text-signal opacity-60 mb-2" />
                    <p className="text-2xl font-black text-snow">{pendingCount}</p>
                    <p className="text-xs text-mist/60">Paiement{pendingCount > 1 ? "s" : ""} à vérifier</p>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/40" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher par élève, référence, offre..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" />
            </div>

            {loading ? (
                <p className="text-sm text-mist/60">Chargement...</p>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Receipt className="h-16 w-16 text-mist/15 mb-4" />
                    <h3 className="text-lg font-bold text-snow/60 mb-1">Aucun paiement</h3>
                    <p className="text-sm text-mist/40 max-w-sm">
                        Les paiements initiés par les candidats apparaîtront ici, avec le numéro
                        Mobile Money à vérifier avant confirmation.
                    </p>
                </div>
            ) : (
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left text-[10px] font-bold text-mist/40 uppercase tracking-wider px-5 py-3">Référence</th>
                                    <th className="text-left text-[10px] font-bold text-mist/40 uppercase tracking-wider px-5 py-3">Élève</th>
                                    <th className="text-left text-[10px] font-bold text-mist/40 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Offre</th>
                                    <th className="text-left text-[10px] font-bold text-mist/40 uppercase tracking-wider px-5 py-3">Montant</th>
                                    <th className="text-left text-[10px] font-bold text-mist/40 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Moyen</th>
                                    <th className="text-left text-[10px] font-bold text-mist/40 uppercase tracking-wider px-5 py-3">Statut</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((payment) => {
                                    const st = statusConfig[payment.status] || statusConfig.PENDING;
                                    return (
                                        <tr key={payment.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-mono font-bold text-signal">{payment.reference}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm text-snow">{payment.studentName}</span>
                                            </td>
                                            <td className="px-5 py-4 hidden md:table-cell">
                                                <span className="text-xs text-mist/60">{payment.offerName}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-snow">{formatCurrency(payment.amount)} F</span>
                                            </td>
                                            <td className="px-5 py-4 hidden lg:table-cell">
                                                <div className="flex items-center gap-1.5 text-xs text-mist/60">
                                                    <Smartphone className="h-3 w-3" />
                                                    <span>{paymentMethodLabels[payment.method] || payment.method}</span>
                                                    {payment.phone && <span className="text-mist/40 font-mono">{payment.phone}</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${st.class}`}>{st.label}</span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {payment.status === "PENDING" && (
                                                    <button
                                                        onClick={() => void handleConfirm(payment)}
                                                        disabled={confirmingId === payment.id}
                                                        className="inline-flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        {confirmingId === payment.id ? "..." : "Confirmer"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
