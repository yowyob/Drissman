"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { authService } from "@/lib/auth-service";

/**
 * Modale de changement de mot de passe, partagée par les profils moniteur et
 * élève. Appelle PUT /api/users/{id}/password (vérifie l'ancien mot de passe
 * côté backend). Ne stocke jamais le mot de passe.
 */
export function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const { user, token } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user?.id || !token) return toast.error("Session expirée — reconnectez-vous");
    if (next.length < 6) return toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
    if (next !== confirm) return toast.error("Les deux mots de passe ne correspondent pas");
    setSubmitting(true);
    try {
      await authService.changePassword(user.id, current, next, token);
      toast.success("Mot de passe modifié");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Échec — vérifiez votre mot de passe actuel");
    } finally {
      setSubmitting(false);
    }
  };

  const field = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm placeholder:text-mist/40";

  return createPortal(
    <div style={{ zIndex: 3000 }} className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-asphalt border border-white/10 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-lg font-black text-snow">Modifier mon mot de passe</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-mist hover:text-snow hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Mot de passe actuel" className={field} />
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Nouveau mot de passe" className={field} />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmer le nouveau mot de passe" className={field} />
          <button onClick={() => void submit()} disabled={submitting || !current || !next}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-signal to-amber-400 text-asphalt text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Modification…</> : "Confirmer"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
