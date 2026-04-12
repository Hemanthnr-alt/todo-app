const CACHE_STATIC = "30-static-v4";
const CACHE_API    = "30-api-v4";

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
      Promise.all(keys.filter(k => k !== CACHE_STATIC && k !== CACHE_API).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Background timer state ─────────────────────────────────────────────────────
let timerInterval = null;
let timerState    = null;

function clearTimerInterval() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function startBackgroundTimer(state) {
  clearTimerInterval();
  timerState = { ...state, startedAt: Date.now() };

  timerInterval = setInterval(async () => {
    if (!timerState) { clearTimerInterval(); return; }

    const elapsed  = Date.now() - timerState.startedAt;
    const remaining = timerState.totalMs - elapsed;

    // Check if any client is focused — if so, let the page handle it
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const hasFocused = allClients.some(c => c.focused);
    if (hasFocused) return;

    if (remaining <= 0) {
      clearTimerInterval();
      timerState = null;
      self.registration.showNotification("⏰ " + (state.label || "Timer") + " done!", {
        body: "Your timer has finished. Tap to open the app.",
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: "timer-complete",
        requireInteraction: true,
        silent: false,
      });
    } else if (remaining <= 60000 && remaining > 59500 && !timerState._warned60) {
      timerState._warned60 = true;
      self.registration.showNotification("⏰ 1 minute left", {
        body: (state.label || "Your timer") + " finishes in 1 minute.",
        icon: "/favicon.svg",
        tag: "timer-warning",
        silent: false,
      });
    }
  }, 500);
}

// ── Message handler (page → SW) ────────────────────────────────────────────────
self.addEventListener("message", event => {
  const { type, ...data } = event.data || {};

  switch (type) {
    case "TIMER_START":
      startBackgroundTimer(data);
      break;
    case "TIMER_STOP":
    case "TIMER_PAUSE":
      clearTimerInterval();
      timerState = null;
      break;
    case "SHOW_NOTIFICATION":
      self.registration.showNotification(data.title || "Thirty", {
        body: data.body || "",
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: data.tag || "general",
        requireInteraction: data.requireInteraction || false,
      });
      break;
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
  }
});

// ── Notification click (open app) ──────────────────────────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow("/");
    })
  );
});

// ── Push notifications (web push) ─────────────────────────────────────────────
self.addEventListener("push", event => {
  const data = event.data?.json?.() || { title: "Thirty", body: "" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: "push",
    })
  );
});

// ── Fetch handler ──────────────────────────────────────────────────────────────
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

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
              cached || new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } })
            )
          )
      );
      return;
    }
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(
          JSON.stringify({ error: "offline", message: "You are offline." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

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