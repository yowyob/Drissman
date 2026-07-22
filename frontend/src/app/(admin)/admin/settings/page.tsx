"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks";
import { Save, Building2, Phone, MapPin, Upload, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { adminOfferService, backendImageUrl } from "@/lib/admin-offer-service";

export default function SettingsPage() {
    const { user, token } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Empty defaults — will be populated from localStorage or API
    const [schoolName, setSchoolName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [region, setRegion] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Charge les paramètres réels de l'école depuis le backend.
    useEffect(() => {
        if (!user?.schoolId) return;
        void apiClient
            .get<any>(`/schools/${user.schoolId}`)
            .then((s) => {
                setSchoolName(s.name || "");
                setAddress(s.address || "");
                setCity(s.city || "");
                setRegion(s.region || "");
                setPhone(s.phone || "");
                setEmail(s.email || "");
                setWebsite(s.website || "");
                setDescription(s.description || "");
                setImageUrl(s.imageUrl || "");
            })
            .catch(() => { /* école pas encore chargée */ });
    }, [user?.schoolId]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;
        if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image"); return; }
        setUploading(true);
        try {
            const url = await adminOfferService.uploadImage(file, token);
            setImageUrl(url);
            toast.success("Image téléchargée — n'oubliez pas d'enregistrer.");
        } catch {
            toast.error("Échec de l'upload de l'image");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        if (!schoolName.trim()) { toast.error("Le nom de l'auto-école est obligatoire"); return; }
        if (!token) { toast.error("Session expirée — reconnectez-vous"); return; }
        setSaving(true);
        try {
            // Persistance réelle en base via le backend (PATCH /schools/admin).
            await apiClient.patch("/schools/admin", {
                name: schoolName, description, address, city, region, phone, email, website,
                imageUrl: imageUrl || undefined,
            }, token);
            setSaved(true);
            toast.success("Paramètres enregistrés");
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            toast.error(e.message || "Échec de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-black text-snow">Paramètres</h1>
                <p className="text-sm text-mist mt-0.5">Gérez les informations de votre auto-école</p>
            </div>

            <div className="space-y-6">
                {/* School identity */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-4">
                    <h2 className="text-sm font-bold text-snow flex items-center gap-2"><Building2 className="h-4 w-4 text-signal" /> Identité de l&apos;école</h2>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Nom de l&apos;auto-école *</label>
                        <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="Entrez le nom de votre auto-école"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow placeholder:text-mist/30 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                            placeholder="Décrivez votre auto-école en quelques lignes..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow placeholder:text-mist/30 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm resize-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-mist uppercase tracking-wider">Logo / Image</label>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-signal/30 transition-colors cursor-pointer flex flex-col items-center gap-3"
                        >
                            {backendImageUrl(imageUrl) ? (
                                <Image
                                    src={backendImageUrl(imageUrl) as string}
                                    alt="Image de l'auto-école"
                                    width={320}
                                    height={160}
                                    unoptimized
                                    className="rounded-lg object-cover max-h-40 w-auto"
                                />
                            ) : null}
                            {uploading ? (
                                <p className="text-xs text-mist/40 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Téléchargement…</p>
                            ) : (
                                <div className="py-2">
                                    <Upload className="h-6 w-6 text-mist/30 mx-auto mb-2" />
                                    <p className="text-xs text-mist/40">{backendImageUrl(imageUrl) ? "Cliquez pour changer l'image" : "Cliquez pour télécharger une image"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-4">
                    <h2 className="text-sm font-bold text-snow flex items-center gap-2"><Phone className="h-4 w-4 text-signal" /> Contact</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-xs font-bold text-mist uppercase tracking-wider">Téléphone</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow placeholder:text-mist/30 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-bold text-mist uppercase tracking-wider">E-mail</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@votre-ecole.cm"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow placeholder:text-mist/30 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" /></div>
                    </div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-mist uppercase tracking-wider">Site web</label>
                        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://votre-ecole.cm"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow placeholder:text-mist/30 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" /></div>
                </div>

                {/* Location */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-4">
                    <h2 className="text-sm font-bold text-snow flex items-center gap-2"><MapPin className="h-4 w-4 text-signal" /> Localisation</h2>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-mist uppercase tracking-wider">Adresse</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Numéro et nom de rue"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow placeholder:text-mist/30 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" /></div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-xs font-bold text-mist uppercase tracking-wider">Ville</label>
                            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Yaoundé, Douala..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow placeholder:text-mist/30 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-bold text-mist uppercase tracking-wider">Région</label>
                            <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Centre, Littoral..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow placeholder:text-mist/30 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm" /></div>
                    </div>
                </div>

                {/* Save */}
                <button onClick={handleSave} disabled={saving}
                    className={`flex items-center gap-2 font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg ${saved
                        ? "bg-green-500 text-white shadow-green-500/20"
                        : "bg-gradient-to-r from-signal to-amber-400 text-asphalt shadow-signal/20 hover:opacity-90"
                        } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}>
                    {saved ? <><CheckCircle className="h-4 w-4" /> Enregistré !</> :
                        saving ? <><span className="h-4 w-4 border-2 border-asphalt/30 border-t-asphalt rounded-full animate-spin" /> Enregistrement...</> :
                            <><Save className="h-4 w-4" /> Enregistrer les modifications</>}
                </button>
            </div>
        </div>
    );
}
