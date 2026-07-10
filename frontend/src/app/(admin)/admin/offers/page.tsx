"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Package, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { adminOfferService, backendImageUrl, type AdminOfferDto } from "@/lib/admin-offer-service";
import { adminModuleService, type AdminModuleDto } from "@/lib/admin-module-service";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}

export default function OffersPage() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<AdminOfferDto[]>([]);
  const [modules, setModules] = useState<AdminModuleDto[]>([]);
  const [offerModules, setOfferModules] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [formHours, setFormHours] = useState(20);
  const [formPermit, setFormPermit] = useState("B");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  const filteredOffers = useMemo(
    () => offers.filter((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [offers, searchQuery],
  );

  const load = async () => {
    if (!token) return;
    try {
      const [offersData, modulesData] = await Promise.all([
        adminOfferService.list(token),
        adminModuleService.list(token),
      ]);
      setOffers(offersData);
      setModules(modulesData);

      const mappings = await Promise.all(
        offersData.map(async (offer) => {
          const links = await adminOfferService.getModules(offer.id, token);
          return [offer.id, links.map((l) => l.moduleId)] as const;
        }),
      );
      setOfferModules(Object.fromEntries(mappings));
    } catch (error) {
      console.error(error);
      toast.error("Chargement des offres impossible");
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormPrice(0);
    setFormHours(20);
    setFormPermit("B");
    setFormImageUrl("");
    setSelectedModuleIds([]);
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) return toast.error("Choisissez une image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image trop lourde (5 Mo max)");
    setUploadingImage(true);
    try {
      const url = await adminOfferService.uploadImage(file, token);
      setFormImageUrl(url);
      toast.success("Image ajoutée (archivée dans le kernel)");
    } catch (error: any) {
      toast.error(error.message || "Échec de l'upload");
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
    );
  };

  const handleCreate = async () => {
    if (!token) return;
    if (!formName.trim()) return toast.error("Nom obligatoire");
    if (formPrice <= 0) return toast.error("Prix invalide");
    if (formHours <= 0) return toast.error("Heures invalides");

    try {
      const created = await adminOfferService.create(
        {
          name: formName.trim(),
          description: formDesc.trim(),
          price: formPrice,
          hours: formHours,
          permitType: formPermit,
          imageUrl: formImageUrl || undefined,
        },
        token,
      );
      if (selectedModuleIds.length > 0) {
        await adminOfferService.setModules(created.id, selectedModuleIds, token);
      }
      setOffers((prev) => [created, ...prev]);
      setOfferModules((prev) => ({ ...prev, [created.id]: selectedModuleIds }));
      setShowModal(false);
      resetForm();
      toast.success("Offre creee");
    } catch (error) {
      console.error(error);
      toast.error("Creation impossible");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await adminOfferService.remove(id, token);
      setOffers((prev) => prev.filter((o) => o.id !== id));
      setOfferModules((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Offre supprimee");
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-snow">Offres & Formules</h1>
          <p className="text-sm text-mist mt-0.5">{offers.length} offre(s)</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-signal to-amber-400 text-asphalt font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-signal/20"
        >
          <Plus className="h-4 w-4" /> Nouvelle offre
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une offre..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-snow placeholder:text-mist/40 text-sm"
        />
      </div>

      {filteredOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-16 w-16 text-mist/15 mb-4" />
          <h3 className="text-lg font-bold text-snow/60 mb-1">Aucune offre</h3>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden hover:border-white/10 transition-all">
              <div className="relative h-28 bg-gradient-to-br from-signal/5 to-blue-500/5 flex items-center justify-center overflow-hidden">
                {offer.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={backendImageUrl(offer.imageUrl) || undefined} alt={offer.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{offer.permitType === "A" ? "🏍️" : offer.permitType === "C" ? "🚛" : "🚗"}</span>
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase">Actif</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-snow mb-1 truncate">{offer.name}</h3>
                <p className="text-xs text-mist/60 line-clamp-2 mb-3">{offer.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-signal">{formatPrice(offer.price)}</span>
                    <span className="text-[10px] text-mist/40 ml-1">FCFA</span>
                  </div>
                  <div className="text-[10px] text-mist/50">
                    {offer.hours}h · {offerModules[offer.id]?.length || 0} module(s)
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <button onClick={() => void handleDelete(offer.id)} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-red-500/10 text-mist hover:text-red-400 text-xs font-bold transition-all">
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-asphalt border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-snow">Nouvelle Offre</h2>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nom" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm resize-none" />

            {/* Image de présentation du cours */}
            <label className={`relative flex items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${formImageUrl ? "border-signal/40" : "border-white/10 hover:border-white/25"}`}>
              {formImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={backendImageUrl(formImageUrl) || undefined} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover" />
              ) : uploadingImage ? (
                <span className="flex items-center gap-2 text-xs text-mist/60"><Loader2 className="h-4 w-4 animate-spin" /> Upload en cours...</span>
              ) : (
                <span className="flex items-center gap-2 text-xs text-mist/60"><ImagePlus className="h-4 w-4" /> Ajouter une image de présentation</span>
              )}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                onChange={(e) => void handleImageUpload(e.target.files?.[0])} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={formPrice || ""} onChange={(e) => setFormPrice(parseInt(e.target.value, 10) || 0)} placeholder="Prix" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
              <input type="number" value={formHours || ""} onChange={(e) => setFormHours(parseInt(e.target.value, 10) || 0)} placeholder="Heures" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
            </div>
            <select value={formPermit} onChange={(e) => setFormPermit(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm">
              <option value="A" className="bg-asphalt">Permis A</option>
              <option value="B" className="bg-asphalt">Permis B</option>
              <option value="C" className="bg-asphalt">Permis C</option>
            </select>

            <div className="space-y-2">
              <p className="text-xs font-bold text-mist/40 uppercase tracking-wider">Modules de l&apos;offre</p>
              {modules.map((mod) => {
                const checked = selectedModuleIds.includes(mod.id);
                return (
                  <label key={mod.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "bg-signal/5 border-signal/30" : "bg-white/[0.02] border-white/[0.04]"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleModule(mod.id)} />
                    <span className="text-sm text-snow flex-1">{mod.name}</span>
                    <span className="text-xs text-mist/50">{mod.requiredHours}h</span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-mist text-sm font-bold">Annuler</button>
              <button onClick={() => void handleCreate()} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-signal to-amber-400 text-asphalt text-sm font-black">
                Creer l&apos;offre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
