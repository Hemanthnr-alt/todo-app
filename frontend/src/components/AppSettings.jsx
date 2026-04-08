import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth }  from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

function Toggle({ checked, onChange, isDark, accent }) {
  return (
    <button onClick={()=>onChange(!checked)}
      style={{
        width:"40px",height:"22px",borderRadius:"999px",
        background:checked?accent:(isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.15)"),
        border:"none",position:"relative",cursor:"pointer",transition:"background 0.2s",
        WebkitTapHighlightColor:"transparent",touchAction:"manipulation",flexShrink:0
      }}>
      <div style={{
        position:"absolute",top:"2px",left:checked?"20px":"2px",width:"18px",height:"18px",
        backgroundColor:"white",borderRadius:"50%",
        /* Enhanced spring cubic-bezier for toggle */
        transition:"left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow:"0 2px 4px rgba(0,0,0,0.2)"
      }}/>
    </button>
  );
}

export default function AppSettings({ isOpen, onClose }) {
  const { user } = useAuth();
  const { isDark, toggleTheme, accent, setAccent } = useTheme();
  const [activeTab, setActiveTab]=useState("general");
  const [pushStatus, setPushStatus]=useState("unknown");
  const [devClicks, setDevClicks]=useState(0);
  
  const ac = accent || "#7C5CFC";
  const getS=(k,def)=>{ try{const v=localStorage.getItem(`thirty_set_${k}`);return v?JSON.parse(v):def;}catch{return def;} };
  const setS=(k,v)=>{ localStorage.setItem(`thirty_set_${k}`,JSON.stringify(v)); };

  const [sound, setSound]=useState(()=>getS("sound",true));
  const [haptic, setHaptic]=useState(()=>getS("haptic",true));
  const [weekStart, setWeekStart]=useState(()=>getS("weekStart","sunday"));

  useEffect(()=>{ setS("sound",sound); setS("haptic",haptic); setS("weekStart",weekStart); },[sound,haptic,weekStart]);

  useEffect(()=>{
    if(isOpen){
      if("Notification" in window){ setPushStatus(Notification.permission); }
      else { setPushStatus("unsupported"); }
    }
  },[isOpen]);

  const reqPush = async () => {
    if(!("Notification" in window)){ toast.error("Push not supported here"); return; }
    try{ const p=await Notification.requestPermission(); setPushStatus(p); if(p==="granted")toast.success("Ready to go!"); else toast("Notifications disabled."); }
    catch{toast.error("Error asking permission");}
  };

  const devMode = () => {
    setDevClicks(c=>c+1);
    if(devClicks===6){ toast("Developer mode activated 🛠", {icon:"🚀"}); localStorage.setItem("thirty_dev","true"); }
  };

  if (!isOpen) return null;

  const bg         = isDark ? "rgba(9,9,15,0.99)"   : "rgba(248,250,252,0.99)";
  const textColor  = isDark ? "#F0EFF8"             : "#0f172a";
  const mutedColor = isDark ? "#8B8AA3"             : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const TABS = [
    { id:"general", icon:"⚙️", label:"General" },
    { id:"look",    icon:"✨", label:"Look & Feel" },
    { id:"alerts",  icon:"🔔", label:"Alerts" },
    { id:"about",   icon:"ℹ️", label:"About" },
  ];

  /* SWATCHES — only purples/pinks/blues for premium SaaS feel */
  const SWATCHES=["#7C5CFC","#F05050","#22C97E","#F5A623","#3b82f6","#ec4899"];

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
        style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",zIndex:8500}}/>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:320}}
        style={{position:"fixed",bottom:0,left:0,right:0,zIndex:8501,background:bg,borderRadius:"24px 24px 0 0",borderTop:`1px solid ${border}`,paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 20px)",fontFamily:"'Inter',sans-serif",maxHeight:"88vh",display:"flex",flexDirection:"column"}}>
        
        {/* Header */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}>
          <div style={{width:"36px",height:"4px",borderRadius:"2px",background:isDark?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.12)"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 20px 24px"}}>
          <h2 style={{fontSize:"20px",fontWeight:600,margin:0,color:textColor,letterSpacing:"-0.02em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Settings</h2>
          <button onClick={onClose} style={{width:"32px",height:"32px",borderRadius:"16px",background:cardBg,border:`1px solid ${border}`,cursor:"pointer",color:textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",WebkitTapHighlightColor:"transparent"}}>✕</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          {/* Tabs */}
          <div style={{display:"flex",gap:"4px",overflowX:"auto",padding:"0 16px 12px",marginBottom:"8px"}} className="hide-scrollbar">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{padding:"8px 16px",borderRadius:"999px",border:`1px solid ${activeTab===t.id?(isDark?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.15)"):border}`,background:activeTab===t.id?cardBg:"transparent",color:activeTab===t.id?textColor:mutedColor,cursor:"pointer",fontSize:"13px",fontWeight:activeTab===t.id?600:500,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{flex:1,overflowY:"auto",padding:"0 20px 20px"}}>
            
            {activeTab==="general"&&(
              <AnimatePresence mode="wait"><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.15}} style={{display:"flex",flexDirection:"column",gap:"24px"}}>
                <div>
                  <div style={{fontSize:"12px",fontWeight:600,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"12px"}}>Account</div>
                  <div style={{padding:"14px 16px",borderRadius:"14px",background:cardBg,border:`1px solid ${border}`,display:"flex",alignItems:"center",gap:"12px"}}>
                    <div style={{width:"44px",height:"44px",borderRadius:"12px",background:`linear-gradient(135deg,${ac},#6447E8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",color:"white",fontWeight:800}}>{user?.name?.charAt(0)||"?"}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"15px",fontWeight:600,color:textColor}}>{user?.name||"Guest"}</div>
                      <div style={{fontSize:"13px",color:mutedColor}}>{user?.email||"Not logged in"}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:"12px",fontWeight:600,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"12px"}}>System</div>
                  <div style={{borderRadius:"14px",background:cardBg,border:`1px solid ${border}`,overflow:"hidden"}}>
                    <div style={{padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${border}`}}>
                      <div><div style={{fontSize:"14px",fontWeight:500,color:textColor}}>Sound effects</div><div style={{fontSize:"12px",color:mutedColor,marginTop:"2px"}}>For timers and completion</div></div>
                      <Toggle checked={sound} onChange={setSound} isDark={isDark} accent={ac}/>
                    </div>
                    <div style={{padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${border}`}}>
                      <div><div style={{fontSize:"14px",fontWeight:500,color:textColor}}>Haptic feedback</div><div style={{fontSize:"12px",color:mutedColor,marginTop:"2px"}}>Vibrate on actions (mobile)</div></div>
                      <Toggle checked={haptic} onChange={setHaptic} isDark={isDark} accent={ac}/>
                    </div>
                    <div style={{padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:"14px",fontWeight:500,color:textColor}}>Week starts on</div></div>
                      <select value={weekStart} onChange={e=>setWeekStart(e.target.value)} style={{background:"transparent",border:`1px solid ${border}`,color:textColor,padding:"6px 12px",borderRadius:"8px",fontSize:"13px",fontFamily:"inherit",cursor:"pointer"}}>
                        <option value="sunday">Sunday</option><option value="monday">Monday</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div></AnimatePresence>
            )}

            {activeTab==="look"&&(
              <AnimatePresence mode="wait"><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.15}} style={{display:"flex",flexDirection:"column",gap:"24px"}}>
                <div>
                  <div style={{fontSize:"12px",fontWeight:600,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"12px"}}>Theme</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                    <button onClick={()=>{if(!isDark)toggleTheme();}} style={{padding:"16px",borderRadius:"14px",background:isDark?`${ac}18`:cardBg,border:`1px solid ${isDark?ac:border}`,color:textColor,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"10px",transition:"all 0.2s"}}>
                      <div style={{fontSize:"24px"}}>🌙</div><span style={{fontSize:"13px",fontWeight:500}}>Dark</span>
                    </button>
                    <button onClick={()=>{if(isDark)toggleTheme();}} style={{padding:"16px",borderRadius:"14px",background:!isDark?`${ac}18`:cardBg,border:`1px solid ${!isDark?ac:border}`,color:textColor,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"10px",transition:"all 0.2s"}}>
                      <div style={{fontSize:"24px"}}>☀️</div><span style={{fontSize:"13px",fontWeight:500}}>Light</span>
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:"12px",fontWeight:600,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"12px"}}>Accent Colour</div>
                  <div style={{padding:"16px",borderRadius:"14px",background:cardBg,border:`1px solid ${border}`,display:"flex",flexWrap:"wrap",gap:"14px",justifyContent:"center"}}>
                    {SWATCHES.map(hex => {
                      const sel = ac===hex;
                      /* Custom gap-ring for selected swatch, with checkmark */
                      return (
                        <button key={hex} onClick={()=>{setAccent(hex);localStorage.setItem("accent",hex);}}
                          style={{
                            width:"38px",height:"38px",borderRadius:"50%",background:hex,border:"none",cursor:"pointer",
                            transition:"transform 0.15s, box-shadow 0.15s",display:"flex",alignItems:"center",justifyContent:"center",
                            boxShadow:sel?`0 0 0 2px ${bg}, 0 0 0 4px ${hex}`:"none",
                            transform:sel?"scale(1.05)":"scale(1)"
                          }}>
                          {sel && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{animation:"scale-check 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"}}><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div></AnimatePresence>
            )}

            {activeTab==="alerts"&&(
              <AnimatePresence mode="wait"><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.15}} style={{display:"flex",flexDirection:"column",gap:"24px"}}>
                <div>
                  <div style={{fontSize:"12px",fontWeight:600,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"12px"}}>Push Notifications</div>
                  <div style={{borderRadius:"14px",background:cardBg,border:`1px solid ${border}`,padding:"16px",marginBottom:"16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
                      <div style={{flex:1,paddingRight:"16px"}}>
                        <div style={{fontSize:"14px",fontWeight:500,color:textColor,marginBottom:"4px"}}>Daily Reminders</div>
                        <div style={{fontSize:"13px",color:mutedColor,lineHeight:1.5}}>Get notified about overdue tasks, upcoming habits, and timer completions.</div>
                      </div>
                      <div style={{padding:"6px 10px",borderRadius:"8px",background:pushStatus==="granted"?"rgba(34,201,126,0.12)":pushStatus==="denied"?"rgba(240,80,80,0.12)":"rgba(255,255,255,0.06)",color:pushStatus==="granted"?"#22C97E":pushStatus==="denied"?"#F05050":mutedColor,fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.02em"}}>
                        {pushStatus}
                      </div>
                    </div>

                    {pushStatus==="default"||pushStatus==="unknown" ? (
                      <button onClick={reqPush} style={{width:"100%",padding:"12px",borderRadius:"10px",background:`linear-gradient(135deg,${ac},#6447E8)`,border:"none",color:"white",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 16px rgba(124,92,252,0.3)`}}>
                        Enable Notifications
                      </button>
                    ) : pushStatus==="denied" ? (
                      /* Updated Amber card for blocked status */
                      <div style={{padding:"12px",borderRadius:"10px",background:"rgba(245,166,35,0.08)",border:"1px solid rgba(245,166,35,0.22)",display:"flex",gap:"10px",alignItems:"flex-start"}}>
                        <div style={{fontSize:"16px"}}>⚠️</div>
                        <div style={{fontSize:"12px",color:"#F5A623",lineHeight:1.5}}>Notifications are blocked. Please allow them in your device settings to receive reminders.</div>
                      </div>
                    ) : (
                      <div style={{padding:"12px",borderRadius:"10px",background:"rgba(34,201,126,0.08)",border:"1px solid rgba(34,201,126,0.22)",display:"flex",gap:"10px",alignItems:"flex-start"}}>
                        <div style={{fontSize:"16px"}}>✅</div>
                        <div style={{fontSize:"12px",color:"#22C97E",lineHeight:1.5}}>You're all set! We'll send you timely reminders for your tasks and timers.</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div></AnimatePresence>
            )}

            {activeTab==="about"&&(
              <AnimatePresence mode="wait"><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.15}} style={{textAlign:"center",padding:"20px 0"}}>
                <div onClick={devMode} style={{width:"80px",height:"80px",borderRadius:"22px",background:`linear-gradient(135deg,${ac},#6447E8)`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",fontWeight:800,color:"white",boxShadow:`0 8px 32px rgba(124,92,252,0.3)`}}>
                  30
                </div>
                <h3 style={{fontSize:"20px",fontWeight:700,margin:"0 0 4px",color:textColor,letterSpacing:"-0.02em"}}>Thirty</h3>
                <p style={{fontSize:"14px",color:mutedColor,margin:"0 0 32px"}}>Version 3.0.0 (Premium)</p>
                
                <div style={{display:"flex",flexDirection:"column",gap:"12px",background:cardBg,borderRadius:"16px",border:`1px solid ${border}`,padding:"12px"}}>
                  <a href="#" style={{display:"flex",justifyContent:"space-between",padding:"12px",color:textColor,textDecoration:"none",fontSize:"14px",fontWeight:500}}><span>Feedback & Support</span><span style={{color:mutedColor}}>↗</span></a>
                  <div style={{height:"1px",background:border}}/>
                  <a href="#" style={{display:"flex",justifyContent:"space-between",padding:"12px",color:textColor,textDecoration:"none",fontSize:"14px",fontWeight:500}}><span>Privacy Policy</span><span style={{color:mutedColor}}>↗</span></a>
                  <div style={{height:"1px",background:border}}/>
                  <a href="#" style={{display:"flex",justifyContent:"space-between",padding:"12px",color:textColor,textDecoration:"none",fontSize:"14px",fontWeight:500}}><span>Terms of Service</span><span style={{color:mutedColor}}>↗</span></a>
                </div>
                <div style={{marginTop:"32px",fontSize:"12px",color:mutedColor,opacity:0.6}}>Designed with <span style={{color:"#F05050"}}>♥</span> for productivity</div>
              </motion.div></AnimatePresence>
            )}

          </div>
        </div>
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none} .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none} @keyframes scale-check{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      </motion.div>
    </>
  );
}