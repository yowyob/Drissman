"use client";

/**
 * Lecture « Network First avec repli cache » des données métier.
 *
 * En ligne : la donnée fraîche est retournée et mise en cache (IndexedDB,
 * isolée par utilisateur). Hors ligne ou backend injoignable : repli sur le
 * dernier instantané si son TTL n'est pas dépassé. Une donnée jamais chargée
 * reste indisponible hors ligne (comportement voulu).
 */

import { offlineDb } from "./db";

/** TTL par défaut des données métier en cache : 24 h. */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export interface OfflineResult<T> {
  data: T;
  fromCache: boolean;
  cachedAt?: number;
}

export async function cachedGet<T>(
  userId: string,
  name: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<OfflineResult<T>> {
  const key = offlineDb.cacheKey(userId, name);
  try {
    const data = await fetcher();
    await offlineDb.putCache({ key, userId, data, cachedAt: Date.now() }).catch(() => {});
    return { data, fromCache: false };
  } catch (err) {
    const entry = await offlineDb.getCache<T>(key);
    if (entry && Date.now() - entry.cachedAt <= ttlMs) {
      return { data: entry.data, fromCache: true, cachedAt: entry.cachedAt };
    }
    throw err; // jamais chargée (ou périmée) : l'erreur réseau remonte
  }
}
