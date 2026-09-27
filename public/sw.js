/* TaskNote Plus — service worker (offline app shell, §14.1 PWA + §6.3 offline-first)
   Strategy:
   - API + auth: network only (never cached; data safety first)
   - Navigations: network-first, fall back to cached shell (works offline after first visit)
   - Static assets (_next, icons): cache-first with runtime cache
   - Mutations made offline are queued in IndexedDB by the app (see src/lib/queue.ts)
*/
const VERSION = "tnp-v1";
const SHELL = ["/", "/login", "/signup", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return; // never cache API

  // Navigations → network-first with shell fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(async () => (await caches.match(req)) ?? (await caches.match("/")) ?? new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } }))
    );
    return;
  }

  // Static assets → cache-first
  if (url.origin === self.location.origin && (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons"))) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
      )
    );
  }
});
