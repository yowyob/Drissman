"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, UserX, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { adminMonitorService, type AdminMonitorDto } from "@/lib/admin-monitor-service";

export default function MonitorsPage() {
  const { token } = useAuth();
  const [monitors, setMonitors] = useState<AdminMonitorDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreated, setShowCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState({ email: "", password: "" });

  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLicenseNumber, setFormLicenseNumber] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const filtered = useMemo(
    () =>
      monitors.filter((m) =>
        `${m.firstName} ${m.lastName} ${m.licenseNumber}`.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [monitors, searchQuery],
  );

  const resetForm = () => {
    setFormFirstName("");
    setFormLastName("");
    setFormEmail("");
    setFormPhone("");
    setFormLicenseNumber("");
    setFormPassword("");
    setShowPassword(false);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pwd = "";
    for (let i = 0; i < 10; i += 1) pwd += chars[Math.floor(Math.random() * chars.length)];
    setFormPassword(pwd);
    setShowPassword(true);
  };

  const loadMonitors = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminMonitorService.list(token);
      setMonitors(data);
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger les moniteurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMonitors();
  }, [token]);

  const handleCreate = async () => {
    if (!token) return;
    if (!formFirstName.trim() || !formLastName.trim()) return toast.error("Nom et prenom obligatoires");
    if (!formEmail.trim()) return toast.error("Email obligatoire");
    if (!formPhone.trim()) return toast.error("Telephone obligatoire");
    if (!formLicenseNumber.trim()) return toast.error("Numero de licence obligatoire");
    if (!formPassword.trim() || formPassword.length < 6) return toast.error("Mot de passe invalide");

    try {
      const created = await adminMonitorService.create(
        {
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          email: formEmail.trim(),
          phoneNumber: formPhone.trim(),
          licenseNumber: formLicenseNumber.trim(),
          password: formPassword,
        },
        token,
      );
      setMonitors((prev) => [created, ...prev]);
      setCreatedCredentials({ email: formEmail.trim(), password: formPassword });
      setShowModal(false);
      setShowCreated(true);
      resetForm();
      toast.success("Moniteur cree et compte de connexion actif");
    } catch (error: any) {
      toast.error(error.message || "Echec de creation du moniteur");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await adminMonitorService.remove(id, token);
      setMonitors((prev) => prev.filter((m) => m.id !== id));
      toast.success("Moniteur supprime");
    } catch (error: any) {
      toast.error(error.message || "Suppression impossible");
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copie");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-snow">Moniteurs</h1>
          <p className="text-sm text-mist mt-0.5">{monitors.length} moniteur{monitors.length > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-signal to-amber-400 text-asphalt font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-signal/20"
        >
          <Plus className="h-4 w-4" /> Ajouter un moniteur
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-snow placeholder:text-mist/40 focus:outline-none focus:border-signal/50 focus:ring-2 focus:ring-signal/20 transition-all text-sm"
        />
      </div>

      {loading ? (
        <div className="text-sm text-mist/60">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserX className="h-16 w-16 text-mist/15 mb-4" />
          <h3 className="text-lg font-bold text-snow/60 mb-1">Aucun moniteur</h3>
          <p className="text-sm text-mist/40 max-w-sm">Ajoutez des moniteurs pour activer leurs comptes et leurs plannings.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mon) => (
            <div key={mon.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-bold text-snow">
                {mon.firstName} {mon.lastName}
              </h3>
              <p className="text-xs text-mist/50 mt-1">Licence: {mon.licenseNumber}</p>
              <p className="text-xs text-mist/50">Telephone: {mon.phoneNumber}</p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end">
                <button
                  onClick={() => void handleDelete(mon.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-mist hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-asphalt border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black text-snow mb-5">Nouveau moniteur</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="Prenom" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
                <input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="Nom" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
              </div>
              <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="moniteur@ecole.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
              <input type="text" value={formLicenseNumber} onChange={(e) => setFormLicenseNumber(e.target.value)} placeholder="Numero de licence" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
              <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+237..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-snow text-sm"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-mist/40">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button type="button" onClick={generatePassword} className="text-[10px] text-signal font-bold">
                Generer automatiquement
              </button>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-mist text-sm font-bold">
                  Annuler
                </button>
                <button onClick={() => void handleCreate()} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-signal to-amber-400 text-asphalt text-sm font-black">
                  Creer le moniteur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreated && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreated(false)}>
          <div className="bg-asphalt border border-white/10 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-lg font-black text-snow">Compte moniteur actif</h2>
            </div>
            <div className="space-y-3 mb-5">
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 flex items-center justify-between">
                <p className="text-sm font-bold text-snow font-mono">{createdCredentials.email}</p>
                <button onClick={() => copyToClipboard(createdCredentials.email)} className="p-1.5 rounded-lg hover:bg-white/5 text-mist/40 hover:text-snow">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 flex items-center justify-between">
                <p className="text-sm font-bold text-snow font-mono">{createdCredentials.password}</p>
                <button onClick={() => copyToClipboard(createdCredentials.password)} className="p-1.5 rounded-lg hover:bg-white/5 text-mist/40 hover:text-snow">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <button onClick={() => setShowCreated(false)} className="w-full py-3 rounded-xl bg-gradient-to-r from-signal to-amber-400 text-asphalt text-sm font-black">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
