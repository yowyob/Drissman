"use client";

/**
 * Barre d'état du mode hors ligne (espace moniteur) :
 * état réseau, opérations en attente / synchronisées / en échec / en conflit,
 * synchronisation manuelle, et purge d'un conflit après lecture.
 */

import { useCallback, useEffect, useState } from "react";
import { CloudOff, RefreshCw, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { useNetworkStatus } from "@/lib/offline/network";
import { listOps, runSync, dismissOp, onQueueChange } from "@/lib/offline/sync";
import { countByStatus } from "@/lib/offline/sync-core";
import type { QueuedOperation } from "@/lib/offline/db";

export function OfflineBar() {
  const { user, token } = useAuth();
  const online = useNetworkStatus();
  const [ops, setOps] = useState<QueuedOperation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const refresh = useCallback(async () => {
    if (user?.id) setOps(await listOps(user.id));
  }, [user?.id]);

  useEffect(() => {
    void refresh();
    return onQueueChange(() => void refresh());
  }, [refresh]);

  const doSync = useCallback(async () => {
    if (!user?.id || !token || syncing) return;
    setSyncing(true);
    try {
      const r = await runSync(user.id, token);
      if (r.sessionExpired) {
        toast.error("Session expirée — reconnectez-vous pour synchroniser vos saisies (elles sont conservées).");
      } else if (r.synced > 0 || r.conflicts > 0 || r.failed > 0) {
        toast.info(`Synchronisation : ${r.synced} envoyée(s)${r.conflicts ? `, ${r.conflicts} conflit(s)` : ""}${r.failed ? `, ${r.failed} rejetée(s)` : ""}`);
      }
    } finally {
      setSyncing(false);
    }
  }, [user?.id, token, syncing]);

  // Synchronisation automatique au retour du réseau.
  useEffect(() => {
    if (online) void doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const counts = countByStatus(ops);
  const attention = counts.PENDING + counts.CONFLICT + counts.FAILED;
  if (online && attention === 0) return null;

  return (
    <div className="sticky top-0 z-40">
      <div
        className={`flex items-center gap-3 px-4 py-2 text-xs font-bold ${
          online ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"
        }`}
      >
        {online ? <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> : <CloudOff className="h-3.5 w-3.5" />}
        <span>
          {online ? "En ligne" : "Mode hors ligne — vos saisies sont enregistrées localement"}
          {counts.PENDING > 0 && ` · ${counts.PENDING} en attente`}
          {counts.CONFLICT > 0 && ` · ${counts.CONFLICT} conflit(s)`}
          {counts.FAILED > 0 && ` · ${counts.FAILED} rejetée(s)`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {attention > 0 && (
            <button onClick={() => setShowDetails((v) => !v)} className="underline underline-offset-2">
              Détails
            </button>
          )}
          {online && counts.PENDING > 0 && (
            <button
              onClick={() => void doSync()}
              disabled={syncing}
              className="rounded-lg bg-white/10 px-2.5 py-1 hover:bg-white/20 disabled:opacity-50"
            >
              Synchroniser
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="max-h-56 overflow-y-auto border-b border-white/10 bg-black/60 px-4 py-2 backdrop-blur">
          {ops
            .filter((o) => o.status !== "SYNCED")
            .map((o) => (
              <div key={o.opId} className="flex items-center gap-2 py-1 text-xs text-white/80">
                {o.status === "CONFLICT" || o.status === "FAILED" ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-white/30" />
                )}
                <span className="truncate">
                  {o.label || o.type} — {o.status === "PENDING" ? "en attente" : o.status === "CONFLICT" ? `conflit : ${o.lastError}` : o.status === "FAILED" ? `rejetée : ${o.lastError}` : "envoi…"}
                </span>
                {(o.status === "CONFLICT" || o.status === "FAILED") && (
                  <button
                    onClick={() => void dismissOp(o.opId)}
                    title="Retirer de la liste"
                    className="ml-auto rounded p-0.5 hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
