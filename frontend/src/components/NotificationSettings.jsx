import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

// FIX: removed document.head.appendChild(styleSheet) from module-level code
// That caused errors in SSR and is wrong pattern - use CSS-in-JS or a proper stylesheet

const DEFAULT_SETTINGS = {
  browserNotifications: false,
  emailReminders: false,
  dueDateReminders: true,
  reminderTime: "1hour",
  dailySummary: true,
};

const NotificationSettings = () => {
  const { isDark } = useTheme();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("notificationSettings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem("notificationSettings", JSON.stringify(next));
    if (key === "browserNotifications" && value && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const mutedColor = isDark ? "rgba(241,245,249,0.5)" : "rgba(15,23,42,0.5)";
  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const SwitchToggle = ({ id, checked, onChange }) => (
    <label htmlFor={id} style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer" }}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} />
      <span style={{
        position: "absolute", inset: 0, borderRadius: "12px", transition: "0.22s",
        background: checked ? "linear-gradient(135deg,#ff6b9d,#ff99cc)" : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"),
      }}>
        <span style={{
          position: "absolute", top: "3px",
          left: checked ? "23px" : "3px",
          width: "18px", height: "18px", borderRadius: "9px",
          background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </span>
    </label>
  );

  const SettingRow = ({ id, label, desc, checked, onChange }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${border}` }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: textColor }}>{label}</div>
        {desc && <div style={{ fontSize: "11px", color: mutedColor, marginTop: "2px" }}>{desc}</div>}
      </div>
      <SwitchToggle id={id} checked={checked} onChange={onChange} />
    </div>
  );

  return (
    <div style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", marginBottom: "20px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: textColor }}>🔔 Notification Settings</h3>

      <SettingRow id="notif-browser" label="Browser Notifications" desc="Show popup alerts in your browser" checked={settings.browserNotifications} onChange={v => updateSetting("browserNotifications", v)} />
      <SettingRow id="notif-email" label="Email Reminders" desc="Receive email reminders for upcoming tasks" checked={settings.emailReminders} onChange={v => updateSetting("emailReminders", v)} />
      <SettingRow id="notif-due" label="Due Date Reminders" desc="Get reminders before tasks are due" checked={settings.dueDateReminders} onChange={v => updateSetting("dueDateReminders", v)} />

      {settings.dueDateReminders && (
        <div style={{ padding: "12px 0", borderBottom: `1px solid ${border}` }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: textColor, marginBottom: "8px" }}>Reminder Time</div>
          <select value={settings.reminderTime} onChange={e => updateSetting("reminderTime", e.target.value)} style={{
            padding: "8px 12px", borderRadius: "8px", border: `1px solid ${border}`,
            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
            color: textColor, fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
          }}>
            <option value="15min">15 minutes before</option>
            <option value="30min">30 minutes before</option>
            <option value="1hour">1 hour before</option>
            <option value="1day">1 day before</option>
          </select>
        </div>
      )}

      <SettingRow id="notif-summary" label="Daily Summary" desc="Receive daily email with task summary" checked={settings.dailySummary} onChange={v => updateSetting("dailySummary", v)} />
    </div>
  );
};

export default NotificationSettings;
