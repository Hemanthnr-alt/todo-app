import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { playTimerSound, sendNotification } from "../services/notifications";

function pad(n)  { return String(Math.floor(Math.abs(n))).padStart(2,"0"); }
function fmtMs(ms) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs/3600000), m = Math.floor((abs%3600000)/60000), s = Math.floor((abs%60000)/1000);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
function fmtMsMs(ms) { return `.${String(Math.floor((ms%1000)/10)).padStart(2,"0")}`; }

function Ring({ pct, color, size=200, stroke=10, children }) {
  const r = (size - stroke*2) / 2;
  const circ = 2*Math.PI*r;
  return (
    <div style={{ position:"relative", width:size, height:size, margin:"0 auto 24px" }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)", position:"absolute", top:0, left:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ*(1-Math.min(pct,100)/100)}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.1s linear, stroke 0.3s" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>{children}</div>
    </div>
  );
}

function NumSpin({ value, onChange, label, isDark, border, textColor, mutedColor }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
      <button onClick={() => onChange(Math.min(59, (value||0)+1))}
        style={{ width:"34px", height:"22px", borderRadius:"6px", border:`1px solid ${border}`, background:"rgba(255,255,255,0.06)", color:textColor, cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
      <input value={String(value||0).padStart(2,"0")} onChange={e => onChange(Math.min(99,Math.max(0,parseInt(e.target.value.replace(/\D/g,""))||0)))}
        style={{ width:"52px", padding:"8px 4px", textAlign:"center", fontSize:"26px", fontWeight:800, background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)", border:`1px solid ${border}`, borderRadius:"10px", color:textColor, outline:"none", fontFamily:"inherit" }}/>
      <button onClick={() => onChange(Math.max(0, (value||0)-1))}
        style={{ width:"34px", height:"22px", borderRadius:"6px", border:`1px solid ${border}`, background:"rgba(255,255,255,0.06)", color:textColor, cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
      <span style={{ fontSize:"9px", color:mutedColor, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
    </div>
  );
}

// ── Stopwatch ──────────────────────────────────────────────────────────────────
function Stopwatch({ isDark, textColor, mutedColor, border, cardBg, accent }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps,    setLaps]    = useState([]);
  const startRef = useRef(null), stored = useRef(0), raf = useRef(null);

  const tick = useCallback(() => {
    setElapsed(stored.current + Date.now() - startRef.current);
    raf.current = requestAnimationFrame(tick);
  }, []);

  const toggle = () => {
    if (running) { cancelAnimationFrame(raf.current); stored.current += Date.now()-startRef.current; }
    else { startRef.current = Date.now(); raf.current = requestAnimationFrame(tick); }
    setRunning(r => !r);
  };

  const reset = () => { cancelAnimationFrame(raf.current); setRunning(false); setElapsed(0); setLaps([]); stored.current = 0; };

  const lap = () => {
    if (!running) return;
    const prev = laps[0]?.total || 0;
    setLaps(l => [{ n:l.length+1, split:elapsed-prev, total:elapsed }, ...l]);
    playTimerSound("beep");
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const fastest = laps.length > 1 ? Math.min(...laps.map(l=>l.split)) : null;
  const slowest = laps.length > 1 ? Math.max(...laps.map(l=>l.split)) : null;

  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ marginBottom:"28px" }}>
        <div style={{ fontSize:"clamp(52px,14vw,72px)", fontWeight:800, letterSpacing:"-0.04em", color:textColor, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>
          {fmtMs(elapsed)}
        </div>
        <div style={{ fontSize:"clamp(18px,5vw,26px)", color:mutedColor, fontVariantNumeric:"tabular-nums", marginTop:"4px" }}>
          {fmtMsMs(elapsed)}
        </div>
      </div>

      <div style={{ display:"flex", gap:"10px", justifyContent:"center", marginBottom:"24px" }}>
        <motion.button whileTap={{scale:0.95}} onClick={lap} disabled={!running}
          style={{ padding:"12px 22px", borderRadius:"99px", border:`1px solid ${border}`, background:running?isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)":"transparent", color:running?textColor:mutedColor, cursor:running?"pointer":"default", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
          Lap
        </motion.button>
        <motion.button whileTap={{scale:0.93}} onClick={toggle}
          style={{ padding:"12px 40px", borderRadius:"99px", border:"none", background:running?`linear-gradient(135deg,#f43f5e,#f97316)`:`linear-gradient(135deg,${accent},${accent}cc)`, color:"white", cursor:"pointer", fontSize:"15px", fontWeight:700, fontFamily:"inherit", boxShadow:running?"0 4px 20px rgba(244,63,94,0.4)":`0 4px 20px ${accent}44` }}>
          {running ? "Stop" : elapsed>0 ? "Resume" : "Start"}
        </motion.button>
        {elapsed>0 && !running && (
          <motion.button whileTap={{scale:0.95}} onClick={reset}
            style={{ padding:"12px 22px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)", color:textColor, cursor:"pointer", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
            Reset
          </motion.button>
        )}
      </div>

      {laps.length > 0 && (
        <div style={{ background:cardBg, borderRadius:"16px", border:`1px solid ${border}`, overflow:"hidden", maxHeight:"260px", overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 1fr", padding:"9px 14px", borderBottom:`1px solid ${border}` }}>
            {["#","Split","Total"].map(h => <span key={h} style={{ fontSize:"10px", fontWeight:700, color:mutedColor, textTransform:"uppercase" }}>{h}</span>)}
          </div>
          {laps.map(l => {
            const isFastest = fastest !== null && l.split === fastest;
            const isSlowest = slowest !== null && l.split === slowest;
            return (
              <div key={l.n} style={{ display:"grid", gridTemplateColumns:"40px 1fr 1fr", padding:"10px 14px", borderBottom:`1px solid ${border}`, background:isFastest?"rgba(16,185,129,0.06)":isSlowest?"rgba(244,63,94,0.06)":"transparent" }}>
                <span style={{ fontSize:"12px", color:mutedColor }}>{l.n}</span>
                <span style={{ fontSize:"13px", fontWeight:700, color:isFastest?"#10b981":isSlowest?"#f43f5e":textColor, fontVariantNumeric:"tabular-nums" }}>{fmtMs(l.split)}{fmtMsMs(l.split)}</span>
                <span style={{ fontSize:"12px", color:mutedColor, fontVariantNumeric:"tabular-nums" }}>{fmtMs(l.total)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Countdown ──────────────────────────────────────────────────────────────────
function Countdown({ isDark, textColor, mutedColor, border, cardBg, accent }) {
  const [running,   setRunning]   = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total,     setTotal]     = useState(0);
  const [h, setH] = useState(0), [m, setM] = useState(5), [s, setS] = useState(0);
  const [warned,    setWarned]    = useState(false);
  const [completed, setCompleted] = useState(false);
  const interval = useRef(null);

  const totalMs = ((h||0)*3600 + (m||0)*60 + (s||0)) * 1000;

  const start = () => {
    if (totalMs <= 0) return;
    setTotal(totalMs); setRemaining(totalMs);
    setRunning(true); setWarned(false); setCompleted(false);
  };

  const toggle = () => setRunning(r => !r);
  const reset  = () => { clearInterval(interval.current); setRunning(false); setRemaining(0); setTotal(0); setCompleted(false); setWarned(false); };

  useEffect(() => {
    if (!running) { clearInterval(interval.current); return; }
    interval.current = setInterval(() => {
      setRemaining(r => {
        const next = r - 100;
        if (!warned && next <= 10000 && next > 9900) { playTimerSound("warning"); setWarned(true); }
        if (next <= 0) {
          clearInterval(interval.current); setRunning(false); setCompleted(true);
          playTimerSound("complete");
          sendNotification({ title:"⏰ Timer complete!", body:"Your countdown finished.", sound:true });
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval.current);
  }, [running, warned]);

  const pct   = total > 0 ? ((total-remaining)/total)*100 : 0;
  const ring  = remaining < 10000 ? "#f43f5e" : remaining < 30000 ? "#f59e0b" : accent;

  const PRESETS = [
    { l:"1 min",  h:0,m:1,  s:0 },
    { l:"5 min",  h:0,m:5,  s:0 },
    { l:"10 min", h:0,m:10, s:0 },
    { l:"25 min", h:0,m:25, s:0 },
    { l:"45 min", h:0,m:45, s:0 },
    { l:"1 hr",   h:1,m:0,  s:0 },
  ];

  return (
    <div style={{ textAlign:"center" }}>
      {total === 0 ? (
        <>
          <div style={{ display:"flex", gap:"10px", justifyContent:"center", alignItems:"center", marginBottom:"24px" }}>
            <NumSpin value={h} onChange={setH} label="hrs"  isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
            <span style={{ fontSize:"28px", fontWeight:800, color:mutedColor, paddingBottom:"22px" }}>:</span>
            <NumSpin value={m} onChange={setM} label="min"  isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
            <span style={{ fontSize:"28px", fontWeight:800, color:mutedColor, paddingBottom:"22px" }}>:</span>
            <NumSpin value={s} onChange={setS} label="sec"  isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
          </div>

          <div style={{ display:"flex", gap:"7px", justifyContent:"center", flexWrap:"wrap", marginBottom:"24px" }}>
            {PRESETS.map(p => (
              <button key={p.l} onClick={() => { setH(p.h); setM(p.m); setS(p.s); }}
                style={{ padding:"6px 14px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)", color:textColor, cursor:"pointer", fontSize:"12px", fontWeight:500, fontFamily:"inherit" }}>
                {p.l}
              </button>
            ))}
          </div>

          <motion.button whileTap={{scale:0.95}} onClick={start} disabled={totalMs<=0}
            style={{ padding:"14px 52px", borderRadius:"99px", border:"none", background:totalMs>0?`linear-gradient(135deg,${accent},${accent}cc)`:"rgba(255,255,255,0.1)", color:"white", cursor:totalMs>0?"pointer":"default", fontSize:"16px", fontWeight:700, fontFamily:"inherit", boxShadow:totalMs>0?`0 4px 20px ${accent}44`:"none" }}>
            Start
          </motion.button>
        </>
      ) : (
        <>
          <Ring pct={pct} color={ring} size={220} stroke={12}>
            <div style={{ fontSize:"clamp(36px,9vw,48px)", fontWeight:800, color:remaining<10000?"#f43f5e":textColor, fontVariantNumeric:"tabular-nums", transition:"color 0.3s" }}>
              {fmtMs(remaining)}
            </div>
            {remaining < 10000 && remaining > 0 && <div style={{ fontSize:"11px", color:"#f43f5e", fontWeight:700, marginTop:"4px" }}>⚠ Almost done!</div>}
            {completed && <div style={{ fontSize:"13px", color:"#10b981", fontWeight:700, marginTop:"4px" }}>✓ Complete!</div>}
          </Ring>

          <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
            {remaining > 0 && !completed && (
              <motion.button whileTap={{scale:0.95}} onClick={toggle}
                style={{ padding:"12px 40px", borderRadius:"99px", border:"none", background:running?`linear-gradient(135deg,#f43f5e,#f97316)`:`linear-gradient(135deg,${accent},${accent}cc)`, color:"white", cursor:"pointer", fontSize:"15px", fontWeight:700, fontFamily:"inherit" }}>
                {running ? "Pause" : "Resume"}
              </motion.button>
            )}
            <motion.button whileTap={{scale:0.95}} onClick={reset}
              style={{ padding:"12px 24px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)", color:textColor, cursor:"pointer", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
              Reset
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Intervals / HIIT ──────────────────────────────────────────────────────────
function Intervals({ isDark, textColor, mutedColor, border, cardBg, accent }) {
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [phase,   setPhase]   = useState("work");
  const [elapsed, setElapsed] = useState(0);
  const [round,   setRound]   = useState(1);
  const [workM, setWorkM] = useState(0), [workS, setWorkS] = useState(30);
  const [restM, setRestM] = useState(0), [restS, setRestS] = useState(10);
  const [rounds, setRounds] = useState(3);
  const [totalRounds, setTotalRounds] = useState(0);
  const interval = useRef(null);

  const workMs  = ((workM||0)*60 + (workS||0)) * 1000;
  const restMs  = ((restM||0)*60 + (restS||0)) * 1000;
  const current = phase === "work" ? workMs : restMs;
  const remaining = Math.max(0, current - elapsed);
  const pct     = current > 0 ? (elapsed/current)*100 : 0;
  const phaseColor = phase === "work" ? accent : "#10b981";

  useEffect(() => {
    if (!running) { clearInterval(interval.current); return; }
    interval.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 100;
        if (current - next <= 3000 && current - next > 2900) playTimerSound("warning");
        if (next >= current) {
          if (phase === "work")   { playTimerSound("interval"); setPhase("rest");  setElapsed(0); return 0; }
          if (round >= (totalRounds||rounds)) {
            playTimerSound("complete");
            sendNotification({ title:"🏋️ Workout done!", body:`Finished ${totalRounds||rounds} rounds!`, sound:true });
            clearInterval(interval.current);
            setRunning(false); setStarted(false);
            setRound(1); setPhase("work"); return 0;
          }
          playTimerSound("interval");
          setRound(r => r+1); setPhase("work"); setElapsed(0); return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval.current);
  }, [running, phase, current, round, rounds, totalRounds]);

  const begin = () => {
    if (workMs <= 0) return;
    setTotalRounds(rounds); setStarted(true); setRunning(true);
    setElapsed(0); setRound(1); setPhase("work");
  };

  const reset = () => { clearInterval(interval.current); setStarted(false); setRunning(false); setElapsed(0); setRound(1); setPhase("work"); };

  return (
    <div style={{ textAlign:"center" }}>
      {!started ? (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
            {[{l:"Work",m:workM,s:workS,sm:setWorkM,ss:setWorkS,c:accent},{l:"Rest",m:restM,s:restS,sm:setRestM,ss:setRestS,c:"#10b981"}].map(({l,m,s,sm,ss,c}) => (
              <div key={l} style={{ padding:"14px 10px", borderRadius:"16px", background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", border:`1px solid ${border}` }}>
                <div style={{ fontSize:"10px", fontWeight:700, color:c, marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{l}</div>
                <div style={{ display:"flex", gap:"4px", alignItems:"center", justifyContent:"center" }}>
                  <NumSpin value={m} onChange={sm} label="min" isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
                  <span style={{ color:mutedColor, fontSize:"20px", fontWeight:800, paddingBottom:"22px" }}>:</span>
                  <NumSpin value={s} onChange={ss} label="sec" isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", marginBottom:"24px" }}>
            <span style={{ fontSize:"13px", color:mutedColor, fontWeight:600 }}>Rounds</span>
            <button onClick={() => setRounds(r => Math.max(1,r-1))} style={{ width:"32px",height:"32px",borderRadius:"99px",border:`1px solid ${border}`,background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)",color:textColor,cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
            <span style={{ fontSize:"24px", fontWeight:800, color:textColor, minWidth:"30px" }}>{rounds}</span>
            <button onClick={() => setRounds(r => Math.min(99,r+1))} style={{ width:"32px",height:"32px",borderRadius:"99px",border:`1px solid ${border}`,background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)",color:textColor,cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
          </div>

          {/* Time estimate */}
          <div style={{ fontSize:"12px", color:mutedColor, marginBottom:"20px" }}>
            Total: ~{Math.round(((workMs+restMs)*rounds)/60000)} min
          </div>

          <motion.button whileTap={{scale:0.95}} onClick={begin} disabled={workMs<=0}
            style={{ padding:"14px 52px", borderRadius:"99px", border:"none", background:`linear-gradient(135deg,${accent},${accent}cc)`, color:"white", cursor:workMs>0?"pointer":"default", fontSize:"16px", fontWeight:700, fontFamily:"inherit", boxShadow:`0 4px 20px ${accent}44` }}>
            Start
          </motion.button>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"12px" }}>
            <span style={{ fontSize:"11px", fontWeight:700, padding:"4px 12px", borderRadius:"99px", background:`${phaseColor}20`, color:phaseColor, textTransform:"uppercase", letterSpacing:"0.07em" }}>{phase}</span>
            <span style={{ fontSize:"12px", color:mutedColor }}>Round {round}/{totalRounds||rounds}</span>
          </div>

          {/* Round indicators */}
          <div style={{ display:"flex", gap:"5px", justifyContent:"center", marginBottom:"16px" }}>
            {Array.from({length:totalRounds||rounds}).map((_,i) => (
              <div key={i} style={{ width:"7px",height:"7px",borderRadius:"50%",background:i<round-1?"#10b981":i===round-1?phaseColor:isDark?"rgba(255,255,255,0.14)":"rgba(0,0,0,0.1)",transition:"all 0.3s" }}/>
            ))}
          </div>

          <Ring pct={pct} color={phaseColor} size={190} stroke={10}>
            <div style={{ fontSize:"38px", fontWeight:800, color:textColor, fontVariantNumeric:"tabular-nums" }}>{fmtMs(remaining)}</div>
            <div style={{ fontSize:"11px", color:mutedColor, marginTop:"4px" }}>{phase}</div>
          </Ring>

          <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
            <motion.button whileTap={{scale:0.95}} onClick={() => setRunning(r => !r)}
              style={{ padding:"12px 40px", borderRadius:"99px", border:"none", background:running?`linear-gradient(135deg,#f43f5e,#f97316)`:`linear-gradient(135deg,${accent},${accent}cc)`, color:"white", cursor:"pointer", fontSize:"15px", fontWeight:700, fontFamily:"inherit" }}>
              {running ? "Pause" : "Resume"}
            </motion.button>
            <motion.button whileTap={{scale:0.95}} onClick={reset}
              style={{ padding:"12px 24px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)", color:textColor, cursor:"pointer", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
              Reset
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Pomodoro (NEW feature) ────────────────────────────────────────────────────
function Pomodoro({ isDark, textColor, mutedColor, border, accent }) {
  const PHASES = [
    { id:"focus",  label:"Focus",       mins:25, color:accent      },
    { id:"short",  label:"Short Break", mins:5,  color:"#10b981"   },
    { id:"long",   label:"Long Break",  mins:15, color:"#3b82f6"   },
  ];
  const [phaseIdx,  setPhaseIdx]  = useState(0);
  const [running,   setRunning]   = useState(false);
  const [remaining, setRemaining] = useState(PHASES[0].mins*60*1000);
  const [sessions,  setSessions]  = useState(0);
  const interval = useRef(null);

  const phase = PHASES[phaseIdx];
  const totalMs = phase.mins * 60 * 1000;
  const pct  = ((totalMs-remaining)/totalMs)*100;

  const switchPhase = (idx) => {
    setPhaseIdx(idx); setRunning(false); setRemaining(PHASES[idx].mins*60*1000);
    clearInterval(interval.current);
  };

  useEffect(() => {
    if (!running) { clearInterval(interval.current); return; }
    interval.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 100) {
          clearInterval(interval.current); setRunning(false);
          playTimerSound("complete");
          if (phaseIdx === 0) {
            setSessions(s => s+1);
            sendNotification({ title:"🍅 Focus session done!", body:"Time for a break!", sound:true });
          }
          // Auto-advance
          const next = phaseIdx === 0 ? (sessions+1)%4===0 ? 2 : 1 : 0;
          setPhaseIdx(next); setRemaining(PHASES[next].mins*60*1000);
          return 0;
        }
        if (r <= 60000 && r > 59900) playTimerSound("warning");
        return r - 100;
      });
    }, 100);
    return () => clearInterval(interval.current);
  }, [running, phaseIdx, sessions]);

  return (
    <div style={{ textAlign:"center" }}>
      {/* Phase selector */}
      <div style={{ display:"flex", gap:"6px", justifyContent:"center", marginBottom:"20px" }}>
        {PHASES.map((p,i) => (
          <button key={p.id} onClick={() => switchPhase(i)}
            style={{ padding:"7px 14px", borderRadius:"99px", border:`1.5px solid ${phaseIdx===i?p.color:border}`, background:phaseIdx===i?`${p.color}18`:"transparent", color:phaseIdx===i?p.color:mutedColor, cursor:"pointer", fontSize:"12px", fontWeight:phaseIdx===i?700:400, fontFamily:"inherit", transition:"all 0.15s" }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Sessions count */}
      <div style={{ display:"flex", gap:"5px", justifyContent:"center", marginBottom:"16px" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:"10px",height:"10px",borderRadius:"50%",background:i<sessions%4?accent:`${isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.1)"}`, transition:"all 0.3s" }}/>
        ))}
      </div>

      <Ring pct={pct} color={phase.color} size={210} stroke={12}>
        <div style={{ fontSize:"clamp(36px,9vw,48px)", fontWeight:800, color:textColor, fontVariantNumeric:"tabular-nums" }}>{fmtMs(remaining)}</div>
        <div style={{ fontSize:"11px", color:phase.color, marginTop:"4px", fontWeight:600 }}>{phase.label}</div>
      </Ring>

      <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
        <motion.button whileTap={{scale:0.95}} onClick={() => setRunning(r => !r)}
          style={{ padding:"13px 44px", borderRadius:"99px", border:"none", background:running?`linear-gradient(135deg,#f43f5e,#f97316)`:`linear-gradient(135deg,${phase.color},${phase.color}cc)`, color:"white", cursor:"pointer", fontSize:"15px", fontWeight:700, fontFamily:"inherit" }}>
          {running ? "Pause" : remaining===totalMs ? "Start" : "Resume"}
        </motion.button>
        <motion.button whileTap={{scale:0.95}} onClick={() => { setRunning(false); setRemaining(phase.mins*60*1000); clearInterval(interval.current); }}
          style={{ padding:"13px 22px", borderRadius:"99px", border:`1px solid ${border}`, background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)", color:textColor, cursor:"pointer", fontSize:"14px", fontWeight:600, fontFamily:"inherit" }}>
          Reset
        </motion.button>
      </div>

      <div style={{ marginTop:"18px", fontSize:"12px", color:mutedColor }}>
        Sessions completed: <strong style={{ color:accent }}>{sessions}</strong>
      </div>
    </div>
  );
}

// ── Main Timer ────────────────────────────────────────────────────────────────
export default function Timer() {
  const { isDark, accent } = useTheme();
  const [tab, setTab] = useState("stopwatch");
  const ac = accent || "#ff6b9d";

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.88)";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const TABS = [
    { id:"stopwatch", label:"Stopwatch", icon:"⏱" },
    { id:"countdown", label:"Countdown", icon:"⏳" },
    { id:"intervals", label:"Intervals", icon:"🔄" },
    { id:"pomodoro",  label:"Pomodoro",  icon:"🍅" },
  ];

  return (
    <div style={{ maxWidth:"500px", margin:"0 auto", padding:"20px 16px", fontFamily:"'DM Sans',sans-serif", color:textColor }}>
      <h1 style={{ fontSize:"clamp(22px,5vw,28px)", fontWeight:800, margin:"0 0 20px", letterSpacing:"-0.03em" }}>
        <span style={{ background:`linear-gradient(135deg,${ac},${ac}aa)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Timer</span>
      </h1>

      {/* Tabs */}
      <div style={{ display:"flex", background:isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)", borderRadius:"14px", padding:"4px", marginBottom:"24px", gap:"3px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:"9px 4px", borderRadius:"11px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"11px", fontWeight:tab===t.id?700:500, background:tab===t.id?(isDark?`${ac}20`:`${ac}14`):"transparent", color:tab===t.id?ac:mutedColor, transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:"4px" }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding:"26px 18px", background:cardBg, backdropFilter:"blur(14px)", borderRadius:"22px", border:`1px solid ${border}`, minHeight:"340px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.14}}>
            {tab==="stopwatch" && <Stopwatch isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg} accent={ac}/>}
            {tab==="countdown" && <Countdown isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg} accent={ac}/>}
            {tab==="intervals" && <Intervals isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg} accent={ac}/>}
            {tab==="pomodoro"  && <Pomodoro  isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} accent={ac}/>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}