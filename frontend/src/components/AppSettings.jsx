/**
 * AppSettings.jsx — Full settings panel (bottom sheet)
 * Tabs: Appearance | Account | General
 * Features: dark/ultra/light theme, 12 accent presets + custom, profile edit, notifications, week start
 */
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Toggle({ checked, onChange, accent }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="btn-reset"
      style={{ width:"44px",height:"24px",borderRadius:"999px",background:checked?(accent||"var(--accent)"):"var(--surface-elevated)",border:"1px solid var(--border)",position:"relative",cursor:"pointer",transition:"background 180ms",flexShrink:0 }}>
      <div style={{ position:"absolute",top:"3px",left:checked?"22px":"3px",width:"16px",height:"16px",backgroundColor:"white",borderRadius:"50%",transition:"left 0.2s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:"0 1px 4px rgba(0,0,0,0.28)" }}/>
    </button>
  );
}

function SH({ title }) {
  return <div style={{ padding:"14px 16px 5px",fontSize:"10px",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.09em" }}>{title}</div>;
}

function Card({ children }) {
  return <div className="glass-panel" style={{ borderRadius:"12px",marginBottom:"8px",overflow:"hidden",marginLeft:"0",marginRight:"0" }}>{children}</div>;
}

function SettingRow({ label, sub, right, onClick, last=false }) {
  const Inner = () => (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",padding:"12px 16px",borderBottom:last?"none":"1px solid var(--border)" }}>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:"14px",fontWeight:500,color:"var(--text-primary)" }}>{label}</div>
        {sub&&<div style={{ fontSize:"11px",color:"var(--text-muted)",marginTop:"1px" }}>{sub}</div>}
      </div>
      {right&&<div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  );
  if (onClick) return <button type="button" onClick={onClick} className="btn-reset" style={{ width:"100%",display:"block",textAlign:"left" }}><Inner/></button>;
  return <div><Inner/></div>;
}

// ── Appearance tab ─────────────────────────────────────────────────────────────
function AppearanceTab({ theme, setTheme, accent, changeAccent, ACCENT_PRESETS }) {
  const themeOpts = [
    { id:"dark",  label:"Dark",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { id:"ultra", label:"Ultra",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3v18M3 12h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { id:"light", label:"Light",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
  ];

  return (
    <>
      <SH title="Theme"/>
      <Card>
        <div style={{ padding:"12px 16px" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px" }}>
            {themeOpts.map(o=>(
              <button key={o.id} type="button" onClick={()=>setTheme(o.id)} className="btn-reset"
                style={{ padding:"10px 6px",borderRadius:"10px",background:theme===o.id?"var(--accent-subtle)":"var(--surface-elevated)",border:`1.5px solid ${theme===o.id?"var(--accent)":"var(--border)"}`,color:theme===o.id?"var(--accent)":"var(--text-secondary)",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",transition:"all 140ms" }}>
                {o.icon}
                <span style={{ fontSize:"11px",fontWeight:700 }}>{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <SH title="Accent color"/>
      <Card>
        <div style={{ padding:"12px 16px 14px" }}>
          <div style={{ display:"flex",flexWrap:"wrap",gap:"9px",marginBottom:"12px" }}>
            {ACCENT_PRESETS.map(p=>(
              <button key={p.value} type="button" onClick={()=>changeAccent(p.value)} className="btn-reset" title={p.name}
                style={{ width:"28px",height:"28px",borderRadius:"50%",background:p.value,boxShadow:accent===p.value?`0 0 0 2px var(--bg),0 0 0 4px ${p.value}`:"none",transition:"box-shadow 130ms" }}/>
            ))}
            <label title="Custom" style={{ width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",overflow:"hidden",background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative" }}>
              <input type="color" value={accent} onChange={e=>changeAccent(e.target.value)} style={{ position:"absolute",opacity:0,width:"100%",height:"100%",cursor:"pointer" }}/>
            </label>
          </div>
          <div style={{ height:"5px",borderRadius:"999px",background:`linear-gradient(90deg,var(--accent-hover),var(--accent))`,boxShadow:`0 2px 8px ${accent}55` }}/>
        </div>
      </Card>
    </>
  );
}

// ── Account tab ────────────────────────────────────────────────────────────────
function AccountTab({ user, updateProfile, changePassword, logout, onClose }) {
  const [name,  setName]  = useState(user?.name||"");
  const [email, setEmail] = useState(user?.email||"");
  const [cur,   setCur]   = useState("");
  const [nw,    setNw]    = useState("");
  const [cf,    setCf]    = useState("");
  const [sav,   setSav]   = useState(false);
  const [savP,  setSavP]  = useState(false);

  useEffect(()=>{ setName(user?.name||""); setEmail(user?.email||""); },[user]);

  const IS = { width:"100%",padding:"10px 12px",borderRadius:"10px",border:"1px solid var(--border)",background:"var(--surface-elevated)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"13px",outline:"none",boxSizing:"border-box" };

  const save = async()=>{
    if(!name.trim()){toast.error("Name required");return;}
    setSav(true); await updateProfile?.({name:name.trim(),email:email.trim()});
    toast.success("Saved"); setSav(false);
  };
  const savePwd = async()=>{
    if(nw!==cf){toast.error("Passwords don't match");return;}
    if(nw.length<6){toast.error("Min 6 characters");return;}
    setSavP(true); await changePassword?.(cur,nw);
    toast.success("Password updated"); setCur(""); setNw(""); setCf(""); setSavP(false);
  };

  return (
    <>
      <SH title="Profile"/>
      <Card>
        <div style={{ padding:"14px 16px",display:"grid",gap:"10px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            <div style={{ width:"48px",height:"48px",borderRadius:"12px",background:"var(--accent-subtle)",border:"1.5px solid var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:800,fontFamily:"var(--font-heading)",color:"var(--accent)",flexShrink:0 }}>
              {(user?.name||"?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:"14px",fontWeight:700,color:"var(--text-primary)" }}>{user?.name||"User"}</div>
              <div style={{ fontSize:"11px",color:"var(--text-muted)" }}>{user?.email||"No email"}</div>
            </div>
          </div>
          <input value={name}  onChange={e=>setName(e.target.value)}  placeholder="Display name" style={IS}/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={IS}/>
          <button type="button" onClick={save} disabled={sav}
            style={{ padding:"10px",borderRadius:"10px",background:"var(--accent)",color:"#fff",fontWeight:700,fontSize:"13px",border:"none",cursor:"pointer",opacity:sav?.5:1 }}>
            {sav?"Saving…":"Save profile"}
          </button>
        </div>
      </Card>

      <SH title="Password"/>
      <Card>
        <div style={{ padding:"14px 16px",display:"grid",gap:"8px" }}>
          <input value={cur} onChange={e=>setCur(e.target.value)} placeholder="Current password" type="password" style={IS}/>
          <input value={nw}  onChange={e=>setNw(e.target.value)}  placeholder="New password"     type="password" style={IS}/>
          <input value={cf}  onChange={e=>setCf(e.target.value)}  placeholder="Confirm"           type="password" style={IS}/>
          <button type="button" onClick={savePwd} disabled={savP||!cur||!nw}
            style={{ padding:"10px",borderRadius:"10px",background:"var(--surface-elevated)",border:"1px solid var(--border)",color:"var(--text-primary)",fontWeight:700,fontSize:"13px",cursor:"pointer",opacity:savP?.5:1 }}>
            {savP?"Updating…":"Update password"}
          </button>
        </div>
      </Card>

      <SH title="Session"/>
      <Card>
        <SettingRow label="Sign out" sub="Log out of this device" last
          right={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>}
          onClick={()=>{ logout?.(); onClose(); toast("Signed out"); }}/>
      </Card>
    </>
  );
}

// ── General tab ────────────────────────────────────────────────────────────────
function GeneralTab({ accent }) {
  const getS = (k,d)=>{ try{const v=localStorage.getItem(`thirty_set_${k}`);return v?JSON.parse(v):d;}catch{return d;} };
  const setS = (k,v)=>localStorage.setItem(`thirty_set_${k}`,JSON.stringify(v));

  const [sound,     setSound]     = useState(()=>getS("sound",true));
  const [haptic,    setHaptic]    = useState(()=>getS("haptic",true));
  const [weekStart, setWeekStart] = useState(()=>getS("weekStart","sunday"));
  const [push,      setPush]      = useState("unknown");

  useEffect(()=>{ setS("sound",sound); },[sound]);
  useEffect(()=>{ setS("haptic",haptic); },[haptic]);
  useEffect(()=>{ setS("weekStart",weekStart); },[weekStart]);
  useEffect(()=>{ if("Notification" in window) setPush(Notification.permission); },[]);

  const reqPush = async()=>{
    if(!("Notification" in window)){toast.error("Not supported");return;}
    const p=await Notification.requestPermission(); setPush(p);
    if(p==="granted") toast.success("Notifications enabled");
    else toast.error("Permission denied");
  };

  return (
    <>
      <SH title="Notifications"/>
      <Card>
        <SettingRow label="Push notifications"
          sub={push==="granted"?"Active":push==="denied"?"Blocked by browser":"Tap to enable"}
          right={push==="granted"
            ?<span style={{fontSize:"11px",fontWeight:700,color:"var(--success)"}}>On</span>
            :<button type="button" onClick={reqPush} className="btn-reset" style={{padding:"4px 10px",borderRadius:"8px",background:"var(--accent-subtle)",color:"var(--accent)",fontSize:"11px",fontWeight:700,border:"1px solid var(--accent)44"}}>Enable</button>
          }/>
        <SettingRow label="Sound" sub="Play sounds on completion" last
          right={<Toggle checked={sound} onChange={setSound} accent={accent}/>}/>
      </Card>

      <SH title="Preferences"/>
      <Card>
        <SettingRow label="Haptic feedback" sub="Vibrate on interactions"
          right={<Toggle checked={haptic} onChange={setHaptic} accent={accent}/>}/>
        <SettingRow label="Week starts" last
          right={
            <div style={{ display:"flex",background:"var(--surface-elevated)",borderRadius:"8px",padding:"2px",border:"1px solid var(--border)" }}>
              {[{v:"sunday",l:"Sun"},{v:"monday",l:"Mon"}].map(o=>(
                <button key={o.v} type="button" onClick={()=>setWeekStart(o.v)} className="btn-reset"
                  style={{ padding:"4px 10px",borderRadius:"6px",background:weekStart===o.v?"var(--accent)":"transparent",color:weekStart===o.v?"#fff":"var(--text-muted)",fontWeight:700,fontSize:"11px",transition:"all 120ms" }}>{o.l}</button>
              ))}
            </div>
          }/>
      </Card>

      <SH title="About"/>
      <Card>
        <SettingRow label="Thirty" sub="Part of the 30 Ecosystem" last
          right={<span style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:600}}>v1.0</span>}/>
      </Card>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function AppSettings({ isOpen, onClose }) {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { theme, setTheme, accent, changeAccent, ACCENT_PRESETS } = useTheme();
  const [tab, setTab] = useState("appearance");

  if (!isOpen) return null;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center" }}
      onClick={onClose}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{type:"spring",damping:28,stiffness:280}}
        style={{ width:"100%",maxWidth:"480px",background:"var(--bg-elevated)",borderRadius:"20px 20px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",border:"1px solid var(--border-strong)",borderBottom:"none" }}>

        <div style={{ width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"10px auto 0" }}/>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px 6px" }}>
          <div style={{ fontSize:"17px",fontWeight:700,color:"var(--text-primary)",fontFamily:"var(--font-heading)" }}>Settings</div>
          <button type="button" onClick={onClose} className="btn-reset"
            style={{ width:"28px",height:"28px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px" }}>×</button>
        </div>

        {/* tab pills */}
        <div style={{ display:"flex",background:"var(--surface)",borderRadius:"10px",margin:"0 16px 6px",padding:"3px",border:"1px solid var(--border)" }}>
          {[{id:"appearance",l:"Appearance"},{id:"account",l:"Account"},{id:"general",l:"General"}].map(t=>(
            <button key={t.id} type="button" onClick={()=>setTab(t.id)} className="btn-reset"
              style={{ flex:1,padding:"7px",borderRadius:"8px",background:tab===t.id?"var(--surface-elevated)":"transparent",color:tab===t.id?"var(--text-primary)":"var(--text-muted)",fontWeight:tab===t.id?700:500,fontSize:"12px",transition:"all 130ms",border:tab===t.id?"1px solid var(--border)":"1px solid transparent" }}>
              {t.l}
            </button>
          ))}
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"0 12px 44px" }}>
          {tab==="appearance"&&<AppearanceTab theme={theme} setTheme={setTheme} accent={accent} changeAccent={changeAccent} ACCENT_PRESETS={ACCENT_PRESETS}/>}
          {tab==="account"  &&<AccountTab user={user} updateProfile={updateProfile} changePassword={changePassword} logout={logout} onClose={onClose}/>}
          {tab==="general"  &&<GeneralTab accent={accent}/>}
        </div>
      </motion.div>
    </div>
  );
}