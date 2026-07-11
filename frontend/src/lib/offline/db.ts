/**
 * Accès IndexedDB du mode hors ligne (aucune dépendance externe).
 *
 * Deux magasins :
 *  - "cache"  : données métier consultables hors ligne (clé = userId::nom),
 *               avec date de mise en cache pour appliquer un TTL.
 *  - "queue"  : opérations créées hors ligne, en attente de synchronisation
 *               (clé = opId, UUID client servant de clé d'idempotence).
 *
 * Les données sont isolées par utilisateur (préfixe userId) et purgées à la
 * déconnexion ou au changement de compte. Aucune donnée n'est stockée dans
 * localStorage. Les jetons/secrets ne transitent jamais par ces magasins.
 */

const DB_NAME = "drissman-offline";
const DB_VERSION = 1;

export interface CacheEntry<T = unknown> {
  key: string; // `${userId}::${name}`
  userId: string;
  schoolId?: string | null;
  data: T;
  cachedAt: number; // epoch ms
}

export type QueueStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED" | "CONFLICT";

export interface QueuedOperation {
  opId: string; // UUID client = clé d'idempotence
  type: "SESSION_COMPLETE" | "VEHICLE_POSITION" | "FORM_DRAFT";
  payload: Record<string, unknown>;
  userId: string;
  schoolId?: string | null;
  createdAt: number;
  status: QueueStatus;
  attempts: number;
  nextAttemptAt: number; // epoch ms — backoff progressif
  lastError?: string;
  /** Libellé court pour l'affichage (« Validation séance du 12/07 »). */
  label?: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("queue")) {
        const q = db.createObjectStore("queue", { keyPath: "opId" });
        q.createIndex("byUser", "userId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

// ----- Cache de données métier -----

export const offlineDb = {
  cacheKey: (userId: string, name: string) => `${userId}::${name}`,

  async putCache<T>(entry: CacheEntry<T>): Promise<void> {
    await tx("cache", "readwrite", (s) => s.put(entry));
  },

  async getCache<T>(key: string): Promise<CacheEntry<T> | undefined> {
    return tx<CacheEntry<T> | undefined>("cache", "readonly", (s) => s.get(key) as IDBRequest<CacheEntry<T> | undefined>);
  },

  // ----- File d'attente -----

  async putOp(op: QueuedOperation): Promise<void> {
    await tx("queue", "readwrite", (s) => s.put(op));
  },

  async getOps(userId: string): Promise<QueuedOperation[]> {
    const all = await tx<QueuedOperation[]>("queue", "readonly", (s) => s.getAll() as IDBRequest<QueuedOperation[]>);
    return all.filter((o) => o.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
  },

  async deleteOp(opId: string): Promise<void> {
    await tx("queue", "readwrite", (s) => s.delete(opId));
  },

  /** Purge complète des données privées d'un utilisateur (déconnexion). */
  async purgeUser(userId: string): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(["cache", "queue"], "readwrite");
      const cache = t.objectStore("cache");
      const cacheReq = cache.getAllKeys();
      cacheReq.onsuccess = () => {
        for (const k of cacheReq.result) {
          if (typeof k === "string" && k.startsWith(`${userId}::`)) cache.delete(k);
        }
      };
      const queue = t.objectStore("queue");
      const qReq = queue.getAll();
      qReq.onsuccess = () => {
        for (const op of qReq.result as QueuedOperation[]) {
          if (op.userId === userId) queue.delete(op.opId);
        }
      };
      t.oncomplete = () => {
        db.close();
        resolve();
      };
      t.onerror = () => reject(t.error);
    });
  },
};
