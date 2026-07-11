import { describe, it, expect } from "vitest";
import {
  applyVerdict,
  backoffDelayMs,
  countByStatus,
  MAX_ATTEMPTS,
  recoverInterrupted,
  selectSyncable,
} from "./sync-core";
import type { QueuedOperation } from "./db";

const base = (over: Partial<QueuedOperation> = {}): QueuedOperation => ({
  opId: "op-1",
  type: "SESSION_COMPLETE",
  payload: { sessionId: "s1" },
  userId: "u1",
  createdAt: 1000,
  status: "PENDING",
  attempts: 0,
  nextAttemptAt: 0,
  ...over,
});

describe("selectSyncable — ordre et éligibilité", () => {
  it("retourne les PENDING échus, triés par date de création", () => {
    const ops = [
      base({ opId: "b", createdAt: 2000 }),
      base({ opId: "a", createdAt: 1000 }),
      base({ opId: "later", nextAttemptAt: 99999 }), // backoff non échu
      base({ opId: "done", status: "SYNCED" }),
      base({ opId: "exhausted", attempts: MAX_ATTEMPTS }),
    ];
    expect(selectSyncable(ops, 5000).map((o) => o.opId)).toEqual(["a", "b"]);
  });
});

describe("applyVerdict — transitions de statut", () => {
  it("SYNCED et ALREADY_PROCESSED valent tous deux succès (pas de doublon au rejeu)", () => {
    expect(applyVerdict(base(), { opId: "op-1", status: "SYNCED" }, 0).status).toBe("SYNCED");
    expect(applyVerdict(base(), { opId: "op-1", status: "ALREADY_PROCESSED" }, 0).status).toBe("SYNCED");
  });

  it("CONFLICT est signalé sans suppression de l'action locale", () => {
    const r = applyVerdict(base(), { opId: "op-1", status: "CONFLICT", message: "déjà validée" }, 0);
    expect(r.status).toBe("CONFLICT");
    expect(r.lastError).toBe("déjà validée");
  });

  it("INVALID passe en FAILED définitif", () => {
    expect(applyVerdict(base(), { opId: "op-1", status: "INVALID" }, 0).status).toBe("FAILED");
  });

  it("TEMPORARY_ERROR re-planifie avec backoff progressif", () => {
    const now = 10_000;
    const r = applyVerdict(base(), { opId: "op-1", status: "TEMPORARY_ERROR" }, now);
    expect(r.status).toBe("PENDING");
    expect(r.attempts).toBe(1);
    expect(r.nextAttemptAt).toBe(now + backoffDelayMs(1));
  });

  it("TEMPORARY_ERROR épuise les tentatives puis passe en FAILED", () => {
    const r = applyVerdict(base({ attempts: MAX_ATTEMPTS - 1 }), { opId: "op-1", status: "TEMPORARY_ERROR" }, 0);
    expect(r.status).toBe("FAILED");
  });
});

describe("backoffDelayMs — délai progressif plafonné", () => {
  it("croît puis plafonne à 10 minutes", () => {
    expect(backoffDelayMs(1)).toBe(5_000);
    expect(backoffDelayMs(2)).toBe(15_000);
    expect(backoffDelayMs(3)).toBe(45_000);
    expect(backoffDelayMs(10)).toBe(600_000);
  });
});

describe("recoverInterrupted — reprise après interruption", () => {
  it("un SYNCING orphelin redevient PENDING, les autres statuts sont inchangés", () => {
    expect(recoverInterrupted(base({ status: "SYNCING" })).status).toBe("PENDING");
    expect(recoverInterrupted(base({ status: "SYNCED" })).status).toBe("SYNCED");
  });
});

describe("countByStatus — indicateurs de la barre hors ligne", () => {
  it("compte chaque statut", () => {
    const counts = countByStatus([base(), base({ status: "CONFLICT" }), base({ status: "SYNCED" })]);
    expect(counts.PENDING).toBe(1);
    expect(counts.CONFLICT).toBe(1);
    expect(counts.SYNCED).toBe(1);
  });
});
