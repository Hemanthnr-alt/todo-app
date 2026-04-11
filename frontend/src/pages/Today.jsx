/**
 * Today.jsx — HabitsNow-inspired daily view
 */
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";
import { PremiumCompleteTitle, PremiumRoundComplete } from "../components/PremiumChrome";
import { PremiumHabitTile, PremiumTaskMark } from "../components/PremiumMarks";
import { formatLocalYMD, localTodayYMD } from "../utils/date";

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MISSED_KEY = "thirty_missed_habits";
const getMissed = () => { try { return JSON.parse(localStorage.getItem(MISSED_KEY)||"{}"); } catch { return {}; } };

function buildDates(s, e) {
  const base = new Date();
  const midnight = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const arr = [];
  for (let o = s; o <= e; o++) { const d = new Date(midnight); d.setDate(midnight.getDate()+o); arr.push(d); }
  return arr;
}

function LockSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{opacity:.4}}>
      <rect x="5" y="11" width="14" height="11" rx="2.5" fill="currentColor"/>
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function AddTypeSheet({ onClose, onGoToTasks, onGoToHabits }) {
  const types = [
    { emoji:"🏆", title:"Habit", sub:"Activity that repeats over time. It has detailed tracking and statistics.", action:()=>{onGoToHabits();onClose();} },
    { emoji:"🔁", title:"Recurring Task", sub:"Activity that repeats over time without tracking or statistics.", action:()=>{onGoToTasks();onClose();} },
    { emoji:"✅", title:"Task", sub:"Single instance activity without tracking over time.", action:()=>{onGoToTasks();onClose();} },
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <motion.div onClick={e=>e.stopPropagation()} initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}} transition={{type:"spring",stiffness:340,damping:30}}
        style={{width:"100%",maxWidth:"480px",background:"var(--surface-raised)",borderRadius:"24px 24px 0 0",padding:"14px 0 44px",border:"1px solid var(--border-strong)",borderBottom:"none"}}>
        <div style={{width:"40px",height:"4px",borderRadius:"999px",background:"var(--border-strong)",margin:"0 auto 14px"}}/>
        {types.map((t,i)=>(
          <button key={t.title} type="button" onClick={t.action} className="btn-reset"
            style={{width:"100%",padding:"15px 22px",display:"flex",alignItems:"center",gap:"15px",borderBottom:i<types.length-1?"1px solid var(--border)":"none",background:"transparent"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"13px",background:"var(--surface)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>{t.emoji}</div>
            <div style={{textAlign:"left",flex:1}}>
              <div style={{fontSize:"15px",fontWeight:700,color:"var(--text-primary)",marginBottom:"3px"}}>{t.title}</div>
              <div style={{fontSize:"12px",color:"var(--text-muted)",lineHeight:1.4}}>{t.sub}</div>
            </div>
            <span style={{color:"var(--text-muted)",fontSize:"18px"}}>›</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

function AgendaItem({ item, accent, onToggleTask, onToggleHabit, selectedDate, todayStr }) {
  const color = item.color || accent;
  const checked = item.done;
  const lineColor = typeof color==="string"&&color.startsWith("var(")?  "var(--accent)":color;
  const isTask = item.type==="task";
  const isFuture = selectedDate > todayStr;
  return (
    <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 8px",borderBottom:"1px solid var(--border)",borderLeft:checked?`3px solid ${color}`:"3px solid transparent",borderRadius:"0 14px 14px 0",background:checked?`linear-gradient(90deg,${color}18,transparent 58%)`:undefined}}>
      {isTask ? <PremiumTaskMark size={32}/> : <PremiumHabitTile emoji={item.icon} color={color} size={32}/>}
      <div style={{flex:1,minWidth:0}}>
        <PremiumCompleteTitle complete={checked} lineColor={lineColor}>{item.title}</PremiumCompleteTitle>
        <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"5px"}}>
          <span style={{fontSize:"11px",color,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{item.kind}</span>
          {!isTask&&item.goalMaxPerDay&&<span style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:600}}>· {item.goalMaxPerDay} {item.unit||"times"}</span>}
        </div>
      </div>
      {isFuture&&!isTask
        ? <div style={{width:"32px",height:"32px",display:"flex",alignItems:"center",justifyContent:"center",color}}><LockSvg/></div>
        : <PremiumRoundComplete checked={checked} onClick={()=>{if(isTask)onToggleTask(item.id,!checked);else onToggleHabit(item.id,item.date);}} color={color} ariaLabel={checked?"Mark incomplete":"Mark complete"}/>
      }
    </div>
  );
}

export default function Today({ onGoToTasks, onGoToCalendar, onGoToHabits }) {
  const { accent } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { tasks, updateTask } = useTasks();
  const { habits, toggleHabit } = useHabits();

  const todayStr = localTodayYMD();
  const [rangeStart, setRangeStart] = useState(-5);
  const [rangeEnd,   setRangeEnd]   = useState(8);
  const [dates,      setDates]      = useState(()=>buildDates(-5,8));
  const [selected,   setSelected]   = useState(todayStr);
  const [showAdd,    setShowAdd]    = useState(false);

  const stripRef      = useRef(null);
  const datesRef      = useRef(dates); datesRef.current=dates;
  const rsRef         = useRef(rangeStart); rsRef.current=rangeStart;
  const reRef         = useRef(rangeEnd);   reRef.current=rangeEnd;

  const scrollTo = useCallback((ds,beh="smooth")=>{
    const el=stripRef.current; if(!el)return;
    const idx=datesRef.current.findIndex(d=>formatLocalYMD(d)===ds); if(idx<0)return;
    const ch=el.children[0]?.children[idx]; if(!ch)return;
    el.scrollTo({left:Math.max(0,ch.offsetLeft-el.clientWidth/2+ch.offsetWidth/2),behavior:beh});
  },[]);

  useLayoutEffect(()=>{scrollTo(selected,"auto");},[scrollTo,selected,dates]);

  useEffect(()=>{
    const el=stripRef.current; if(!el)return;
    const fn=()=>{
      const{scrollLeft,scrollWidth,clientWidth}=el,thr=180;
      if(scrollLeft+clientWidth>=scrollWidth-thr){const ne=reRef.current+7;setRangeEnd(ne);setDates(buildDates(rsRef.current,ne));}
      if(scrollLeft<=thr){const ns=rsRef.current-7,nd=buildDates(ns,reRef.current),pw=el.scrollWidth;setRangeStart(ns);setDates(nd);requestAnimationFrame(()=>{if(stripRef.current)stripRef.current.scrollLeft+=stripRef.current.scrollWidth-pw;});}
    };
    el.addEventListener("scroll",fn,{passive:true});
    return ()=>el.removeEventListener("scroll",fn);
  },[]);

  const selDateObj = new Date(`${selected}T00:00:00`);
  const missedMap  = getMissed();

  const dayTasks = tasks.filter(t=>t.dueDate===selected).map(t=>({type:"task",id:t.id,title:t.title,icon:"◉",color:"#E84A8A",kind:"Task",done:t.completed}));
  const dayHabits = habits
    .filter(h=>{
      const start=h.startDate||h.createdAt?.slice(0,10)||todayStr;
      if(selected<start)return false;
      if(h.frequency==="daily")return true;
      if(h.frequency==="weekly")return(h.recurringDays||[]).includes(selDateObj.getDay());
      return true;
    })
    .map(h=>({type:"habit",id:h.id,title:h.name,icon:h.icon,color:h.color,kind:missedMap[`${h.id}_${selected}`]?"Missed":"Habit",done:(h.completedDates||[]).includes(selected),date:selected,goalMaxPerDay:h.goalMaxPerDay||null,unit:h.unit||"times"}));

  const items = useMemo(()=>[...dayHabits,...dayTasks],[dayHabits,dayTasks]);
  const doneCount = items.filter(i=>i.done).length;

  // Header label: "12 Apr 2026"
  const headerDate = `${selDateObj.getDate()} ${MONTH_NAMES[selDateObj.getMonth()]} ${selDateObj.getFullYear()}`;

  if (!isAuthenticated) return (
    <div style={{maxWidth:"620px",margin:"0 auto",padding:"28px 16px"}}>
      <div className="glass-panel" style={{borderRadius:"20px",padding:"24px",textAlign:"center"}}>
        <h2 style={{fontSize:"24px",marginBottom:"8px",letterSpacing:"-0.04em"}}>Today</h2>
        <p style={{color:"var(--text-muted)",fontSize:"14px",marginBottom:"18px"}}>Sign in to see your daily list.</p>
        <button onClick={onGoToTasks} className="btn-primary" style={{padding:"0 18px"}}>Open Tasks</button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:"720px",margin:"0 auto",padding:"20px 16px 24px",color:"var(--text-body)"}}>

      {/* header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <div>
          <h1 style={{fontSize:"26px",fontFamily:"var(--font-heading)",letterSpacing:"-0.04em",marginBottom:"2px"}}>{headerDate}</h1>
          <div style={{color:"var(--text-muted)",fontSize:"13px"}}>{doneCount}/{items.length} done</div>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={onGoToCalendar} className="btn-reset" style={{width:"38px",height:"38px",borderRadius:"12px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-primary)",display:"flex",alignItems:"center",justifyContent:"center"}} aria-label="Calendar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
          <button className="btn-reset" style={{width:"38px",height:"38px",borderRadius:"12px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-primary)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
        </div>
      </div>

      {/* date strip */}
      <div ref={stripRef} className="hide-scrollbar" style={{overflowX:"auto",marginBottom:"14px"}}>
        <div style={{display:"flex",gap:"7px",width:"max-content"}}>
          {dates.map(date=>{
            const ds=formatLocalYMD(date),isTd=ds===todayStr,isSel=ds===selected;
            return (
              <button key={ds} onClick={()=>setSelected(ds)} className="btn-reset"
                style={{minWidth:"50px",padding:"8px 10px",borderRadius:"14px",textAlign:"center",background:isSel?accent:"var(--surface)",color:isSel?"#fff":"var(--text-primary)",border:`1px solid ${isSel?accent:"var(--border)"}`,boxShadow:isSel?`0 4px 14px ${accent}44`:"none",transition:"all 160ms"}}>
                <div style={{fontSize:"10px",color:isSel?"rgba(255,255,255,0.8)":"var(--text-muted)",marginBottom:"5px",fontWeight:600}}>{DAY_LABELS[date.getDay()].slice(0,3)}</div>
                <div style={{fontSize:"20px",fontFamily:"var(--font-heading)",lineHeight:1,fontWeight:700}}>{date.getDate()}</div>
                {isTd&&!isSel&&<div style={{marginTop:"5px",width:"5px",height:"5px",borderRadius:"50%",background:accent,marginInline:"auto"}}/>}
              </button>
            );
          })}
        </div>
      </div>

      {/* filter bar */}
      <div style={{display:"flex",gap:"7px",marginBottom:"14px",alignItems:"center",overflowX:"auto"}} className="hide-scrollbar">
        <button className="btn-reset" style={{padding:"6px 14px",borderRadius:"999px",background:"var(--surface-elevated)",color:"var(--text-primary)",fontSize:"12px",fontWeight:700,border:"1px solid var(--border)",whiteSpace:"nowrap"}}>All</button>
        <button onClick={()=>setShowAdd(true)} className="btn-reset" style={{padding:"6px 14px",borderRadius:"999px",background:"var(--surface)",color:"var(--text-secondary)",fontSize:"12px",fontWeight:600,border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"5px",whiteSpace:"nowrap"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New list
        </button>
        <div style={{flex:1}}/>
        {[
          <svg key="f" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
          <svg key="q" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
          <svg key="x" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
        ].map((icon,i)=>(
          <button key={i} className="btn-reset" style={{padding:"5px",borderRadius:"8px",color:"var(--text-muted)",background:"var(--surface)",border:"1px solid var(--border)",display:"flex",alignItems:"center"}}>{icon}</button>
        ))}
      </div>

      {/* agenda */}
      <div className="glass-panel" style={{borderRadius:"18px",padding:"0 14px"}}>
        {items.length===0
          ? (<div style={{padding:"36px 10px",textAlign:"center"}}>
              <div style={{color:"var(--text-muted)",fontSize:"14px",marginBottom:"16px"}}>{selected===todayStr?"Nothing for today yet.":"Nothing planned for this day."}</div>
              <button onClick={()=>setShowAdd(true)} className="btn-primary" style={{padding:"0 18px",height:"44px"}}>Add item</button>
            </div>)
          : (<AnimatePresence initial={false}>
              {items.map(item=>(
                <AgendaItem key={`${item.type}-${item.id}`} item={item} accent={accent} selectedDate={selected} todayStr={todayStr}
                  onToggleTask={(id,c)=>updateTask(id,{completed:c})} onToggleHabit={(id,d)=>toggleHabit(id,d)}/>
              ))}
            </AnimatePresence>)
        }
      </div>

      {/* FAB */}
      <button type="button" onClick={()=>setShowAdd(true)} className="btn-reset" aria-label="Add item"
        style={{position:"fixed",right:"18px",bottom:"calc(var(--mobile-nav-height) + 28px)",width:"58px",height:"58px",borderRadius:"18px",background:`linear-gradient(145deg,var(--accent-hover),var(--accent))`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"var(--shadow-glow), 0 8px 28px var(--accent-glow)",border:"1px solid rgba(255,255,255,0.2)"}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>

      <AnimatePresence>
        {showAdd&&<AddTypeSheet onClose={()=>setShowAdd(false)} onGoToTasks={onGoToTasks} onGoToHabits={onGoToHabits||onGoToTasks}/>}
      </AnimatePresence>
    </div>
  );
}