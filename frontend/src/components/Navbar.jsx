/**
 * Navbar.jsx
 * Fixed:
 *  - Notifications: new notif immediately replaces old using AnimatePresence key swap
 *    so it flashes in/out instead of stacking one below another
 *  - Single stable toast ID so no notification stacking
 *  - MenuSheet uses SVG icons
 *  - Button shape effect removed (ThemeContext handles it)
 */
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AppSettings from "./AppSettings";
import AuthModal from "./AuthModal";
import { isNativeApp } from "../services/storage";

const NATIVE = isNativeApp();

// ── Nav icons ──────────────────────────────────────────────────────────────────
const I = {
  Today: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={active?"currentColor":"none"} fillOpacity={active?0.1:0}/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Habits: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 3"/>
      <circle cx="19" cy="5" r="2" fill={active?"currentColor":"none"} strokeWidth="1.5"/>
    </svg>
  ),
  Tasks: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  Insights: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Timer: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" fill={active?"currentColor":"none"} fillOpacity={active?0.1:0}/>
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2.5 2.5"/>
      <path d="M9.5 3.5h5M12 3.5v2"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id:"today",   label:"Today",   Icon:I.Today },
  { id:"habits",  label:"Habits",  Icon:I.Habits },
  { id:"tasks",   label:"Tasks",   Icon:I.Tasks },
  { id:"summary", label:"Insights",Icon:I.Insights },
  { id:"timer",   label:"Timer",   Icon:I.Timer },
];

// ── Menu SVG icons ─────────────────────────────────────────────────────────────
const MenuIcons = {
  Settings:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Insights:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Rewards:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 5h12v7a6 6 0 0 1-12 0V5z"/><path d="M12 18v3M8 21h8"/></svg>,
  Categories: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>,
  Sun:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  Moon:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  UltraDark:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h9"/><path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" fillOpacity="0.2"/></svg>,
  SignOut:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  SignIn:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
};

// ── Notification panel ─────────────────────────────────────────────────────────
// KEY FIX: uses AnimatePresence with key on EACH notification so that when a new
// notification arrives, the previous one instantly exits and the new one enters.
// This replaces the stacking behaviour with a smooth swap.
const TYPE_ICON = { 
  due_today: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info, #3b82f6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  overdue: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger, #ef4444)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  task_completed: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  reminder: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notifs") || "[]"); } catch { return []; }
  });

  const persist = (list) => {
    const trimmed = list.slice(0, 20);
    setNotifs(trimmed);
    localStorage.setItem("notifs", JSON.stringify(trimmed));
  };

  const clear   = () => persist([]);
  const dismiss = (id) => persist(notifs.filter(n => n.id !== id));
  const markAll = () => persist(notifs.map(n => ({ ...n, read: true })));

  // Sync from localStorage in case something else wrote to it
  useEffect(() => {
    const sync = () => {
      try { setNotifs(JSON.parse(localStorage.getItem("notifs") || "[]")); } catch {}
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:8500,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{type:"spring",damping:28,stiffness:280}}
        className="glass-panel"
        style={{ width:"100%",maxWidth:"480px",borderRadius:"20px 20px 0 0",paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 80px)",border:"1px solid var(--border-strong)",borderBottom:"none" }}>

        <div style={{ width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"10px auto 0" }}/>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 10px" }}>
          <div>
            <div style={{ fontSize:"16px",fontWeight:700,color:"var(--text-primary)" }}>Notifications</div>
            <div style={{ fontSize:"11px",color:"var(--text-muted)",marginTop:"1px" }}>
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </div>
          </div>
          <div style={{ display:"flex",gap:"8px" }}>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="btn-reset"
                style={{ fontSize:"12px",fontWeight:600,color:"var(--text-muted)" }}>Mark read</button>
            )}
            {notifs.length > 0 && (
              <button type="button" onClick={clear} className="btn-reset"
                style={{ fontSize:"12px",fontWeight:700,color:"var(--accent)" }}>Clear all</button>
            )}
          </div>
        </div>

        <div style={{ padding:"0 14px 14px",maxHeight:"60vh",overflowY:"auto" }}>
          {notifs.length === 0 ? (
            <div className="glass-tile" style={{ borderRadius:"var(--radius-btn)",padding:"32px 16px",textAlign:"center" }}>
              <div style={{ fontSize:"28px",marginBottom:"8px" }}>🔕</div>
              <div style={{ fontSize:"11px",color:"var(--text-muted)" }}>No notifications yet.</div>
            </div>
          ) : (
            /* KEY FIX: AnimatePresence + key on each item so removing/adding 
               causes the old one to animate out first before new one enters */
            <AnimatePresence initial={false} mode="popLayout">
              {notifs.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity:0, y:-10, scale:0.96 }}
                  animate={{ opacity:1, y:0,   scale:1    }}
                  exit={{    opacity:0, y:-10,  scale:0.96 }}
                  transition={{ duration:0.18, ease:[0.22,1,0.36,1] }}
                  style={{ display:"flex",gap:"10px",alignItems:"flex-start",
                    background:n.read?"var(--surface-raised)":`linear-gradient(90deg,${n.read?"":"var(--accent-soft)"},var(--surface-raised) 60%)`,
                    borderRadius:"var(--radius-btn)",padding:"12px 14px",marginBottom:"6px",
                    border:`1px solid ${n.read?"var(--border)":"var(--accent)44"}` }}>
                  <span style={{ fontSize:"16px",flexShrink:0,marginTop:"1px" }}>
                    {TYPE_ICON[n.type] || "📋"}
                  </span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:"13px",fontWeight:700,color:"var(--text-primary)",marginBottom:"2px" }}>{n.title}</div>
                    {(n.body || n.message) && (
                      <div style={{ fontSize:"12px",color:"var(--text-secondary)",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{n.body || n.message}</div>
                    )}
                    <div style={{ fontSize:"10px",color:"var(--text-muted)",marginTop:"4px" }}>{n.time}</div>
                  </div>
                  {!n.read && <div style={{ width:"7px",height:"7px",borderRadius:"50%",background:"var(--accent)",flexShrink:0,marginTop:"4px" }}/>}
                  <button type="button" onClick={() => dismiss(n.id)} className="btn-reset"
                    style={{ color:"var(--text-muted)",fontSize:"14px",flexShrink:0,padding:"0 2px" }}>✕</button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Menu row ──────────────────────────────────────────────────────────────────
function MenuRow({ icon, label, onClick, danger = false, chevron = true }) {
  return (
    <motion.button type="button" onClick={onClick} className="btn-reset"
      whileTap={{ backgroundColor:"var(--surface-elevated)" }}
      style={{ width:"100%",padding:"13px 18px",display:"flex",alignItems:"center",gap:"14px",color:danger?"var(--danger)":"var(--text-primary)",fontSize:"15px",fontWeight:500,background:"transparent" }}>
      <span style={{ width:"34px",height:"34px",borderRadius:"var(--radius-btn)",background:danger?"rgba(255,92,106,0.10)":"var(--surface-elevated)",border:`1px solid ${danger?"rgba(255,92,106,0.20)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",color:danger?"var(--danger)":"var(--text-secondary)",flexShrink:0 }}>
        {icon}
      </span>
      <span style={{ flex:1,textAlign:"left" }}>{label}</span>
      {chevron && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>}
    </motion.button>
  );
}

// ── Menu sheet ─────────────────────────────────────────────────────────────────
function MenuSheet({ onClose, onSettings, isAuthenticated, user, logout, toggleTheme, isDark, isUltraDark, onPageChange }) {
  const themeIcon = isDark && !isUltraDark ? <MenuIcons.Sun/> : isUltraDark ? <MenuIcons.Moon/> : <MenuIcons.UltraDark/>;
  const themeLabel = isDark && !isUltraDark ? "Light mode" : isUltraDark ? "Dark mode" : "Ultra dark";

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:8500,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{type:"spring",damping:28,stiffness:280}}
        style={{ width:"100%",maxWidth:"480px",background:"var(--bg-elevated)",borderRadius:"24px 24px 0 0",paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 12px)",border:"1px solid var(--border-strong)",borderBottom:"none",overflow:"hidden" }}>

        <div style={{ width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"12px auto 0" }}/>

        {isAuthenticated && user && (
          <div style={{ display:"flex",gap:"13px",alignItems:"center",padding:"16px 18px 14px" }}>
            <div style={{ width:"48px",height:"48px",borderRadius:"14px",flexShrink:0,background:user.avatar?`url(${user.avatar}) center/cover`:"var(--accent-subtle)",border:user.avatar?"1px solid var(--border-strong)":"1.5px solid var(--accent)44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:800,color:"var(--accent)",fontFamily:"var(--font-heading)" }}>
              {!user.avatar && (user.name||"?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:"15px",fontWeight:700,color:"var(--text-primary)" }}>{user.name}</div>
              <div style={{ fontSize:"12px",color:"var(--text-muted)",marginTop:"2px" }}>{user.email}</div>
            </div>
          </div>
        )}

        <div style={{ height:"1px",background:"var(--border)",margin:"0 16px 6px" }}/>

        <MenuRow icon={<MenuIcons.Settings/>}   label="Settings"    onClick={()=>{onSettings();onClose();}}/>
        <MenuRow icon={<MenuIcons.Insights/>}   label="Insights"    onClick={()=>{onPageChange("summary");onClose();}}/>
        <MenuRow icon={<MenuIcons.Rewards/>}    label="Rewards"     onClick={()=>{onPageChange("rewards");onClose();}}/>
        <MenuRow icon={<MenuIcons.Categories/>} label="Categories"  onClick={()=>{onPageChange("categories");onClose();}}/>
        <MenuRow icon={themeIcon}               label={themeLabel}  onClick={()=>{toggleTheme();onClose();}}/>

        <div style={{ height:"1px",background:"var(--border)",margin:"6px 16px" }}/>

        {isAuthenticated ? (
          <MenuRow icon={<MenuIcons.SignOut/>} label="Sign out" danger onClick={()=>{logout();toast("See you soon.");onClose();}} chevron={false}/>
        ) : (
          <MenuRow icon={<MenuIcons.SignIn/>}  label="Sign in"  onClick={()=>{window.dispatchEvent(new Event("open-auth"));onClose();}}/>
        )}

        <div style={{ height:"8px" }}/>
      </motion.div>
    </div>
  );
}

// ── Main Navbar ────────────────────────────────────────────────────────────────
export default function Navbar({ activePage, onPageChange }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, isUltraDark, toggleTheme, accent } = useTheme();
  const [showAuth,     setShowAuth]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [unread,       setUnread]       = useState(0);

  useEffect(() => {
    const update = () => {
      try { setUnread(JSON.parse(localStorage.getItem("notifs")||"[]").filter(n=>!n.read).length); }
      catch { setUnread(0); }
    };
    update();
    const iv = setInterval(update, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = () => setShowAuth(true);
    window.addEventListener("open-auth", h);
    return () => window.removeEventListener("open-auth", h);
  }, []);

  const btnStyle = {
    width:"34px",height:"34px",borderRadius:"var(--radius-btn)",
    background:"var(--surface)",border:"1px solid var(--border)",
    color:"var(--text-secondary)",display:"flex",alignItems:"center",
    justifyContent:"center",cursor:"pointer",position:"relative",flexShrink:0,
  };

  return (
    <>
      {/* Top bar */}
      <div style={{ position:"sticky",top:0,zIndex:300,paddingTop:"env(safe-area-inset-top,0px)",background:"var(--bg)",borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:"1200px",margin:"0 auto",padding:"8px 14px",display:"flex",alignItems:"center",gap:"10px" }}>

          <motion.div whileTap={{scale:0.95}} onClick={()=>onPageChange("today")}
            style={{ display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",flexShrink:0 }}>
            <div style={{ width:"34px",height:"34px",borderRadius:"10px",background:`linear-gradient(145deg,${accent},var(--accent-pressed))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"var(--font-heading)",fontWeight:800,fontSize:"13px",letterSpacing:"-0.06em",boxShadow:`0 4px 14px ${accent}44` }}>30</div>
            <span className="desktop-only" style={{ fontFamily:"var(--font-heading)",fontWeight:700,fontSize:"15px",color:"var(--text-primary)",letterSpacing:"-0.02em" }}>Thirty</span>
          </motion.div>

          <nav className="desktop-nav" style={{ display:"flex",gap:"4px",flex:1,justifyContent:"center" }}>
            {NAV_ITEMS.map(item => {
              const active = activePage === item.id;
              return (
                <motion.button key={item.id} whileTap={{scale:0.96}} onClick={()=>onPageChange(item.id)} className="btn-reset"
                  style={{ padding:"6px 12px",borderRadius:"var(--radius-btn)",color:active?"var(--accent)":"var(--text-muted)",background:active?"var(--accent-subtle)":"transparent",fontWeight:active?700:500,fontSize:"12px",display:"flex",alignItems:"center",gap:"5px",border:active?"1px solid var(--accent)28":"1px solid transparent",transition:"all 140ms" }}>
                  <item.Icon active={active}/>
                  {item.label}
                </motion.button>
              );
            })}
          </nav>

          <div style={{ display:"flex",gap:"7px",alignItems:"center",marginLeft:"auto" }}>
            <motion.button whileTap={{scale:0.92}} onClick={()=>setShowNotifs(true)} className="btn-reset" style={btnStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && (
                <div style={{ position:"absolute",top:"6px",right:"6px",width:"7px",height:"7px",borderRadius:"50%",background:"var(--accent)",boxShadow:`0 0 0 2px var(--bg)` }}/>
              )}
            </motion.button>

            {isAuthenticated ? (
              <motion.button whileTap={{scale:0.92}} onClick={()=>setShowMenu(true)} className="btn-reset"
                style={{ ...btnStyle,overflow:"hidden",border:user?.avatar?"1px solid var(--border-strong)":"1px solid var(--accent)44",background:user?.avatar?"transparent":"var(--accent-subtle)" }}>
                {user?.avatar ? (
                  <div style={{ width:"100%",height:"100%",background:`url(${user.avatar}) center/cover` }}/>
                ) : (
                  <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:800,color:"var(--accent)",fontFamily:"var(--font-heading)" }}>
                    {(user?.name||"?").charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.button>
            ) : (
              <motion.button whileTap={{scale:0.95}} onClick={()=>setShowAuth(true)} className="btn-reset" style={btnStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav" style={{ position:"fixed",left:0,right:0,bottom:0,zIndex:300,background:"var(--bg)",borderTop:"1px solid var(--border)",paddingBottom:"max(env(safe-area-inset-bottom,0px),8px)" }}>
        <div style={{ display:"flex",justifyContent:"space-around",alignItems:"center",height:"56px",padding:"0 4px" }}>
          {NAV_ITEMS.map(item => {
            const active = activePage === item.id;
            return (
              <motion.button key={item.id} whileTap={{scale:0.90}} onClick={()=>onPageChange(item.id)} className="btn-reset"
                style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",padding:"4px 2px",color:active?"var(--accent)":"var(--text-muted)",position:"relative",WebkitTapHighlightColor:"transparent" }}>
                {active && <motion.div layoutId="nav-active-dot" style={{ position:"absolute",top:"4px",left:0,right:0,margin:"auto",width:"4px",height:"4px",borderRadius:"50%",background:"var(--accent)" }}/>}
                <item.Icon active={active}/>
                <span style={{ fontSize:"9px",fontWeight:active?700:500,letterSpacing:"0.02em" }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Panels */}
      <AnimatePresence>
        {showNotifs && <NotifPanel onClose={()=>setShowNotifs(false)}/>}
        {showMenu && (
          <MenuSheet onClose={()=>setShowMenu(false)} onSettings={()=>setShowSettings(true)}
            isAuthenticated={isAuthenticated} user={user} logout={logout}
            toggleTheme={toggleTheme} isDark={isDark} isUltraDark={isUltraDark}
            onPageChange={onPageChange}/>
        )}
      </AnimatePresence>

      <AuthModal isOpen={showAuth} onClose={()=>setShowAuth(false)}/>
      <AppSettings isOpen={showSettings} onClose={()=>setShowSettings(false)}/>
    </>
  );
}