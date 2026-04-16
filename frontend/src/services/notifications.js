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

// ── Notification ID ranges (avoids collisions) ────────────────────────────────
// 1–999       : one-off / timer notifications
// 1000–1999   : task due-today reminders
// 2000–2999   : task overdue reminders
// 3000–3999   : habit reminders
// 4000–4999   : recurring task reminders
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const ID = {
  TIMER_DONE:    1,
  TIMER_WARN:    2,
  TIMER_RUNNING: 3,
  TASK_DUE:   (i) => 1000 + (i % 1000),
  TASK_OVER:  (i) => 2000 + (i % 1000),
  HABIT:      (i) => 3000 + (i % 1000),
  RECURRING:  (i) => 4000 + (i % 1000),
};

const isCapacitor = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

const getLN = async () => {
  if (!isCapacitor()) return null;
  return LocalNotifications;
};

// ── Create notification channel (Android 8+) ─────────────────────────────────
// Channels appear in Android Settings → App → Notifications
let _channelsCreated = false;
const ensureChannels = async (ln) => {
  if (!ln || _channelsCreated) return;
  try {
    await ln.createChannel({
      id:          "reminders",
      name:        "Reminders",
      description: "Habit and task reminders",
      importance:  5,          // IMPORTANCE_HIGH — shows as heads-up
      visibility:  1,          // VISIBILITY_PUBLIC
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
    _channelsCreated = true;
    console.log("[Notif] ✅ Notification channels created");
  } catch (e) {
    console.warn("[Notif] ❌ Channel creation failed:", e);
  }
};

// ── Permission request ────────────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  const ln = await getLN();
  if (ln) {
    try {
      await ensureChannels(ln);
      const result = await ln.requestPermissions();
      console.log("[Notif] Permission result:", result);
      return result?.display === "granted";
    } catch (e) {
      console.warn("[Notif] ❌ Permission request failed:", e);
      return false;
    }
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

export const needsPermissionPrompt = async () => {
  const ln = await getLN();
  if (ln) {
    try {
      const { display } = await ln.checkPermissions();
      console.log("[Notif] Current permission status:", display);
      // On Android 13+, 'prompt' means not yet asked
      return display !== "granted";
    } catch { return true; }
  }
  if ("Notification" in window) {
    return Notification.permission === "default";
  }
  return false;
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
      await ensureChannels(ln);
      const safeId = Math.abs(Math.floor(id % 2147483647)) || 1;
      await ln.schedule({
        notifications: [{
          title,
          body,
          id:            safeId,
          channelId:     channel,
          schedule:      { at: new Date(Date.now() + 500) },
          smallIcon:     "ic_stat_notify",
          iconColor:     "#14B8A6",
          actionTypeId:  "",
          extra:         null,
        }],
      });
      console.log("[Notif] ✅ Notification scheduled:", title);
    } catch (e) { console.warn("[Notif] ❌ Send failed:", e); }
  } else {
    const sent = await postToSW({ type:"SHOW_NOTIFICATION", title, body, tag, requireInteraction });
    if (!sent && typeof Notification !== "undefined" && Notification?.permission === "granted") {
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
    await ensureChannels(ln);
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
        smallIcon:     "ic_stat_notify",
        iconColor:     "#14B8A6",
        actionTypeId:  "",
        extra:         null,
      }],
    });
  } catch (e) { console.warn("[Notif] ❌ Schedule failed:", e); }
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

  await ensureChannels(ln);
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
          smallIcon:     "ic_stat_notify",
          iconColor:     "#14B8A6",
          actionTypeId:  "",
          extra:         JSON.stringify({ habitId: h.id, type: "habit_reminder" }),
        }],
      });
      console.log(`[Notif] ✅ Habit reminder scheduled: ${h.name} at ${fireAt}`);
    } catch (e) { console.warn(`[Notif] ❌ Habit ${h.name} schedule failed:`, e); }
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
    await ensureChannels(ln);
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
            smallIcon:"ic_stat_notify",
            iconColor:"#14B8A6",
            actionTypeId: "",
            extra:    JSON.stringify({ type: "task_due" }),
          }],
        });
        console.log("[Notif] ✅ Task due reminder scheduled");
      } catch (e) { console.warn("[Notif] ❌ Task due reminder failed:", e); }
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
            smallIcon:"ic_stat_notify",
            iconColor:"#F5A623",
            actionTypeId: "",
            extra:    JSON.stringify({ type: "task_overdue" }),
          }],
        });
        console.log("[Notif] ✅ Overdue reminder scheduled");
      } catch (e) { console.warn("[Notif] ❌ Overdue reminder failed:", e); }
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
  const ln = await getLN();

  if (ln) {
    await ensureChannels(ln);
    const now = Date.now();
    const endAt = new Date(now + totalMs);

    // Cancel any previous timer notifications
    try {
      await ln.cancel({ notifications: [{ id: ID.TIMER_RUNNING }, { id: ID.TIMER_DONE }, { id: ID.TIMER_WARN }] });
    } catch {}

    const notifs = [
      // Immediate "running" notification — shows now in the status bar
      {
        title:        `⏱ ${label || "Timer"} running...`,
        body:         `Ends at ${endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        id:           ID.TIMER_RUNNING,
        channelId:    "timer",
        schedule:     { at: new Date(now + 200) },  // fire 200ms from now (essentially immediate)
        smallIcon:    "ic_stat_notify",
        iconColor:    "#14B8A6",
      },
      // Completion notification — fires exactly when timer ends
      {
        title:        `✅ ${label || "Timer"} complete!`,
        body:         "Your timer has finished. Tap to open the app.",
        id:           ID.TIMER_DONE,
        channelId:    "timer",
        schedule:     { at: endAt, allowWhileIdle: true },
        smallIcon:    "ic_stat_notify",
        iconColor:    "#14B8A6",
        extra:        JSON.stringify({ type: "timer_done" }),
      },
    ];

    // Warning 1 minute before if timer is long enough
    if (totalMs > 60000) {
      notifs.push({
        title:      "⏰ 1 minute left",
        body:       `${label || "Your timer"} finishes in 1 minute.`,
        id:         ID.TIMER_WARN,
        channelId:  "timer",
        schedule:   { at: new Date(now + totalMs - 60000), allowWhileIdle: true },
        smallIcon:  "ic_stat_notify",
        iconColor:  "#14B8A6",
      });
    }

    try {
      await ln.schedule({ notifications: notifs });
      console.log("[Notif] ✅ Timer notifications scheduled:", notifs.length, "notifications");
    } catch (e) {
      console.warn("[Notif] ❌ Native timer scheduling failed:", e);
    }
  } else {
    await postToSW({ type:"TIMER_START", label, totalMs });
  }
};

export const stopBackgroundTimer = async () => {
  const ln = await getLN();
  if (ln) {
    try { await ln.cancel({ notifications: [{ id: ID.TIMER_RUNNING }, { id: ID.TIMER_DONE }, { id: ID.TIMER_WARN }] }); } catch {}
  } else {
    await postToSW({ type:"TIMER_STOP" });
  }
};

export const pauseBackgroundTimer = async () => {
  const ln = await getLN();
  if (ln) {
    try { await ln.cancel({ notifications: [{ id: ID.TIMER_RUNNING }, { id: ID.TIMER_DONE }, { id: ID.TIMER_WARN }] }); } catch {}
  } else {
    await postToSW({ type:"TIMER_PAUSE" });
  }
};

// ── Set up notification tap handler ──────────────────────────────────────────
// Call once on app startup to handle tapping a notification that opens the app
export const setupNotificationListeners = async () => {
  const ln = await getLN();
  if (!ln) {
    console.log("[Notif] Not on native platform, skipping listener setup");
    return;
  }

  try {
    // When user taps a notification
    await ln.addListener("localNotificationActionPerformed", (event) => {
      console.log("[Notif] Notification tapped:", event);
      const extra = event.notification?.extra;
      if (!extra) return;
      try {
        const data = typeof extra === "string" ? JSON.parse(extra) : extra;
        // Navigate to relevant page
        window.dispatchEvent(new CustomEvent("thirty-notification-tap", { detail: data }));
      } catch {}
    });

    // Received while app is in foreground — add to in-app history
    await ln.addListener("localNotificationReceived", (notification) => {
      console.log("[Notif] Notification received in foreground:", notification.title);
      saveToHistory(notification.title || "Reminder", notification.body || "");
    });

    console.log("[Notif] ✅ Notification listeners registered");
  } catch (e) { console.warn("[Notif] ❌ Listener setup failed:", e); }
};

// ── Send a test notification (for debugging) ─────────────────────────────────
export const sendTestNotification = async () => {
  const ln = await getLN();
  console.log("[Notif] sendTestNotification called, ln =", !!ln, "isCapacitor =", isCapacitor());
  
  if (ln) {
    try {
      await ensureChannels(ln);
      await ln.schedule({
        notifications: [{
          title:       "🔔 Thirty is working!",
          body:        "Notifications are set up correctly. You'll get reminders for tasks, habits, and timers.",
          id:          999,
          channelId:   "reminders",
          schedule:    { at: new Date(Date.now() + 1000) },
          smallIcon:   "ic_stat_notify",
          iconColor:   "#14B8A6",
        }],
      });
      console.log("[Notif] ✅ Test notification scheduled");
      return true;
    } catch (e) {
      console.warn("[Notif] ❌ Test notification failed:", e);
      return false;
    }
  } else {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("🔔 Thirty is working!", { body: "Notifications are set up correctly." });
      return true;
    }
    return false;
  }
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