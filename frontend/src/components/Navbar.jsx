import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth }  from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthModal   from "./AuthModal";
import AppSettings from "./AppSettings";
import Portal      from "./Portal";
import toast       from "react-hot-toast";

/* ── Premium SVG icons ─────────────────────────────────────────────────────── */
const Icons = {
  Today: ({ size=22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Habits: ({ size=22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 3"/>
      <circle cx="19" cy="5" r="2.5" fill={active?"currentColor":"none"} stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Tasks: ({ size=22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  Timer: ({ size=22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l3 3"/>
      <path d="M9 3h6"/><path d="M12 3v2"/>
    </svg>
  ),
  Trophy: ({ size=22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/>
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
      <path d="M6 5h12v7a6 6 0 0 1-12 0V5z"/>
      <path d="M12 18v3"/><path d="M8 21h8"/>
    </svg>
  ),
  /* Bell SVG — used for notification panel empty state in purple tint */
  BellEmpty: ({ size=48, color="#7C5CFC" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.8 }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Bell: ({ size=20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Settings: ({ size=18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Sun: ({ size=18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: ({ size=18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Logout: ({ size=18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id:"today",   label:"Today",   Icon:Icons.Today  },
  { id:"habits",  label:"Habits",  Icon:Icons.Habits },
  { id:"tasks",   label:"Tasks",   Icon:Icons.Tasks  },
  { id:"timer",   label:"Timer",   Icon:Icons.Timer  },
  { id:"rewards", label:"Rewards", Icon:Icons.Trophy },
];

/* ── Notification panel ────────────────────────────────────────────────────── */
function NotifPanel({ onClose, isDark, border, textColor, mutedColor }) {
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notifs")||"[]"); } catch { return []; }
  });
  const unread  = notifs.filter(n => !n.read).length;
  const clearAll = () => { setNotifs([]); localStorage.setItem("notifs","[]"); };
  const bg = isDark ? "rgba(9,9,15,0.99)" : "rgba(248,250,252,0.99)";

  return (
    <Portal>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        onClick={onClose}
        style={{ position:"fixed",inset:0,zIndex:8500,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)" }}/>
      <motion.div
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{ type:"spring", damping:30, stiffness:320 }}
        style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:8501,background:bg,borderRadius:"24px 24px 0 0",border:`1px solid ${border}`,maxHeight:"72vh",overflowY:"auto",paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 80px)",fontFamily:"'Inter',sans-serif" }}>
        <div style={{ display:"flex",justifyContent:"center",padding:"12px 0 4px" }}>
          <div style={{ width:"36px",height:"4px",borderRadius:"2px",background:isDark?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.12)" }}/>
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 20px 16px" }}>
          <div>
            <span style={{ fontSize:"17px",fontWeight:700,color:textColor,letterSpacing:"-0.03em" }}>Notifications</span>
            {unread > 0 && <span style={{ fontSize:"12px",color:"#7C5CFC",fontWeight:600,marginLeft:"8px" }}>· {unread} new</span>}
          </div>
          <button onClick={clearAll} style={{ background:"none",border:"none",color:"#7C5CFC",cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>Clear all</button>
        </div>
        <div style={{ padding:"0 14px 14px" }}>
          {notifs.length === 0 ? (
            <div style={{ textAlign:"center",padding:"44px 16px" }}>
              {/* Purple tinted bell SVG — not gold emoji */}
              <div style={{ display:"flex",justifyContent:"center",marginBottom:"14px" }}>
                <div style={{ width:"64px",height:"64px",borderRadius:"50%",background:"rgba(124,92,252,0.1)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Icons.BellEmpty size={32} color="#7C5CFC"/>
                </div>
              </div>
              <p style={{ fontSize:"14px",color:mutedColor,margin:0 }}>All caught up!</p>
              <p style={{ fontSize:"12px",color:mutedColor,margin:"4px 0 0",opacity:0.6 }}>No new notifications</p>
            </div>
          ) : notifs.map((n,i) => (
            <div key={i} style={{ padding:"13px 15px",borderRadius:"12px",marginBottom:"8px",background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",border:`1px solid ${n.read?border:"rgba(124,92,252,0.3)"}`,opacity:n.read?0.6:1 }}>
              <div style={{ fontSize:"13px",fontWeight:600,color:textColor }}>{n.title}</div>
              <div style={{ fontSize:"12px",color:mutedColor,marginTop:"3px" }}>{n.body}</div>
              <div style={{ fontSize:"10px",color:mutedColor,marginTop:"3px" }}>{n.time}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </Portal>
  );
}

/* ── Mobile menu sheet ─────────────────────────────────────────────────────── */
function MobileMenuSheet({ onClose, isDark, toggleTheme, border, textColor, mutedColor, user, logout, onOpenSettings, accent }) {
  const bg = isDark ? "rgba(9,9,15,0.99)" : "rgba(248,250,252,0.99)";
  const items = [
    { Icon:isDark?Icons.Sun:Icons.Moon, label:isDark?"Light Mode":"Dark Mode", action:()=>{ toggleTheme(); onClose(); } },
    { Icon:Icons.Settings, label:"Settings", action:()=>{ onOpenSettings(); onClose(); } },
    { Icon:Icons.Logout,   label:"Log out",  action:()=>{ logout(); toast("See you soon 👋"); onClose(); }, danger:true },
  ];
  return (
    <Portal>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        onClick={onClose}
        style={{ position:"fixed",inset:0,zIndex:8500,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)" }}/>
      <motion.div
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{ type:"spring", damping:30, stiffness:320 }}
        style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:8501,background:bg,borderRadius:"24px 24px 0 0",border:`1px solid ${border}`,paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 80px)",fontFamily:"'Inter',sans-serif" }}>
        <div style={{ display:"flex",justifyContent:"center",padding:"12px 0 4px" }}>
          <div style={{ width:"36px",height:"4px",borderRadius:"2px",background:isDark?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.12)" }}/>
        </div>
        {user && (
          <div style={{ display:"flex",alignItems:"center",gap:"12px",padding:"12px 20px 18px" }}>
            <div style={{ width:"46px",height:"46px",borderRadius:"14px",flexShrink:0,background:`linear-gradient(135deg,${accent},#6447E8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:800,color:"white",boxShadow:`0 4px 16px rgba(124,92,252,0.4)` }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:"15px",fontWeight:700,color:textColor }}>{user?.name}</div>
              <div style={{ fontSize:"12px",color:mutedColor }}>{user?.email}</div>
            </div>
          </div>
        )}
        <div style={{ padding:"0 14px 14px",display:"flex",flexDirection:"column",gap:"8px" }}>
          {items.map(item => (
            <motion.button key={item.label} whileTap={{scale:0.98}} onClick={item.action}
              style={{ width:"100%",padding:"15px 18px",background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",border:`1px solid ${item.danger?"rgba(240,80,80,0.2)":border}`,borderRadius:"14px",color:item.danger?"#F05050":textColor,cursor:"pointer",fontSize:"14px",fontWeight:600,fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:"14px",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
              <item.Icon size={20}/>
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </Portal>
  );
}

/* ── Main Navbar ────────────────────────────────────────────────────────────── */
export default function Navbar({ activePage, onPageChange }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme, accent }   = useTheme();
  const [showAuth,     setShowAuth]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [showMobile,   setShowMobile]   = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [unread,       setUnread]       = useState(0);
  const menuRef = useRef(null);
  const ac = accent || "#7C5CFC";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const fn = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [showMenu]);

  useEffect(() => {
    const check = () => {
      try { setUnread(JSON.parse(localStorage.getItem("notifs")||"[]").filter(n=>!n.read).length); } catch {}
    };
    check();
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, []);

  const navBg  = isDark
    ? (scrolled ? "rgba(9,9,15,0.97)" : "rgba(9,9,15,0.88)")
    : (scrolled ? "rgba(248,250,252,0.97)" : "rgba(248,250,252,0.88)");
  const border     = isDark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.07)";
  const textColor  = isDark ? "#F0EFF8"                 : "#0f172a";
  const mutedColor = isDark ? "#8B8AA3"                 : "rgba(15,23,42,0.42)";

  const toolBtn = {
    width:"36px", height:"36px", borderRadius:"10px",
    border:`1px solid ${border}`,
    background:isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",
    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
    transition:"all 0.15s", flexShrink:0, color:textColor, position:"relative",
    WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
  };

  return (
    <>
      {/* TOP NAV */}
      <motion.nav
        initial={{y:-64,opacity:0}} animate={{y:0,opacity:1}}
        transition={{ type:"spring", damping:22, stiffness:220, delay:0.05 }}
        style={{ position:"sticky",top:0,zIndex:300,background:navBg,backdropFilter:"blur(28px) saturate(1.8)",borderBottom:`1px solid ${border}`,fontFamily:"'Inter',sans-serif",transition:"background 0.3s",boxShadow:scrolled?"0 4px 32px rgba(0,0,0,0.18)":"none",paddingTop:"env(safe-area-inset-top,0px)" }}
      >
        {/* Accent top stripe */}
        <div style={{ position:"absolute",top:"env(safe-area-inset-top,0px)",left:0,right:0,height:"1.5px",background:`linear-gradient(90deg,transparent,${ac} 30%,${ac}aa 60%,transparent)`,opacity:0.85 }}/>

        <div style={{ maxWidth:"1200px",margin:"0 auto",padding:"0 16px",height:"56px",display:"flex",alignItems:"center" }}>

          {/* Logo — keep "30" brand mark exactly */}
          <motion.div whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            onClick={() => onPageChange("today")}
            style={{ display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",flexShrink:0,marginRight:"16px" }}>
            <div style={{ width:"32px",height:"32px",background:`linear-gradient(135deg,${ac},#6447E8)`,borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 16px rgba(124,92,252,0.45)`,fontSize:"12px",fontWeight:900,color:"white",letterSpacing:"-0.05em",flexShrink:0 }}>
              30
            </div>
            <span style={{ fontSize:"16px",fontWeight:800,letterSpacing:"-0.05em",color:ac,userSelect:"none",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Thirty
            </span>
          </motion.div>

          {/* Desktop nav pills */}
          <div className="desktop-nav" style={{ display:"flex",alignItems:"center",gap:"2px",flex:1,justifyContent:"center" }}>
            {NAV_ITEMS.map(item => {
              const active = activePage === item.id;
              return (
                <motion.button key={item.id} whileTap={{scale:0.94}}
                  onClick={() => onPageChange(item.id)}
                  style={{ position:"relative",display:"flex",alignItems:"center",gap:"6px",padding:"7px 12px",borderRadius:"10px",border:"none",background:active?(isDark?`${ac}18`:`${ac}12`):"transparent",color:active?ac:mutedColor,cursor:"pointer",fontSize:"12px",fontWeight:active?700:500,transition:"all 0.16s",fontFamily:"inherit",whiteSpace:"nowrap",outline:"none" }}
                  onMouseEnter={e=>{if(!active){e.currentTarget.style.color=textColor;e.currentTarget.style.background=isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)";}}}
                  onMouseLeave={e=>{if(!active){e.currentTarget.style.color=mutedColor;e.currentTarget.style.background="transparent";}}}
                >
                  <item.Icon size={14} active={active}/>
                  <span>{item.label}</span>
                  {active && (
                    <motion.div layoutId="nav-pill" style={{ position:"absolute",bottom:"-1px",left:"50%",transform:"translateX(-50%)",width:"20px",height:"2px",background:`linear-gradient(90deg,${ac},${ac}aa)`,borderRadius:"2px" }}/>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right tools */}
          <div style={{ display:"flex",alignItems:"center",gap:"6px",flexShrink:0,marginLeft:"auto" }}>
            <motion.button whileTap={{scale:0.9}} onClick={toggleTheme} className="desktop-only" style={toolBtn}>
              {isDark ? <Icons.Sun size={16}/> : <Icons.Moon size={16}/>}
            </motion.button>

            <motion.button whileTap={{scale:0.9}} onClick={() => setShowNotifs(true)} style={toolBtn}>
              <Icons.Bell size={16}/>
              {unread > 0 && (
                <div style={{ position:"absolute",top:"6px",right:"6px",width:"6px",height:"6px",borderRadius:"50%",background:"#F05050" }}/>
              )}
            </motion.button>

            <motion.button whileTap={{scale:0.9}} onClick={() => setShowSettings(true)} className="desktop-only" style={toolBtn}>
              <Icons.Settings size={16}/>
            </motion.button>

            <div className="desktop-only" style={{ width:"1px",height:"18px",background:border,margin:"0 2px" }}/>

            {isAuthenticated ? (
              <div ref={menuRef} style={{ position:"relative" }}>
                <motion.button whileTap={{scale:0.96}}
                  onClick={() => setShowMenu(!showMenu)}
                  style={{ display:"flex",alignItems:"center",gap:"6px",padding:"4px 8px 4px 4px",borderRadius:"99px",border:`1px solid ${showMenu?ac+"66":border}`,background:isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",cursor:"pointer",color:textColor,fontSize:"12px",fontWeight:600,fontFamily:"inherit",transition:"all 0.15s",WebkitTapHighlightColor:"transparent" }}>
                  <div style={{ width:"26px",height:"26px",borderRadius:"50%",background:`linear-gradient(135deg,${ac},#6447E8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:800,color:"white",flexShrink:0 }}>
                    {user?.name?.charAt(0)?.toUpperCase()||"?"}
                  </div>
                  <span className="desktop-only" style={{ maxWidth:"64px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {user?.name?.split(" ")[0]}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{opacity:0,y:-6,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6,scale:0.96}}
                      transition={{duration:0.14}}
                      style={{ position:"absolute",top:"46px",right:0,width:"220px",background:isDark?"rgba(9,9,15,0.98)":"rgba(255,255,255,0.98)",backdropFilter:"blur(24px)",borderRadius:"16px",border:`1px solid ${border}`,overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.32)",zIndex:400 }}>
                      <div style={{ padding:"13px 15px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",gap:"10px" }}>
                        <div style={{ width:"36px",height:"36px",borderRadius:"10px",background:`linear-gradient(135deg,${ac},#6447E8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:800,color:"white",flexShrink:0 }}>
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:"13px",fontWeight:700,color:textColor,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.name}</div>
                          <div style={{ fontSize:"11px",color:mutedColor,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.email}</div>
                        </div>
                      </div>
                      {[
                        { Icon:isDark?Icons.Sun:Icons.Moon, label:isDark?"Light Mode":"Dark Mode", action:()=>{ setShowMenu(false); toggleTheme(); } },
                        { Icon:Icons.Settings, label:"Settings", action:()=>{ setShowMenu(false); setShowSettings(true); } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action}
                          style={{ width:"100%",padding:"10px 15px",background:"none",border:"none",color:textColor,cursor:"pointer",fontSize:"13px",textAlign:"left",fontFamily:"inherit",fontWeight:500,display:"flex",alignItems:"center",gap:"10px",transition:"background 0.12s",WebkitTapHighlightColor:"transparent" }}
                          onMouseEnter={e=>e.currentTarget.style.background=isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"}
                          onMouseLeave={e=>e.currentTarget.style.background="none"}>
                          <item.Icon size={16}/>{item.label}
                        </button>
                      ))}
                      <div style={{ borderTop:`1px solid ${border}` }}>
                        <button onClick={() => { setShowMenu(false); logout(); toast("See you soon 👋"); }}
                          style={{ width:"100%",padding:"10px 15px",background:"none",border:"none",color:"#F05050",cursor:"pointer",fontSize:"13px",textAlign:"left",fontWeight:500,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"10px",WebkitTapHighlightColor:"transparent" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(240,80,80,0.07)"}
                          onMouseLeave={e=>e.currentTarget.style.background="none"}>
                          <Icons.Logout size={16}/>Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.96}}
                onClick={() => setShowAuth(true)}
                style={{ padding:"7px 16px",background:`linear-gradient(135deg,${ac},#6447E8)`,border:"none",borderRadius:"99px",color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700,boxShadow:"0 4px 14px rgba(124,92,252,0.4)",fontFamily:"inherit",whiteSpace:"nowrap",WebkitTapHighlightColor:"transparent" }}>
                Sign in
              </motion.button>
            )}

            {isAuthenticated && (
              <motion.button whileTap={{scale:0.9}} className="mobile-only"
                onClick={() => setShowMobile(true)}
                style={{ ...toolBtn, fontSize:"18px", letterSpacing:"2px", fontWeight:700 }}>
                ···
              </motion.button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav" style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:300,background:navBg,backdropFilter:"blur(28px) saturate(1.8)",borderTop:`1px solid ${border}` }}>
        <div style={{ display:"flex",justifyContent:"space-around",alignItems:"center",height:"64px",padding:"0 4px" }}>
          {NAV_ITEMS.map(item => {
            const active = activePage === item.id;
            return (
              <motion.button key={item.id}
                whileTap={{ y: -3 }}
                transition={{ type:"spring", stiffness:500, damping:20 }}
                onClick={() => onPageChange(item.id)}
                style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",padding:"6px 2px",background:"none",border:"none",cursor:"pointer",color:active?ac:mutedColor,fontFamily:"inherit",transition:"color 0.15s",position:"relative",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                {/* 2px purple underline bar at top */}
                {active && (
                  <motion.div layoutId="mobile-pill"
                    style={{ position:"absolute",top:0,left:"25%",right:"25%",height:"2px",borderRadius:"0 0 3px 3px",background:ac }}/>
                )}
                <div style={{ filter:active?`drop-shadow(0 0 8px ${ac}99)`:"none",transition:"filter 0.2s" }}>
                  <item.Icon size={22} active={active}/>
                </div>
                <span style={{ fontSize:"10px",fontWeight:active?600:400,letterSpacing:"0.01em" }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
        <div style={{ height:"env(safe-area-inset-bottom,0px)" }}/>
      </div>

      {/* Sheets */}
      <AnimatePresence>
        {showNotifs && <NotifPanel key="notifs" onClose={()=>setShowNotifs(false)} isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showMobile && <MobileMenuSheet key="mobile-menu" onClose={()=>setShowMobile(false)} isDark={isDark} toggleTheme={toggleTheme} border={border} textColor={textColor} mutedColor={mutedColor} user={user} logout={logout} onOpenSettings={()=>setShowSettings(true)} accent={ac}/>}
      </AnimatePresence>

      <AuthModal    isOpen={showAuth}     onClose={()=>setShowAuth(false)}/>
      <AppSettings  isOpen={showSettings} onClose={()=>setShowSettings(false)}/>

      <style>{`
        .mobile-bottom-nav{display:none}
        .mobile-only{display:none!important}
        @media(max-width:768px){
          .desktop-nav{display:none!important}
          .desktop-only{display:none!important}
          .mobile-bottom-nav{display:block!important}
          .mobile-only{display:flex!important}
        }
      `}</style>
    </>
  );
}