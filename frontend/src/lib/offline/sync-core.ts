/**
 * Logique pure du moteur de synchronisation — aucune dépendance au DOM ni à
 * IndexedDB, pour être testable unitairement.
 */

import type { QueuedOperation, QueueStatus } from "./db";

export const MAX_ATTEMPTS = 8;
/** Backoff progressif : 5 s, 15 s, 45 s… plafonné à 10 min. */
export function backoffDelayMs(attempts: number): number {
  return Math.min(5_000 * Math.pow(3, Math.max(0, attempts - 1)), 600_000);
}

/** Opérations à envoyer maintenant : PENDING dont l'échéance de retry est passée, par ordre de création. */
export function selectSyncable(ops: QueuedOperation[], now: number): QueuedOperation[] {
  return ops
    .filter((o) => o.status === "PENDING" && o.nextAttemptAt <= now && o.attempts < MAX_ATTEMPTS)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export interface ServerVerdict {
  opId: string;
  status: "SYNCED" | "ALREADY_PROCESSED" | "CONFLICT" | "INVALID" | "TEMPORARY_ERROR";
  message?: string;
}

/**
 * Applique le verdict serveur à une opération locale.
 * Invariants : jamais de suppression avant confirmation ; une erreur
 * transitoire re-planifie (backoff) ; un rejeu confirmé vaut succès.
 */
export function applyVerdict(op: QueuedOperation, verdict: ServerVerdict, now: number): QueuedOperation {
  switch (verdict.status) {
    case "SYNCED":
    case "ALREADY_PROCESSED":
      return { ...op, status: "SYNCED", lastError: undefined };
    case "CONFLICT":
      return { ...op, status: "CONFLICT", lastError: verdict.message };
    case "INVALID":
      return { ...op, status: "FAILED", lastError: verdict.message };
    case "TEMPORARY_ERROR": {
      const attempts = op.attempts + 1;
      const exhausted = attempts >= MAX_ATTEMPTS;
      return {
        ...op,
        status: exhausted ? "FAILED" : "PENDING",
        attempts,
        nextAttemptAt: now + backoffDelayMs(attempts),
        lastError: verdict.message ?? "Erreur temporaire",
      };
    }
  }
}

/** Après interruption (fermeture pendant l'envoi) : un SYNCING orphelin redevient PENDING. */
export function recoverInterrupted(op: QueuedOperation): QueuedOperation {
  return op.status === "SYNCING" ? { ...op, status: "PENDING" } : op;
}

export function countByStatus(ops: QueuedOperation[]): Record<QueueStatus, number> {
  const counts: Record<QueueStatus, number> = { PENDING: 0, SYNCING: 0, SYNCED: 0, FAILED: 0, CONFLICT: 0 };
  for (const op of ops) counts[op.status]++;
  return counts;
}
