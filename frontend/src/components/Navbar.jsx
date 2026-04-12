/**
 * Navbar.jsx — HabitsNow-style navigation
 * Top bar: 30 logo | bell | menu (⋯)
 * Bottom nav (mobile): Today | Habits | Tasks | Categories | Timer
 * Desktop: compact pill nav inside top bar
 */
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AppSettings from "./AppSettings";
import AuthModal from "./AuthModal";
import Portal from "./Portal";

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
  Rewards: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2.2:1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4"/>
      <path d="M6 5h12v7a6 6 0 0 1-12 0V5z" fill={active?"currentColor":"none"} fillOpacity={active?0.1:0}/>
      <path d="M12 18v3M8 21h8"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id:"today",    label:"Today",   Icon:I.Today },
  { id:"habits",   label:"Habits",  Icon:I.Habits },
  { id:"tasks",    label:"Tasks",   Icon:I.Tasks },
  { id:"summary",  label:"Insights",Icon:I.Insights },
  { id:"timer",    label:"Timer",   Icon:I.Timer },
];

// ── Notification panel ─────────────────────────────────────────────────────────
function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notifs")||"[]"); } catch { return []; }
  });

  const clear = () => { setNotifs([]); localStorage.setItem("notifs","[]"); };
  const unread = notifs.filter(n=>!n.read).length;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:8500,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{type:"spring",damping:28,stiffness:280}}
        className="glass-panel"
        style={{width:"100%",maxWidth:"480px",borderRadius:"20px 20px 0 0",paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 80px)",border:"1px solid var(--border-strong)",borderBottom:"none"}}>
        <div style={{width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"10px auto 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 10px"}}>
          <div>
            <div style={{fontSize:"16px",fontWeight:700,color:"var(--text-primary)"}}>Notifications</div>
            <div style={{fontSize:"11px",color:"var(--text-muted)",marginTop:"1px"}}>{unread>0?`${unread} unread`:"All caught up"}</div>
          </div>
          {notifs.length>0&&<button type="button" onClick={clear} className="btn-reset" style={{fontSize:"12px",fontWeight:700,color:"var(--accent)"}}>Clear all</button>}
        </div>
        <div style={{padding:"0 14px 14px"}}>
          {notifs.length===0?(
            <div className="glass-tile" style={{borderRadius:"12px",padding:"24px 16px",textAlign:"center"}}>
              <div style={{fontSize:"11px",color:"var(--text-muted)"}}>No notifications yet. Habit reminders and streak updates will appear here.</div>
            </div>
          ):(
            notifs.map((n,i)=>(
              <div key={i} className="glass-tile" style={{borderRadius:"12px",padding:"12px 14px",marginBottom:"6px",borderColor:n.read?"var(--border)":"var(--accent)"}}>
                <div style={{fontSize:"13px",fontWeight:700,color:"var(--text-primary)",marginBottom:"2px"}}>{n.title}</div>
                <div style={{fontSize:"12px",color:"var(--text-secondary)",lineHeight:1.4}}>{n.body}</div>
                <div style={{fontSize:"10px",color:"var(--text-muted)",marginTop:"4px"}}>{n.time}</div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Menu sheet ─────────────────────────────────────────────────────────────────
function MenuSheet({ onClose, onSettings, isAuthenticated, user, logout, toggleTheme, isDark, isUltraDark, onPageChange }) {
  const menuItems = [
    { icon:"⚙️", label:"Settings",   fn:()=>{ onSettings(); onClose(); } },
    { icon:"📊", label:"Insights",   fn:()=>{ onPageChange("summary"); onClose(); } },
    { icon:"🏆", label:"Rewards",    fn:()=>{ onPageChange("rewards"); onClose(); } },
    { icon:"📁", label:"Categories", fn:()=>{ onPageChange("categories"); onClose(); } },
    { icon: isDark&&!isUltraDark?"☀️":isUltraDark?"🌙":"🌑",
      label: isDark&&!isUltraDark?"Light mode":isUltraDark?"Dark mode":"Ultra dark",
      fn:()=>{ toggleTheme(); onClose(); } },
  ];

  if (isAuthenticated) {
    menuItems.push({ icon:"🚪", label:"Sign out", fn:()=>{ logout(); toast("See you soon."); onClose(); }, danger:true });
  }

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:8500,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{type:"spring",damping:28,stiffness:280}}
        style={{width:"100%",maxWidth:"480px",background:"var(--bg-elevated)",borderRadius:"20px 20px 0 0",paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 80px)",border:"1px solid var(--border-strong)",borderBottom:"none"}}>
        <div style={{width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"10px auto 0"}}/>
        {isAuthenticated&&user&&(
          <div style={{display:"flex",gap:"12px",alignItems:"center",padding:"14px 18px 10px"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"12px",background:"var(--accent-subtle)",border:"1.5px solid var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:800,color:"var(--accent)",fontFamily:"var(--font-heading)",flexShrink:0}}>
              {(user.name||"?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:"14px",fontWeight:700,color:"var(--text-primary)"}}>{user.name}</div>
              <div style={{fontSize:"11px",color:"var(--text-muted)"}}>{user.email}</div>
            </div>
          </div>
        )}
        <div style={{height:"1px",background:"var(--border)",margin:"0 16px 4px"}}/>
        {menuItems.map(m=>(
          <button key={m.label} type="button" onClick={m.fn} className="btn-reset"
            style={{width:"100%",padding:"13px 20px",display:"flex",alignItems:"center",gap:"14px",color:m.danger?"var(--danger)":"var(--text-primary)",fontSize:"14px",fontWeight:500}}>
            <span style={{fontSize:"18px",width:"22px",textAlign:"center"}}>{m.icon}</span>
            {m.label}
          </button>
        ))}
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
    const iv = setInterval(update, 5000);
    return () => clearInterval(iv);
  }, []);

  const btnStyle = {
    width:"34px", height:"34px", borderRadius:"10px",
    background:"var(--surface)", border:"1px solid var(--border)",
    color:"var(--text-secondary)", display:"flex", alignItems:"center",
    justifyContent:"center", cursor:"pointer", position:"relative",
    flexShrink:0,
  };

  return (
    <>
      {/* ── Top bar ── */}
      <div style={{
        position:"sticky", top:0, zIndex:300,
        paddingTop:"env(safe-area-inset-top,0px)",
        background:"var(--bg)", borderBottom:"1px solid var(--border)",
      }}>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"8px 14px",display:"flex",alignItems:"center",gap:"10px"}}>

          {/* Logo */}
          <motion.div whileTap={{scale:0.95}} onClick={()=>onPageChange("today")}
            style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",flexShrink:0}}>
            <div style={{
              width:"34px",height:"34px",borderRadius:"10px",
              background:`linear-gradient(145deg,${accent},var(--accent-pressed))`,
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"#fff",fontFamily:"var(--font-heading)",fontWeight:800,
              fontSize:"13px",letterSpacing:"-0.06em",
              boxShadow:`0 4px 14px ${accent}44`,
            }}>30</div>
            <span className="desktop-only" style={{fontFamily:"var(--font-heading)",fontWeight:700,fontSize:"15px",color:"var(--text-primary)",letterSpacing:"-0.02em"}}>Thirty</span>
          </motion.div>

          {/* Desktop nav pills */}
          <nav className="desktop-nav" style={{display:"flex",gap:"4px",flex:1,justifyContent:"center"}}>
            {NAV_ITEMS.map(item=>{
              const active=activePage===item.id;
              return (
                <motion.button key={item.id} whileTap={{scale:0.96}} onClick={()=>onPageChange(item.id)} className="btn-reset"
                  style={{padding:"6px 12px",borderRadius:"10px",color:active?"var(--accent)":"var(--text-muted)",background:active?"var(--accent-subtle)":"transparent",fontWeight:active?700:500,fontSize:"12px",display:"flex",alignItems:"center",gap:"5px",border:active?"1px solid var(--accent)28":"1px solid transparent",transition:"all 140ms"}}>
                  <item.Icon active={active}/>
                  {item.label}
                </motion.button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{display:"flex",gap:"7px",alignItems:"center",marginLeft:"auto"}}>
            {/* Bell */}
            <motion.button whileTap={{scale:0.92}} onClick={()=>setShowNotifs(true)} className="btn-reset" style={btnStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread>0&&<div style={{position:"absolute",top:"7px",right:"7px",width:"7px",height:"7px",borderRadius:"50%",background:"var(--accent)",boxShadow:`0 0 0 2px var(--bg)`}}/>}
            </motion.button>

            {/* Desktop: settings + auth */}
            <motion.button whileTap={{scale:0.92}} onClick={()=>setShowSettings(true)} className="btn-reset desktop-only" style={btnStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </motion.button>

            {isAuthenticated?(
              <motion.button whileTap={{scale:0.95}} onClick={()=>setShowMenu(v=>!v)} className="btn-reset desktop-only"
                style={{...btnStyle,width:"auto",padding:"0 10px 0 4px",display:"flex",alignItems:"center",gap:"7px"}}>
                <div style={{width:"26px",height:"26px",borderRadius:"8px",background:"var(--accent-subtle)",border:"1px solid var(--accent)44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:800,color:"var(--accent)"}}>
                  {(user?.name||"?").charAt(0).toUpperCase()}
                </div>
                <span style={{fontSize:"12px",fontWeight:700,color:"var(--text-primary)"}}>{user?.name?.split(" ")[0]}</span>
              </motion.button>
            ):(
              <motion.button whileTap={{scale:0.97}} onClick={()=>setShowAuth(true)} className="btn-primary desktop-only"
                style={{height:"34px",padding:"0 14px",fontSize:"13px"}}>Sign in</motion.button>
            )}

            {/* Mobile: dots menu */}
            <motion.button whileTap={{scale:0.92}} onClick={()=>setShowMenu(true)} className="btn-reset mobile-only" style={btnStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5"  cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="mobile-bottom-nav" style={{
        position:"fixed",left:0,right:0,bottom:0,zIndex:300,
        background:"var(--bg)",borderTop:"1px solid var(--border)",
        paddingBottom:"max(env(safe-area-inset-bottom,0px),8px)",
      }}>
        <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",height:"56px",padding:"0 4px"}}>
          {NAV_ITEMS.map(item=>{
            const active=activePage===item.id;
            return (
              <motion.button key={item.id} whileTap={{scale:0.90}} onClick={()=>onPageChange(item.id)} className="btn-reset"
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",padding:"4px 2px",color:active?"var(--accent)":"var(--text-muted)",position:"relative",WebkitTapHighlightColor:"transparent"}}>
                {active&&(
                  <motion.div layoutId="nav-active-dot"
                    style={{position:"absolute",top:"4px",left:"50%",transform:"translateX(-50%)",width:"4px",height:"4px",borderRadius:"50%",background:"var(--accent)"}}/>
                )}
                <item.Icon active={active}/>
                <span style={{fontSize:"9px",fontWeight:active?700:500,letterSpacing:"0.02em"}}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Panels & modals ── */}
      <AnimatePresence>
        {showNotifs&&<NotifPanel onClose={()=>setShowNotifs(false)}/>}
        {showMenu&&(
          <MenuSheet onClose={()=>setShowMenu(false)}
            onSettings={()=>setShowSettings(true)}
            isAuthenticated={isAuthenticated} user={user}
            logout={logout} toggleTheme={toggleTheme}
            isDark={isDark} isUltraDark={isUltraDark}
            onPageChange={onPageChange}/>
        )}
      </AnimatePresence>

      <AuthModal isOpen={showAuth} onClose={()=>setShowAuth(false)}/>
      <AppSettings isOpen={showSettings} onClose={()=>setShowSettings(false)}/>
    </>
  );
}