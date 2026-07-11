"use client";

/**
 * Moteur de synchronisation : envoie les opérations en attente au backend
 * (POST /api/sync/batch), applique les verdicts, gère le retry progressif et
 * la reprise après interruption. Déclenché automatiquement au retour du réseau
 * et disponible en commande manuelle depuis la barre hors ligne.
 */

import { offlineDb, type QueuedOperation } from "./db";
import { applyVerdict, recoverInterrupted, selectSyncable, type ServerVerdict } from "./sync-core";
import { notifyBackendState } from "./network";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const BATCH_SIZE = 25;

export interface SyncOutcome {
  sent: number;
  synced: number;
  conflicts: number;
  failed: number;
  sessionExpired: boolean;
}

let running = false;
const changeListeners = new Set<() => void>();

export function onQueueChange(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}
function emitChange() {
  changeListeners.forEach((l) => l());
}

export async function enqueue(
  op: Omit<QueuedOperation, "opId" | "status" | "attempts" | "nextAttemptAt" | "createdAt">,
): Promise<QueuedOperation> {
  const queued: QueuedOperation = {
    ...op,
    opId: crypto.randomUUID(),
    createdAt: Date.now(),
    status: "PENDING",
    attempts: 0,
    nextAttemptAt: 0,
  };
  await offlineDb.putOp(queued);
  emitChange();
  return queued;
}

export async function listOps(userId: string): Promise<QueuedOperation[]> {
  return offlineDb.getOps(userId);
}

export async function dismissOp(opId: string): Promise<void> {
  await offlineDb.deleteOp(opId);
  emitChange();
}

/**
 * Lance une passe de synchronisation. Sans effet si déjà en cours (verrou),
 * si aucune opération n'est éligible, ou si la session a expiré (401 → l'appelant
 * doit demander une ré-authentification, la file reste intacte).
 */
export async function runSync(userId: string, token: string): Promise<SyncOutcome> {
  const outcome: SyncOutcome = { sent: 0, synced: 0, conflicts: 0, failed: 0, sessionExpired: false };
  if (running || !token) return outcome;
  running = true;
  try {
    // Reprise : les SYNCING orphelins d'une session interrompue redeviennent PENDING.
    const all = await offlineDb.getOps(userId);
    for (const op of all) {
      const recovered = recoverInterrupted(op);
      if (recovered !== op) await offlineDb.putOp(recovered);
    }

    const now = Date.now();
    const toSend = selectSyncable(await offlineDb.getOps(userId), now).filter(
      (o) => o.type !== "FORM_DRAFT", // les brouillons restent locaux
    );
    if (toSend.length === 0) return outcome;

    for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
      const batch = toSend.slice(i, i + BATCH_SIZE);
      for (const op of batch) await offlineDb.putOp({ ...op, status: "SYNCING" });
      emitChange();

      let verdicts: ServerVerdict[];
      try {
        const res = await fetch(`${API_BASE_URL}/sync/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            operations: batch.map((o) => ({
              opId: o.opId,
              type: o.type,
              createdAt: new Date(o.createdAt).toISOString(),
              payload: o.payload,
            })),
          }),
        });
        if (res.status === 401) {
          // Session expirée : on rend les opérations à la file et on s'arrête.
          for (const op of batch) await offlineDb.putOp({ ...op, status: "PENDING" });
          outcome.sessionExpired = true;
          emitChange();
          return outcome;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        verdicts = await res.json();
        notifyBackendState(true);
      } catch {
        // Backend injoignable : tout le lot repart en attente avec backoff.
        const ts = Date.now();
        for (const op of batch) {
          await offlineDb.putOp(applyVerdict({ ...op, status: "SYNCING" }, { opId: op.opId, status: "TEMPORARY_ERROR", message: "Backend injoignable" }, ts));
        }
        notifyBackendState(false);
        emitChange();
        return outcome;
      }

      const ts = Date.now();
      for (const op of batch) {
        const verdict = verdicts.find((v) => v.opId === op.opId) ?? {
          opId: op.opId,
          status: "TEMPORARY_ERROR" as const,
          message: "Réponse serveur incomplète",
        };
        const updated = applyVerdict({ ...op, status: "SYNCING" }, verdict, ts);
        await offlineDb.putOp(updated);
        outcome.sent++;
        if (updated.status === "SYNCED") outcome.synced++;
        else if (updated.status === "CONFLICT") outcome.conflicts++;
        else if (updated.status === "FAILED") outcome.failed++;
      }
      emitChange();
    }
    return outcome;
  } finally {
    running = false;
  }
}
