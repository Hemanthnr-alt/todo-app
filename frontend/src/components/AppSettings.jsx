import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  requestNotificationPermission,
  checkPermissionStatus,
  sendNotification,
} from "../services/notifications";

const DEFAULTS = {
  notifications: {
    browser:      false,
    dueReminders: true,
    dailySummary: true,
    reminderTime: "1hour",
  },
  appearance: {
    compactView:        false,
    showCompleted:      true,
    animationsEnabled:  true,
  },
  privacy: {
    showEmail:    false,
    showActivity: true,
  },
};

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("tp_settings") || "null");
    if (!s) return structuredClone(DEFAULTS);
    return {
      notifications: { ...DEFAULTS.notifications, ...s.notifications },
      appearance:    { ...DEFAULTS.appearance,    ...s.appearance    },
      privacy:       { ...DEFAULTS.privacy,       ...s.privacy       },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function Toggle({ label, desc, value, onChange, isDark, accentColor = "#ff6b9d" }) {
  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.42)" : "rgba(15,23,42,0.42)";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "13px 0",
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
    }}>
      <div style={{ flex: 1, paddingRight: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: textColor, marginBottom: desc ? "2px" : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: "11px", color: mutedColor, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer",
          background: value
            ? `linear-gradient(135deg,${accentColor},${accentColor}cc)`
            : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
          position: "relative", transition: "background 0.22s", flexShrink: 0,
          border: "none", outline: "none",
          boxShadow: value ? `0 2px 10px ${accentColor}55` : "none",
        }}
      >
        <div style={{
          position: "absolute", top: "3px",
          left: value ? "23px" : "3px",
          width: "18px", height: "18px", borderRadius: "9px",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
          transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </button>
    </div>
  );
}
function ChangePassword({ isDark, textColor, mutedColor, border, cardBg, inputBg }) {
  const [show,    setShow]    = useState(false);
  const [current, setCurrent] = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const inputStyle = {
    width:"100%", padding:"11px 14px", borderRadius:"10px",
    border:`1px solid ${border}`, background:inputBg, color:textColor,
    fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  };

  const handleChange = async () => {
    if (!current || !newPw || !confirm) { toast.error("Fill all fields"); return; }
    if (newPw !== confirm) { toast.error("Passwords don't match"); return; }
    if (newPw.length < 6)  { toast.error("Min 6 characters"); return; }

    setSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword:current, newPassword:newPw });
      toast.success("Password changed! ✓");
      setCurrent(""); setNewPw(""); setConfirm(""); setShow(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ marginTop:"16px" }}>
      <button onClick={()=>setShow(!show)} style={{
        width:"100%", padding:"11px 14px", borderRadius:"12px",
        border:`1px solid ${border}`, background: show ? "rgba(255,107,157,0.08)" : (isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"),
        color: show ? "#ff6b9d" : textColor,
        cursor:"pointer", fontSize:"13px", fontWeight:600, fontFamily:"inherit",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span>🔑 Change Password</span>
        <span style={{ fontSize:"12px", color:mutedColor }}>{show?"▲":"▼"}</span>
      </button>

      <AnimatePresence>
        {show && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
            <div style={{ padding:"14px 0 0", display:"flex", flexDirection:"column", gap:"10px" }}>
              {[
                { label:"Current password", val:current, set:setCurrent },
                { label:"New password",     val:newPw,   set:setNewPw   },
                { label:"Confirm new",      val:confirm, set:setConfirm },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ position:"relative" }}>
                  <input
                    type={showPw?"text":"password"}
                    placeholder={label}
                    value={val} onChange={e=>set(e.target.value)}
                    style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="#ff6b9d"}
                    onBlur={e=>e.target.style.borderColor=border}
                  />
                </div>
              ))}
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <input type="checkbox" id="showpw" checked={showPw} onChange={e=>setShowPw(e.target.checked)} style={{ accentColor:"#ff6b9d", cursor:"pointer" }}/>
                <label htmlFor="showpw" style={{ fontSize:"12px", color:mutedColor, cursor:"pointer" }}>Show passwords</label>
              </div>
              <motion.button whileTap={{scale:0.97}} onClick={handleChange} disabled={saving}
                style={{ padding:"11px", borderRadius:"10px", background:"linear-gradient(135deg,#ff6b9d,#ff99cc)", border:"none", color:"white", cursor:saving?"not-allowed":"pointer", fontSize:"13px", fontWeight:700, fontFamily:"inherit", opacity:saving?0.75:1 }}>
                {saving?"Saving…":"Update Password"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default function AppSettings({ isOpen, onClose }) {
  const { isDark, toggleTheme }    = useTheme();
  const { user, isAuthenticated }  = useAuth();
  const [settings,    setSettings]    = useState(loadSettings);
  const [saving,      setSaving]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("appearance");
  const [notifGranted, setNotifGranted] = useState(false);

  // Check permission on open
  useEffect(() => {
    if (!isOpen) return;
    checkPermissionStatus().then(setNotifGranted);
  }, [isOpen]);

  const upd = (cat, key, val) => {
    setSettings(prev => ({ ...prev, [cat]: { ...prev[cat], [key]: val } }));
    if (cat === "appearance" && key === "theme") {
      if ((val === "dark") !== isDark) toggleTheme();
    }
  };

  // ✅ Works on both APK (Capacitor) and browser
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      upd("notifications", "browser", true);
      toast.success("Notifications enabled! 🔔");
      // Send test notification
      await sendNotification({
        title: "30 — Notifications enabled",
        body:  "You'll now receive task reminders.",
      });
    } else {
      upd("notifications", "browser", false);
      toast.error("Permission denied. Enable in your device Settings.");
    }
  };

  const handleToggleBrowserNotif = async (val) => {
    if (val && !notifGranted) {
      await handleEnableNotifications();
    } else {
      upd("notifications", "browser", val);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      localStorage.setItem("tp_settings", JSON.stringify(settings));

      if (settings.appearance.animationsEnabled === false) {
        document.documentElement.style.setProperty("--motion-duration", "0s");
      } else {
        document.documentElement.style.removeProperty("--motion-duration");
      }

      if (isAuthenticated) {
        try {
          await api.put("/user/notifications", {
            dueDateReminders: settings.notifications.dueReminders,
            dailySummary:     settings.notifications.dailySummary,
            reminderTime:     settings.notifications.reminderTime,
            emailReminders:   settings.notifications.dueReminders,
          });
        } catch {}
      }

      toast.success("Settings saved! ✓");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSettings(structuredClone(DEFAULTS));
    localStorage.removeItem("tp_settings");
    toast("Settings reset to defaults");
  };

  const bg         = isDark ? "rgba(8,11,20,0.98)"        : "rgba(250,251,253,0.98)";
  const border     = isDark ? "rgba(255,107,157,0.1)"     : "rgba(255,107,157,0.14)";
  const textColor  = isDark ? "#f1f5f9"                   : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.42)"    : "rgba(15,23,42,0.42)";
  const cardBg     = isDark ? "rgba(255,255,255,0.04)"    : "rgba(0,0,0,0.03)";

  const TABS = [
    { id: "appearance",    label: "Appearance",    icon: "🎨" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "account",       label: "Account",       icon: "👤" },
    { id: "privacy",       label: "Privacy",       icon: "🔒" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000 }}
          />

          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            style={{
              position: "fixed", top: 0, right: 0,
              height: "100dvh", width: "min(420px,100vw)",
              background: bg, backdropFilter: "blur(24px)",
              borderLeft: `1px solid ${border}`,
              boxShadow: "-8px 0 48px rgba(0,0,0,0.16)",
              zIndex: 1001, display: "flex", flexDirection: "column",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "18px 22px 16px",
              borderBottom: `1px solid ${border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "7px",
                    background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 900, color: "white",
                  }}>30</div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: textColor, letterSpacing: "-0.03em" }}>Settings</h2>
                </div>
                <p style={{ fontSize: "12px", color: mutedColor, margin: 0 }}>Customise your 30 experience</p>
              </div>
              <button onClick={onClose} style={{
                width: "32px", height: "32px", borderRadius: "9px",
                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                border: `1px solid ${border}`, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: mutedColor, fontSize: "14px",
              }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex", gap: "4px", padding: "12px 22px 0",
              flexShrink: 0, borderBottom: `1px solid ${border}`,
              overflowX: "auto",
            }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: "7px 12px", borderRadius: "8px 8px 0 0",
                  border: `1px solid ${activeTab === tab.id ? border : "transparent"}`,
                  borderBottom: activeTab === tab.id ? "2px solid #ff6b9d" : "2px solid transparent",
                  background: activeTab === tab.id ? (isDark ? "rgba(255,107,157,0.08)" : "rgba(255,107,157,0.06)") : "transparent",
                  color: activeTab === tab.id ? "#ff6b9d" : mutedColor,
                  cursor: "pointer", fontSize: "12px", fontWeight: activeTab === tab.id ? 700 : 500,
                  fontFamily: "inherit", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: "5px",
                  transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: "13px" }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >

                  {/* ── APPEARANCE ── */}
                  {activeTab === "appearance" && (
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "10px" }}>
                        Theme
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
                        {[
                          { value: "dark",  label: "🌙 Dark",  desc: "Easy on the eyes" },
                          { value: "light", label: "☀️ Light", desc: "Bright & clean"    },
                        ].map(opt => {
                          const active = (isDark ? "dark" : "light") === opt.value;
                          return (
                            <button key={opt.value} onClick={() => { if (!active) toggleTheme(); }}
                              style={{
                                padding: "12px", borderRadius: "12px",
                                border: `1.5px solid ${active ? "#ff6b9d" : border}`,
                                background: active ? "rgba(255,107,157,0.1)" : cardBg,
                                color: active ? "#ff6b9d" : textColor,
                                cursor: "pointer", textAlign: "left",
                                fontFamily: "inherit", transition: "all 0.18s",
                              }}
                            >
                              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>{opt.label}</div>
                              <div style={{ fontSize: "11px", color: active ? "#ff6b9d" : mutedColor }}>{opt.desc}</div>
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ background: cardBg, borderRadius: "12px", padding: "0 14px", border: `1px solid ${border}` }}>
                        <Toggle label="Compact View"          desc="Reduce spacing between items"   value={settings.appearance.compactView}       onChange={v => upd("appearance","compactView",v)}      isDark={isDark} />
                        <Toggle label="Show Completed Tasks"  desc="Keep completed tasks visible"   value={settings.appearance.showCompleted}     onChange={v => upd("appearance","showCompleted",v)}    isDark={isDark} />
                        <Toggle label="Enable Animations"     desc="Smooth transitions and effects" value={settings.appearance.animationsEnabled} onChange={v => upd("appearance","animationsEnabled",v)} isDark={isDark} />
                      </div>
                    </div>
                  )}

                  {/* ── NOTIFICATIONS ── */}
                  {activeTab === "notifications" && (
                    <div>
                      {/* Permission status card */}
                      <div style={{
                        padding: "14px 16px", borderRadius: "14px",
                        background: notifGranted ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
                        border: `1px solid ${notifGranted ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                        marginBottom: "16px",
                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
                      }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: notifGranted ? "#10b981" : "#f59e0b" }}>
                            {notifGranted ? "✓ Notifications enabled" : "⚠ Notifications blocked"}
                          </div>
                          <div style={{ fontSize: "11px", color: mutedColor, marginTop: "3px" }}>
                            {notifGranted
                              ? "You'll receive task reminders"
                              : "Tap Enable to allow notifications"}
                          </div>
                        </div>
                        {!notifGranted && (
                          <button onClick={handleEnableNotifications} style={{
                            padding: "8px 14px", borderRadius: "10px",
                            background: "linear-gradient(135deg,#f59e0b,#f97316)",
                            border: "none", color: "white", cursor: "pointer",
                            fontSize: "12px", fontWeight: 700, fontFamily: "inherit",
                            flexShrink: 0,
                          }}>Enable</button>
                        )}
                      </div>

                      <div style={{ background: cardBg, borderRadius: "12px", padding: "0 14px", border: `1px solid ${border}`, marginBottom: "16px" }}>
                        <Toggle
                          label="Push Notifications"
                          desc="Alerts when tasks are due"
                          value={settings.notifications.browser && notifGranted}
                          onChange={handleToggleBrowserNotif}
                          isDark={isDark}
                        />
                        <Toggle
                          label="Due Date Reminders"
                          desc="Alert before tasks are due"
                          value={settings.notifications.dueReminders}
                          onChange={v => upd("notifications","dueReminders",v)}
                          isDark={isDark}
                        />
                        <Toggle
                          label="Daily Summary Email"
                          desc="End-of-day digest in your inbox"
                          value={settings.notifications.dailySummary}
                          onChange={v => upd("notifications","dailySummary",v)}
                          isDark={isDark}
                        />
                      </div>

                      {settings.notifications.dueReminders && (
                        <div style={{ background: cardBg, borderRadius: "12px", padding: "14px", border: `1px solid ${border}` }}>
                          <label style={{ fontSize: "11px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "10px" }}>
                            Reminder Lead Time
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {[
                              { value: "15min", label: "15 min" },
                              { value: "30min", label: "30 min" },
                              { value: "1hour", label: "1 hour" },
                              { value: "1day",  label: "1 day"  },
                            ].map(opt => (
                              <button key={opt.value}
                                onClick={() => upd("notifications","reminderTime",opt.value)}
                                style={{
                                  padding: "10px", borderRadius: "10px",
                                  border: `1.5px solid ${settings.notifications.reminderTime === opt.value ? "#ff6b9d" : border}`,
                                  background: settings.notifications.reminderTime === opt.value ? "rgba(255,107,157,0.1)" : "transparent",
                                  color: settings.notifications.reminderTime === opt.value ? "#ff6b9d" : textColor,
                                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                                  fontFamily: "inherit", transition: "all 0.15s",
                                }}
                              >{opt.label}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ACCOUNT ── */}
                  {activeTab === "account" && (
                    <div>
                      {isAuthenticated ? (
                        <>
                          <div style={{
                            padding: "16px", borderRadius: "14px",
                            background: "rgba(255,107,157,0.07)",
                            border: "1px solid rgba(255,107,157,0.15)",
                            display: "flex", gap: "14px", alignItems: "center",
                            marginBottom: "20px",
                          }}>
                            <div style={{
                              width: "52px", height: "52px", borderRadius: "14px",
                              background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "20px", fontWeight: 800, color: "white", flexShrink: 0,
                            }}>
                              {user?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div style={{ fontSize: "15px", fontWeight: 800, color: textColor }}>{user?.name}</div>
                              <div style={{ fontSize: "12px", color: mutedColor, marginTop: "2px" }}>{user?.email}</div>
                              <div style={{
                                marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "4px",
                                padding: "2px 8px", borderRadius: "6px",
                                background: "rgba(16,185,129,0.12)", color: "#10b981",
                                fontSize: "10px", fontWeight: 700,
                              }}>✓ Active account</div>
                            </div>
                          </div>

                          <div style={{ background: cardBg, borderRadius: "12px", border: `1px solid ${border}`, overflow: "hidden", marginBottom: "16px" }}>
                            {[
                              { label: "Name",  value: user?.name,  icon: "👤" },
                              { label: "Email", value: user?.email, icon: "✉️" },
                            ].map((row, i) => (
                              <div key={row.label} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "12px 14px",
                                borderBottom: i === 0 ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` : "none",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "14px" }}>{row.icon}</span>
                                  <span style={{ fontSize: "12px", color: mutedColor }}>{row.label}</span>
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: textColor }}>{row.value}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ padding: "12px", borderRadius: "12px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#f43f5e", marginBottom: "4px" }}>⚠ Danger Zone</div>
                            <div style={{ fontSize: "11px", color: mutedColor, marginBottom: "10px" }}>These actions cannot be undone.</div>
                            <button
                              onClick={() => {
                                if (window.confirm("Clear all local data? Your account and tasks are safe.")) {
                                  localStorage.clear();
                                  toast("Local data cleared");
                                }
                              }}
                              style={{
                                padding: "8px 14px", borderRadius: "8px",
                                background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)",
                                color: "#f43f5e", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                                fontFamily: "inherit",
                              }}
                            >Clear local data</button>
                          </div>
                          {/* Change Password */}
<ChangePassword isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg} inputBg={isDark?"rgba(255,255,255,0.06)":"#f8fafc"} />
                        </>
                      ) : (
                        <div style={{ textAlign: "center", padding: "40px 20px" }}>
                          <div style={{ fontSize: "48px", marginBottom: "12px" }}>👋</div>
                          <h3 style={{ fontSize: "16px", fontWeight: 700, color: textColor, margin: "0 0 8px" }}>Not signed in</h3>
                          <p style={{ fontSize: "13px", color: mutedColor }}>Sign in to sync your tasks across devices</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── PRIVACY ── */}
                  {activeTab === "privacy" && (
                    <div>
                      <div style={{ background: cardBg, borderRadius: "12px", padding: "0 14px", border: `1px solid ${border}`, marginBottom: "16px" }}>
                        <Toggle label="Show Email on Profile"  value={settings.privacy.showEmail}    onChange={v => upd("privacy","showEmail",v)}    isDark={isDark} />
                        <Toggle label="Show Activity Status"   value={settings.privacy.showActivity} onChange={v => upd("privacy","showActivity",v)} isDark={isDark} />
                      </div>
                      <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6", marginBottom: "6px" }}>ℹ Data & Privacy</div>
                        <div style={{ fontSize: "11px", color: mutedColor, lineHeight: 1.6 }}>
                          Your tasks are stored securely on our servers. We never sell your data. Local settings are stored only in your browser.
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{
              padding: "14px 22px",
              borderTop: `1px solid ${border}`,
              display: "flex", gap: "8px", flexShrink: 0,
              background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)",
            }}>
              <button onClick={reset} style={{
                flex: 1, padding: "10px", borderRadius: "10px",
                border: `1px solid ${border}`, background: "transparent",
                color: mutedColor, cursor: "pointer", fontSize: "12px", fontWeight: 600,
                fontFamily: "inherit", transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = textColor}
                onMouseLeave={e => e.currentTarget.style.color = mutedColor}
              >Reset</button>
              <button onClick={save} disabled={saving} style={{
                flex: 2, padding: "10px", borderRadius: "10px",
                background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                border: "none", color: "white",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(255,107,157,0.3)",
                opacity: saving ? 0.75 : 1, transition: "opacity 0.2s",
              }}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}