import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const DEFAULTS = {
  notifications: { browser: true, sound: true, dueReminders: true, dailySummary: true, reminderTime: "1hour" },
  appearance: { compactView: false, showCompleted: true, defaultView: "today" },
  privacy: { showEmail: false, showActivity: true },
};

function load() {
  try {
    const s = JSON.parse(localStorage.getItem("tp_settings") || "null");
    if (!s) return DEFAULTS;
    return { ...DEFAULTS, ...s, notifications: { ...DEFAULTS.notifications, ...s.notifications }, appearance: { ...DEFAULTS.appearance, ...s.appearance }, privacy: { ...DEFAULTS.privacy, ...s.privacy } };
  } catch { return DEFAULTS; }
}

function Toggle({ label, desc, value, onChange, isDark }) {
  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: textColor }}>{label}</div>
        {desc && <div style={{ fontSize: "11px", color: mutedColor, marginTop: "2px" }}>{desc}</div>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer",
          background: value ? "linear-gradient(135deg,#ff6b9d,#ff99cc)" : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"),
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: "3px",
          left: value ? "23px" : "3px",
          width: "18px", height: "18px", borderRadius: "9px",
          background: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </div>
    </div>
  );
}

export default function AppSettings({ isOpen, onClose }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState(load);

  const upd = (cat, key, val) => {
    const next = { ...settings, [cat]: { ...settings[cat], [key]: val } };
    setSettings(next);
    if (cat === "appearance" && key === "theme") {
      if (val === "dark" && !isDark) toggleTheme();
      if (val === "light" && isDark) toggleTheme();
    }
  };

  const save = () => {
    localStorage.setItem("tp_settings", JSON.stringify(settings));
    toast.success("Settings saved!");
    onClose();
  };

  const bg = isDark ? "rgba(8,11,20,0.98)" : "rgba(248,250,252,0.98)";
  const border = isDark ? "rgba(255,107,157,0.12)" : "rgba(255,107,157,0.15)";
  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: "24px" }}>
      <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#ff6b9d", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>{title}</h4>
      {children}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000 }} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            style={{
              position: "fixed", top: 0, right: 0, height: "100vh", width: "380px",
              background: bg, backdropFilter: "blur(20px)",
              borderLeft: `1px solid ${border}`,
              boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
              zIndex: 1001, display: "flex", flexDirection: "column",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `1px solid ${border}`,
            }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: textColor }}>Settings</h2>
                <p style={{ fontSize: "12px", color: mutedColor, margin: "2px 0 0" }}>Customize your experience</p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: mutedColor }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {/* Account */}
              <Section title="Account">
                <div style={{
                  padding: "14px", borderRadius: "12px",
                  background: isDark ? "rgba(255,107,157,0.08)" : "rgba(255,107,157,0.06)",
                  border: `1px solid rgba(255,107,157,0.15)`,
                  display: "flex", gap: "12px", alignItems: "center",
                }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "12px",
                    background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", fontWeight: 700, color: "white",
                  }}>
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: textColor }}>{user?.name || "Guest"}</div>
                    <div style={{ fontSize: "12px", color: mutedColor }}>{user?.email || "Not signed in"}</div>
                  </div>
                </div>
              </Section>

              {/* Appearance */}
              <Section title="Appearance">
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", color: mutedColor, display: "block", marginBottom: "6px" }}>Theme</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["dark", "light"].map((t) => (
                      <button
                        key={t}
                        onClick={() => upd("appearance", "theme", t)}
                        style={{
                          flex: 1, padding: "8px", borderRadius: "10px",
                          border: `1px solid ${(isDark ? "dark" : "light") === t ? "#ff6b9d" : border}`,
                          background: (isDark ? "dark" : "light") === t ? "rgba(255,107,157,0.12)" : "transparent",
                          color: textColor, cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
                        }}
                      >
                        {t === "dark" ? "🌙 Dark" : "☀️ Light"}
                      </button>
                    ))}
                  </div>
                </div>
                <Toggle label="Compact View" value={settings.appearance.compactView} onChange={(v) => upd("appearance", "compactView", v)} isDark={isDark} />
                <Toggle label="Show Completed Tasks" value={settings.appearance.showCompleted} onChange={(v) => upd("appearance", "showCompleted", v)} isDark={isDark} />
              </Section>

              {/* Notifications */}
              <Section title="Notifications">
                <Toggle label="Browser Notifications" desc="Show popup alerts" value={settings.notifications.browser} onChange={(v) => upd("notifications", "browser", v)} isDark={isDark} />
                <Toggle label="Due Date Reminders" desc="Remind me before deadlines" value={settings.notifications.dueReminders} onChange={(v) => upd("notifications", "dueReminders", v)} isDark={isDark} />
                <Toggle label="Daily Summary Email" desc="End-of-day task digest" value={settings.notifications.dailySummary} onChange={(v) => upd("notifications", "dailySummary", v)} isDark={isDark} />
              </Section>

              {/* Privacy */}
              <Section title="Privacy">
                <Toggle label="Show Email on Profile" value={settings.privacy.showEmail} onChange={(v) => upd("privacy", "showEmail", v)} isDark={isDark} />
                <Toggle label="Show Activity Status" value={settings.privacy.showActivity} onChange={(v) => upd("privacy", "showActivity", v)} isDark={isDark} />
              </Section>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${border}`, display: "flex", gap: "8px" }}>
              <button
                onClick={() => { localStorage.removeItem("tp_settings"); setSettings(DEFAULTS); toast("Settings reset"); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: `1px solid ${border}`, background: "transparent",
                  color: mutedColor, cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
                }}
              >Reset</button>
              <button
                onClick={save}
                style={{
                  flex: 2, padding: "10px", borderRadius: "10px",
                  background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                  border: "none", color: "white", cursor: "pointer",
                  fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
                  boxShadow: "0 4px 14px rgba(255,107,157,0.3)",
                }}
              >Save Changes</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}