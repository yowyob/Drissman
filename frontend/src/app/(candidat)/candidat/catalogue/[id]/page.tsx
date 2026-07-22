"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useSchool, useAuth } from "@/hooks";
import { Star, MapPin, ArrowLeft, Car, ShieldCheck, Check, Loader2, Phone, X, MessageSquare, Send, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/motion";
import { enrollmentService, EnrollmentDto } from "@/lib/enrollment-service";
import { paymentService } from "@/lib/payment-service";
import { reviewService, type ReviewDto, type ReviewEligibility } from "@/lib/review-service";
import { backendImageUrl } from "@/lib/admin-offer-service";

interface Enrollment {
    id: string;
    offerId: string;
    offerName: string;
    schoolId: string;
    schoolName: string;
    price: number;
    hours: number;
    permitType: string;
    modules: Array<{ id: string; name: string; category: string; requiredHours: number }>;
    status: "PENDING" | "ACTIVE" | "COMPLETED" | "REFUSED";
    enrolledAt: string;
    studentId: string;
    studentName: string;
    paymentMethod: string;
    paymentPhone: string;
}

interface SchoolOffer {
    id: string;
    title: string;
    name?: string;
    type: string;
    permitType?: string;
    description: string;
    features?: string[];
    price: number;
    hours?: number;
    imageUrl?: string;
    modules?: Array<{ id: string; name: string; category: string; requiredHours: number }>;
}

interface PageProps { params: Promise<{ id: string }> }

export default function CatalogueDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const { school, loading, error } = useSchool(id);
    const { user, token } = useAuth();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [paymentModal, setPaymentModal] = useState<SchoolOffer | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [paymentPhone, setPaymentPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // --- Avis (chargés depuis l'API) + éligibilité (formulaire conditionné) ---
    const [reviews, setReviews] = useState<ReviewDto[]>([]);
    const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    const loadReviews = useCallback(async () => {
        try {
            setReviews((await reviewService.getForSchool(id)) || []);
        } catch {
            /* liste d'avis indisponible : on n'affiche rien de bloquant */
        }
    }, [id]);

    useEffect(() => { void loadReviews(); }, [loadReviews]);

    useEffect(() => {
        if (!token) { setEligibility(null); return; }
        (async () => {
            try {
                setEligibility(await reviewService.getEligibility(id, token));
            } catch {
                setEligibility(null);
            }
        })();
    }, [id, token]);

    const handleSubmitReview = async () => {
        if (!token || reviewRating < 1) return;
        setSubmittingReview(true);
        try {
            await reviewService.create(id, reviewRating, reviewComment.trim(), token);
            toast.success("Merci ! Votre avis a été publié.");
            setReviewRating(0);
            setReviewComment("");
            await loadReviews();
            setEligibility(await reviewService.getEligibility(id, token));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible d'envoyer l'avis");
        } finally {
            setSubmittingReview(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!token) return;
            try {
                const remote = await enrollmentService.getMyEnrollments(token);
                if (cancelled) return;
                const mapped: Enrollment[] = remote.map((e: EnrollmentDto) => ({
                    id: e.id,
                    offerId: e.offerId,
                    offerName: e.offerName,
                    schoolId: e.schoolId,
                    schoolName: e.schoolName,
                    price: e.price,
                    hours: e.hours,
                    permitType: e.permitType,
                    modules: [],
                    status: e.status === "CANCELLED" ? "REFUSED" : (e.status as Enrollment["status"]),
                    enrolledAt: e.enrolledAt,
                    studentId: e.studentId,
                    studentName: e.studentName,
                    paymentMethod: "",
                    paymentPhone: "",
                }));
                setEnrollments(mapped);
                return;
            } catch {
                if (!cancelled) toast.error("Impossible de charger vos inscriptions");
            }
        };
        load();
        return () => { cancelled = true; };
    }, [token]);

    const isEnrolled = (offerId: string) => enrollments.some(e => e.offerId === offerId && (!user?.id || !e.studentId || e.studentId === user.id));

    const handleSubmitPayment = async () => {
        if (!paymentMethod || !paymentPhone || !paymentModal || !user) return;
        setSubmitting(true);

        let enrollment: Enrollment;
        try {
            if (!token) throw new Error("no-token");
            const created = await enrollmentService.createEnrollment(paymentModal.id, token);
            // Initie le paiement réel : la méthode et le téléphone sont désormais
            // transmis au backend (facture PENDING, confirmée ensuite par l'école).
            // Carte bancaire : le backend retourne une URL Stripe Checkout à ouvrir.
            try {
                const isCard = paymentMethod === "Carte bancaire";
                const payment = await paymentService.initiate(
                    created.id, paymentMethod, isCard ? "" : paymentPhone, token);
                if (isCard && payment.checkoutUrl) {
                    window.open(payment.checkoutUrl, "_blank", "noopener");
                    toast.info("Fenêtre de paiement Stripe ouverte — finalisez le règlement puis revenez sur Mes Paiements.");
                }
            } catch {
                toast.warning("Inscription créée, mais l'initiation du paiement a échoué. Contactez l'auto-école.");
            }
            enrollment = {
                id: created.id,
                offerId: created.offerId,
                offerName: created.offerName,
                schoolId: created.schoolId,
                schoolName: created.schoolName,
                price: created.price,
                hours: created.hours,
                permitType: created.permitType,
                modules: paymentModal.modules || [],
                status: created.status === "CANCELLED" ? "REFUSED" : (created.status as Enrollment["status"]),
                enrolledAt: created.enrolledAt,
                studentId: created.studentId,
                studentName: created.studentName,
                paymentMethod,
                paymentPhone,
            };
        } catch {
            setSubmitting(false);
            toast.error("Inscription impossible pour le moment. Reessayez.");
            return;
        }

        const updated = [...enrollments, enrollment];
        setEnrollments(updated);

        setPaymentModal(null);
        setPaymentMethod("");
        setPaymentPhone("");
        setSubmitting(false);

        toast.success("Paiement en attente de confirmation.", {
            description: `Via ${paymentMethod} (${paymentPhone})`,
            duration: 5000,
        });
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-10 w-10 text-signal animate-spin" />
            </div>
        );
    }

    if (error || !school) {
        return (
            <div className="text-center py-24">
                <Car className="h-12 w-12 text-mist/20 mx-auto mb-3" />
                <p className="text-sm text-mist/50">Auto-école introuvable</p>
                <Link href="/candidat/catalogue" className="text-xs text-signal mt-2 inline-block">← Retour au catalogue</Link>
            </div>
        );
    }

    // Données réelles de l'API (note, avis, badge vérifié) — plus de valeurs fabriquées.
    const schoolData = school;

    return (
        <PageTransition className="space-y-8">
            {/* Back link */}
            <Link href="/candidat/catalogue" className="inline-flex items-center gap-2 text-sm font-bold text-mist hover:text-signal transition-colors">
                <ArrowLeft className="h-4 w-4" /> Retour au catalogue
            </Link>

            {/* Hero */}
            <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden">
                <img src={school.imageUrl || "/hero_student_dark.png"} alt={school.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-lg">
                            <Star className="h-3.5 w-3.5 text-signal fill-signal" />
                            <span className="text-sm font-black text-white">{schoolData.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-white/50">({schoolData.reviewCount})</span>
                        </div>
                        {schoolData.isVerified && (
                            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Vérifié
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">{school.name}</h1>
                    <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-signal" /> {school.address}, {school.city}
                    </p>
                </div>
            </div>

            {/* Description */}
            {school.description && (
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                    <h2 className="text-lg font-black text-snow mb-3">À propos</h2>
                    <p className="text-sm text-mist/70 leading-relaxed">{school.description}</p>
                </div>
            )}

            {/* Offers */}
            {school.offers && school.offers.length > 0 && (
                <div>
                    <h2 className="text-xl font-black text-snow mb-4">Nos Formules</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {school.offers.map((offer: SchoolOffer) => {
                            const enrolled = isEnrolled(offer.id);
                            return (
                                <div key={offer.id} className={`bg-white/[0.03] rounded-2xl border overflow-hidden transition-all ${enrolled ? "border-green-500/20" : "border-white/[0.06] hover:border-signal/20"}`}>
                                    {offer.imageUrl && (
                                        <div className="h-32 w-full overflow-hidden">
                                            <img src={backendImageUrl(offer.imageUrl) || undefined} alt={offer.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-base font-black text-snow">{offer.title}</h3>
                                        <span className="bg-signal/10 text-signal text-[10px] font-bold px-2 py-0.5 rounded-lg">{offer.type}</span>
                                    </div>
                                    <p className="text-xs text-mist/60 mb-3">{offer.description}</p>
                                    {offer.features && (
                                        <ul className="space-y-1.5 mb-4">
                                            {offer.features.map((f: string) => (
                                                <li key={f} className="text-xs text-mist/70 flex items-center gap-2">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-signal shrink-0" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                                        <div>
                                            <span className="text-xl font-black text-signal">{new Intl.NumberFormat("fr-FR").format(offer.price)}</span>
                                            <span className="text-[10px] text-mist/40 ml-1">FCFA</span>
                                        </div>
                                        {enrolled ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-3 py-2 rounded-xl">
                                                <Check className="h-3.5 w-3.5" /> Inscrit
                                            </span>
                                        ) : (
                                            <button onClick={() => setPaymentModal(offer)}
                                                className="text-sm font-bold text-asphalt bg-signal px-5 py-2 rounded-xl hover:bg-signal/80 transition-all shadow-lg shadow-signal/20">
                                                S&apos;inscrire
                                            </button>
                                        )}
                                    </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Avis — chargés depuis l'API + formulaire conditionné à l'inscription */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-snow">Avis des élèves</h2>
                    {reviews.length > 0 && <span className="text-xs text-mist/50">{reviews.length} avis</span>}
                </div>

                {/* Dépôt d'avis : visible UNIQUEMENT si élève inscrit (en cours/validé) et pas déjà commenté */}
                {eligibility?.canReview ? (
                    <div className="bg-white/[0.03] rounded-2xl border border-signal/15 p-5 mb-4">
                        <p className="text-sm font-bold text-snow mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-signal" /> Laisser un avis
                        </p>
                        <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setReviewRating(n)}
                                    className="p-0.5 transition-transform hover:scale-110" aria-label={`${n} étoile(s)`}>
                                    <Star className={`h-6 w-6 ${n <= reviewRating ? "text-signal fill-signal" : "text-white/15"}`} />
                                </button>
                            ))}
                        </div>
                        <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Partagez votre expérience avec cette auto-école…" rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-snow text-sm placeholder:text-mist/30 focus:border-signal/30 focus:outline-none transition-all resize-none" />
                        <div className="flex justify-end mt-3">
                            <button onClick={handleSubmitReview} disabled={reviewRating < 1 || submittingReview}
                                className="flex items-center gap-2 text-sm font-bold text-asphalt bg-signal px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-signal/80 transition-all">
                                {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Publier mon avis
                            </button>
                        </div>
                    </div>
                ) : eligibility && eligibility.reason ? (
                    <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4 mb-4 flex items-center gap-2.5">
                        <Lock className="h-4 w-4 text-mist/40 shrink-0" />
                        <p className="text-xs text-mist/50">{eligibility.reason}</p>
                    </div>
                ) : null}

                {/* Liste des avis */}
                {reviews.length === 0 ? (
                    <p className="text-sm text-mist/40">Aucun avis pour le moment.</p>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-xl bg-signal/20 flex items-center justify-center text-signal font-bold text-xs">
                                            {review.userName?.charAt(0) || "?"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-snow flex items-center gap-1.5">
                                                {review.userName}
                                                {review.verified && <ShieldCheck className="h-3 w-3 text-green-400" />}
                                            </p>
                                            <p className="text-[10px] text-mist/30">{new Date(review.createdAt).toLocaleDateString("fr-FR")}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? "text-signal fill-signal" : "text-white/10"}`} />
                                        ))}
                                    </div>
                                </div>
                                {review.comment && <p className="text-xs text-mist/60">{review.comment}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {paymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-asphalt rounded-2xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Header */}
                        <div className="p-5 border-b border-white/[0.06]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-black text-snow">Inscription</h3>
                                    <p className="text-xs text-mist/50 mt-0.5">{paymentModal.title} · {new Intl.NumberFormat("fr-FR").format(paymentModal.price)} FCFA</p>
                                </div>
                                <button onClick={() => { setPaymentModal(null); setPaymentMethod(""); setPaymentPhone(""); }}
                                    className="p-1.5 rounded-lg text-mist hover:text-snow hover:bg-white/5 transition-all">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Payment methods */}
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-mist/40 uppercase tracking-wider mb-3">Moyen de paiement</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <button onClick={() => setPaymentMethod("Orange Money")}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${paymentMethod === "Orange Money" ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                                        <div className="text-2xl mb-1">🟠</div>
                                        <p className="text-xs font-bold text-snow">Orange Money</p>
                                    </button>
                                    <button onClick={() => setPaymentMethod("MTN Mobile Money")}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${paymentMethod === "MTN Mobile Money" ? "border-yellow-500 bg-yellow-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                                        <div className="text-2xl mb-1">🟡</div>
                                        <p className="text-xs font-bold text-snow">MTN MoMo</p>
                                    </button>
                                    <button onClick={() => { setPaymentMethod("Carte bancaire"); setPaymentPhone("—"); }}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${paymentMethod === "Carte bancaire" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                                        <div className="text-2xl mb-1">💳</div>
                                        <p className="text-xs font-bold text-snow">Carte</p>
                                    </button>
                                </div>
                            </div>

                            {paymentMethod && paymentMethod !== "Carte bancaire" && (
                                <div>
                                    <p className="text-xs font-bold text-mist/40 uppercase tracking-wider mb-2">Numéro de téléphone</p>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/30" />
                                        <input type="tel" placeholder="6XX XXX XXX" value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-snow text-sm placeholder:text-mist/30 focus:border-signal/30 focus:outline-none transition-all" />
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            {paymentMethod && paymentPhone && (
                                <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-mist/50">Offre</span>
                                        <span className="text-snow font-bold">{paymentModal.title}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-mist/50">Paiement via</span>
                                        <span className="text-snow font-bold">{paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-mist/50">Téléphone</span>
                                        <span className="text-snow font-bold">{paymentPhone}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                                        <span className="text-mist/50 font-bold">Total</span>
                                        <span className="text-signal font-black">{new Intl.NumberFormat("fr-FR").format(paymentModal.price)} FCFA</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-white/[0.06] flex gap-3">
                            <button onClick={() => { setPaymentModal(null); setPaymentMethod(""); setPaymentPhone(""); }}
                                className="flex-1 py-3 rounded-xl bg-white/5 text-sm font-bold text-mist hover:text-snow hover:bg-white/10 transition-all">
                                Annuler
                            </button>
                            <button onClick={handleSubmitPayment} disabled={!paymentMethod || !paymentPhone || submitting}
                                className="flex-1 py-3 rounded-xl bg-signal text-asphalt text-sm font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-signal/80 transition-all shadow-lg shadow-signal/20 flex items-center justify-center gap-2">
                                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : "Confirmer le paiement"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
