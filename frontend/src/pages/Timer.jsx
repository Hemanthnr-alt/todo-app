import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../components/CustomSelect";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import { lifecycleOf } from "../utils/recurringTask";
import { useTimerContext } from "../context/TimerContext";

/* ── Wake Lock hook ───────────────────────────────────────────────────── */
function useWakeLock() {
  const [active, setActive] = useState(false);
  const lockRef = useRef(null);
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  const acquire = useCallback(async () => {
    if (!supported) return;
    try {
      lockRef.current = await navigator.wakeLock.request("screen");
      lockRef.current.addEventListener("release", () => setActive(false));
      setActive(true);
    } catch { setActive(false); }
  }, [supported]);

  const release = useCallback(() => {
    lockRef.current?.release();
    lockRef.current = null;
    setActive(false);
  }, []);

  const toggle = useCallback(() => { active ? release() : acquire(); }, [active, acquire, release]);

  // Re-acquire after visibility change (Android screen wakes back up)
  useEffect(() => {
    const fn = () => { if (document.visibilityState === "visible" && active) acquire(); };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [active, acquire]);

  useEffect(() => () => { lockRef.current?.release(); }, []);
  return { active, toggle, supported };
}

/* ── Helpers ── */
function pad(n) { return String(Math.floor(Math.abs(n))).padStart(2,"0"); }
function fmtMs(ms) {
  const abs=Math.abs(ms), h=Math.floor(abs/3600000), m=Math.floor((abs%3600000)/60000), s=Math.floor((abs%60000)/1000);
  return h>0?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`;
}
function fmtMsMs(ms) { return `.${String(Math.floor((ms%1000)/10)).padStart(2,"0")}`; }

/* ── Ring SVG with glow ──────────────────────────────────────────────── */
function Ring({ pct, color, size=200, stroke=10, children, glow=true }) {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r;
  const resolvedColor = typeof color === "string" && color.startsWith("var") ? color : color;
  return (
    <div style={{position:"relative",width:size,height:size,margin:"0 auto 24px"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute",top:0,left:0}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-elevated)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={resolvedColor} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ*(1-Math.min(pct,100)/100)}
          strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.1s linear,stroke 0.3s",
            filter:glow&&pct>0?`drop-shadow(0 0 8px ${resolvedColor}88)`:"none"}} />
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {children}
      </div>
    </div>
  );
}

/* ── NumberSpinner ── */
function NumSpin({ value, onChange, label, max=59 }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
      <button onClick={()=>onChange(Math.min(max,(value||0)+1))}
        style={{width:"34px",height:"26px",borderRadius:"8px",border:"1px solid var(--border)",
          background:"var(--surface-raised)",color:"var(--text-primary)",cursor:"pointer",
          fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
        ▲
      </button>
      <input
        value={String(value||0).padStart(2,"0")}
        onChange={e=>onChange(Math.min(max,Math.max(0,parseInt(e.target.value.replace(/\D/g,""))||0)))}
        style={{width:"54px",padding:"8px 4px",textAlign:"center",fontSize:"28px",fontWeight:800,
          background:"var(--surface-raised)",border:"1px solid var(--border)",
          borderRadius:"10px",color:"var(--text-primary)",outline:"none",
          fontFamily:"var(--font-heading)",fontVariantNumeric:"tabular-nums"}}/>
      <button onClick={()=>onChange(Math.max(0,(value||0)-1))}
        style={{width:"34px",height:"26px",borderRadius:"8px",border:"1px solid var(--border)",
          background:"var(--surface-raised)",color:"var(--text-primary)",cursor:"pointer",
          fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
        ▼
      </button>
      <span style={{fontSize:"10px",color:"var(--text-muted)",fontWeight:700,
        textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</span>
    </div>
  );
}

/* ── Pill button ── */
const PillBtn = ({ onClick, children, style={} }) => (
  <motion.button whileTap={{scale:0.95}} onClick={onClick}
    style={{padding:"12px 24px",borderRadius:"var(--radius-pill)",
      border:"1px solid var(--border)",background:"var(--surface-raised)",
      color:"var(--text-secondary)",cursor:"pointer",fontSize:"14px",fontWeight:600,
      fontFamily:"var(--font-body)",...style}}>
    {children}
  </motion.button>
);

/* ────────────────────────────────────────────────
   STOPWATCH
──────────────────────────────────────────────── */
function Stopwatch({ accent }) {
  const { swRunning: running, swElapsed: elapsed, swLaps: laps, swToggle: toggle, swReset: reset, swLap: lap } = useTimerContext();
  const fastest=laps.length>1?Math.min(...laps.map(l=>l.split)):null;
  const slowest=laps.length>1?Math.max(...laps.map(l=>l.split)):null;

  return (
    <div style={{textAlign:"center"}}>
      {/* Large digit display */}
      <div style={{marginBottom:"28px"}}>
        <div style={{fontSize:"clamp(60px,16vw,88px)",fontWeight:800,letterSpacing:"-0.04em",
          color:"var(--text-primary)",fontVariantNumeric:"tabular-nums",lineHeight:1,
          fontFamily:"var(--font-heading)"}}>
          {fmtMs(elapsed)}
        </div>
        <div style={{fontSize:"24px",color:"var(--text-muted)",fontVariantNumeric:"tabular-nums",
          marginTop:"2px",fontFamily:"var(--font-body)"}}>
          {fmtMsMs(elapsed)}
        </div>
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:"10px",justifyContent:"center",marginBottom:"24px",flexWrap:"wrap"}}>
        <PillBtn onClick={lap} style={{opacity:running?1:0.35,cursor:running?"pointer":"default"}}>Lap</PillBtn>
        <motion.button whileTap={{scale:0.93}} onClick={toggle}
          className="btn-primary"
          style={{padding:"0 44px",
            background:running?"var(--danger)":"var(--accent)",
            boxShadow:running?"0 4px 20px rgba(255,69,58,0.4)":"0 4px 20px var(--accent-glow)"}}>
          {running?"Stop":elapsed>0?"Resume":"Start"}
        </motion.button>
        {elapsed>0&&!running&&<PillBtn onClick={reset}>Reset</PillBtn>}
      </div>

      {/* Lap list */}
      {laps.length>0&&(
        <div style={{background:"var(--surface-raised)",borderRadius:"12px",
          border:"1px solid var(--border)",overflow:"hidden",maxHeight:"260px",overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"40px 1fr 1fr",padding:"10px 14px",
            borderBottom:"1px solid var(--border)",background:"var(--surface-elevated)"}}>
            {["#","Split","Total"].map(h=>(
              <span key={h} style={{fontSize:"10px",fontWeight:700,color:"var(--text-muted)",
                textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</span>
            ))}
          </div>
          {laps.map((l)=>{
            const isFastest=fastest!==null&&l.split===fastest;
            const isSlowest=slowest!==null&&l.split===slowest;
            return(
              <div key={l.n} style={{display:"grid",gridTemplateColumns:"40px 1fr 1fr",
                padding:"9px 14px",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontSize:"12px",color:"var(--text-muted)",fontWeight:600}}>{l.n}</span>
                <span style={{fontSize:"13px",fontWeight:600,fontVariantNumeric:"tabular-nums",
                  color:isFastest?"var(--success)":isSlowest?"var(--danger)":"var(--text-primary)"}}>
                  {fmtMs(l.split)}{fmtMsMs(l.split)}
                </span>
                <span style={{fontSize:"13px",color:"var(--text-secondary)",fontVariantNumeric:"tabular-nums"}}>
                  {fmtMs(l.total)}{fmtMsMs(l.total)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────
   COUNTDOWN
──────────────────────────────────────────────── */
const PRESETS=[
  {l:"1 min",h:0,m:1,s:0},{l:"5 min",h:0,m:5,s:0},{l:"10 min",h:0,m:10,s:0},
  {l:"15 min",h:0,m:15,s:0},{l:"20 min",h:0,m:20,s:0},{l:"30 min",h:0,m:30,s:0},
  {l:"1 hr",h:1,m:0,s:0},
];

function Countdown({ accent }) {
  const { cdStarted: started, cdRunning: running, cdTotalMs: totalMs, cdRemaining: remaining, cdCompleted: completed, cdStart: startReq, cdToggle: toggle, cdReset: reset } = useTimerContext();
  const [h,setH]=useState(0),[m,setM]=useState(5),[s,setS]=useState(0);
  const baseMs=((h||0)*3600+(m||0)*60+(s||0))*1000;

  const ring = completed?"var(--success)":remaining<10000?"var(--danger)":"var(--accent)";
  const pct  = started&&totalMs>0?((totalMs-remaining)/totalMs)*100:0;

  return (
    <div style={{textAlign:"center"}}>
      {!started?(
        <>
          {/* Preset chips */}
          <div style={{display:"flex",gap:"6px",justifyContent:"center",flexWrap:"wrap",marginBottom:"20px"}}>
            {PRESETS.map(p=>(
              <button key={p.l} onClick={()=>{setH(p.h);setM(p.m);setS(p.s);}}
                style={{padding:"6px 14px",borderRadius:"var(--radius-pill)",
                  border:"1px solid var(--border)",background:"var(--surface-raised)",
                  color:"var(--text-secondary)",cursor:"pointer",fontSize:"12px",
                  fontWeight:600,fontFamily:"var(--font-body)",
                  transition:"all 0.15s",WebkitTapHighlightColor:"transparent"}}>
                {p.l}
              </button>
            ))}
          </div>
          {/* Spinners */}
          <div style={{display:"flex",gap:"12px",justifyContent:"center",alignItems:"flex-start",marginBottom:"28px"}}>
            <NumSpin value={h} onChange={setH} label="hrs" max={23}/>
            <span style={{fontSize:"32px",fontWeight:800,color:"var(--text-muted)",paddingTop:"24px"}}>:</span>
            <NumSpin value={m} onChange={setM} label="min" max={59}/>
            <span style={{fontSize:"32px",fontWeight:800,color:"var(--text-muted)",paddingTop:"24px"}}>:</span>
            <NumSpin value={s} onChange={setS} label="sec" max={59}/>
          </div>
          <motion.button whileTap={{scale:0.96}} onClick={()=>startReq(baseMs)} disabled={baseMs<=0}
            className="btn-primary"
            style={{padding:"0 56px",opacity:baseMs>0?1:0.4,cursor:baseMs>0?"pointer":"default"}}>
            Start
          </motion.button>
        </>
      ):(
        <>
          <Ring pct={pct} color={ring} size={240} stroke={14}>
            <div style={{fontSize:"64px",fontWeight:800,
              color:completed?"var(--success)":remaining<10000?"var(--danger)":"var(--text-primary)",
              fontVariantNumeric:"tabular-nums",transition:"color 0.3s",
              fontFamily:"var(--font-heading)"}}>
              {fmtMs(remaining)}
            </div>
            {completed&&<div style={{fontSize:"14px",color:"var(--success)",fontWeight:700,marginTop:"6px"}}>✓ Done!</div>}
            {!completed&&remaining<10000&&remaining>0&&(
              <div style={{fontSize:"11px",color:"var(--danger)",fontWeight:700,marginTop:"4px"}}>⚠ Almost done!</div>
            )}
          </Ring>
          <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
            {!completed&&(
              <motion.button whileTap={{scale:0.95}} onClick={toggle}
                className="btn-primary"
                style={{padding:"0 40px",background:running?"var(--danger)":"var(--accent)",
                  boxShadow:running?"0 4px 20px rgba(255,69,58,0.4)":"0 4px 20px var(--accent-glow)"}}>
                {running?"Pause":"Resume"}
              </motion.button>
            )}
            <PillBtn onClick={reset}>Reset</PillBtn>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────
   INTERVALS
──────────────────────────────────────────────── */
function Intervals({ accent }) {
  const { intStarted: started, intRunning: running, intPhase: phase, intElapsed: elapsed, intRound: round, intTotalRounds: totalRounds, currentPhaseMs: current, intBegin: begin, intToggle: toggle, intReset: reset } = useTimerContext();
  const [rounds,setRounds]=useState(3);
  const [workM,setWorkM]=useState(0),[workS,setWorkS]=useState(30);
  const [restM,setRestM]=useState(0),[restS,setRestS]=useState(10);

  const workMs=((workM||0)*60+(workS||0))*1000;
  const restMs=((restM||0)*60+(restS||0))*1000;
  const remaining=Math.max(0,current-elapsed);
  const pct=current>0?(elapsed/current)*100:0;
  const phaseColor=phase==="work"?accent:"var(--success)";

  return (
    <div style={{textAlign:"center"}}>
      {!started?(
        <div>
          {/* Work/Rest panels */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"}}>
            {[
              {l:"Work",m:workM,s:workS,sm:setWorkM,ss:setWorkS,c:accent},
              {l:"Rest",m:restM,s:restS,sm:setRestM,ss:setRestS,c:"var(--success)"},
            ].map(({l,m,s,sm,ss,c})=>(
              <div key={l} style={{padding:"16px 10px",borderRadius:"14px",
                background:"var(--surface-raised)",border:"1px solid var(--border)"}}>
                <div style={{fontSize:"11px",fontWeight:700,color:c,marginBottom:"14px",
                  textTransform:"uppercase",letterSpacing:"0.07em"}}>{l}</div>
                <div style={{display:"flex",gap:"4px",alignItems:"center",justifyContent:"center"}}>
                  <NumSpin value={m} onChange={sm} label="min"/>
                  <span style={{color:"var(--text-muted)",fontSize:"22px",fontWeight:800,paddingBottom:"22px"}}>:</span>
                  <NumSpin value={s} onChange={ss} label="sec"/>
                </div>
              </div>
            ))}
          </div>

          {/* Rounds */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"14px",marginBottom:"10px"}}>
            <span style={{fontSize:"13px",color:"var(--text-muted)",fontWeight:600}}>Rounds</span>
            <button onClick={()=>setRounds(r=>Math.max(1,r-1))}
              style={{width:"34px",height:"34px",borderRadius:"50%",border:"1px solid var(--border)",
                background:"var(--surface-raised)",color:"var(--text-primary)",cursor:"pointer",
                fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
              −
            </button>
            <span style={{fontSize:"28px",fontWeight:800,color:"var(--text-primary)",
              minWidth:"36px",fontFamily:"var(--font-heading)"}}>{rounds}</span>
            <button onClick={()=>setRounds(r=>Math.min(99,r+1))}
              style={{width:"34px",height:"34px",borderRadius:"50%",border:"1px solid var(--border)",
                background:"var(--surface-raised)",color:"var(--text-primary)",cursor:"pointer",
                fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
              +
            </button>
          </div>
          <div style={{fontSize:"12px",color:"var(--text-muted)",marginBottom:"24px"}}>
            Total: ~{Math.round(((workMs+restMs)*rounds)/60000)} min
          </div>
          <motion.button whileTap={{scale: 0.96}} onClick={()=>begin(workMs,restMs,rounds)} disabled={workMs<=0}
            className="btn-primary"
            style={{padding:"0 56px",opacity:workMs>0?1:0.4,cursor:workMs>0?"pointer":"default"}}>
            Start
          </motion.button>
        </div>
      ):(
        <>
          {/* Phase indicator */}
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
            <span style={{fontSize:"12px",fontWeight:700,padding:"5px 14px",borderRadius:"var(--radius-pill)",
              background:`${phase==="work"?accent:"var(--success)"}22`,color:phaseColor,
              textTransform:"uppercase",letterSpacing:"0.07em"}}>
              {phase}
            </span>
            <span style={{fontSize:"13px",color:"var(--text-muted)"}}>Round {round}/{totalRounds||rounds}</span>
          </div>
          {/* Round dots */}
          <div style={{display:"flex",gap:"6px",justifyContent:"center",marginBottom:"16px"}}>
            {Array.from({length:totalRounds||rounds}).map((_,i)=>(
              <div key={i} style={{width:"8px",height:"8px",borderRadius:"50%",
                background:i<round-1?"var(--success)":i===round-1?phaseColor:"var(--surface-elevated)",
                transition:"all 0.3s"}}/>
            ))}
          </div>
          <Ring pct={pct} color={phaseColor} size={220} stroke={14}>
            <div style={{fontSize:"48px",fontWeight:800,color:"var(--text-primary)",
              fontVariantNumeric:"tabular-nums",fontFamily:"var(--font-heading)"}}>
              {fmtMs(remaining)}
            </div>
            <div style={{fontSize:"11px",color:phaseColor,marginTop:"4px",
              textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:700}}>
              {phase}
            </div>
          </Ring>
          <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
            <motion.button whileTap={{scale:0.95}} onClick={toggle}
              className="btn-primary"
              style={{padding:"0 40px",background:running?"var(--danger)":"var(--accent)",
                boxShadow:running?"0 4px 20px rgba(255,69,58,0.4)":"0 4px 20px var(--accent-glow)"}}>
              {running?"Pause":"Resume"}
            </motion.button>
            <PillBtn onClick={reset}>Reset</PillBtn>
          </div>
        </>
      )}
    </div>
  );
}

const POMO_MINS_KEY = "thirty_pomodoro_mins";

/* ────────────────────────────────────────────────
   POMODORO
──────────────────────────────────────────────── */
function Pomodoro({ accent, linkedTaskId, onLinkedTaskId, taskOptions, showTaskLink }) {
  const { pomoRunning: running, pomoPhaseIdx: phaseIdx, pomoRemaining: remaining, pomoSessions: sessions, pomoTotalMs: totalMs, pomoToggle: toggle, pomoSwitchPhase: switchPhase, pomoReset: localPomoReset } = useTimerContext();
  
  const defaultMins = { focus: 25, short: 5, long: 15 };
  const [mins, setMins] = useState(() => {
    try {
      const j = JSON.parse(localStorage.getItem(POMO_MINS_KEY) || "{}");
      return { ...defaultMins, ...j };
    } catch {
      return defaultMins;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(POMO_MINS_KEY, JSON.stringify(mins));
    } catch { /* ignore */ }
  }, [mins]);

  const phases = useMemo(() => [
    { id: "focus", label: "Focus", mins: mins.focus, color: accent },
    { id: "short", label: "Short Break", mins: mins.short, color: "var(--success)" },
    { id: "long", label: "Long Break", mins: mins.long, color: "var(--info)" },
  ], [mins, accent]);

  const phase = phases[phaseIdx] || phases[0];
  const pct = ((totalMs - remaining) / totalMs) * 100;
  const linkedLabel = taskOptions.find((o) => o.value === linkedTaskId)?.label;

  return (
    <div style={{ textAlign: "center" }}>
      {showTaskLink && taskOptions.length > 0 && (
        <div style={{ marginBottom: "16px", textAlign: "left" }}>
          <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
            Link to task
          </div>
          <CustomSelect
            value={linkedTaskId || ""}
            onChange={onLinkedTaskId}
            options={[{ value: "", label: "None" }, ...taskOptions]}
            placeholder="Optional"
          />
          {linkedLabel && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              Focusing for: <strong style={{ color: "var(--text-primary)" }}>{linkedLabel}</strong>
            </div>
          )}
        </div>
      )}

      {!running && (
        <div className="glass-tile" style={{ borderRadius: "14px", padding: "12px", marginBottom: "16px", border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {[
            { key: "focus", label: "Focus (min)" },
            { key: "short", label: "Short (min)" },
            { key: "long", label: "Long (min)" },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: "grid", gap: "4px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              {label}
              <input
                type="number"
                min={1}
                max={180}
                value={mins[key]}
                onChange={(e) => setMins((prev) => ({ ...prev, [key]: Math.min(180, Math.max(1, Number(e.target.value) || 1)) }))}
                style={{ padding: "8px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontWeight: 700 }}
              />
            </label>
          ))}
        </div>
      )}

      {/* Phase selector pills */}
      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "20px", flexWrap: "wrap" }}>
        {phases.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => switchPhase(i, phases)}
            style={{
              padding: "8px 16px",
              borderRadius: "12px",
              border: phaseIdx === i ? `1.5px solid ${typeof p.color === "string" && p.color.startsWith("var") ? p.color : p.color}` : "1.5px solid var(--border)",
              background: phaseIdx === i ? "var(--accent)" : "var(--surface-raised)",
              color: phaseIdx === i ? "#fff" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: phaseIdx === i ? 700 : 600,
              fontFamily: "var(--font-body)",
              transition: "all 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Session dots (4 per cycle) */}
      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "16px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: i < sessions % 4 ? accent : "var(--surface-elevated)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>

      <Ring pct={pct} color={phase.color} size={240} stroke={14}>
        <div style={{ fontSize: "64px", fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-heading)" }}>
          {fmtMs(remaining)}
        </div>
        <div style={{ fontSize: "12px", color: phase.color, marginTop: "4px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {phase.label}
        </div>
      </Ring>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => toggle(phases)}
          className="btn-primary"
          style={{
            padding: "0 44px",
            background: running ? "var(--danger)" : "var(--accent)",
            boxShadow: running ? "0 4px 20px rgba(255,69,58,0.4)" : "0 4px 20px var(--accent-glow)",
          }}
        >
          {running ? "Pause" : remaining === totalMs ? "Start" : "Resume"}
        </motion.button>
        <PillBtn
          onClick={() => {
            localPomoReset(phase.mins * 60 * 1000);
          }}
        >
          Reset
        </PillBtn>
      </div>
      <div style={{ marginTop: "18px", fontSize: "13px", color: "var(--text-muted)" }}>
        Sessions: <strong style={{ color: accent, fontFamily: "var(--font-heading)" }}>{sessions}</strong>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Tab icons (vector, matches app chrome)
──────────────────────────────────────────────── */
function IconStopwatch({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="14" r="8" />
      <path d="M12 6v2M9 2h6" />
    </svg>
  );
}
function IconCountdown({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 2h4M12 14v4l3 3" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}
function IconIntervals({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h4l2-6 4 12 2-6h4" />
    </svg>
  );
}
function IconPomodoro({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" fill="none" />
    </svg>
  );
}

/* ────────────────────────────────────────────────
   MAIN TIMER PAGE
──────────────────────────────────────────────── */
const TABS = [
  { id: "stopwatch", label: "Stopwatch", Icon: IconStopwatch },
  { id: "countdown", label: "Countdown", Icon: IconCountdown },
  { id: "intervals", label: "Intervals", Icon: IconIntervals },
  { id: "pomodoro", label: "Pomodoro", Icon: IconPomodoro },
];

const TIMER_TASK_KEY = "thirty_timer_linked_task";

export default function Timer() {
  const { accent } = useTheme();
  const { isAuthenticated } = useAuth();
  const { tasks } = useTasks();
  const [tab, setTab] = useState("stopwatch");
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const wakeLock = useWakeLock();

  useEffect(() => {
    try {
      const v = localStorage.getItem(TIMER_TASK_KEY);
      if (v) setLinkedTaskId(v);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      if (linkedTaskId) localStorage.setItem(TIMER_TASK_KEY, linkedTaskId);
      else localStorage.removeItem(TIMER_TASK_KEY);
    } catch { /* ignore */ }
  }, [linkedTaskId]);

  const taskSelectOptions = useMemo(
    () => tasks
      .filter((t) => lifecycleOf(t) === "active" && !t.completed)
      .map((t) => ({ value: t.id, label: (t.title || "Untitled").slice(0, 72) })),
    [tasks],
  );

  const ac = accent || "var(--accent)";

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "18px 16px 28px", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom: "18px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Timer</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>Focus, countdown, intervals, and Pomodoro.</p>
        </div>
        {wakeLock.supported && (
          <motion.button whileTap={{scale:0.92}} type="button" onClick={wakeLock.toggle}
            style={{ display:"flex",alignItems:"center",gap:"6px",padding:"8px 14px",borderRadius:"var(--radius-btn)",
              border:`1px solid ${wakeLock.active?"var(--accent)":"var(--border)"}`,
              background:wakeLock.active?"var(--accent-subtle)":"var(--surface-raised)",
              color:wakeLock.active?"var(--accent)":"var(--text-muted)",
              fontSize:"12px",fontWeight:700,cursor:"pointer",flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {wakeLock.active
                ? <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>
                : <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>}
            </svg>
            {wakeLock.active ? "Screen On" : "Keep On"}
          </motion.button>
        )}
      </div>

      <div
        className="glass-panel"
        style={{
          borderRadius: "18px",
          padding: "10px",
          marginBottom: "14px",
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          justifyContent: "stretch",
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                flex: "1 1 calc(25% - 6px)",
                minWidth: "72px",
                padding: "10px 6px",
                borderRadius: "14px",
                border: active ? `1px solid ${ac}55` : "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: active ? 700 : 600,
                background: active ? `linear-gradient(145deg, ${ac}22, var(--surface-raised))` : "var(--surface)",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: active ? `0 6px 18px ${ac}22` : "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ color: active ? ac : "var(--text-muted)", display: "inline-flex", filter: active ? "drop-shadow(0 0 6px var(--accent-glow))" : "none" }}>
                <t.Icon active={active} />
              </span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="glass-panel"
        style={{
          padding: "22px 16px 26px",
          borderRadius: "18px",
          minHeight: "360px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: ac }}>{TABS.find((x) => x.id === tab)?.label}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
            {tab === "stopwatch" && <Stopwatch accent={ac} />}
            {tab === "countdown" && <Countdown accent={ac} />}
            {tab === "intervals" && <Intervals accent={ac} />}
            {tab === "pomodoro" && (
              <Pomodoro
                accent={ac}
                linkedTaskId={linkedTaskId}
                onLinkedTaskId={setLinkedTaskId}
                taskOptions={taskSelectOptions}
                showTaskLink={isAuthenticated}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}