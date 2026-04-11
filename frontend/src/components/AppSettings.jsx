import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import { IconBell, IconClose, IconFolder, IconInfo, IconMoon, IconSettingsGear, IconSparkle, IconSun } from "./PremiumChrome";

function Toggle({ checked, onChange, accent }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: "48px",
        height: "26px",
        borderRadius: "999px",
        background: checked ? (accent || "var(--accent)") : "var(--surface-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "25px" : "3px",
          width: "18px",
          height: "18px",
          backgroundColor: "white",
          borderRadius: "50%",
          transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.28)",
        }}
      />
    </button>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AppSettings({ isOpen, onClose }) {
  const { user, updateProfile, changePassword } = useAuth();
  const { isDark, toggleTheme, accent, changeAccent, ACCENT_PRESETS, isAccentUnlocked } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [pushStatus, setPushStatus] = useState("unknown");
  const [devClicks, setDevClicks] = useState(0);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const ac = accent || "#6B46FF";
  const getS = (k, def) => { try { const v = localStorage.getItem(`thirty_set_${k}`); return v ? JSON.parse(v) : def; } catch { return def; } };
  const setS = (k, v) => { localStorage.setItem(`thirty_set_${k}`, JSON.stringify(v)); };

  const [sound, setSound] = useState(() => getS("sound", true));
  const [haptic, setHaptic] = useState(() => getS("haptic", true));
  const [weekStart, setWeekStart] = useState(() => getS("weekStart", "sunday"));

  useEffect(() => {
    setS("sound", sound);
    setS("haptic", haptic);
    setS("weekStart", weekStart);
  }, [sound, haptic, weekStart]);

  useEffect(() => {
    if (isOpen) {
      setProfileName(user?.name || "");
      setProfileEmail(user?.email || "");
      setProfileAvatar(user?.avatar || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if ("Notification" in window) setPushStatus(Notification.permission);
      else setPushStatus("unsupported");
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const reqPush = async () => {
    if (!("Notification" in window)) { toast.error("Push not supported here"); return; }
    try {
      const p = await Notification.requestPermission();
      setPushStatus(p);
      if (p === "granted") toast.success("Notifications enabled!");
      else toast("Notifications disabled.");
    } catch {
      toast.error("Error asking permission");
    }
  };

  const devMode = () => {
    setDevClicks((c) => c + 1);
    if (devClicks === 6) {
      toast("Developer mode activated");
      localStorage.setItem("thirty_dev", "true");
    }
  };

  const exportBackup = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        tasks: JSON.parse(localStorage.getItem("30_offline_tasks") || "[]"),
        categories: JSON.parse(localStorage.getItem("30_offline_cats") || "[]"),
        habits: JSON.parse(localStorage.getItem("30_habits") || "[]"),
        projects: JSON.parse(localStorage.getItem("30_offline_projects") || "[]"),
        templates: JSON.parse(localStorage.getItem("30_offline_templates") || "[]"),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `thirty-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const importBackup = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.tasks) localStorage.setItem("30_offline_tasks", JSON.stringify(data.tasks));
        if (data.categories) localStorage.setItem("30_offline_cats", JSON.stringify(data.categories));
        if (data.habits) localStorage.setItem("30_habits", JSON.stringify(data.habits));
        if (data.projects) localStorage.setItem("30_offline_projects", JSON.stringify(data.projects));
        if (data.templates) localStorage.setItem("30_offline_templates", JSON.stringify(data.templates));
        toast.success("Imported - reload to apply");
        setTimeout(() => window.location.reload(), 800);
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleAvatarPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    if (file.size > 1024 * 1024) return toast.error("Profile photo must be under 1MB");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProfileAvatar(dataUrl);
    } catch {
      toast.error("Couldn't read that image");
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim() || !profileEmail.trim()) return toast.error("Name and email are required");
    setSavingProfile(true);
    const result = await updateProfile({ name: profileName.trim(), email: profileEmail.trim(), avatar: profileAvatar || "" });
    setSavingProfile(false);
    if (result.success) toast.success("Profile updated");
    else toast.error(result.error);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error("Fill in all password fields");
    if (newPassword !== confirmPassword) return toast.error("New passwords do not match");
    setSavingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed");
    } else {
      toast.error(result.error);
    }
  };

  const TABS = [
    { id: "general", Icon: IconSettingsGear, label: "General" },
    { id: "look", Icon: IconSparkle, label: "Appearance" },
    { id: "alerts", Icon: IconBell, label: "Alerts" },
    { id: "data", Icon: IconFolder, label: "Data" },
    { id: "about", Icon: IconInfo, label: "About" },
  ];

  const rowStyle = {
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "0.5px solid var(--border)",
  };

  const policySections = useMemo(() => ([
    {
      title: "Feedback & Support",
      body: "For bug reports, account help, and product feedback, email hemanthnaidunr@gmail.com. Please include your device, what happened, and steps to reproduce the issue when possible.",
      action: "mailto:hemanthnaidunr@gmail.com",
      actionLabel: "Email support",
    },
    {
      title: "Privacy Policy",
      body: "Thirty stores your account information, tasks, habits, preferences, and optional profile photo to run the app experience. We do not sell your data, and you should only upload content you are comfortable keeping in your account and backups.",
    },
    {
      title: "Terms of Service",
      body: "By using Thirty, you agree to use the app lawfully and not upload harmful, illegal, or abusive content. You remain responsible for your account security and the content you store in the app.",
    },
  ]), []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 8500 }}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 8501,
          background: "var(--surface)",
          borderRadius: "20px 20px 0 0",
          borderTop: "0.5px solid rgba(255,255,255,0.1)",
          paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 20px)",
          fontFamily: "var(--font-body)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--surface-elevated)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.02em", fontFamily: "var(--font-heading)" }}>
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "12px",
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <IconClose size={16} stroke="currentColor" />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "0 16px 12px", marginBottom: "8px" }} className="hide-scrollbar">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: active ? "var(--accent-subtle)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: active ? 700 : 500,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    WebkitTapHighlightColor: "transparent",
                    boxShadow: active ? "0 4px 14px var(--accent-glow)" : "none",
                  }}
                >
                  <span style={{ display: "inline-flex", opacity: active ? 1 : 0.75 }}>
                    <t.Icon size={16} stroke="currentColor" />
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
            {activeTab === "general" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.14 }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <div className="section-label" style={{ marginBottom: "10px" }}>Profile</div>
                    <div className="glass-tile" style={{ borderRadius: "16px", padding: "16px", display: "grid", gap: "14px" }}>
                      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        {profileAvatar ? (
                          <img src={profileAvatar} alt="Profile" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "18px", border: "1px solid var(--border)" }} />
                        ) : (
                          <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: ac, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "20px", fontFamily: "var(--font-heading)" }}>
                            {profileName?.charAt(0) || user?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{profileName || "Your profile"}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px" }}>{profileEmail || "Add your email"}</div>
                        </div>
                      </div>
                      <label className="glass-tile" style={{ display: "block", borderRadius: "14px", padding: "12px 14px", cursor: "pointer", textAlign: "center", fontWeight: 600, fontSize: "13px" }}>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarPick} />
                        Upload profile photo
                      </label>
                      {profileAvatar && (
                        <button type="button" className="btn-reset" onClick={() => setProfileAvatar("")} style={{ color: "var(--danger)", fontSize: "13px", fontWeight: 700, textAlign: "left" }}>
                          Remove profile photo
                        </button>
                      )}
                      <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Full name" style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
                      <input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="Email address" type="email" style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
                      <button type="button" onClick={handleSaveProfile} className="btn-primary" style={{ height: "46px" }} disabled={savingProfile}>
                        {savingProfile ? "Saving..." : "Save profile"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="section-label" style={{ marginBottom: "10px" }}>Security</div>
                    <div className="glass-tile" style={{ borderRadius: "16px", padding: "16px", display: "grid", gap: "12px" }}>
                      <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" type="password" style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
                      <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
                      <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" type="password" style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
                      <button type="button" onClick={handleChangePassword} className="btn-primary" style={{ height: "46px" }} disabled={savingPassword}>
                        {savingPassword ? "Updating..." : "Change password"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="section-label" style={{ marginBottom: "10px" }}>System</div>
                    <div style={{ borderRadius: "14px", background: "var(--surface-raised)", overflow: "hidden" }}>
                      <div style={rowStyle}>
                        <div>
                          <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>Sound effects</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>For timers and completion</div>
                        </div>
                        <Toggle checked={sound} onChange={setSound} accent={ac} />
                      </div>
                      <div style={rowStyle}>
                        <div>
                          <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>Haptic feedback</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Vibrate on actions (mobile)</div>
                        </div>
                        <Toggle checked={haptic} onChange={setHaptic} accent={ac} />
                      </div>
                      <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>Week starts on</div>
                        <select value={weekStart} onChange={(e) => setWeekStart(e.target.value)} style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer" }}>
                          <option value="sunday">Sunday</option>
                          <option value="monday">Monday</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {activeTab === "look" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.14 }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <div className="section-label" style={{ marginBottom: "10px" }}>Theme</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <button type="button" onClick={() => { if (!isDark) toggleTheme(); }} style={{ padding: "16px", borderRadius: "16px", background: isDark ? "var(--accent-subtle)" : "var(--surface-raised)", border: isDark ? "1.5px solid var(--accent)" : "1.5px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", transition: "all 0.2s", WebkitTapHighlightColor: "transparent", boxShadow: isDark ? "0 8px 24px var(--accent-glow)" : "none" }}>
                        <span style={{ color: isDark ? "var(--accent)" : "var(--text-muted)" }}><IconMoon size={28} stroke="currentColor" /></span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: isDark ? "var(--accent)" : "var(--text-muted)" }}>Dark</span>
                      </button>
                      <button type="button" onClick={() => { if (isDark) toggleTheme(); }} style={{ padding: "16px", borderRadius: "16px", background: !isDark ? "var(--accent-subtle)" : "var(--surface-raised)", border: !isDark ? "1.5px solid var(--accent)" : "1.5px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", transition: "all 0.2s", WebkitTapHighlightColor: "transparent", boxShadow: !isDark ? "0 8px 24px var(--accent-glow)" : "none" }}>
                        <span style={{ color: !isDark ? "var(--accent)" : "var(--text-muted)" }}><IconSun size={28} stroke="currentColor" /></span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: !isDark ? "var(--accent)" : "var(--text-muted)" }}>Light</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="section-label" style={{ marginBottom: "10px" }}>Accent colour</div>
                    <div style={{ padding: "14px", borderRadius: "16px", background: "var(--surface-raised)", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "12px" }}>
                      {ACCENT_PRESETS.map((preset) => {
                        const sel = ac === preset.value;
                        const locked = typeof isAccentUnlocked === "function" && !isAccentUnlocked(preset);
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => {
                              if (locked) {
                                toast(`Unlock at ${preset.unlockStreak}-day streak (Rewards)`);
                                return;
                              }
                              changeAccent(preset.value);
                            }}
                            style={{
                              border: "none",
                              cursor: locked ? "not-allowed" : "pointer",
                              opacity: locked ? 0.45 : 1,
                              padding: "8px 4px",
                              borderRadius: "14px",
                              background: sel ? "var(--accent-subtle)" : "transparent",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "8px",
                              transition: "transform 0.15s, box-shadow 0.15s",
                              WebkitTapHighlightColor: "transparent",
                              boxShadow: sel ? `0 0 0 1px ${preset.value}55, 0 6px 18px ${preset.value}33` : "none",
                            }}
                          >
                            <span style={{ width: "40px", height: "40px", borderRadius: "50%", background: preset.value, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: sel ? `0 0 0 2px var(--bg), 0 0 0 4px ${preset.value}` : "inset 0 2px 4px rgba(255,255,255,0.25)" }}>
                              {sel && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: sel ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.02em" }}>
                              {locked ? `${preset.name} · Locked` : preset.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {activeTab === "alerts" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.14 }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <div className="section-label" style={{ marginBottom: "10px" }}>Push Notifications</div>
                    <div style={{ borderRadius: "14px", background: "var(--surface-raised)", padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div style={{ flex: 1, paddingRight: "16px" }}>
                          <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>Daily Reminders</div>
                          <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>Get notified about tasks, habits, and timers.</div>
                        </div>
                        <div style={{ padding: "6px 10px", borderRadius: "8px", background: pushStatus === "granted" ? "var(--success-subtle)" : pushStatus === "denied" ? "var(--danger-subtle)" : "var(--surface-elevated)", color: pushStatus === "granted" ? "var(--success)" : pushStatus === "denied" ? "var(--danger)" : "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          {pushStatus}
                        </div>
                      </div>

                      {pushStatus === "default" || pushStatus === "unknown" ? (
                        <button className="btn-primary" onClick={reqPush} style={{ width: "100%", height: "46px", fontSize: "14px" }}>Enable Notifications</button>
                      ) : pushStatus === "denied" ? (
                        <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.25)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--danger)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>!</div>
                          <div style={{ fontSize: "12px", color: "var(--danger)", lineHeight: 1.5 }}>Notifications are blocked. Allow them in device settings.</div>
                        </div>
                      ) : (
                        <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.25)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--success)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--success)", lineHeight: 1.5 }}>You're all set! Reminders are active.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {activeTab === "data" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.14 }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="section-label">Backup & restore</div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                    Exports cached tasks, categories, and habits from this device. Sign in and sync for server copies.
                  </p>
                  <button type="button" className="btn-primary" style={{ height: "46px", fontWeight: 700 }} onClick={exportBackup}>
                    Download JSON backup
                  </button>
                  <label className="glass-tile" style={{ display: "block", borderRadius: "14px", padding: "14px", cursor: "pointer", textAlign: "center", fontWeight: 600, fontSize: "14px" }}>
                    <input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); }} />
                    Restore from JSON file
                  </label>
                </motion.div>
              </AnimatePresence>
            )}

            {activeTab === "about" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.14 }} style={{ display: "flex", flexDirection: "column", gap: "18px", padding: "10px 0 20px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div onClick={devMode} style={{ width: "80px", height: "80px", borderRadius: "22px", background: ac, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, color: "white", boxShadow: `0 8px 32px ${ac}55`, cursor: "default", fontFamily: "var(--font-heading)" }}>
                      30
                    </div>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)", letterSpacing: "-0.02em", fontFamily: "var(--font-heading)" }}>Thirty</h3>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>Version 3.0.0 · Premium</p>
                  </div>

                  {policySections.map((section) => (
                    <div key={section.title} className="glass-tile" style={{ borderRadius: "16px", padding: "16px", display: "grid", gap: "10px" }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{section.title}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>{section.body}</div>
                      {section.action && (
                        <a href={section.action} style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                          {section.actionLabel}
                        </a>
                      )}
                    </div>
                  ))}

                  <div style={{ fontSize: "12px", color: "var(--text-muted)", opacity: 0.7, textAlign: "center" }}>
                    Built for focused days - Thirty
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      </motion.div>
    </>
  );
}
