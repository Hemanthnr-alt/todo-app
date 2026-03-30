const CACHE_STATIC = "30-static-v3";
const CACHE_API    = "30-api-v3";

const STATIC_ASSETS = ["/", "/index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_API)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // ── API calls (Render backend) ──
  if (url.hostname.includes("onrender.com")) {
    if (e.request.method === "GET") {
      e.respondWith(
        fetch(e.request.clone())
          .then(res => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_API).then(c => c.put(e.request, clone));
            }
            return res;
          })
          .catch(() =>
            caches.match(e.request).then(cached =>
              cached || new Response(
                JSON.stringify([]),
                { headers: { "Content-Type": "application/json" } }
              )
            )
          )
      );
      return;
    }

    // POST/PUT/DELETE while offline
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(
          JSON.stringify({ error: "offline", message: "You are offline. Please try again when connected." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  // ── Static assets ──
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request)
        .then(res => {
          if (res.ok && e.request.method === "GET") {
            const clone = res.clone();
            caches.open(CACHE_STATIC).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match("/index.html"))
    )
  );
});