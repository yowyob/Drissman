/**
 * Service Worker Drissman — shell applicatif uniquement.
 *
 * Stratégies :
 *  - ressources statiques (JS/CSS/images/fonts) : Cache First ;
 *  - navigations : Network First avec repli sur le shell mis en cache ;
 *  - les DONNÉES MÉTIER ne passent PAS par ce cache : elles sont gérées en
 *    IndexedDB par l'application (isolation par utilisateur, TTL, purge à la
 *    déconnexion) ;
 *  - jamais de mise en cache : requêtes non-GET, /api/auth, /api/payments,
 *    /api/sync, ni aucune réponse d'API (jetons, données sensibles).
 */

const VERSION = "drissman-sw-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

const NEVER_CACHE = [/\/api\//];
const STATIC_DEST = ["style", "script", "image", "font"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(PAGE_CACHE).then((c) => c.addAll(["/"]).catch(() => {})));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((re) => re.test(url.pathname))) return;

  // Statique : Cache First.
  if (STATIC_DEST.includes(req.destination)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Navigation : Network First, repli sur la page en cache puis sur le shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
    );
  }
});
