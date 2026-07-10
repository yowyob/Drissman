"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Calendar, Users, BookOpen, ChevronDown, ChevronUp, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { trainingPeriodService, type TrainingPeriodViewDto } from "@/lib/training-period-service";
import { adminOfferService, type AdminOfferDto } from "@/lib/admin-offer-service";

const statusConfig: Record<string, { label: string; class: string }> = {
  DRAFT: { label: "Brouillon", class: "bg-gray-500/10 text-gray-400" },
  PUBLISHED: { label: "Publiee", class: "bg-green-500/10 text-green-400" },
  IN_PROGRESS: { label: "En cours", class: "bg-signal/10 text-signal" },
  COMPLETED: { label: "Terminee", class: "bg-blue-500/10 text-blue-400" },
  CANCELLED: { label: "Annulee", class: "bg-red-500/10 text-red-400" },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

const emptyForm = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  enrollmentDeadline: "",
  maxStudents: 30,
  selectedOfferIds: [] as string[],
};

export default function SessionsPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<TrainingPeriodViewDto[]>([]);
  const [offers, setOffers] = useState<AdminOfferDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [sessionsData, offersData] = await Promise.all([
        trainingPeriodService.list(token),
        adminOfferService.list(token),
      ]);
      setSessions(sessionsData);
      setOffers(offersData);
    } catch (error) {
      console.error(error);
      toast.error("Chargement des sessions impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const filtered = useMemo(
    () => sessions.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [sessions, searchQuery],
  );

  const handleCreate = async () => {
    if (!token) return;
    if (!form.name.trim()) return toast.error("Nom obligatoire");
    if (!form.startDate || !form.endDate) return toast.error("Dates obligatoires");
    if (form.selectedOfferIds.length === 0) return toast.error("Selectionnez au moins une offre");

    try {
      const created = await trainingPeriodService.create(
        {
          name: form.name.trim(),
          description: form.description.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          enrollmentDeadline: form.enrollmentDeadline || form.startDate,
          maxStudents: form.maxStudents,
          offerIds: form.selectedOfferIds,
        },
        token,
      );
      setSessions((prev) => [created, ...prev]);
      setForm(emptyForm);
      setShowModal(false);
      setExpandedId(created.id);
      toast.success("Session creee");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Creation impossible");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    const session = sessions.find((s) => s.id === id);
    if (session && session.totalEnrolled > 0) return toast.error("Impossible de supprimer une session avec des inscrits");
    try {
      await trainingPeriodService.remove(id, token);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session supprimee");
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible");
    }
  };

  const handlePublish = async (id: string) => {
    if (!token) return;
    try {
      const updated = await trainingPeriodService.updateStatus(id, "PUBLISHED", token);
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success("Session publiee");
    } catch (error) {
      console.error(error);
      toast.error("Publication impossible");
    }
  };

  const toggleFormation = (offerId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedOfferIds: prev.selectedOfferIds.includes(offerId)
        ? prev.selectedOfferIds.filter((id) => id !== offerId)
        : [...prev.selectedOfferIds, offerId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-snow">Sessions de Formation</h1>
          <p className="text-sm text-mist mt-0.5">{sessions.length} session(s)</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-signal to-amber-400 text-asphalt font-black px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-signal/20">
          <Plus className="h-4 w-4" /> Nouvelle Session
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/40" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher une session..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-snow placeholder:text-mist/40 text-sm" />
      </div>

      {loading ? (
        <p className="text-sm text-mist/60">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-16 w-16 text-mist/15 mb-4" />
          <h3 className="text-lg font-bold text-snow/60 mb-1">Aucune session</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((session) => {
            const st = statusConfig[session.status] || statusConfig.DRAFT;
            const isExpanded = expandedId === session.id;
            const fillPct = session.maxStudents > 0 ? Math.round((session.totalEnrolled / session.maxStudents) * 100) : 0;

            return (
              <div key={session.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden hover:border-white/10 transition-all">
                <button onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full text-left p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-black text-snow truncate">{session.name}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${st.class}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-mist/50 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(session.startDate).toLocaleDateString("fr-FR")} → {new Date(session.endDate).toLocaleDateString("fr-FR")}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{session.formations.length} formation(s)</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{session.totalEnrolled}/{session.maxStudents} inscrits</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="h-2 w-20 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${fillPct >= 90 ? "bg-red-400" : fillPct >= 60 ? "bg-signal" : "bg-blue-400"}`} style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className="text-xs text-mist/40 font-mono">{fillPct}%</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-mist/40 shrink-0" /> : <ChevronDown className="h-4 w-4 text-mist/40 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/[0.06] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-mist/40 uppercase tracking-wider">Formations proposees</h3>
                      <div className="flex gap-1">
                        {session.status === "DRAFT" && (
                          <button onClick={() => void handlePublish(session.id)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-400 transition-all" title="Publier">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => void handleDelete(session.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-mist/40 hover:text-red-400 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {session.formations.map((f) => (
                        <div key={f.offerId} className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4 flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-signal/10 to-blue-500/10 flex items-center justify-center text-lg shrink-0">
                            {f.permitType === "A" ? "🏍️" : f.permitType === "B" ? "🚗" : "🚛"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-snow">{f.offerName}</p>
                            <p className="text-xs text-mist/40">Permis {f.permitType}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-signal">{formatCurrency(f.price)} F</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-asphalt border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-snow">Nouvelle Session de Formation</h2>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nom de la session" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
            <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
              <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={form.enrollmentDeadline} onChange={(e) => setForm((p) => ({ ...p, enrollmentDeadline: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
              <input type="number" value={form.maxStudents} onChange={(e) => setForm((p) => ({ ...p, maxStudents: parseInt(e.target.value, 10) || 30 }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-mist uppercase tracking-wider">Formations incluses *</label>
              <div className="space-y-2">
                {offers.map((offer) => {
                  const checked = form.selectedOfferIds.includes(offer.id);
                  return (
                    <label key={offer.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "bg-signal/5 border-signal/30" : "bg-white/[0.02] border-white/[0.04] hover:border-signal/20"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleFormation(offer.id)} />
                      <span className="text-sm text-snow flex-1">{offer.name}</span>
                      <span className="text-xs font-bold text-signal">{formatCurrency(offer.price)} F</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-mist text-sm font-bold">Annuler</button>
              <button onClick={() => void handleCreate()} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-signal to-amber-400 text-asphalt text-sm font-black">Creer la session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
