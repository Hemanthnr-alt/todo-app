import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { playTimerSound, sendNotification } from "../services/notifications";

function pad(n) { return String(Math.floor(Math.abs(n))).padStart(2,"0"); }

function fmtMs(ms) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs/3600000);
  const m = Math.floor((abs%3600000)/60000);
  const s = Math.floor((abs%60000)/1000);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function fmtMs10(ms) {
  return `.${String(Math.floor((ms%1000)/10)).padStart(2,"0")}`;
}

// ── Circular progress ─────────────────────────────────────────────────────────
function Ring({ pct, color, size=180, stroke=8, children }) {
  const r = (size-stroke*2)/2;
  const circ = 2*Math.PI*r;
  return (
    <div style={{ position:"relative", width:size, height:size, margin:"0 auto 24px" }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)", position:"absolute", top:0, left:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.1s linear" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {children}
      </div>
    </div>
  );
}

// ── Number input ──────────────────────────────────────────────────────────────
function NumInput({ value, onChange, label, isDark, border, textColor, mutedColor }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
        <button onClick={()=>onChange(Math.min(59,parseInt(value||0)+1))}
          style={{ width:"36px", height:"24px", borderRadius:"6px", border:`1px solid ${border}`, background:"rgba(255,107,157,0.1)", color:"#ff6b9d", cursor:"pointer", fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
        <input value={value} onChange={e=>onChange(parseInt(e.target.value.replace(/\D/g,"").slice(0,2))||0)}
          style={{ width:"56px", padding:"10px 4px", textAlign:"center", fontSize:"28px", fontWeight:800, background: isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)", border:`1px solid ${border}`, borderRadius:"10px", color:textColor, outline:"none", fontFamily:"inherit" }}/>
        <button onClick={()=>onChange(Math.max(0,parseInt(value||0)-1))}
          style={{ width:"36px", height:"24px", borderRadius:"6px", border:`1px solid ${border}`, background:"rgba(255,107,157,0.1)", color:"#ff6b9d", cursor:"pointer", fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
      </div>
      <span style={{ fontSize:"10px", color:mutedColor, fontWeight:700, textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

// ── Stopwatch ─────────────────────────────────────────────────────────────────
function Stopwatch({ isDark, textColor, mutedColor, border, cardBg }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps,    setLaps]    = useState([]);
  const startRef = useRef(null);
  const stored   = useRef(0);
  const raf      = useRef(null);

  const tick = useCallback(() => {
    setElapsed(stored.current + Date.now() - startRef.current);
    raf.current = requestAnimationFrame(tick);
  }, []);

  const toggle = () => {
    if (running) { cancelAnimationFrame(raf.current); stored.current += Date.now()-startRef.current; }
    else { startRef.current = Date.now(); raf.current = requestAnimationFrame(tick); }
    setRunning(r => !r);
  };

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setRunning(false); setElapsed(0); setLaps([]);
    stored.current = 0;
  };

  const lap = () => {
    if (!running) return;
    const prev = laps[0]?.time || 0;
    setLaps(l => [{ n:l.length+1, time:elapsed, split:elapsed-prev }, ...l]);
    playTimerSound("beep");
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div style={{ textAlign:"center" }}>
      {/* Big time display */}
      <div style={{ marginBottom:"32px" }}>
        <div style={{ fontSize:"clamp(52px,14vw,72px)", fontWeight:800, letterSpacing:"-0.04em", color:textColor, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>
          {fmtMs(elapsed)}
        </div>
        <div style={{ fontSize:"clamp(20px,5vw,28px)", color:mutedColor, fontVariantNumeric:"tabular-nums", marginTop:"4px" }}>
          {fmtMs10(elapsed)}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:"12px", justifyContent:"center", marginBottom:"28px" }}>
        <motion.button whileTap={{scale:0.95}} onClick={lap} disabled={!running}
          style={{ padding:"13px 24px", borderRadius:"99px", border:`1px solid ${border}`, background: running?isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)":"transparent", color:running?textColor:mutedColor, cursor:running?"pointer":"default", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
          Lap
        </motion.button>

        <motion.button whileTap={{scale:0.93}} onClick={toggle}
          style={{ padding:"13px 40px", borderRadius:"99px", border:"none", background: running?"linear-gradient(135deg,#f43f5e,#f97316)":"linear-gradient(135deg,#ff6b9d,#ff99cc)", color:"white", cursor:"pointer", fontSize:"15px", fontWeight:700, fontFamily:"inherit", boxShadow: running?"0 4px 20px rgba(244,63,94,0.4)":"0 4px 20px rgba(255,107,157,0.4)" }}>
          {running ? "Stop" : elapsed>0 ? "Resume" : "Start"}
        </motion.button>

        {elapsed>0 && !running && (
          <motion.button whileTap={{scale:0.95}} onClick={reset}
            style={{ padding:"13px 24px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)", color:textColor, cursor:"pointer", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
            Reset
          </motion.button>
        )}
      </div>

      {/* Laps */}
      {laps.length>0 && (
        <div style={{ background:cardBg, borderRadius:"16px", border:`1px solid ${border}`, overflow:"hidden", maxHeight:"280px", overflowY:"auto" }}>
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"}`, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:"11px", fontWeight:700, color:mutedColor, textTransform:"uppercase" }}>Lap</span>
            <span style={{ fontSize:"11px", fontWeight:700, color:mutedColor, textTransform:"uppercase" }}>Split / Total</span>
          </div>
          {laps.map(l => (
            <div key={l.n} style={{ display:"flex", justifyContent:"space-between", padding:"10px 16px", borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"}` }}>
              <span style={{ fontSize:"13px", color:mutedColor }}>Lap {l.n}</span>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"13px", fontWeight:700, color:textColor, fontVariantNumeric:"tabular-nums" }}>{fmtMs(l.split)}</div>
                <div style={{ fontSize:"10px", color:mutedColor, fontVariantNumeric:"tabular-nums" }}>{fmtMs(l.time)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function Countdown({ isDark, textColor, mutedColor, border, cardBg }) {
  const [running,   setRunning]   = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total,     setTotal]     = useState(0);
  const [h,  setH]  = useState(0);
  const [m,  setM]  = useState(5);
  const [s,  setS]  = useState(0);
  const [warned,    setWarned]    = useState(false);
  const interval = useRef(null);

  const totalMs = (h*3600 + m*60 + s) * 1000;

  const start = () => {
    if (totalMs <= 0) return;
    setTotal(totalMs); setRemaining(totalMs);
    setRunning(true); setWarned(false);
  };

  const toggle = () => setRunning(r => !r);

  const reset = () => {
    clearInterval(interval.current);
    setRunning(false); setRemaining(0); setTotal(0); setWarned(false);
  };

  useEffect(() => {
    if (!running) { clearInterval(interval.current); return; }
    interval.current = setInterval(() => {
      setRemaining(r => {
        const next = r - 100;
        if (!warned && next <= 10000 && next > 9900) {
          playTimerSound("warning"); setWarned(true);
        }
        if (next <= 0) {
          clearInterval(interval.current);
          setRunning(false);
          playTimerSound("complete");
          sendNotification({ title:"⏰ Timer complete!", body:"Your countdown is done.", sound:true });
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval.current);
  }, [running, warned]);

  const pct = total>0 ? ((total-remaining)/total)*100 : 0;
  const color = remaining<10000 ? "#f43f5e" : remaining<30000 ? "#f59e0b" : "#ff6b9d";

  return (
    <div style={{ textAlign:"center" }}>
      {total===0 ? (
        // Setup
        <div>
          <div style={{ display:"flex", gap:"16px", justifyContent:"center", alignItems:"center", marginBottom:"28px" }}>
            <NumInput value={h} onChange={setH} label="hours"   isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
            <span style={{ fontSize:"32px", fontWeight:800, color:mutedColor, paddingBottom:"24px" }}>:</span>
            <NumInput value={m} onChange={setM} label="min"     isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
            <span style={{ fontSize:"32px", fontWeight:800, color:mutedColor, paddingBottom:"24px" }}>:</span>
            <NumInput value={s} onChange={setS} label="sec"     isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
          </div>

          {/* Presets */}
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap", marginBottom:"24px" }}>
            {[["1 min",0,1,0],["5 min",0,5,0],["10 min",0,10,0],["25 min",0,25,0],["1 hr",1,0,0]].map(([l,ph,pm,ps])=>(
              <button key={l} onClick={()=>{ setH(ph);setM(pm);setS(ps); }}
                style={{ padding:"7px 14px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)", color:textColor, cursor:"pointer", fontSize:"12px", fontWeight:600, fontFamily:"inherit" }}>
                {l}
              </button>
            ))}
          </div>

          <motion.button whileTap={{scale:0.95}} onClick={start}
            style={{ padding:"14px 52px", borderRadius:"99px", border:"none", background:"linear-gradient(135deg,#ff6b9d,#ff99cc)", color:"white", cursor:"pointer", fontSize:"16px", fontWeight:700, fontFamily:"inherit", boxShadow:"0 4px 20px rgba(255,107,157,0.4)" }}>
            Start
          </motion.button>
        </div>
      ) : (
        <>
          <Ring pct={pct} color={color} size={200} stroke={10}>
            <div style={{ fontSize:"clamp(32px,8vw,44px)", fontWeight:800, color: remaining<10000?"#f43f5e":textColor, fontVariantNumeric:"tabular-nums", transition:"color 0.3s" }}>
              {fmtMs(remaining)}
            </div>
            {remaining<10000 && remaining>0 && (
              <div style={{ fontSize:"11px", color:"#f43f5e", fontWeight:700, marginTop:"4px" }}>⚠ Almost done!</div>
            )}
            {remaining===0 && (
              <div style={{ fontSize:"13px", color:"#10b981", fontWeight:700, marginTop:"4px" }}>✓ Done!</div>
            )}
          </Ring>

          <div style={{ display:"flex", gap:"12px", justifyContent:"center" }}>
            {remaining>0 && (
              <motion.button whileTap={{scale:0.95}} onClick={toggle}
                style={{ padding:"13px 40px", borderRadius:"99px", border:"none", background:running?"linear-gradient(135deg,#f43f5e,#f97316)":"linear-gradient(135deg,#ff6b9d,#ff99cc)", color:"white", cursor:"pointer", fontSize:"15px", fontWeight:700, fontFamily:"inherit" }}>
                {running?"Pause":"Resume"}
              </motion.button>
            )}
            <motion.button whileTap={{scale:0.95}} onClick={reset}
              style={{ padding:"13px 24px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)", color:textColor, cursor:"pointer", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
              Reset
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Intervals ─────────────────────────────────────────────────────────────────
function Intervals({ isDark, textColor, mutedColor, border, cardBg }) {
  const [started,  setStarted]  = useState(false);
  const [running,  setRunning]  = useState(false);
  const [phase,    setPhase]    = useState("work");
  const [elapsed,  setElapsed]  = useState(0);
  const [round,    setRound]    = useState(1);
  const [workM,    setWorkM]    = useState(0);
  const [workS,    setWorkS]    = useState(30);
  const [restM,    setRestM]    = useState(0);
  const [restS,    setRestS]    = useState(10);
  const [rounds,   setRounds]   = useState(3);
  const interval = useRef(null);

  const workMs  = (workM*60+workS)*1000;
  const restMs  = (restM*60+restS)*1000;
  const current = phase==="work" ? workMs : restMs;
  const remaining = Math.max(0, current-elapsed);
  const pct = current>0 ? (elapsed/current)*100 : 0;
  const phaseColor = phase==="work" ? "#ff6b9d" : "#10b981";

  useEffect(() => {
    if (!running) { clearInterval(interval.current); return; }
    interval.current = setInterval(() => {
      setElapsed(e => {
        const next = e+100;
        if (next>=current) {
          if (phase==="work") {
            playTimerSound("interval");
            setPhase("rest"); setElapsed(0); return 0;
          } else {
            if (round>=rounds) {
              playTimerSound("complete");
              sendNotification({ title:"🏋️ Workout complete!", body:`Finished ${rounds} rounds!`, sound:true });
              clearInterval(interval.current);
              setRunning(false); setStarted(false);
              setRound(1); setPhase("work"); return 0;
            }
            playTimerSound("interval");
            setRound(r => r+1); setPhase("work"); setElapsed(0); return 0;
          }
        }
        // Warning beep at 3s left
        if (current-next<=3000 && current-next>2900) playTimerSound("warning");
        return next;
      });
    }, 100);
    return () => clearInterval(interval.current);
  }, [running, phase, current, round, rounds]);

  const begin = () => {
    if (workMs<=0) return;
    setStarted(true); setRunning(true);
    setElapsed(0); setRound(1); setPhase("work");
  };

  const reset = () => {
    clearInterval(interval.current);
    setStarted(false); setRunning(false);
    setElapsed(0); setRound(1); setPhase("work");
  };

  return (
    <div style={{ textAlign:"center" }}>
      {!started ? (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
            {[
              { label:"Work", m:workM, s:workS, setM:setWorkM, setS:setWorkS, color:"#ff6b9d" },
              { label:"Rest", m:restM, s:restS, setM:setRestM, setS:setRestS, color:"#10b981" },
            ].map(({label,m,s,setM,setS,color})=>(
              <div key={label} style={{ padding:"14px 10px", borderRadius:"16px", background:isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)", border:`1px solid ${border}` }}>
                <div style={{ fontSize:"11px", fontWeight:700, color, marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
                <div style={{ display:"flex", gap:"4px", alignItems:"center", justifyContent:"center" }}>
                  <NumInput value={m} onChange={setM} label="min" isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
                  <span style={{ color:mutedColor, fontSize:"22px", fontWeight:800, paddingBottom:"24px" }}>:</span>
                  <NumInput value={s} onChange={setS} label="sec" isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", marginBottom:"24px" }}>
            <span style={{ fontSize:"14px", color:mutedColor, fontWeight:600 }}>Rounds</span>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <button onClick={()=>setRounds(r=>Math.max(1,r-1))} style={{ width:"32px",height:"32px",borderRadius:"99px",border:`1px solid ${border}`,background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)",color:textColor,cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
              <span style={{ fontSize:"22px", fontWeight:800, color:textColor, minWidth:"28px" }}>{rounds}</span>
              <button onClick={()=>setRounds(r=>Math.min(99,r+1))} style={{ width:"32px",height:"32px",borderRadius:"99px",border:`1px solid ${border}`,background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)",color:textColor,cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
            </div>
          </div>

          <motion.button whileTap={{scale:0.95}} onClick={begin}
            style={{ padding:"14px 52px", borderRadius:"99px", border:"none", background:"linear-gradient(135deg,#ff6b9d,#ff99cc)", color:"white", cursor:"pointer", fontSize:"16px", fontWeight:700, fontFamily:"inherit", boxShadow:"0 4px 20px rgba(255,107,157,0.4)" }}>
            Start
          </motion.button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom:"12px", display:"flex", gap:"8px", justifyContent:"center", alignItems:"center" }}>
            <span style={{ fontSize:"11px", fontWeight:700, padding:"4px 12px", borderRadius:"99px", background:`${phaseColor}20`, color:phaseColor, textTransform:"uppercase", letterSpacing:"0.07em" }}>
              {phase}
            </span>
            <span style={{ fontSize:"13px", color:mutedColor }}>Round {round} of {rounds}</span>
          </div>

          {/* Round indicators */}
          <div style={{ display:"flex", gap:"6px", justifyContent:"center", marginBottom:"16px" }}>
            {Array.from({length:rounds}).map((_,i)=>(
              <div key={i} style={{ width:"8px",height:"8px",borderRadius:"50%",background:i<round-1?"#10b981":i===round-1?phaseColor:isDark?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.1)", transition:"all 0.3s" }}/>
            ))}
          </div>

          <Ring pct={pct} color={phaseColor} size={180} stroke={8}>
            <div style={{ fontSize:"36px", fontWeight:800, color:textColor, fontVariantNumeric:"tabular-nums" }}>{fmtMs(remaining)}</div>
            <div style={{ fontSize:"11px", color:mutedColor, marginTop:"4px" }}>{phase==="work"?"work":"rest"}</div>
          </Ring>

          <div style={{ display:"flex", gap:"12px", justifyContent:"center" }}>
            <motion.button whileTap={{scale:0.95}} onClick={()=>setRunning(r=>!r)}
              style={{ padding:"13px 40px", borderRadius:"99px", border:"none", background:running?"linear-gradient(135deg,#f43f5e,#f97316)":"linear-gradient(135deg,#ff6b9d,#ff99cc)", color:"white", cursor:"pointer", fontSize:"15px", fontWeight:700, fontFamily:"inherit" }}>
              {running?"Pause":"Resume"}
            </motion.button>
            <motion.button whileTap={{scale:0.95}} onClick={reset}
              style={{ padding:"13px 24px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)", color:textColor, cursor:"pointer", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
              Reset
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Timer ────────────────────────────────────────────────────────────────
export default function Timer() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState("stopwatch");

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.88)";
  const border     = isDark ? "rgba(255,107,157,0.1)"  : "rgba(255,107,157,0.18)";

  const TABS = [
    { id:"stopwatch", label:"Stopwatch", icon:"⏱" },
    { id:"countdown", label:"Countdown", icon:"⏳" },
    { id:"intervals", label:"Intervals", icon:"🔄" },
  ];

  return (
    <div style={{ maxWidth:"480px", margin:"0 auto", padding:"20px 16px", fontFamily:"'DM Sans',sans-serif", color:textColor }}>
      <h1 style={{ fontSize:"clamp(22px,5vw,28px)", fontWeight:800, margin:"0 0 20px", letterSpacing:"-0.03em" }}>
        <span style={{ background:"linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Timer</span>
      </h1>

      {/* Tab switcher */}
      <div style={{ display:"flex", background:isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)", borderRadius:"14px", padding:"4px", marginBottom:"24px", gap:"3px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, padding:"10px 6px", borderRadius:"11px",
            border:"none", cursor:"pointer", fontFamily:"inherit",
            fontSize:"12px", fontWeight: tab===t.id ? 700 : 500,
            background: tab===t.id ? (isDark?"rgba(255,107,157,0.2)":"rgba(255,107,157,0.12)") : "transparent",
            color: tab===t.id ? "#ff6b9d" : mutedColor,
            transition:"all 0.15s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"5px",
          }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding:"24px 16px", background:cardBg, backdropFilter:"blur(12px)", borderRadius:"22px", border:`1px solid ${border}`, minHeight:"320px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}}>
            {tab==="stopwatch" && <Stopwatch isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg}/>}
            {tab==="countdown" && <Countdown isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg}/>}
            {tab==="intervals" && <Intervals isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg}/>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}