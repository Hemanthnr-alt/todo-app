import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth }  from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import { IconBell, IconClose, IconInfo, IconMoon, IconSettingsGear, IconSparkle, IconSun } from "./PremiumChrome";

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

export default function AppSettings({ isOpen, onClose }) {
  const { user } = useAuth();
  const { isDark, toggleTheme, accent, changeAccent, ACCENT_PRESETS } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [pushStatus, setPushStatus] = useState("unknown");
  const [devClicks, setDevClicks] = useState(0);

  const ac = accent || "#6B46FF";
  const getS = (k,def) => { try{const v=localStorage.getItem(`thirty_set_${k}`);return v?JSON.parse(v):def;}catch{return def;} };
  const setS = (k,v) => { localStorage.setItem(`thirty_set_${k}`,JSON.stringify(v)); };

  const [sound,     setSound]     = useState(() => getS("sound",true));
  const [haptic,    setHaptic]    = useState(() => getS("haptic",true));
  const [weekStart, setWeekStart] = useState(() => getS("weekStart","sunday"));

  useEffect(() => { setS("sound",sound); setS("haptic",haptic); setS("weekStart",weekStart); },[sound,haptic,weekStart]);

  useEffect(() => {
    if (isOpen) {
      if ("Notification" in window) setPushStatus(Notification.permission);
      else setPushStatus("unsupported");
    }
  },[isOpen]);

  const reqPush = async () => {
    if (!("Notification" in window)) { toast.error("Push not supported here"); return; }
    try {
      const p = await Notification.requestPermission();
      setPushStatus(p);
      if (p==="granted") toast.success("Notifications enabled!");
      else toast("Notifications disabled.");
    } catch { toast.error("Error asking permission"); }
  };

  const devMode = () => {
    setDevClicks(c => c+1);
    if (devClicks===6) { toast("Developer mode activated"); localStorage.setItem("thirty_dev","true"); }
  };

  if (!isOpen) return null;

  const TABS = [
    { id: "general", Icon: IconSettingsGear, label: "General" },
    { id: "look", Icon: IconSparkle, label: "Appearance" },
    { id: "alerts", Icon: IconBell, label: "Alerts" },
    { id: "about", Icon: IconInfo, label: "About" },
  ];

  const rowStyle = {
    padding:"16px", display:"flex", justifyContent:"space-between",
    alignItems:"center", borderBottom:"0.5px solid var(--border)",
  };

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
          backdropFilter:"blur(6px)", zIndex:8500 }}/>
      <motion.div
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{type:"spring", damping:30, stiffness:320}}
        style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:8501,
          background:"var(--surface)",
          borderRadius:"20px 20px 0 0",
          borderTop:"0.5px solid rgba(255,255,255,0.1)",
          paddingBottom:`calc(env(safe-area-inset-bottom,0px) + 20px)`,
          fontFamily:"var(--font-body)",
          maxHeight:"88vh", display:"flex", flexDirection:"column",
        }}>

        {/* Drag handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:"36px", height:"4px", borderRadius:"2px",
            background:"var(--surface-elevated)" }}/>
        </div>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"8px 20px 20px" }}>
          <h2 style={{ fontSize:"20px", fontWeight:700, margin:0,
            color:"var(--text-primary)", letterSpacing:"-0.02em",
            fontFamily:"var(--font-heading)" }}>Settings</h2>
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

        <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>

          {/* Tabs */}
          <div style={{ display:"flex", gap:"6px", overflowX:"auto",
            padding:"0 16px 12px", marginBottom:"8px" }} className="hide-scrollbar">
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
                    border: active ? `1px solid var(--accent)` : "1px solid var(--border)",
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

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 16px 20px" }}>

            {/* GENERAL */}
            {activeTab==="general" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  exit={{opacity:0,y:-8}} transition={{duration:0.14}}
                  style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

                  {/* Account */}
                  <div>
                    <div className="section-label" style={{ marginBottom:"10px" }}>Account</div>
                    <div style={{ padding:"14px 16px", borderRadius:"14px",
                      background:"var(--surface-raised)",
                      display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ width:"44px", height:"44px", borderRadius:"12px",
                        background: ac, display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:"18px",
                        color:"white", fontWeight:800, fontFamily:"var(--font-heading)" }}>
                        {user?.name?.charAt(0)||"?"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"15px", fontWeight:600, color:"var(--text-primary)" }}>
                          {user?.name||"Guest"}
                        </div>
                        <div style={{ fontSize:"13px", color:"var(--text-muted)" }}>
                          {user?.email||"Not logged in"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System */}
                  <div>
                    <div className="section-label" style={{ marginBottom:"10px" }}>System</div>
                    <div style={{ borderRadius:"14px", background:"var(--surface-raised)", overflow:"hidden" }}>
                      <div style={rowStyle}>
                        <div>
                          <div style={{ fontSize:"15px", fontWeight:500, color:"var(--text-primary)" }}>Sound effects</div>
                          <div style={{ fontSize:"12px", color:"var(--text-muted)", marginTop:"2px" }}>For timers and completion</div>
                        </div>
                        <Toggle checked={sound} onChange={setSound} accent={ac}/>
                      </div>
                      <div style={rowStyle}>
                        <div>
                          <div style={{ fontSize:"15px", fontWeight:500, color:"var(--text-primary)" }}>Haptic feedback</div>
                          <div style={{ fontSize:"12px", color:"var(--text-muted)", marginTop:"2px" }}>Vibrate on actions (mobile)</div>
                        </div>
                        <Toggle checked={haptic} onChange={setHaptic} accent={ac}/>
                      </div>
                      <div style={{ padding:"16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ fontSize:"15px", fontWeight:500, color:"var(--text-primary)" }}>Week starts on</div>
                        <select value={weekStart} onChange={e=>setWeekStart(e.target.value)}
                          style={{ background:"var(--bg)", border:"1px solid var(--border)",
                            color:"var(--text-primary)", padding:"6px 12px",
                            borderRadius:"8px", fontSize:"13px",
                            fontFamily:"inherit", cursor:"pointer" }}>
                          <option value="sunday">Sunday</option>
                          <option value="monday">Monday</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* APPEARANCE */}
            {activeTab==="look" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  exit={{opacity:0,y:-8}} transition={{duration:0.14}}
                  style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

                  {/* Theme */}
                  <div>
                    <div className="section-label" style={{ marginBottom:"10px" }}>Theme</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                      <button
                        type="button"
                        onClick={() => { if (!isDark) toggleTheme(); }}
                        style={{
                          padding: "16px",
                          borderRadius: "16px",
                          background: isDark ? "var(--accent-subtle)" : "var(--surface-raised)",
                          border: isDark ? `1.5px solid var(--accent)` : "1.5px solid var(--border)",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                          transition: "all 0.2s",
                          WebkitTapHighlightColor: "transparent",
                          boxShadow: isDark ? "0 8px 24px var(--accent-glow)" : "none",
                        }}
                      >
                        <span style={{ color: isDark ? "var(--accent)" : "var(--text-muted)" }}>
                          <IconMoon size={28} stroke="currentColor" />
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: isDark ? "var(--accent)" : "var(--text-muted)" }}>Dark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (isDark) toggleTheme(); }}
                        style={{
                          padding: "16px",
                          borderRadius: "16px",
                          background: !isDark ? "var(--accent-subtle)" : "var(--surface-raised)",
                          border: !isDark ? `1.5px solid var(--accent)` : "1.5px solid var(--border)",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                          transition: "all 0.2s",
                          WebkitTapHighlightColor: "transparent",
                          boxShadow: !isDark ? "0 8px 24px var(--accent-glow)" : "none",
                        }}
                      >
                        <span style={{ color: !isDark ? "var(--accent)" : "var(--text-muted)" }}>
                          <IconSun size={28} stroke="currentColor" />
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: !isDark ? "var(--accent)" : "var(--text-muted)" }}>Light</span>
                      </button>
                    </div>
                  </div>

                  {/* Accent */}
                  <div>
                    <div className="section-label" style={{ marginBottom:"10px" }}>Accent colour</div>
                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "16px",
                        background: "var(--surface-raised)",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      {ACCENT_PRESETS.map((preset) => {
                        const sel = ac === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => changeAccent(preset.value)}
                            style={{
                              border: "none",
                              cursor: "pointer",
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
                            <span
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: preset.value,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: sel ? `0 0 0 2px var(--bg), 0 0 0 4px ${preset.value}` : `inset 0 2px 4px rgba(255,255,255,0.25)`,
                              }}
                            >
                              {sel && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: sel ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.02em" }}>{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* ALERTS */}
            {activeTab==="alerts" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  exit={{opacity:0,y:-8}} transition={{duration:0.14}}
                  style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
                  <div>
                    <div className="section-label" style={{ marginBottom:"10px" }}>Push Notifications</div>
                    <div style={{ borderRadius:"14px", background:"var(--surface-raised)", padding:"16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start", marginBottom:"16px" }}>
                        <div style={{ flex:1, paddingRight:"16px" }}>
                          <div style={{ fontSize:"15px", fontWeight:500, color:"var(--text-primary)", marginBottom:"4px" }}>
                            Daily Reminders
                          </div>
                          <div style={{ fontSize:"13px", color:"var(--text-muted)", lineHeight:1.5 }}>
                            Get notified about tasks, habits, and timers.
                          </div>
                        </div>
                        <div style={{ padding:"6px 10px", borderRadius:"8px",
                          background: pushStatus==="granted" ? "var(--success-subtle)"
                            : pushStatus==="denied" ? "var(--danger-subtle)"
                            : "var(--surface-elevated)",
                          color: pushStatus==="granted" ? "var(--success)"
                            : pushStatus==="denied" ? "var(--danger)"
                            : "var(--text-muted)",
                          fontSize:"11px", fontWeight:700, textTransform:"uppercase" }}>
                          {pushStatus}
                        </div>
                      </div>

                      {pushStatus==="default"||pushStatus==="unknown" ? (
                        <button className="btn-primary" onClick={reqPush}
                          style={{ width:"100%", height:"46px", fontSize:"14px" }}>
                          Enable Notifications
                        </button>
                      ) : pushStatus==="denied" ? (
                        <div style={{ padding:"12px", borderRadius:"10px",
                          background:"rgba(255,69,58,0.1)",
                          border:"1px solid rgba(255,69,58,0.25)",
                          display:"flex", gap:"10px", alignItems:"flex-start" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--danger)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>!</div>
                          <div style={{ fontSize:"12px", color:"var(--danger)", lineHeight:1.5 }}>
                            Notifications are blocked. Allow them in device settings.
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding:"12px", borderRadius:"10px",
                          background:"rgba(48,209,88,0.1)",
                          border:"1px solid rgba(48,209,88,0.25)",
                          display:"flex", gap:"10px", alignItems:"flex-start" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--success)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div style={{ fontSize:"12px", color:"var(--success)", lineHeight:1.5 }}>
                            You're all set! Reminders are active.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* ABOUT */}
            {activeTab==="about" && (
              <AnimatePresence mode="wait">
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  exit={{opacity:0,y:-8}} transition={{duration:0.14}}
                  style={{ textAlign:"center", padding:"20px 0" }}>
                  <div onClick={devMode}
                    style={{ width:"80px", height:"80px", borderRadius:"22px",
                      background: ac, margin:"0 auto 16px",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"28px", fontWeight:800, color:"white",
                      boxShadow:`0 8px 32px ${ac}55`, cursor:"default",
                      fontFamily:"var(--font-heading)" }}>
                    30
                  </div>
                  <h3 style={{ fontSize:"20px", fontWeight:700, margin:"0 0 4px",
                    color:"var(--text-primary)", letterSpacing:"-0.02em",
                    fontFamily:"var(--font-heading)" }}>Thirty</h3>
                  <p style={{ fontSize:"14px", color:"var(--text-muted)", margin:"0 0 32px" }}>
                    Version 3.0.0 · Premium
                  </p>

                  <div style={{ display:"flex", flexDirection:"column", gap:"0",
                    background:"var(--surface-raised)", borderRadius:"14px", overflow:"hidden" }}>
                    {["Feedback & Support","Privacy Policy","Terms of Service"].map((item, i, arr) => (
                      <a key={item} href="#"
                        style={{ display:"flex", justifyContent:"space-between", padding:"15px 16px",
                          color:"var(--text-primary)", textDecoration:"none",
                          fontSize:"15px", fontWeight:500,
                          borderBottom: i < arr.length-1 ? "0.5px solid var(--border)" : "none" }}>
                        <span>{item}</span>
                        <span style={{ color:"var(--text-muted)" }}>↗</span>
                      </a>
                    ))}
                  </div>

                  <div style={{ marginTop:"32px", fontSize:"12px", color:"var(--text-muted)", opacity:0.6 }}>
                    Built for focused days — Thirty
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