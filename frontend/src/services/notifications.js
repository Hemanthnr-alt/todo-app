import { isNativeApp } from "./storage";

const NATIVE = isNativeApp();

let _ln = null;
const getLN = async () => {
  if (!NATIVE) return null;
  if (_ln) return _ln;
  try { const m = await import("@capacitor/local-notifications"); _ln = m.LocalNotifications; return _ln; }
  catch { return null; }
};

// ── Permission ────────────────────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  const ln = await getLN();
  if (ln) {
    try { const { display } = await ln.requestPermissions(); return display === "granted"; }
    catch { return false; }
  }
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

// ── Get registered service worker ─────────────────────────────────────────────
const getSW = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch { return null; }
};

// ── Post message to service worker ───────────────────────────────────────────
export const postToSW = async (message) => {
  const sw = await getSW();
  if (sw?.active) {
    sw.active.postMessage(message);
    return true;
  }
  return false;
};

// ── Send notification (foreground or via SW) ──────────────────────────────────
export const sendNotification = async ({ title, body, id = Date.now(), sound = true, requireInteraction = false, tag = "general" }) => {
  const ln = await getLN();

  if (ln) {
    try {
      await ln.schedule({
        notifications: [{
          title, body,
          id: Math.abs(Math.floor(id % 2147483647)) || 1,
          schedule: { at: new Date(Date.now() + 300) },
          sound: sound ? "beep.wav" : null,
          actionTypeId: "",
          extra: null,
        }],
      });
    } catch (e) { console.warn("Native notif failed:", e); }
  } else {
    // Try via service worker first (works in background on Android PWA)
    const sent = await postToSW({ type: "SHOW_NOTIFICATION", title, body, tag, requireInteraction });
    if (!sent && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  }

  // Save to history
  try {
    const existing = JSON.parse(localStorage.getItem("notifs")||"[]");
    const updated  = [{ id: `notif_${Date.now()}`, title, body, time: new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}), read:false }, ...existing].slice(0,20);
    localStorage.setItem("notifs", JSON.stringify(updated));
  } catch {}
};

// ── Background timer control ──────────────────────────────────────────────────
export const startBackgroundTimer = async ({ label, totalMs }) => {
  await postToSW({ type: "TIMER_START", label, totalMs });
};

export const stopBackgroundTimer = async () => {
  await postToSW({ type: "TIMER_STOP" });
};

export const pauseBackgroundTimer = async () => {
  await postToSW({ type: "TIMER_PAUSE" });
};

// ── Task due date checker — call this daily ────────────────────────────────────
export const scheduleTaskReminders = async (tasks) => {
  const ln = await getLN();
  if (!ln) return;

  try {
    await ln.cancel({ notifications: tasks.map((_, i) => ({ id: 1000 + i })) });

    const today = new Date().toISOString().split("T")[0];
    const dueSoon = tasks.filter(t => !t.completed && t.dueDate === today);

    for (let i = 0; i < dueSoon.length; i++) {
      const t = dueSoon[i];
      await ln.schedule({
        notifications: [{
          title: "Task due today 📋",
          body:  t.title,
          id:    1000 + i,
          schedule: { at: new Date(Date.now() + 5000 + i * 1000) },
          sound: "beep.wav",
          actionTypeId: "",
          extra: null,
        }],
      });
    }
  } catch (e) { console.warn("Schedule reminders failed:", e); }
};

// ── Timer sound (Web Audio API) ───────────────────────────────────────────────
let audioCtx = null;

export const playTimerSound = (type = "beep") => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;

    const patterns = {
      beep:     [{ freq: 880, dur: 0.15, start: 0 }, { freq: 880, dur: 0.15, start: 0.2 }],
      complete: [{ freq: 523, dur: 0.1, start:0 },{ freq:659,dur:0.1,start:0.12 },{ freq:784,dur:0.1,start:0.24 },{ freq:1047,dur:0.3,start:0.36 }],
      interval: [{ freq:440,dur:0.08,start:0},{ freq:660,dur:0.08,start:0.1},{ freq:880,dur:0.12,start:0.2}],
      warning:  [{ freq:440,dur:0.3,start:0 }],
      start:    [{ freq:660,dur:0.08,start:0},{ freq:880,dur:0.15,start:0.1}],
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