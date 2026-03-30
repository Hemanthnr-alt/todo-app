// Safe import — works in both browser and Capacitor APK
const isNative = () => {
  try {
    return window?.Capacitor?.isNativePlatform?.() === true;
  } catch { return false; }
};

const getLocalNotifications = async () => {
  if (!isNative()) return null;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return LocalNotifications;
  } catch { return null; }
};

export const requestNotificationPermission = async () => {
  const ln = await getLocalNotifications();

  if (ln) {
    // ✅ Native APK
    try {
      const { display } = await ln.requestPermissions();
      return display === "granted";
    } catch { return false; }
  }

  // ✅ Browser
  if (!("Notification" in window)) return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch { return false; }
};

export const checkPermissionStatus = async () => {
  const ln = await getLocalNotifications();

  if (ln) {
    try {
      const { display } = await ln.checkPermissions();
      return display === "granted";
    } catch { return false; }
  }

  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
};

export const sendNotification = async ({ title, body, id = Date.now() }) => {
  const ln = await getLocalNotifications();

  if (ln) {
    try {
      await ln.schedule({
        notifications: [{
          title,
          body,
          id: Math.abs(Math.floor(id % 2147483647)) || 1,
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
  } else if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try { new Notification(title, { body }); } catch {}
  }

  // Save to history
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