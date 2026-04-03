import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, ACCENT_PRESETS } from "../context/ThemeContext";
import { useAuth }     from "../context/AuthContext";
import { isNativeApp } from "../services/storage";
import api  from "../services/api";
import toast from "react-hot-toast";
import {
  requestNotificationPermission,
  checkPermissionStatus,
  sendNotification,
} from "../services/notifications";

const NATIVE = isNativeApp();

const DEFAULTS = {
  notifications: { browser:false, dueReminders:true, reminderTime:"1hour" },
  appearance:    { compactView:false, showCompleted:true, animationsEnabled:true },
};

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("tp_settings")||"null");
    if (!s) return structuredClone(DEFAULTS);
    return {
      notifications: { ...DEFAULTS.notifications, ...s.notifications },
      appearance:    { ...DEFAULTS.appearance,    ...s.appearance    },
    };
  } catch { return structuredClone(DEFAULTS); }
}

function getNetworkEnabled() {
  try { return JSON.parse(localStorage.getItem("thirty_network")??"true"); } catch { return true; }
}

/* ── Toggle component ───────────────────────────────────────────────────────── */
function Toggle({ label, desc, value, onChange, isDark, accent="#ff6b9d" }) {
  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.42)" : "rgba(15,23,42,0.42)";
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"}` }}>
      <div style={{ flex:1,paddingRight:"16px" }}>
        <div style={{ fontSize:"13px",fontWeight:600,color:textColor,marginBottom:desc?"2px":0 }}>{label}</div>
        {desc && <div style={{ fontSize:"11px",color:mutedColor,lineHeight:1.4 }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{ width:"44px",height:"24px",borderRadius:"12px",cursor:"pointer",background:value?`linear-gradient(135deg,${accent},${accent}cc)`:(isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"),position:"relative",transition:"background 0.22s",flexShrink:0,border:"none",outline:"none",boxShadow:value?`0 2px 10px ${accent}44`:"none",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}
      >
        <div style={{ position:"absolute",top:"3px",left:value?"23px":"3px",width:"18px",height:"18px",borderRadius:"9px",background:"white",boxShadow:"0 1px 4px rgba(0,0,0,0.22)",transition:"left 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}/>
      </button>
    </div>
  );
}

/* ── Change password ────────────────────────────────────────────────────────── */
function ChangePassword({ isDark, textColor, mutedColor, border, inputBg, accent }) {
  const [show,    setShow]    = useState(false);
  const [current, setCurrent] = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const iStyle = {
    width:"100%",padding:"11px 14px",borderRadius:"10px",
    border:`1px solid ${border}`,background:inputBg,color:textColor,
    fontSize:"13px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",
    WebkitAppearance:"none",
  };

  const handle = async () => {
    if (!current||!newPw||!confirm) { toast.error("Fill all fields"); return; }
    if (newPw !== confirm)          { toast.error("Passwords don't match"); return; }
    if (newPw.length < 6)           { toast.error("Min 6 characters"); return; }
    setSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword:current, newPassword:newPw });
      toast.success("Password updated ✓");
      setCurrent(""); setNewPw(""); setConfirm(""); setShow(false);
    } catch (err) { toast.error(err.response?.data?.error||"Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ marginTop:"14px" }}>
      <button
        onClick={() => setShow(!show)}
        style={{ width:"100%",padding:"11px 14px",borderRadius:"12px",border:`1px solid ${border}`,background:show?`${accent}10`:(isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"),color:show?accent:textColor,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}
      >
        <span>🔑 Change Password</span>
        <span style={{ fontSize:"12px",color:mutedColor }}>{show?"▲":"▼"}</span>
      </button>

      <AnimatePresence>
        {show && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
            <div style={{ padding:"12px 0 0",display:"flex",flexDirection:"column",gap:"9px" }}>
              {[
                { l:"Current password", v:current, s:setCurrent },
                { l:"New password",     v:newPw,   s:setNewPw   },
                { l:"Confirm new",      v:confirm, s:setConfirm },
              ].map(({ l,v,s }) => (
                <input key={l}
                  type={showPw?"text":"password"}
                  placeholder={l}
                  value={v}
                  onChange={e => s(e.target.value)}
                  style={iStyle}
                  onFocus={e => e.target.style.borderColor = accent}
                  onBlur={e  => e.target.style.borderColor = border}
                />
              ))}
              <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                <input type="checkbox" id="showpw_set" checked={showPw} onChange={e=>setShowPw(e.target.checked)} style={{ accentColor:accent,cursor:"pointer",width:"16px",height:"16px" }}/>
                <label htmlFor="showpw_set" style={{ fontSize:"12px",color:mutedColor,cursor:"pointer" }}>Show passwords</label>
              </div>
              <motion.button whileTap={{scale:0.97}} onClick={handle} disabled={saving}
                style={{ padding:"11px",borderRadius:"10px",background:`linear-gradient(135deg,${accent},${accent}cc)`,border:"none",color:"white",cursor:saving?"not-allowed":"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit",opacity:saving?0.75:1,WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                {saving?"Saving…":"Update Password"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main AppSettings ───────────────────────────────────────────────────────── */
export default function AppSettings({ isOpen, onClose }) {
  const { isDark, toggleTheme, accent, changeAccent } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const [settings,      setSettings]      = useState(loadSettings);
  const [saving,        setSaving]        = useState(false);
  const [activeTab,     setActiveTab]     = useState("appearance");
  const [notifGranted,  setNotifGranted]  = useState(false);
  const [networkOn,     setNetworkOn]     = useState(getNetworkEnabled);
  const [backingUp,     setBackingUp]     = useState(false);

  const ac = accent || "#ff6b9d";

  useEffect(() => {
    if (!isOpen) return;
    checkPermissionStatus().then(setNotifGranted);
    setActiveTab("appearance");
  }, [isOpen]);

  const upd = (cat, key, val) =>
    setSettings(p => ({ ...p, [cat]:{ ...p[cat], [key]:val } }));

  /* ── Notifications ── */
  const handleEnableNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      upd("notifications","browser",true);
      toast.success("Notifications enabled! 🔔");
      await sendNotification({ title:"Thirty — Notifications on", body:"You'll now get task reminders." });
    } else {
      toast.error("Denied — enable in device Settings app");
    }
  };

  /* ── Internet toggle (APK) ── */
  const toggleNetwork = (val) => {
    setNetworkOn(val);
    localStorage.setItem("thirty_network", JSON.stringify(val));
    toast(val ? "Internet access on" : "Offline-only mode on");
  };

  /* ── Backup ── */
  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const data = {
        tasks:      JSON.parse(localStorage.getItem("30app_tasks")||"[]"),
        habits:     JSON.parse(localStorage.getItem("30app_habits")||"[]"),
        categories: JSON.parse(localStorage.getItem("30app_categories")||"[]"),
        exportedAt: new Date().toISOString(), version:"1.0",
      };
      const blob = new Blob([JSON.stringify(data,null,2)],{ type:"application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `thirty-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Backup downloaded ✓");
    } catch { toast.error("Backup failed"); }
    finally { setBackingUp(false); }
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.tasks)      localStorage.setItem("30app_tasks",      JSON.stringify(data.tasks));
      if (data.habits)     localStorage.setItem("30app_habits",     JSON.stringify(data.habits));
      if (data.categories) localStorage.setItem("30app_categories", JSON.stringify(data.categories));
      toast.success("Restored! Refresh to see changes ✓");
      e.target.value = "";
    } catch { toast.error("Invalid backup file"); }
  };

  /* ── Save ── */
  const save = async () => {
    setSaving(true);
    try {
      localStorage.setItem("tp_settings", JSON.stringify(settings));
      if (!settings.appearance.animationsEnabled) {
        document.documentElement.style.setProperty("--motion-duration","0s");
      } else {
        document.documentElement.style.removeProperty("--motion-duration");
      }
      if (isAuthenticated && !NATIVE) {
        try {
          await api.put("/user/notifications",{
            dueDateReminders: settings.notifications.dueReminders,
            reminderTime:     settings.notifications.reminderTime,
            emailReminders:   settings.notifications.dueReminders,
          });
        } catch {}
      }
      toast.success("Settings saved ✓");
      onClose();
    } finally { setSaving(false); }
  };

  /* ── Colours ── */
  const bg         = isDark ? "rgba(8,6,16,0.98)"       : "rgba(250,251,253,0.98)";
  const border     = isDark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.07)";
  const textColor  = isDark ? "#f1f5f9"                 : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.42)"  : "rgba(15,23,42,0.42)";
  const cardBg     = isDark ? "rgba(255,255,255,0.04)"  : "rgba(0,0,0,0.03)";
  const inputBg    = isDark ? "rgba(255,255,255,0.07)"  : "#f8fafc";

  const TABS = [
    { id:"appearance",    icon:"🎨", label:"Look"    },
    { id:"notifications", icon:"🔔", label:"Alerts"  },
    { id:"data",          icon:"💾", label:"Data"    },
    { id:"account",       icon:"👤", label:"Account" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={onClose}
            style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000 }}/>

          <motion.div
            initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}}
            transition={{ type:"spring", damping:32, stiffness:290 }}
            style={{ position:"fixed",top:0,right:0,height: "calc(var(--vh, 1vh) * 100)",width:"min(420px,100vw)",background:bg,backdropFilter:"blur(28px)",borderLeft:`1px solid ${border}`,boxShadow:"-8px 0 56px rgba(0,0,0,0.22)",zIndex:1001,display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif" }}
          >
            {/* Header */}
            <div style={{ padding:"18px 22px 16px",borderBottom:`1px solid ${border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px" }}>
                  <div style={{ width:"28px",height:"28px",borderRadius:"8px",background:`linear-gradient(135deg,${ac},${ac}cc)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:900,color:"white",letterSpacing:"-0.04em" }}>
                    30
                  </div>
                  <h2 style={{ fontSize:"17px",fontWeight:800,margin:0,color:textColor,letterSpacing:"-0.04em" }}>Settings</h2>
                </div>
                <p style={{ fontSize:"11px",color:mutedColor,margin:0 }}>Customise your Thirty experience</p>
              </div>
              <button
                onClick={onClose}
                style={{ width:"32px",height:"32px",borderRadius:"9px",background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",border:`1px solid ${border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:mutedColor,fontSize:"14px",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                ✕
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display:"flex",padding:"10px 16px 0",gap:"4px",flexShrink:0,borderBottom:`1px solid ${border}`,overflowX:"auto" }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ padding:"7px 12px",borderRadius:"8px 8px 0 0",border:`1px solid ${activeTab===tab.id?border:"transparent"}`,borderBottom:activeTab===tab.id?`2px solid ${ac}`:"2px solid transparent",background:activeTab===tab.id?(isDark?`${ac}12`:`${ac}08`):"transparent",color:activeTab===tab.id?ac:mutedColor,cursor:"pointer",fontSize:"12px",fontWeight:activeTab===tab.id?700:500,fontFamily:"inherit",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:"5px",transition:"all 0.15s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                  <span>{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex:1,overflowY:"auto",padding:"20px 22px" }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.14}}>

                  {/* ── APPEARANCE ── */}
                  {activeTab === "appearance" && (
                    <div>
                      <label style={{ fontSize:"10px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:"10px" }}>Theme</label>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"22px" }}>
                        {[{v:"dark",l:"🌙 Dark",d:"Easy on the eyes"},{v:"light",l:"☀️ Light",d:"Bright & clean"}].map(opt => {
                          const active = (isDark?"dark":"light") === opt.v;
                          return (
                            <button key={opt.v} onClick={() => { if (!active) toggleTheme(); }}
                              style={{ padding:"12px",borderRadius:"12px",border:`1.5px solid ${active?ac:border}`,background:active?`${ac}12`:cardBg,color:active?ac:textColor,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all 0.18s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                              <div style={{ fontSize:"13px",fontWeight:700,marginBottom:"2px" }}>{opt.l}</div>
                              <div style={{ fontSize:"11px",color:active?ac:mutedColor }}>{opt.d}</div>
                            </button>
                          );
                        })}
                      </div>

                      <label style={{ fontSize:"10px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:"10px" }}>Accent Colour</label>
                      <div style={{ display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"22px",alignItems:"center" }}>
                        {ACCENT_PRESETS.map(p => (
                          <button key={p.value} onClick={() => changeAccent(p.value)} title={p.name}
                            style={{ width:"32px",height:"32px",borderRadius:"50%",background:p.value,border:ac===p.value?"3px solid white":"2px solid transparent",boxShadow:ac===p.value?`0 0 0 2px ${p.value}, 0 4px 12px ${p.value}55`:"none",cursor:"pointer",transition:"all 0.15s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}/>
                        ))}
                        <input type="color" value={ac} onChange={e => changeAccent(e.target.value)} title="Custom colour"
                          style={{ width:"32px",height:"32px",borderRadius:"50%",border:`2px solid ${border}`,cursor:"pointer",padding:0,background:"transparent" }}/>
                      </div>

                      <div style={{ background:cardBg,borderRadius:"12px",padding:"0 14px",border:`1px solid ${border}` }}>
                        <Toggle label="Compact View"         desc="Reduce spacing between items"   value={settings.appearance.compactView}       onChange={v=>upd("appearance","compactView",v)}       isDark={isDark} accent={ac}/>
                        <Toggle label="Show Completed Tasks" desc="Keep completed items visible"   value={settings.appearance.showCompleted}     onChange={v=>upd("appearance","showCompleted",v)}     isDark={isDark} accent={ac}/>
                        <Toggle label="Enable Animations"    desc="Smooth transitions and effects" value={settings.appearance.animationsEnabled} onChange={v=>upd("appearance","animationsEnabled",v)} isDark={isDark} accent={ac}/>
                      </div>
                    </div>
                  )}

                  {/* ── NOTIFICATIONS ── */}
                  {activeTab === "notifications" && (
                    <div>
                      {/* Status card */}
                      <div style={{ padding:"14px 15px",borderRadius:"14px",background:notifGranted?"rgba(16,185,129,0.08)":"rgba(245,158,11,0.08)",border:`1px solid ${notifGranted?"rgba(16,185,129,0.25)":"rgba(245,158,11,0.25)"}`,marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px" }}>
                        <div>
                          <div style={{ fontSize:"13px",fontWeight:700,color:notifGranted?"#10b981":"#f59e0b" }}>
                            {notifGranted ? "✓ Notifications enabled" : "⚠ Notifications blocked"}
                          </div>
                          <div style={{ fontSize:"11px",color:mutedColor,marginTop:"3px" }}>
                            {notifGranted ? "You'll receive task reminders" : "Tap Enable to allow notifications"}
                          </div>
                        </div>
                        {!notifGranted && (
                          <button
                            onClick={handleEnableNotif}
                            style={{ padding:"10px 16px",borderRadius:"10px",background:"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit",flexShrink:0,minHeight:"44px",minWidth:"80px",WebkitTapHighlightColor:"transparent",touchAction:"manipulation",userSelect:"none" }}>
                            Enable
                          </button>
                        )}
                      </div>

                      <div style={{ background:cardBg,borderRadius:"12px",padding:"0 14px",border:`1px solid ${border}`,marginBottom:"16px" }}>
                        <Toggle
                          label="Push Notifications" desc="Alerts when tasks are due"
                          value={settings.notifications.browser && notifGranted}
                          onChange={v => { if (v && !notifGranted) handleEnableNotif(); else upd("notifications","browser",v); }}
                          isDark={isDark} accent={ac}
                        />
                        <Toggle
                          label="Due Date Reminders" desc="Alert before tasks are due"
                          value={settings.notifications.dueReminders}
                          onChange={v => upd("notifications","dueReminders",v)}
                          isDark={isDark} accent={ac}
                        />
                      </div>

                      {settings.notifications.dueReminders && (
                        <div style={{ background:cardBg,borderRadius:"12px",padding:"14px",border:`1px solid ${border}` }}>
                          <label style={{ fontSize:"10px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:"10px" }}>Reminder Lead Time</label>
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px" }}>
                            {[{v:"15min",l:"15 min"},{v:"30min",l:"30 min"},{v:"1hour",l:"1 hour"},{v:"1day",l:"1 day"}].map(opt => (
                              <button key={opt.v} onClick={() => upd("notifications","reminderTime",opt.v)}
                                style={{ padding:"10px",borderRadius:"10px",border:`1.5px solid ${settings.notifications.reminderTime===opt.v?ac:border}`,background:settings.notifications.reminderTime===opt.v?`${ac}12`:"transparent",color:settings.notifications.reminderTime===opt.v?ac:textColor,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"inherit",transition:"all 0.15s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                                {opt.l}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── DATA ── */}
                  {activeTab === "data" && (
                    <div>
                      {/* Internet toggle — APK only */}
                      {NATIVE && (
                        <div style={{ background:cardBg,borderRadius:"12px",padding:"0 14px",border:`1px solid ${border}`,marginBottom:"16px" }}>
                          <Toggle
                            label="Internet Access"
                            desc="Allow app to sync with server. Off = fully offline."
                            value={networkOn} onChange={toggleNetwork}
                            isDark={isDark} accent={ac}
                          />
                        </div>
                      )}

                      <label style={{ fontSize:"10px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:"12px" }}>Local Backup</label>
                      <div style={{ display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px" }}>
                        <motion.button whileTap={{scale:0.97}} onClick={handleBackup} disabled={backingUp}
                          style={{ padding:"12px 16px",borderRadius:"12px",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"white",cursor:backingUp?"not-allowed":"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"8px",justifyContent:"center",opacity:backingUp?0.7:1,WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                          ⬇ {backingUp?"Preparing…":"Export Backup (.json)"}
                        </motion.button>
                        <label
                          style={{ padding:"12px 16px",borderRadius:"12px",background:cardBg,border:`1px solid ${border}`,color:textColor,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"8px",justifyContent:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                          ⬆ Import Backup
                          <input type="file" accept=".json" onChange={handleRestore} style={{ display:"none" }}/>
                        </label>
                      </div>

                      <div style={{ padding:"14px",borderRadius:"12px",background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.18)",marginBottom:"16px" }}>
                        <div style={{ fontSize:"12px",fontWeight:700,color:"#3b82f6",marginBottom:"6px" }}>ℹ About your data</div>
                        <div style={{ fontSize:"11px",color:mutedColor,lineHeight:1.7 }}>
                          {NATIVE ? "APK: data stored on device. Export regularly to back up." : "Web: data synced to our servers. Export for an offline copy."}
                        </div>
                      </div>

                      <div style={{ padding:"14px",borderRadius:"12px",background:"rgba(244,63,94,0.06)",border:"1px solid rgba(244,63,94,0.15)" }}>
                        <div style={{ fontSize:"12px",fontWeight:700,color:"#f43f5e",marginBottom:"4px" }}>⚠ Danger Zone</div>
                        <div style={{ fontSize:"11px",color:mutedColor,marginBottom:"10px" }}>Cannot be undone.</div>
                        <button onClick={() => { if(window.confirm("Clear all local data?")){ localStorage.clear(); toast("Local data cleared"); } }}
                          style={{ padding:"8px 14px",borderRadius:"8px",background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.2)",color:"#f43f5e",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                          Clear local data
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── ACCOUNT ── */}
                  {activeTab === "account" && (
                    <div>
                      {isAuthenticated ? (
                        <>
                          <div style={{ padding:"16px",borderRadius:"16px",background:`${ac}0f`,border:`1px solid ${ac}25`,display:"flex",gap:"14px",alignItems:"center",marginBottom:"18px" }}>
                            <div style={{ width:"52px",height:"52px",borderRadius:"14px",background:`linear-gradient(135deg,${ac},${ac}cc)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:800,color:"white",flexShrink:0,boxShadow:`0 4px 16px ${ac}44` }}>
                              {user?.name?.charAt(0)?.toUpperCase()||"?"}
                            </div>
                            <div>
                              <div style={{ fontSize:"15px",fontWeight:800,color:textColor }}>{user?.name}</div>
                              <div style={{ fontSize:"12px",color:mutedColor,marginTop:"2px" }}>{user?.email}</div>
                              <div style={{ marginTop:"6px",display:"inline-flex",alignItems:"center",gap:"4px",padding:"2px 8px",borderRadius:"6px",background:"rgba(16,185,129,0.12)",color:"#10b981",fontSize:"10px",fontWeight:700 }}>✓ Active</div>
                            </div>
                          </div>

                          <div style={{ background:cardBg,borderRadius:"12px",border:`1px solid ${border}`,overflow:"hidden",marginBottom:"14px" }}>
                            {[{l:"Name",v:user?.name,i:"👤"},{l:"Email",v:user?.email,i:"✉️"}].map((row,idx) => (
                              <div key={row.l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderBottom:idx===0?`1px solid ${border}`:"none" }}>
                                <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                                  <span style={{ fontSize:"13px" }}>{row.i}</span>
                                  <span style={{ fontSize:"12px",color:mutedColor }}>{row.l}</span>
                                </div>
                                <span style={{ fontSize:"12px",fontWeight:600,color:textColor }}>{row.v}</span>
                              </div>
                            ))}
                          </div>

                          <ChangePassword isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} inputBg={inputBg} accent={ac}/>
                        </>
                      ) : (
                        <div style={{ textAlign:"center",padding:"48px 20px" }}>
                          <div style={{ fontSize:"44px",marginBottom:"12px" }}>👋</div>
                          <h3 style={{ fontSize:"16px",fontWeight:700,color:textColor,margin:"0 0 8px" }}>Not signed in</h3>
                          <p style={{ fontSize:"13px",color:mutedColor }}>Sign in to sync tasks across devices</p>
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{ padding:"14px 22px",borderTop:`1px solid ${border}`,display:"flex",gap:"8px",flexShrink:0,background:isDark?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.4)" }}>
              <button
                onClick={() => { setSettings(structuredClone(DEFAULTS)); localStorage.removeItem("tp_settings"); toast("Reset to defaults"); }}
                style={{ flex:1,padding:"10px",borderRadius:"10px",border:`1px solid ${border}`,background:"transparent",color:mutedColor,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                Reset
              </button>
              <button onClick={save} disabled={saving}
                style={{ flex:2,padding:"10px",borderRadius:"10px",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"white",cursor:saving?"not-allowed":"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit",boxShadow:`0 4px 14px ${ac}44`,opacity:saving?0.75:1,WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                {saving?"Saving…":"Save Changes"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}