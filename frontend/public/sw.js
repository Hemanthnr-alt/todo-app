/**
 * sw.js — Service Worker for Thirty
 * Handles: caching, background timer, push notifications, scheduled reminders
 *
 * For Android PWA (non-Capacitor): notifications show in the real Android
 * notification bar via showNotification() when the app is in background.
 * For Capacitor APK: the native @capacitor/local-notifications handles this.
 */

const CACHE_STATIC = "30-static-v5";
const CACHE_API    = "30-api-v5";
const STATIC_ASSETS = ["/", "/index.html"];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
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

// ── Background timer state ────────────────────────────────────────────────────
let timerInterval = null;
let timerState    = null;

function clearTimerInterval() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function formatTime(ms) {
  if (ms <= 0) return "0:00";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function startBackgroundTimer(state) {
  clearTimerInterval();
  timerState = { ...state, startedAt: Date.now() };

  timerInterval = setInterval(async () => {
    if (!timerState) { clearTimerInterval(); return; }

    const elapsed   = Date.now() - timerState.startedAt;
    const remaining = timerState.totalMs - elapsed;

    // Check if any client window is focused
    const allClients = await self.clients.matchAll({ type:"window", includeUncontrolled:true });
    const hasFocused = allClients.some(c => c.focused);

    // Show persistent "Timer running" notification in status bar when app is backgrounded
    if (!hasFocused && remaining > 0) {
      // Update the ongoing timer notification every 5 seconds
      const secElapsed = Math.floor(elapsed / 1000);
      if (secElapsed % 5 === 0) {
        try {
          await self.registration.showNotification(
            `⏱ ${state.label || "Timer"} — ${formatTime(remaining)} left`, {
              body:              "Tap to return to the app",
              icon:              "/favicon.svg",
              badge:             "/favicon.svg",
              tag:               "timer-running",   // same tag = replaces previous
              renotify:          false,
              silent:            true,               // no sound on every update
              requireInteraction:false,
              data:              { type:"timer", remaining },
            }
          );
        } catch {}
      }
    }

    if (remaining <= 0) {
      clearTimerInterval();
      timerState = null;
      // Close the "running" notification
      const notifs = await self.registration.getNotifications({ tag:"timer-running" });
      notifs.forEach(n => n.close());
      // Show completion notification
      self.registration.showNotification(
        `✅ ${state.label || "Timer"} complete!`, {
          body:               "Your timer has finished. Tap to open the app.",
          icon:               "/favicon.svg",
          badge:              "/favicon.svg",
          tag:                "timer-complete",
          requireInteraction: true,
          vibrate:            [200, 100, 200, 100, 200],
          silent:             false,
          data:               { type:"timer_done" },
        }
      );
    } else if (remaining <= 60000 && remaining > 59500 && !timerState._warned60) {
      timerState._warned60 = true;
      self.registration.showNotification("⏰ 1 minute left", {
        body:    `${state.label || "Your timer"} finishes in 1 minute.`,
        icon:    "/favicon.svg",
        badge:   "/favicon.svg",
        tag:     "timer-warning",
        vibrate: [100, 50, 100],
        silent:  false,
      });
    }
  }, 1000);
}

// ── Message handler (page → SW) ───────────────────────────────────────────────
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
      // Remove the running timer notification from status bar
      self.registration.getNotifications({ tag:"timer-running" })
        .then(notifs => notifs.forEach(n => n.close()))
        .catch(() => {});
      break;

    case "SHOW_NOTIFICATION":
      // Called from sendNotification() when on web/PWA
      self.registration.showNotification(data.title || "Thirty", {
        body:               data.body      || "",
        icon:               "/favicon.svg",
        badge:              "/favicon.svg",
        tag:                data.tag       || "general",
        requireInteraction: data.requireInteraction || false,
        vibrate:            [100, 50, 100],
        data:               { type: data.tag || "general" },
      });
      break;

    case "SCHEDULE_REMINDER":
      // Called from the web app to schedule a future notification via SW
      // (only works while SW is alive — for reliable scheduling use native)
      {
        const delay = data.at ? new Date(data.at).getTime() - Date.now() : 0;
        if (delay > 0) {
          setTimeout(() => {
            self.registration.showNotification(data.title || "Reminder", {
              body:    data.body  || "",
              icon:    "/favicon.svg",
              badge:   "/favicon.svg",
              tag:     data.tag   || "reminder",
              vibrate: [200, 100, 200],
              data:    data.extra || {},
            });
          }, delay);
        }
      }
      break;

    case "SKIP_WAITING":
      self.skipWaiting();
      break;
  }
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const data = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type:"window", includeUncontrolled:true }).then(clients => {
      // Find an existing app window and focus it
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        // Tell the page which section to navigate to
        if (data.type) {
          existing.postMessage({ type:"NOTIFICATION_TAP", data });
        }
        return;
      }
      // No window open — open a new one
      return self.clients.openWindow("/");
    })
  );
});

// ── Push notifications (server-sent) ─────────────────────────────────────────
self.addEventListener("push", event => {
  const payload = event.data?.json?.() || { title:"Thirty", body:"" };
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:    payload.body,
      icon:    "/favicon.svg",
      badge:   "/favicon.svg",
      tag:     payload.tag || "push",
      vibrate: [200, 100, 200],
      data:    payload.data || {},
    })
  );
});

// ── Fetch handler (network-first for API, cache-first for assets) ─────────────
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // API calls — network first, fall back to cache
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
                { headers: { "Content-Type":"application/json" } }
              )
            )
          )
      );
      return;
    }
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(
          JSON.stringify({ error:"offline", message:"You are offline." }),
          { status:503, headers:{ "Content-Type":"application/json" } }
        )
      )
    );
    return;
  }

  // Static assets — cache first, fall back to network
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