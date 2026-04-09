import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { playTimerSound, sendNotification } from "../services/notifications";

/* ── Helpers ── */
function pad(n) { return String(Math.floor(Math.abs(n))).padStart(2,"0"); }
function fmtMs(ms) {
  const abs=Math.abs(ms), h=Math.floor(abs/3600000), m=Math.floor((abs%3600000)/60000), s=Math.floor((abs%60000)/1000);
  return h>0?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`;
}
function fmtMsMs(ms) { return `.${String(Math.floor((ms%1000)/10)).padStart(2,"0")}`; }

/* ── Ring SVG ── */
function Ring({ pct, color, size=200, stroke=10, children }) {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size,margin:"0 auto 24px"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute",top:0,left:0}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-raised)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ*(1-Math.min(pct,100)/100)}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 0.1s linear,stroke 0.3s"}}/>
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
  const [running,setRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [laps,setLaps]=useState([]);
  const startRef=useRef(null), stored=useRef(0), raf=useRef(null);

  const tick=useCallback(()=>{
    setElapsed(stored.current+Date.now()-startRef.current);
    raf.current=requestAnimationFrame(tick);
  },[]);

  const toggle=()=>{
    if(running){ cancelAnimationFrame(raf.current); stored.current+=Date.now()-startRef.current; }
    else { startRef.current=Date.now(); raf.current=requestAnimationFrame(tick); }
    setRunning(r=>!r);
  };
  const reset=()=>{ cancelAnimationFrame(raf.current);setRunning(false);setElapsed(0);setLaps([]);stored.current=0; };
  const lap=()=>{
    if(!running) return;
    const prev=laps[0]?.total||0;
    setLaps(l=>[{n:l.length+1,split:elapsed-prev,total:elapsed},...l]);
    playTimerSound("beep");
  };
  useEffect(()=>()=>cancelAnimationFrame(raf.current),[]);

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
  const [started,setStarted]=useState(false);
  const [running,setRunning]=useState(false);
  const [h,setH]=useState(0),[m,setM]=useState(5),[s,setS]=useState(0);
  const [remaining,setRemaining]=useState(0);
  const [completed,setCompleted]=useState(false);
  const interval=useRef(null);
  const totalMs=((h||0)*3600+(m||0)*60+(s||0))*1000;

  const ring = completed?"var(--success)":remaining<10000?"var(--danger)":"var(--accent)";
  const pct  = started&&totalMs>0?((totalMs-remaining)/totalMs)*100:0;

  const start=()=>{
    if(totalMs<=0) return;
    setRemaining(totalMs); setStarted(true); setRunning(true); setCompleted(false);
  };
  const toggle=()=>setRunning(r=>!r);
  const reset=()=>{
    clearInterval(interval.current);
    setStarted(false); setRunning(false); setRemaining(0); setCompleted(false);
  };

  useEffect(()=>{
    if(!running){ clearInterval(interval.current); return; }
    interval.current=setInterval(()=>{
      setRemaining(r=>{
        if(r<=100){
          clearInterval(interval.current); setRunning(false); setCompleted(true);
          playTimerSound("complete");
          sendNotification({title:"⏰ Timer done!",body:"Your countdown has finished.",sound:true});
          return 0;
        }
        if(r<=10000&&r>9900) playTimerSound("warning");
        return r-100;
      });
    },100);
    return()=>clearInterval(interval.current);
  },[running]);

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
          <motion.button whileTap={{scale:0.96}} onClick={start} disabled={totalMs<=0}
            className="btn-primary"
            style={{padding:"0 56px",opacity:totalMs>0?1:0.4,cursor:totalMs>0?"pointer":"default"}}>
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
  const [started,setStarted]=useState(false);
  const [running,setRunning]=useState(false);
  const [phase,setPhase]=useState("work");
  const [elapsed,setElapsed]=useState(0);
  const [round,setRound]=useState(1);
  const [rounds,setRounds]=useState(3);
  const [totalRounds,setTotalRounds]=useState(0);
  const [workM,setWorkM]=useState(0),[workS,setWorkS]=useState(30);
  const [restM,setRestM]=useState(0),[restS,setRestS]=useState(10);
  const interval=useRef(null);

  const workMs=((workM||0)*60+(workS||0))*1000;
  const restMs=((restM||0)*60+(restS||0))*1000;
  const current=phase==="work"?workMs:restMs;
  const remaining=Math.max(0,current-elapsed);
  const pct=current>0?(elapsed/current)*100:0;
  const phaseColor=phase==="work"?accent:"var(--success)";

  useEffect(()=>{
    if(!running){ clearInterval(interval.current); return; }
    interval.current=setInterval(()=>{
      setElapsed(e=>{
        const next=e+100;
        if(current-next<=3000&&current-next>2900) playTimerSound("warning");
        if(next>=current){
          if(phase==="work"){
            playTimerSound("interval"); setPhase("rest"); setElapsed(0); return 0;
          }
          if(round>=(totalRounds||rounds)){
            playTimerSound("complete");
            sendNotification({title:"🏋️ Workout done!",body:`Finished ${totalRounds||rounds} rounds!`,sound:true});
            clearInterval(interval.current);
            setRunning(false); setStarted(false); setRound(1); setPhase("work"); return 0;
          }
          playTimerSound("interval"); setRound(r=>r+1); setPhase("work"); setElapsed(0); return 0;
        }
        return next;
      });
    },100);
    return()=>clearInterval(interval.current);
  },[running,phase,current,round,rounds,totalRounds]);

  const begin=()=>{
    if(workMs<=0) return;
    setTotalRounds(rounds); setStarted(true); setRunning(true); setElapsed(0); setRound(1); setPhase("work");
  };
  const reset=()=>{ clearInterval(interval.current);setStarted(false);setRunning(false);setElapsed(0);setRound(1);setPhase("work"); };

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
          <motion.button whileTap={{scale: 0.96}} onClick={begin} disabled={workMs<=0}
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
            <motion.button whileTap={{scale:0.95}} onClick={()=>setRunning(r=>!r)}
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

/* ────────────────────────────────────────────────
   POMODORO
──────────────────────────────────────────────── */
function Pomodoro({ accent }) {
  const PHASES=[
    {id:"focus",  label:"Focus",       mins:25, color:accent},
    {id:"short",  label:"Short Break", mins:5,  color:"var(--success)"},
    {id:"long",   label:"Long Break",  mins:15, color:"var(--info)"},
  ];
  const [phaseIdx,setPhaseIdx]=useState(0);
  const [running,setRunning]=useState(false);
  const [remaining,setRemaining]=useState(PHASES[0].mins*60*1000);
  const [sessions,setSessions]=useState(0);
  const interval=useRef(null);
  const phase=PHASES[phaseIdx];
  const totalMs=phase.mins*60*1000;
  const pct=((totalMs-remaining)/totalMs)*100;

  const switchPhase=idx=>{
    setPhaseIdx(idx); setRunning(false);
    setRemaining(PHASES[idx].mins*60*1000);
    clearInterval(interval.current);
  };

  useEffect(()=>{
    if(!running){ clearInterval(interval.current); return; }
    interval.current=setInterval(()=>{
      setRemaining(r=>{
        if(r<=100){
          clearInterval(interval.current); setRunning(false);
          playTimerSound("complete");
          if(phaseIdx===0){
            setSessions(s=>s+1);
            sendNotification({title:"🍅 Focus session done!",body:"Time for a break!",sound:true});
          }
          const nextSessions=phaseIdx===0?sessions+1:sessions;
          const next=phaseIdx===0?(nextSessions%4===0?2:1):0;
          setPhaseIdx(next); setRemaining(PHASES[next].mins*60*1000); return 0;
        }
        if(r<=60000&&r>59900) playTimerSound("warning");
        return r-100;
      });
    },100);
    return()=>clearInterval(interval.current);
  },[running,phaseIdx,sessions]);

  return (
    <div style={{textAlign:"center"}}>
      {/* Phase selector pills */}
      <div style={{display:"flex",gap:"6px",justifyContent:"center",marginBottom:"20px"}}>
        {PHASES.map((p,i)=>(
          <button key={p.id} onClick={()=>switchPhase(i)}
            style={{padding:"8px 16px",borderRadius:"12px",
              border:phaseIdx===i?`1.5px solid ${typeof p.color==="string"&&p.color.startsWith("var")?p.color:p.color}`:"1.5px solid var(--border)",
              background:phaseIdx===i?"var(--accent)":"var(--surface-raised)",
              color:phaseIdx===i?"#fff":"var(--text-muted)",
              cursor:"pointer",fontSize:"12px",fontWeight:phaseIdx===i?700:600,
              fontFamily:"var(--font-body)",transition:"all 0.15s",
              WebkitTapHighlightColor:"transparent"}}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Session dots (4 per cycle) */}
      <div style={{display:"flex",gap:"6px",justifyContent:"center",marginBottom:"16px"}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:"10px",height:"10px",borderRadius:"50%",
            background:i<sessions%4?accent:"var(--surface-elevated)",transition:"all 0.3s"}}/>
        ))}
      </div>

      <Ring pct={pct} color={phase.color} size={240} stroke={14}>
        <div style={{fontSize:"64px",fontWeight:800,color:"var(--text-primary)",
          fontVariantNumeric:"tabular-nums",fontFamily:"var(--font-heading)"}}>
          {fmtMs(remaining)}
        </div>
        <div style={{fontSize:"12px",color:phase.color,marginTop:"4px",
          fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>
          {phase.label}
        </div>
      </Ring>

      <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
        <motion.button whileTap={{scale:0.95}} onClick={()=>setRunning(r=>!r)}
          className="btn-primary"
          style={{padding:"0 44px",background:running?"var(--danger)":"var(--accent)",
            boxShadow:running?"0 4px 20px rgba(255,69,58,0.4)":"0 4px 20px var(--accent-glow)"}}>
          {running?"Pause":remaining===totalMs?"Start":"Resume"}
        </motion.button>
        <PillBtn onClick={()=>{setRunning(false);setRemaining(phase.mins*60*1000);clearInterval(interval.current);}}>
          Reset
        </PillBtn>
      </div>
      <div style={{marginTop:"18px",fontSize:"13px",color:"var(--text-muted)"}}>
        Sessions: <strong style={{color:accent,fontFamily:"var(--font-heading)"}}>{sessions}</strong>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   MAIN TIMER PAGE
──────────────────────────────────────────────── */
const TABS=[
  {id:"stopwatch", label:"Stopwatch", icon:"⏱"},
  {id:"countdown", label:"Countdown", icon:"⏳"},
  {id:"intervals", label:"Intervals", icon:"🔄"},
  {id:"pomodoro",  label:"Pomodoro",  icon:"🍅"},
];

export default function Timer() {
  const { accent } = useTheme();
  const [tab, setTab] = useState("stopwatch");
  const ac = accent || "var(--accent)";

  return (
    <div style={{maxWidth:"500px",margin:"0 auto",padding:"20px 16px",
      fontFamily:"var(--font-body)",color:"var(--text-primary)"}}>

      <h1 style={{fontSize:"28px",fontWeight:700,margin:"0 0 20px",
        letterSpacing:"-0.03em",fontFamily:"var(--font-heading)",color:"var(--text-primary)"}}>
        Timer
      </h1>

      {/* Segmented tab bar */}
      <div style={{display:"flex",background:"var(--surface)",borderRadius:"14px",
        padding:"3px",marginBottom:"24px",gap:"2px"}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,padding:"8px 4px",borderRadius:"11px",border:"none",
                cursor:"pointer",fontFamily:"var(--font-body)",fontSize:"11px",
                fontWeight:active?700:500,
                background:active?"var(--surface-raised)":"transparent",
                color:active?"var(--text-primary)":"var(--text-muted)",
                transition:"all 0.15s",display:"flex",alignItems:"center",
                justifyContent:"center",gap:"4px",
                boxShadow:active?"0 1px 6px rgba(0,0,0,0.35)":"none",
                WebkitTapHighlightColor:"transparent"}}>
              <span>{t.icon}</span>
              <span style={{display:"none"}}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active tab label */}
      <div style={{textAlign:"center",marginBottom:"16px"}}>
        <span style={{fontSize:"12px",fontWeight:700,textTransform:"uppercase",
          letterSpacing:"0.07em",color:ac}}>{TABS.find(t=>t.id===tab)?.label}</span>
      </div>

      {/* Tab content */}
      <div style={{padding:"24px 16px",background:"var(--surface)",borderRadius:"16px",
        border:"none",minHeight:"340px"}}>
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            exit={{opacity:0,y:-8}} transition={{duration:0.14}}>
            {tab==="stopwatch"&&<Stopwatch accent={ac}/>}
            {tab==="countdown"&&<Countdown accent={ac}/>}
            {tab==="intervals"&&<Intervals accent={ac}/>}
            {tab==="pomodoro" &&<Pomodoro  accent={ac}/>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}