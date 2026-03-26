// frontend/src/components/NotificationSettings.jsx
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import PremiumButton from "./PremiumButton";

const DEFAULT_NOTIFICATION_SETTINGS = {
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
      if (saved) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      /* ignore */
    }
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  });

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(newSettings));

    if (key === "browserNotifications" && value && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={{ ...styles.title, color: isDark ? "white" : "#1e293b" }}>🔔 Notification Settings</h3>

      <div style={styles.settingItem}>
        <div>
          <div style={{ fontWeight: "bold", color: isDark ? "white" : "#1e293b" }}>Browser Notifications</div>
          <div style={styles.description}>Show popup notifications in your browser</div>
        </div>
        <label className="tf-notification-settings-switch" style={styles.switch} htmlFor="notif-browser">
          <input
            id="notif-browser"
            type="checkbox"
            checked={settings.browserNotifications}
            onChange={(e) => updateSetting("browserNotifications", e.target.checked)}
          />
          <span style={styles.slider} />
        </label>
      </div>

      <div style={styles.settingItem}>
        <div>
          <div style={{ fontWeight: "bold", color: isDark ? "white" : "#1e293b" }}>Email Reminders</div>
          <div style={styles.description}>Receive email reminders for upcoming tasks</div>
        </div>
        <label className="tf-notification-settings-switch" style={styles.switch} htmlFor="notif-email">
          <input
            id="notif-email"
            type="checkbox"
            checked={settings.emailReminders}
            onChange={(e) => updateSetting("emailReminders", e.target.checked)}
          />
          <span style={styles.slider} />
        </label>
      </div>

      <div style={styles.settingItem}>
        <div>
          <div style={{ fontWeight: "bold", color: isDark ? "white" : "#1e293b" }}>Due Date Reminders</div>
          <div style={styles.description}>Get reminders before tasks are due</div>
        </div>
        <label className="tf-notification-settings-switch" style={styles.switch} htmlFor="notif-due">
          <input
            id="notif-due"
            type="checkbox"
            checked={settings.dueDateReminders}
            onChange={(e) => updateSetting("dueDateReminders", e.target.checked)}
          />
          <span style={styles.slider} />
        </label>
      </div>

      {settings.dueDateReminders && (
        <div style={styles.settingItem}>
          <div>
            <div style={{ fontWeight: "bold", color: isDark ? "white" : "#1e293b" }}>Reminder Time</div>
            <div style={styles.description}>When to send reminders before due date</div>
          </div>
          <select
            value={settings.reminderTime}
            onChange={(e) => updateSetting("reminderTime", e.target.value)}
            style={{
              ...styles.select,
              background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              color: isDark ? "white" : "#1e293b",
            }}
          >
            <option value="15min">15 minutes before</option>
            <option value="30min">30 minutes before</option>
            <option value="1hour">1 hour before</option>
            <option value="1day">1 day before</option>
          </select>
        </div>
      )}

      <div style={styles.settingItem}>
        <div>
          <div style={{ fontWeight: "bold", color: isDark ? "white" : "#1e293b" }}>Daily Summary</div>
          <div style={styles.description}>Receive daily email with task summary</div>
        </div>
        <label className="tf-notification-settings-switch" style={styles.switch} htmlFor="notif-summary">
          <input
            id="notif-summary"
            type="checkbox"
            checked={settings.dailySummary}
            onChange={(e) => updateSetting("dailySummary", e.target.checked)}
          />
          <span style={styles.slider} />
        </label>
      </div>

      <PremiumButton
        size="sm"
        variant="glass"
        onClick={() => {
          localStorage.setItem("notificationSettings", JSON.stringify(settings));
          alert("Settings saved!");
        }}
      >
        Save Settings
      </PremiumButton>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    marginBottom: "20px",
  },
  title: {
    fontSize: "18px",
    marginBottom: "16px",
  },
  settingItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  description: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
    marginTop: "4px",
  },
  switch: {
    position: "relative",
    display: "inline-block",
    width: "50px",
    height: "24px",
  },
  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ccc",
    transition: ".4s",
    borderRadius: "34px",
    "&:before": {
      position: "absolute",
      content: '""',
      height: "18px",
      width: "18px",
      left: "3px",
      bottom: "3px",
      backgroundColor: "white",
      transition: ".4s",
      borderRadius: "50%",
    },
  },
  select: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    fontSize: "13px",
    cursor: "pointer",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  label.tf-notification-settings-switch input[type="checkbox"]:checked + span {
    background-color: #ff6b9d;
  }
  label.tf-notification-settings-switch input[type="checkbox"]:checked + span:before {
    transform: translateX(26px);
  }
  label.tf-notification-settings-switch input[type="checkbox"] {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;
document.head.appendChild(styleSheet);

export default NotificationSettings;
