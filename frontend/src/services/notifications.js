import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

let LocalNotifications = null;

// Lazy load only on native
const getLocalNotifications = async () => {
  if (isNative && !LocalNotifications) {
    const mod = await import("@capacitor/local-notifications");
    LocalNotifications = mod.LocalNotifications;
  }
  return LocalNotifications;
};

export const requestNotificationPermission = async () => {
  if (isNative) {
    try {
      const ln = await getLocalNotifications();
      const { display } = await ln.requestPermissions();
      return display === "granted";
    } catch { return false; }
  }
  if (!("Notification" in window)) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const checkPermissionStatus = async () => {
  if (isNative) {
    try {
      const ln = await getLocalNotifications();
      const { display } = await ln.checkPermissions();
      return display === "granted";
    } catch { return false; }
  }
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
};

export const sendNotification = async ({ title, body, id = Date.now() }) => {
  if (isNative) {
    try {
      const ln = await getLocalNotifications();
      await ln.schedule({
        notifications: [{
          title,
          body,
          id: Math.abs(Math.floor(id % 2147483647)),
          schedule: { at: new Date(Date.now() + 300) },
          sound: null,
          attachments: null,
          actionTypeId: "",
          extra: null,
        }],
      });
    } catch (err) {
      console.warn("Native notification failed:", err);
    }
  } else {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  }

  // Always save to notification history
  try {
    const existing = JSON.parse(localStorage.getItem("notifs") || "[]");
    const updated = [{
      title, body,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    }, ...existing].slice(0, 20);
    localStorage.setItem("notifs", JSON.stringify(updated));
  } catch {}
};