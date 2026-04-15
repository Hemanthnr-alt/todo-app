/**
 * notifications.js — Full Android + Web notification system
 *
 * Android (Capacitor native):
 *  - Uses @capacitor/local-notifications for real system notifications
 *  - Shows in status bar with app icon, sound, vibration
 *  - Habit reminders scheduled at exact times daily
 *  - Task due-today reminders at 9 AM
 *  - Timer countdowns shown as ongoing notifications
 *  - Persists across reboots (BOOT_COMPLETED receiver in manifest)
 *
 * Web / PWA:
 *  - Uses Service Worker showNotification for background notifications
 *  - Falls back to Notification API when in foreground
 */

import { isNativeApp } from "./storage";

const NATIVE = isNativeApp();

// ── Notification ID ranges (avoids collisions) ────────────────────────────────
// 1–999       : one-off / timer notifications
// 1000–1999   : task due-today reminders
// 2000–2999   : task overdue reminders
// 3000–3999   : habit reminders
// 4000–4999   : recurring task reminders
const ID = {
  TIMER_DONE:    1,
  TIMER_WARN:    2,
  TASK_DUE:   (i) => 1000 + (i % 1000),
  TASK_OVER:  (i) => 2000 + (i % 1000),
  HABIT:      (i) => 3000 + (i % 1000),
  RECURRING:  (i) => 4000 + (i % 1000),
};

// ── Lazy-load Capacitor LocalNotifications ────────────────────────────────────
let _ln = null;
const getLN = async () => {
  if (!NATIVE) return null;
  if (_ln) return _ln;
  try {
    const m = await import("@capacitor/local-notifications");
    _ln = m.LocalNotifications;
    return _ln;
  } catch (e) {
    console.warn("[Notif] LocalNotifications not available:", e);
    return null;
  }
};

// ── Create notification channel (Android 8+) ─────────────────────────────────
// Channels appear in Android Settings → App → Notifications
const ensureChannels = async (ln) => {
  if (!ln) return;
  try {
    await ln.createChannel({
      id:          "reminders",
      name:        "Reminders",
      description: "Habit and task reminders",
      importance:  5,          // IMPORTANCE_HIGH — shows as heads-up
      visibility:  1,          // VISIBILITY_PUBLIC
      sound:       "beep.wav",
      vibration:   true,
      lights:      true,
      lightColor:  "#14B8A6",
    });
    await ln.createChannel({
      id:          "timer",
      name:        "Timer",
      description: "Timer and countdown notifications",
      importance:  5,
      visibility:  1,
      sound:       "beep.wav",
      vibration:   true,
    });
    await ln.createChannel({
      id:          "due",
      name:        "Task Due",
      description: "Tasks due today or overdue",
      importance:  4,          // IMPORTANCE_DEFAULT
      visibility:  1,
      vibration:   true,
    });
  } catch (e) {
    console.warn("[Notif] Channel creation failed:", e);
  }
};

// ── Permission request ────────────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  const ln = await getLN();
  if (ln) {
    try {
      await ensureChannels(ln);
      const { display } = await ln.requestPermissions();
      return display === "granted";
    } catch { return false; }
  }
  // Web fallback
  if (!("Notification" in window)) return false;
  try { return (await Notification.requestPermission()) === "granted"; }
  catch { return false; }
};

export const checkPermissionStatus = async () => {
  const ln = await getLN();
  if (ln) {
    try { const { display } = await ln.checkPermissions(); return display === "granted"; }
    catch { return false; }
  }
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
};

// ── Service Worker helpers (web only) ─────────────────────────────────────────
const getSW = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.ready; }
  catch { return null; }
};

export const postToSW = async (message) => {
  const sw = await getSW();
  if (sw?.active) { sw.active.postMessage(message); return true; }
  return false;
};

// ── Save notification to in-app history ──────────────────────────────────────
const saveToHistory = (title, body) => {
  try {
    const existing = JSON.parse(localStorage.getItem("notifs") || "[]");
    const updated = [{
      id:    `notif_${Date.now()}`,
      title,
      body,
      time:  new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }),
      read:  false,
    }, ...existing].slice(0, 20);
    localStorage.setItem("notifs", JSON.stringify(updated));
  } catch {}
};

// ── Send one-off notification (immediate) ────────────────────────────────────
export const sendNotification = async ({
  title,
  body,
  id       = Date.now(),
  sound    = true,
  channel  = "reminders",
  tag      = "general",
  requireInteraction = false,
}) => {
  const ln = await getLN();

  if (ln) {
    try {
      await ln.schedule({
        notifications: [{
          title,
          body,
          id:            Math.abs(Math.floor(id % 2147483647)) || 1,
          channelId:     channel,
          schedule:      { at: new Date(Date.now() + 500) },
          sound:         sound ? "beep.wav" : undefined,
          smallIcon:     "ic_stat_notify",
          iconColor:     "#14B8A6",
          actionTypeId:  "",
          extra:         null,
        }],
      });
    } catch (e) { console.warn("[Notif] Send failed:", e); }
  } else {
    const sent = await postToSW({ type:"SHOW_NOTIFICATION", title, body, tag, requireInteraction });
    if (!sent && Notification?.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  }

  saveToHistory(title, body);
};

// ── Schedule a notification at an exact future time ──────────────────────────
export const scheduleNotification = async ({
  id,
  title,
  body,
  at,           // Date object
  channel = "reminders",
  sound   = true,
  repeats = false,
}) => {
  const ln = await getLN();
  if (!ln) return;  // Exact scheduling is native-only

  try {
    await ln.schedule({
      notifications: [{
        title,
        body,
        id:           Math.abs(Math.floor(id % 2147483647)) || 1,
        channelId:    channel,
        schedule: {
          at,
          allowWhileIdle: true,   // fire even in Doze mode
          repeats,
        },
        sound:         sound ? "beep.wav" : undefined,
        smallIcon:     "ic_stat_notify",
        iconColor:     "#14B8A6",
        actionTypeId:  "",
        extra:         null,
      }],
    });
  } catch (e) { console.warn("[Notif] Schedule failed:", e); }
};

// ── Cancel scheduled notifications ───────────────────────────────────────────
export const cancelNotifications = async (ids) => {
  const ln = await getLN();
  if (!ln) return;
  try {
    await ln.cancel({ notifications: ids.map(id => ({ id })) });
  } catch {}
};

// ── Schedule ALL habit reminders ──────────────────────────────────────────────
// Called from useHabits whenever habits change.
// Schedules one notification per habit that has reminderEnabled=true and reminderTime set.
// Shows in Android status bar at the exact time every day.
export const scheduleHabitReminders = async (habits) => {
  const ln = await getLN();
  if (!ln) return;

  const today     = new Date();
  const todayStr  = today.toISOString().split("T")[0];

  // Cancel existing habit reminders
  const cancelIds = habits.map((_, i) => ID.HABIT(i));
  try { await ln.cancel({ notifications: cancelIds.map(id => ({ id })) }); } catch {}

  for (let i = 0; i < habits.length; i++) {
    const h = habits[i];
    if (!h.reminderEnabled || !h.reminderTime) continue;

    // Skip if already completed today
    if ((h.completedDates || []).includes(todayStr)) continue;

    const [hh, mm] = String(h.reminderTime).slice(0, 5).split(":").map(Number);
    if (isNaN(hh) || isNaN(mm)) continue;

    // Build the next fire time
    const fireAt = new Date();
    fireAt.setHours(hh, mm, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (fireAt <= new Date()) fireAt.setDate(fireAt.getDate() + 1);

    try {
      await ln.schedule({
        notifications: [{
          title:        `⏰ ${h.name}`,
          body:         `Time for your habit${h.streak > 0 ? ` · 🔥 ${h.streak} day streak` : ""}`,
          id:           ID.HABIT(i),
          channelId:    "reminders",
          schedule: {
            at:             fireAt,
            allowWhileIdle: true,
            repeats:        false,   // We reschedule daily after completion
          },
          sound:         "beep.wav",
          smallIcon:     "ic_stat_notify",
          iconColor:     "#14B8A6",
          actionTypeId:  "",
          extra:         JSON.stringify({ habitId: h.id, type: "habit_reminder" }),
        }],
      });
    } catch (e) { console.warn(`[Notif] Habit ${h.name} schedule failed:`, e); }
  }
};

// ── Schedule task due-today reminders ─────────────────────────────────────────
// Shows at 9 AM for tasks due today, and immediately for overdue tasks.
export const scheduleTaskReminders = async (tasks) => {
  const ln = await getLN();

  const today = new Date().toISOString().split("T")[0];
  const now   = new Date();

  const dueTodayTasks = tasks.filter(t =>
    !t.completed &&
    !t.isRecurring &&
    t.dueDate === today &&
    t.lifecycleStatus !== "trashed" &&
    t.lifecycleStatus !== "archived"
  );

  const overdueTasks = tasks.filter(t =>
    !t.completed &&
    !t.isRecurring &&
    t.dueDate && t.dueDate < today &&
    t.lifecycleStatus !== "trashed" &&
    t.lifecycleStatus !== "archived"
  );

  if (ln) {
    // Cancel previous task reminders
    const cancelIds = [
      ...dueTodayTasks.map((_, i) => ID.TASK_DUE(i)),
      ...overdueTasks.map((_, i) => ID.TASK_OVER(i)),
    ];
    try { await ln.cancel({ notifications: cancelIds.map(id => ({ id })) }); } catch {}

    // Schedule due-today batch at 9 AM (or in 5s if already past 9 AM)
    if (dueTodayTasks.length > 0) {
      const fireAt = new Date();
      fireAt.setHours(9, 0, 0, 0);
      if (fireAt <= now) fireAt.setTime(now.getTime() + 5000);

      try {
        await ln.schedule({
          notifications: [{
            title:    `📋 ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? "s" : ""} due today`,
            body:     dueTodayTasks.slice(0, 3).map(t => `• ${t.title}`).join("\n") +
                      (dueTodayTasks.length > 3 ? `\n+${dueTodayTasks.length - 3} more` : ""),
            id:       ID.TASK_DUE(0),
            channelId:"due",
            schedule: { at: fireAt, allowWhileIdle: true },
            sound:    "beep.wav",
            smallIcon:"ic_stat_notify",
            iconColor:"#14B8A6",
            actionTypeId: "",
            extra:    null,
          }],
        });
      } catch (e) { console.warn("[Notif] Task due reminder failed:", e); }
    }

    // Overdue: show immediately if any
    if (overdueTasks.length > 0) {
      try {
        await ln.schedule({
          notifications: [{
            title:    `⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`,
            body:     overdueTasks.slice(0, 3).map(t => `• ${t.title}`).join("\n") +
                      (overdueTasks.length > 3 ? `\n+${overdueTasks.length - 3} more` : ""),
            id:       ID.TASK_OVER(0),
            channelId:"due",
            schedule: { at: new Date(now.getTime() + 3000), allowWhileIdle: true },
            sound:    "beep.wav",
            smallIcon:"ic_stat_notify",
            iconColor:"#F5A623",
            actionTypeId: "",
            extra:    null,
          }],
        });
      } catch (e) { console.warn("[Notif] Overdue reminder failed:", e); }
    }
  } else {
    // Web: save to in-app history
    if (dueTodayTasks.length > 0) {
      saveToHistory(
        `📋 ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? "s" : ""} due today`,
        dueTodayTasks.slice(0, 3).map(t => t.title).join(", ")
      );
    }
    if (overdueTasks.length > 0) {
      saveToHistory(
        `⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`,
        overdueTasks.slice(0, 3).map(t => t.title).join(", ")
      );
    }
  }
};

// ── Timer notifications ───────────────────────────────────────────────────────
export const startBackgroundTimer = async ({ label, totalMs }) => {
  await postToSW({ type:"TIMER_START", label, totalMs });
};

export const stopBackgroundTimer = async () => {
  await postToSW({ type:"TIMER_STOP" });
  // Also cancel any native timer notification
  const ln = await getLN();
  if (ln) {
    try { await ln.cancel({ notifications: [{ id: ID.TIMER_DONE }, { id: ID.TIMER_WARN }] }); } catch {}
  }
};

export const pauseBackgroundTimer = async () => {
  await postToSW({ type:"TIMER_PAUSE" });
};

// ── Set up notification tap handler ──────────────────────────────────────────
// Call once on app startup to handle tapping a notification that opens the app
export const setupNotificationListeners = async () => {
  const ln = await getLN();
  if (!ln) return;

  try {
    // When user taps a notification
    await ln.addListener("localNotificationActionPerformed", (event) => {
      const extra = event.notification?.extra;
      if (!extra) return;
      try {
        const data = typeof extra === "string" ? JSON.parse(extra) : extra;
        // Could navigate to relevant page — dispatch custom event
        window.dispatchEvent(new CustomEvent("thirty-notification-tap", { detail: data }));
      } catch {}
    });

    // Received while app is in foreground — add to in-app history
    await ln.addListener("localNotificationReceived", (notification) => {
      saveToHistory(notification.title || "Reminder", notification.body || "");
    });
  } catch (e) { console.warn("[Notif] Listener setup failed:", e); }
};

// ── Timer sound (Web Audio API) ───────────────────────────────────────────────
let audioCtx = null;

export const playTimerSound = (type = "beep") => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;

    const patterns = {
      beep:     [{ freq:880, dur:0.15, start:0 }, { freq:880, dur:0.15, start:0.2 }],
      complete: [{ freq:523, dur:0.1, start:0 },{ freq:659,dur:0.1,start:0.12 },{ freq:784,dur:0.1,start:0.24 },{ freq:1047,dur:0.3,start:0.36 }],
      interval: [{ freq:440, dur:0.08,start:0 },{ freq:660,dur:0.08,start:0.1 },{ freq:880,dur:0.12,start:0.2 }],
      warning:  [{ freq:440, dur:0.3, start:0 }],
      start:    [{ freq:660, dur:0.08,start:0 },{ freq:880,dur:0.15,start:0.1 }],
    };

    const notes = patterns[type] || patterns.beep;
    notes.forEach(({ freq, dur, start }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    });
  } catch (e) { console.warn("Audio failed:", e); }
};