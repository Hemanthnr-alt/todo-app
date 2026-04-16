import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { isNativeApp } from "../services/storage";
import CenteredModal from "./CenteredModal";

function Toggle({ checked, onChange, accent }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="btn-reset"
      style={{ width:"44px",height:"24px",borderRadius:"999px",background:checked?(accent||"var(--accent)"):"var(--surface-elevated)",border:"1px solid var(--border)",position:"relative",cursor:"pointer",transition:"background 180ms",flexShrink:0 }}>
      <div style={{ position:"absolute",top:"3px",left:checked?"22px":"3px",width:"16px",height:"16px",backgroundColor:"white",borderRadius:"50%",transition:"left 0.2s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:"0 1px 4px rgba(0,0,0,0.28)" }}/>
    </button>
  );
}

function SH({ title }) {
  return <div style={{ padding:"18px 18px 8px",fontSize:"10px",fontWeight:800,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.12em" }}>{title}</div>;
}

function Card({ children }) {
  return <div className="glass-panel" style={{ borderRadius:"20px",marginBottom:"12px",overflow:"hidden",margin:"0 14px",border:"1px solid var(--border-strong)" }}>{children}</div>;
}

function SettingRow({ label, sub, right, onClick, last=false }) {
  const Inner = () => (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",padding:"14px 18px",borderBottom:last?"none":"1px solid var(--border)",background:onClick?"transparent":"var(--surface-raised)",transition:"background 120ms" }}>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:"15px",fontWeight:600,color:"var(--text-primary)" }}>{label}</div>
        {sub&&<div style={{ fontSize:"12px",color:"var(--text-secondary)",marginTop:"3px",lineHeight:1.4 }}>{sub}</div>}
      </div>
      {right&&<div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  );
  if (onClick) return <motion.button whileHover={{backgroundColor:"var(--surface-elevated)"}} whileTap={{backgroundColor:"var(--surface-elevated)"}} type="button" onClick={onClick} className="btn-reset" style={{ width:"100%",display:"block",textAlign:"left" }}><Inner/></motion.button>;
  return <div><Inner/></div>;
}

// ── Appearance tab ─────────────────────────────────────────────────────────────
function AppearanceTab({ theme, setTheme, accent, changeAccent, ACCENT_PRESETS, buttonShape, changeShape }) {
  const themeOpts = [
    { id:"dark",  label:"Dark",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { id:"ultra", label:"Ultra",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 3v18M3 12h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { id:"light", label:"Light",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  ];

  const shapeStyles = { sharp:"4px", rounded:"14px", pill:"999px" };

  return (
    <>
      <SH title="Theme"/>
      <Card>
        <div style={{ padding:"16px",background:"var(--surface-raised)" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px" }}>
            {themeOpts.map(o=>(
              <button key={o.id} type="button" onClick={()=>setTheme(o.id)} className="btn-reset"
                style={{ padding:"14px 6px",borderRadius:"var(--radius-btn)",background:theme===o.id?"var(--accent-subtle)":"var(--surface)",border:`1.5px solid ${theme===o.id?"var(--accent)":"var(--border)"}`,color:theme===o.id?"var(--accent)":"var(--text-secondary)",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",transition:"all 140ms" }}>
                {o.icon}
                <span style={{ fontSize:"12px",fontWeight:700 }}>{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <SH title="Accent color"/>
      <Card>
        <div style={{ padding:"16px",background:"var(--surface-raised)" }}>
          <div style={{ display:"flex",flexWrap:"wrap",gap:"10px",marginBottom:"16px" }}>
            {ACCENT_PRESETS.map(p=>(
              <button key={p.value} type="button" onClick={()=>changeAccent(p.value)} className="btn-reset" title={p.name}
                style={{ width:"32px",height:"32px",borderRadius:"50%",background:p.value,boxShadow:accent===p.value?`0 0 0 2px var(--bg),0 0 0 4px ${p.value}`:"none",transition:"box-shadow 130ms" }}/>
            ))}
            <label title="Custom" style={{ width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",overflow:"hidden",background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative" }}>
              <input type="color" value={accent} onChange={e=>changeAccent(e.target.value)} style={{ position:"absolute",opacity:0,width:"100%",height:"100%",cursor:"pointer" }}/>
            </label>
          </div>
          <div style={{ height:"6px",borderRadius:"999px",background:`linear-gradient(90deg,var(--accent-hover),var(--accent))`,boxShadow:`0 2px 10px ${accent}55` }}/>
        </div>
      </Card>

      <SH title="UI Elements"/>
      <Card>
        <div style={{ padding:"16px",background:"var(--surface-raised)" }}>
          <div style={{ fontSize:"14px",fontWeight:700,color:"var(--text-primary)",marginBottom:"12px",fontFamily:"var(--font-heading)" }}>Button style</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px" }}>
            {[
              { id:"sharp",   l:"Sharp",   r:"4px" },
              { id:"rounded", l:"Rounded", r:"14px" },
              { id:"pill",    l:"Pill",    r:"999px" },
            ].map(s=>(
              <button key={s.id} type="button" onClick={()=>changeShape(s.id)} className="btn-reset"
                style={{
                  height:"42px",
                  borderRadius: s.r,
                  background: buttonShape===s.id ? "var(--accent)" : "var(--surface)",
                  color: buttonShape===s.id ? "#fff" : "var(--text-secondary)",
                  border: buttonShape===s.id ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  fontWeight:700, fontSize:"12px",
                  transition:"all 160ms",
                  boxShadow: buttonShape===s.id ? "0 4px 14px var(--accent-glow)" : "none",
                }}>
                {s.l}
              </button>
            ))}
          </div>

          {/* Shape applies instantly — no save needed */}
          <div style={{ marginTop:"10px",fontSize:"11px",color:"var(--text-muted)",fontWeight:500,textAlign:"center",padding:"4px 0" }}>
            Changes apply instantly across the whole app
          </div>
        </div>
      </Card>

      <div style={{height: 24}}/>
    </>
  );
}

// ── Profile Photo Modal ──────────────────────────────────────────────────────
function ProfilePhotoModal({ user, updateProfile, onClose }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { accent } = useTheme();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Max image size is 2MB");
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target.result;
      const res = await updateProfile({ avatar: base64 });
      setLoading(false);
      if (res.success) { toast.success("Photo updated"); onClose(); }
      else toast.error(res.error || "Failed to update");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async () => {
    setLoading(true);
    const res = await updateProfile({ avatar: null });
    setLoading(false);
    if (res.success) { toast.success("Photo removed"); onClose(); }
    else toast.error(res.error || "Failed");
  };

  return (
    <CenteredModal isOpen={true} onClose={onClose} title="Profile Photo" maxWidth="320px">
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"24px",padding:"8px 0" }}>
        <div style={{ position:"relative" }}>
          {user?.avatar ? (
            <div style={{ width:"160px",height:"160px",borderRadius:"54px",background:`url(${user.avatar}) center/cover`,border:"4px solid var(--surface-raised)",boxShadow:"0 12px 32px rgba(0,0,0,0.3)" }}/>
          ) : (
            <div style={{ width:"160px",height:"160px",borderRadius:"54px",background:"var(--accent-subtle)",border:"3px solid var(--accent)44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"64px",fontWeight:900,fontFamily:"var(--font-heading)",color:"var(--accent)",boxShadow:`0 12px 32px ${accent}22` }}>
              {(user?.name||"?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{display:"none"}}/>
        <div style={{ display:"flex",flexDirection:"column",gap:"10px",width:"100%" }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} className="btn-primary"
            style={{ width:"100%",height:"48px",fontSize:"14px",fontWeight:700 }}>
            {loading ? "Uploading..." : "Change Photo"}
          </button>
          {user?.avatar && (
            <button type="button" onClick={removePhoto} disabled={loading} className="btn-secondary"
              style={{ width:"100%",height:"48px",color:"var(--danger)",borderColor:"var(--border-danger)" }}>
              Remove Photo
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-reset"
            style={{ width:"100%",height:"48px",borderRadius:"var(--radius-btn)",color:"var(--text-muted)",fontWeight:700,fontSize:"14px",border:"1px solid transparent" }}>
            Cancel
          </button>
        </div>
      </div>
    </CenteredModal>
  );
}

// ── Account tab ──────────────────────────────────────────────────────────────
function AccountTab({ user, updateProfile, changePassword, logout, onClose }) {
  const [name,  setName]  = useState(user?.name||"");
  const [email, setEmail] = useState(user?.email||"");
  const [cur,   setCur]   = useState("");
  const [nw,    setNw]    = useState("");
  const [cf,    setCf]    = useState("");
  const [sav,   setSav]   = useState(false);
  const [savP,  setSavP]  = useState(false);
  const [photoModal, setPhotoModal] = useState(false);

  useEffect(()=>{ setName(user?.name||""); setEmail(user?.email||""); },[user]);

  const IS = { width:"100%",padding:"12px 16px",borderRadius:"var(--radius-btn)",border:"1px solid var(--border)",background:"var(--surface-elevated)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",outline:"none",boxSizing:"border-box" };

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
        <div style={{ padding:"24px 20px",display:"flex",flexDirection:"column",alignItems:"center",background:"var(--surface-raised)",gap:"16px" }}>
          <motion.button whileTap={{scale:0.95}} type="button" onClick={() => setPhotoModal(true)} className="btn-reset" title="Change photo"
            style={{ width:"80px",height:"80px",borderRadius:"28px",background:user?.avatar?`url(${user.avatar}) center/cover`:"var(--accent-subtle)",border:user?.avatar?"2px solid var(--border-strong)":"2px solid var(--accent)44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",fontWeight:900,fontFamily:"var(--font-heading)",color:"var(--accent)",flexShrink:0,position:"relative",boxShadow:"0 8px 24px rgba(0,0,0,0.15)" }}>
            {!user?.avatar && (user?.name||"?").charAt(0).toUpperCase()}
            <div style={{position:"absolute",bottom:"-4px",right:"-4px",width:"24px",height:"24px",borderRadius:"var(--radius-btn)",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",border:"3px solid var(--surface-raised)"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </motion.button>
          <div style={{textAlign:"center"}}>
            <div style={{ fontSize:"18px",fontWeight:800,color:"var(--text-primary)",fontFamily:"var(--font-heading)" }}>{user?.name||"Display Name"}</div>
            <div style={{ fontSize:"13px",color:"var(--text-muted)",marginTop:"1px" }}>{user?.email||"account@domain.com"}</div>
          </div>
        </div>
        <div style={{ padding:"0 20px 20px",display:"grid",gap:"12px",background:"var(--surface-raised)" }}>
          <div style={{display:"grid",gap:"10px",marginTop:"8px"}}>
            <input value={name}  onChange={e=>setName(e.target.value)}  placeholder="Display name" style={IS}/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={IS}/>
            <button type="button" onClick={save} disabled={sav} className="btn-primary" style={{ width:"100%",marginTop:"6px" }}>
              {sav?"Saving…":"Save details"}
            </button>
          </div>
        </div>
      </Card>

      <SH title="Security"/>
      <Card>
        <div style={{ padding:"20px",display:"grid",gap:"10px",background:"var(--surface-raised)" }}>
          <input value={cur} onChange={e=>setCur(e.target.value)} placeholder="Current password" type="password" style={IS}/>
          <input value={nw}  onChange={e=>setNw(e.target.value)}  placeholder="New password"     type="password" style={IS}/>
          <input value={cf}  onChange={e=>setCf(e.target.value)}  placeholder="Confirm password" type="password" style={IS}/>
          <button type="button" onClick={savePwd} disabled={savP||!cur||!nw} className="btn-secondary"
            style={{ width:"100%",marginTop:"6px",opacity:savP?.5:1 }}>
            {savP?"Updating…":"Update password"}
          </button>
        </div>
      </Card>

      <SH title="Session"/>
      <Card>
        <SettingRow label="Sign out" sub="Log out of this device securely" last
          right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>}
          onClick={()=>{ logout?.(); onClose(); toast("Signed out"); }}/>
      </Card>

      <div style={{height: 24}}/>
      {photoModal && <ProfilePhotoModal user={user} updateProfile={updateProfile} onClose={() => setPhotoModal(false)} />}
    </>
  );
}

// ── General tab ──────────────────────────────────────────────────────────────
function GeneralTab({ accent }) {
  const NATIVE = isNativeApp();
  const getS = (k,d)=>{ try{const v=localStorage.getItem(`thirty_set_${k}`);return v?JSON.parse(v):d;}catch{return d;} };
  const setS = (k,v)=>localStorage.setItem(`thirty_set_${k}`,JSON.stringify(v));

  const [sound,     setSound]     = useState(()=>getS("sound",true));
  const [haptic,    setHaptic]    = useState(()=>getS("haptic",true));
  const [weekStart, setWeekStart] = useState(()=>getS("weekStart","sunday"));
  const [push,      setPush]      = useState("unknown");

  useEffect(()=>{ setS("sound",sound); },[sound]);
  useEffect(()=>{ setS("haptic",haptic); },[haptic]);
  useEffect(()=>{ 
    setS("weekStart",weekStart); 
    window.dispatchEvent(new Event("weekStart-changed"));
  },[weekStart]);
  useEffect(()=>{ if(!NATIVE && "Notification" in window) setPush(Notification.permission); },[NATIVE]);

  const reqPush = async()=>{
    if(!("Notification" in window) && !NATIVE){toast.error("Not supported");return;}
    if (NATIVE) {
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        const { display } = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
        setPush(display);
        if(display==="granted") toast.success("Notifications enabled");
        else toast.error("Permission denied");
      } else {
        toast.error("Local notifications plugin missing");
      }
      return;
    }
    const p=await Notification.requestPermission(); setPush(p);
    if(p==="granted") toast.success("Notifications enabled");
    else toast.error("Permission denied");
  };

  return (
    <>
      <SH title="Notifications"/>
      <Card>
        <SettingRow label="Push alerts"
          sub={push==="granted"?"Active":push==="denied"?"Blocked by device":"Tap to enable"}
          onClick={push==="granted"?null:reqPush}
          right={push==="granted"
            ?<span style={{fontSize:"12px",fontWeight:700,color:"var(--success)"}}>Enabled</span>
            :<span style={{padding:"6px 14px",borderRadius:"var(--radius-btn)",background:"var(--accent-subtle)",color:"var(--accent)",fontSize:"12px",fontWeight:700}}>Turn on</span>
          }/>
      </Card>

      <SH title="App Preferences"/>
      <Card>
        <SettingRow label="Sound effects" sub="Play satisfying sounds on completion"
          right={<Toggle checked={sound} onChange={setSound} accent={accent}/>}/>
        <SettingRow label="Haptic feedback" sub="Vibrate on interactions"
          right={<Toggle checked={haptic} onChange={setHaptic} accent={accent}/>}/>
        <SettingRow label="First day of week" last
          right={
            <div style={{ display:"flex",background:"var(--surface-elevated)",borderRadius:"var(--radius-btn)",padding:"4px",border:"1px solid var(--border)" }}>
              {[{v:"sunday",l:"Sun"},{v:"monday",l:"Mon"}].map(o=>(
                <button key={o.v} type="button" onClick={()=>setWeekStart(o.v)} className="btn-reset"
                  style={{ padding:"6px 14px",borderRadius:"var(--radius-btn)",background:weekStart===o.v?"var(--accent)":"transparent",color:weekStart===o.v?"#fff":"var(--text-muted)",fontWeight:700,fontSize:"12px",transition:"all 120ms" }}>{o.l}</button>
              ))}
            </div>
          }/>
      </Card>

      <SH title="About"/>
      <Card>
        <SettingRow label="Thirty Engine Dashboard" sub="Part of the Ultra-Premium SaaS Ecosystem" last
          right={<span style={{fontSize:"12px",color:"var(--accent)",fontWeight:700,padding:"4px 10px",background:"var(--accent-subtle)",border:"1px solid var(--accent)44",borderRadius:"var(--radius-btn)"}}>v2.0</span>}/>
      </Card>

      <div style={{height: 24}}/>
    </>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function AppSettings({ isOpen, onClose }) {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { theme, setTheme, accent, changeAccent, ACCENT_PRESETS, buttonShape, changeShape } = useTheme();
  const [tab, setTab] = useState("appearance");

  if (!isOpen) return null;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(12px)",display:"flex",alignItems:"flex-end",justifyContent:"center" }}
      onClick={onClose}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{type:"spring",damping:28,stiffness:260}}
        style={{ width:"100%",maxWidth:"540px",background:"var(--bg)",borderRadius:"24px 24px 0 0",height:"92vh",display:"flex",flexDirection:"column",border:"1px solid var(--border-strong)",borderBottom:"none",boxShadow:"0 -12px 40px rgba(0,0,0,0.4)" }}>

        <div style={{ width:"40px",height:"5px",borderRadius:"999px",background:"var(--border-hover)",margin:"14px auto 8px" }}/>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 18px",background:"var(--bg)",position:"sticky",top:0,zIndex:10 }}>
          <div>
            <div style={{ fontSize:"22px",fontWeight:900,color:"var(--text-primary)",fontFamily:"var(--font-heading)",letterSpacing:"-0.03em" }}>Settings</div>
            <div style={{ fontSize:"11px",color:"var(--text-muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginTop:"1px" }}>Preferences & Account</div>
          </div>
          <motion.button whileTap={{scale:0.92}} type="button" onClick={onClose} className="btn-reset"
            style={{ width:"36px",height:"36px",borderRadius:"var(--radius-btn)",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px" }}>×</motion.button>
        </div>

        <div style={{ display:"flex",background:"var(--surface-raised)",borderRadius:"var(--radius-btn)",margin:"0 16px 12px",padding:"4px",border:"1px solid var(--border-strong)" }}>
          {[{id:"appearance",l:"App & UI"},{id:"account",l:"Account Settings"},{id:"general",l:"Preferences"}].map(t=>(
            <button key={t.id} type="button" onClick={()=>setTab(t.id)} className="btn-reset"
              style={{ flex:1,padding:"10px",borderRadius:"var(--radius-btn)",background:tab===t.id?"var(--surface-elevated)":"transparent",color:tab===t.id?"var(--text-primary)":"var(--text-muted)",fontWeight:tab===t.id?700:600,fontSize:"13px",transition:"all 130ms",border:tab===t.id?"1px solid var(--border)":"1px solid transparent",boxShadow:tab===t.id?"0 2px 8px rgba(0,0,0,0.12)":"none" }}>
              {t.l}
            </button>
          ))}
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"0 0 44px" }} className="hide-scrollbar">
          {tab==="appearance"&&<AppearanceTab theme={theme} setTheme={setTheme} accent={accent} changeAccent={changeAccent} ACCENT_PRESETS={ACCENT_PRESETS} buttonShape={buttonShape} changeShape={changeShape}/>}
          {tab==="account"  &&<AccountTab user={user} updateProfile={updateProfile} changePassword={changePassword} logout={logout} onClose={onClose}/>}
          {tab==="general"  &&<GeneralTab accent={accent}/>}
        </div>
      </motion.div>
    </div>
  );
}