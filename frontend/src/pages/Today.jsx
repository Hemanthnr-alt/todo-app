/**
 * Today.jsx — Clean HabitsNow-style daily view
 * - SVG icon tiles (no emojis)
 * - Recurring tasks shown with repeat icon badge
 * - Habits with startDate respected, future locked
 * - All buttons wired
 */
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";
import { PremiumCompleteTitle, PremiumRoundComplete, HabitIconTile, TaskIconTile, IconRepeat } from "../components/PremiumChrome";
import { formatLocalYMD, localTodayYMD } from "../utils/date";

const DAY_LABELS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MISSED_KEY  = "thirty_missed_habits";
const getMissed   = () => { try { return JSON.parse(localStorage.getItem(MISSED_KEY)||"{}"); } catch { return {}; } };

function buildDates(s,e) {
  const base=new Date(), mid=new Date(base.getFullYear(),base.getMonth(),base.getDate()), arr=[];
  for(let o=s;o<=e;o++){const d=new Date(mid);d.setDate(mid.getDate()+o);arr.push(d);}
  return arr;
}

// ── Lock icon ──────────────────────────────────────────────────────────────────
function LockSvg({ color="currentColor" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{opacity:.35}}>
      <rect x="5" y="11" width="14" height="11" rx="2.5" fill={color}/>
      <path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ── Help modal ─────────────────────────────────────────────────────────────────
function HelpModal({ onClose }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <motion.div onClick={e=>e.stopPropagation()} initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.88,opacity:0}} transition={{type:"spring",stiffness:380,damping:28}}
        style={{background:"var(--surface-raised)",borderRadius:"20px",padding:"20px",width:"100%",maxWidth:"340px",border:"1px solid var(--border-strong)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
          <div style={{fontSize:"16px",fontWeight:700,color:"var(--text-primary)"}}>How Today works</div>
          <button type="button" onClick={onClose} className="btn-reset" style={{width:"28px",height:"28px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>×</button>
        </div>
        {[
          {icon:"📅",t:"Date strip",d:"Scroll to view any day. Today is highlighted in accent color."},
          {icon:"✅",t:"Complete items",d:"Tap the circle to mark habits or tasks done."},
          {icon:"🔒",t:"Future habits",d:"Future dates are locked — habits can't be logged ahead of time."},
          {icon:"➕",t:"Add items",d:"Tap + FAB or 'New list' to add a Habit, Recurring Task, or Task."},
          {icon:"🔁",t:"Recurring tasks",d:"Shown with a repeat badge — these appear every day/week."},
        ].map(it=>(
          <div key={it.t} style={{display:"flex",gap:"10px",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
            <div style={{fontSize:"18px",width:"22px",flexShrink:0,textAlign:"center"}}>{it.icon}</div>
            <div>
              <div style={{fontSize:"12px",fontWeight:700,color:"var(--text-primary)",marginBottom:"1px"}}>{it.t}</div>
              <div style={{fontSize:"11px",color:"var(--text-muted)",lineHeight:1.4}}>{it.d}</div>
            </div>
          </div>
        ))}
        <button type="button" onClick={onClose} className="btn-primary" style={{width:"100%",marginTop:"12px",height:"42px",fontSize:"13px"}}>Got it</button>
      </motion.div>
    </div>
  );
}

// ── Add type sheet ─────────────────────────────────────────────────────────────
function AddTypeSheet({ onClose, onGoToTasks, onGoToHabits }) {
  const types = [
    {bg:"#FF7A5918",border:"#FF7A5940",icon:"🏆",iconBg:"#FF7A5933",title:"Habit",sub:"Activity that repeats over time. It has detailed tracking and statistics.",action:()=>{onGoToHabits?.();onClose();}},
    {bg:"#F5A62318",border:"#F5A62340",icon:"🔁",iconBg:"#F5A62333",title:"Recurring Task",sub:"Activity that repeats over time without tracking or statistics.",action:()=>{onGoToTasks?.("recurring");onClose();}},
    {bg:"#3DD68C18",border:"#3DD68C40",icon:"✅",iconBg:"#3DD68C33",title:"Task",sub:"Single instance activity without tracking over time.",action:()=>{onGoToTasks?.("single");onClose();}},
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <motion.div onClick={e=>e.stopPropagation()} initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}} transition={{type:"spring",stiffness:340,damping:30}}
        style={{width:"100%",maxWidth:"480px",background:"var(--surface-raised)",borderRadius:"20px 20px 0 0",padding:"12px 0 48px",border:"1px solid var(--border-strong)",borderBottom:"none"}}>
        <div style={{width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"0 auto 14px"}}/>
        {types.map((t,i)=>(
          <button key={t.title} type="button" onClick={t.action} className="btn-reset"
            style={{width:"100%",padding:"14px 20px",display:"flex",alignItems:"center",gap:"14px",borderBottom:i<types.length-1?"1px solid var(--border)":"none",background:"transparent"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"13px",background:t.bg,border:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{t.icon}</div>
            <div style={{textAlign:"left",flex:1,minWidth:0}}>
              <div style={{fontSize:"14px",fontWeight:700,color:"var(--text-primary)",marginBottom:"2px"}}>{t.title}</div>
              <div style={{fontSize:"11px",color:"var(--text-muted)",lineHeight:1.4}}>{t.sub}</div>
            </div>
            <span style={{color:"var(--text-muted)",fontSize:"16px",flexShrink:0}}>›</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ── Sort sheet ────────────────────────────────────────────────────────────────
function SortSheet({ current, onSelect, onClose }) {
  const opts=[
    {v:"default",l:"Default order"},
    {v:"habits",l:"Habits first"},
    {v:"tasks",l:"Tasks first"},
    {v:"done_last",l:"Completed last"},
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <motion.div onClick={e=>e.stopPropagation()} initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}} transition={{type:"spring",stiffness:340,damping:30}}
        style={{width:"100%",maxWidth:"440px",background:"var(--surface-raised)",borderRadius:"20px 20px 0 0",padding:"12px 0 44px",border:"1px solid var(--border-strong)",borderBottom:"none"}}>
        <div style={{width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"0 auto 10px"}}/>
        <div style={{padding:"4px 16px 10px",fontSize:"10px",fontWeight:700,color:"var(--text-muted)",letterSpacing:"0.07em",textTransform:"uppercase"}}>Sort</div>
        {opts.map(o=>(
          <button key={o.v} type="button" onClick={()=>{onSelect(o.v);onClose();}} className="btn-reset"
            style={{width:"100%",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",background:current===o.v?"var(--accent-soft)":"transparent",borderLeft:current===o.v?"3px solid var(--accent)":"3px solid transparent",color:"var(--text-primary)",fontSize:"14px",fontWeight:current===o.v?700:400}}>
            {o.l}
            {current===o.v&&<span style={{color:"var(--accent)",fontSize:"13px"}}>✓</span>}
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ── Agenda item ───────────────────────────────────────────────────────────────
function AgendaItem({ item, accent, onToggleTask, onToggleHabit, isFuture }) {
  const color   = item.color || accent;
  const checked = item.done;
  const isTask  = item.type==="task";
  const canAct  = !isFuture || isTask;

  return (
    <motion.div layout initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{duration:0.18}}
      style={{
        display:"flex",alignItems:"center",gap:"11px",
        padding:"12px 8px",borderBottom:"1px solid var(--border)",
        borderLeft:checked?`3px solid ${color}`:"3px solid transparent",
        borderRadius:"0 12px 12px 0",
        background:checked?`linear-gradient(90deg,${color}12,transparent 50%)`:undefined,
        transition:"background 250ms",
      }}>

      {/* icon tile */}
      {isTask
        ? <TaskIconTile iconKey={item.taskIcon||"check"} color={color} size={34}/>
        : <HabitIconTile iconKey={item.icon||"default"}  color={color} size={34}/>
      }

      {/* text */}
      <div style={{flex:1,minWidth:0}}>
        <PremiumCompleteTitle complete={checked} lineColor="var(--text-secondary)">
          {item.title}
        </PremiumCompleteTitle>
        <div style={{display:"flex",alignItems:"center",gap:"5px",marginTop:"3px",flexWrap:"wrap"}}>
          <span style={{fontSize:"10px",color,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase"}}>{item.kind}</span>
          {item.isRecurring&&(
            <span style={{display:"inline-flex",alignItems:"center",gap:"2px",fontSize:"10px",color:"var(--text-muted)",fontWeight:600}}>
              <IconRepeat size={10} stroke="var(--text-muted)"/> Recurring
            </span>
          )}
          {!isTask&&item.goalMaxPerDay&&(
            <span style={{fontSize:"10px",color:"var(--text-muted)",fontWeight:500}}>· {item.goalMaxPerDay} {item.unit||"times"}</span>
          )}
        </div>
      </div>

      {/* action */}
      {!canAct?(
        <div style={{width:"32px",height:"32px",display:"flex",alignItems:"center",justifyContent:"center",color}}><LockSvg color={color}/></div>
      ):(
        <PremiumRoundComplete checked={checked}
          onClick={()=>{if(isTask)onToggleTask(item.id,!checked);else onToggleHabit(item.id,item.date);}}
          color={color} ariaLabel={checked?"Mark incomplete":"Mark complete"}/>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Today({ onGoToTasks, onGoToCalendar, onGoToHabits }) {
  const { accent } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { tasks, updateTask, toggleComplete } = useTasks();
  const { habits, toggleHabit } = useHabits();

  const todayStr = localTodayYMD();
  const [rangeStart,setRangeStart]=useState(-5);
  const [rangeEnd,  setRangeEnd]  =useState(8);
  const [dates,     setDates]     =useState(()=>buildDates(-5,8));
  const [selected,  setSelected]  =useState(todayStr);
  const [showAdd,   setShowAdd]   =useState(false);
  const [showHelp,  setShowHelp]  =useState(false);
  const [showSort,  setShowSort]  =useState(false);
  const [sortMode,  setSortMode]  =useState("default");

  const stripRef=useRef(null);
  const dRef=useRef(dates); dRef.current=dates;
  const rsRef=useRef(rangeStart); rsRef.current=rangeStart;
  const reRef=useRef(rangeEnd);   reRef.current=rangeEnd;

  const scrollTo=useCallback((ds,beh="smooth")=>{
    const el=stripRef.current; if(!el)return;
    const idx=dRef.current.findIndex(d=>formatLocalYMD(d)===ds); if(idx<0)return;
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

  const selDateObj   = new Date(`${selected}T00:00:00`);
  const missedMap    = getMissed();
  const isFutureDate = selected > todayStr;

  const dayTasks = tasks.filter(t => {
    if (t.dueDate === selected) return true;
    if (t.isRecurring && (t.completedDates || []).includes(selected)) return true;
    return false;
  }).map(t=>({
    type:"task",id:t.id,title:t.title,taskIcon:t.icon||"check",color:"#E84A8A",
    kind:"Task",done:t.isRecurring ? (t.completedDates || []).includes(selected) : t.completed,
    isRecurring:!!t.isRecurring, rawTask: t
  }));

  const dayHabits = habits.filter(h=>{
    const start=h.startDate||h.createdAt?.slice(0,10)||todayStr;
    if(selected<start)return false;
    if(h.frequency==="daily")return true;
    if(h.frequency==="weekly")return(h.recurringDays||[]).includes(selDateObj.getDay());
    return true;
  }).map(h=>({
    type:"habit",id:h.id,title:h.name,icon:h.icon||"default",color:h.color,
    kind:missedMap[`${h.id}_${selected}`]?"Missed":"Habit",
    done:(h.completedDates||[]).includes(selected),date:selected,
    goalMaxPerDay:h.goalMaxPerDay||null,unit:h.unit||"times",
  }));

  const rawItems = useMemo(()=>[...dayHabits,...dayTasks],[dayHabits,dayTasks]);

  const items = useMemo(()=>{
    if(sortMode==="habits")   return [...dayHabits,...dayTasks];
    if(sortMode==="tasks")    return [...dayTasks,...dayHabits];
    if(sortMode==="done_last")return [...rawItems].sort((a,b)=>a.done===b.done?0:a.done?1:-1);
    return rawItems;
  },[rawItems,dayHabits,dayTasks,sortMode]);

  const doneCount  = items.filter(i=>i.done).length;
  const headerDate = `${selDateObj.getDate()} ${MONTH_NAMES[selDateObj.getMonth()]} ${selDateObj.getFullYear()}`;

  if (!isAuthenticated) {
    return (
      <div style={{maxWidth:"620px",margin:"0 auto",padding:"24px 14px"}}>
        <div className="glass-panel" style={{borderRadius:"16px",padding:"24px",textAlign:"center"}}>
          <h2 style={{fontSize:"22px",marginBottom:"8px",letterSpacing:"-0.03em"}}>Today</h2>
          <p style={{color:"var(--text-muted)",fontSize:"13px",marginBottom:"16px"}}>Sign in to see your daily list.</p>
          <button onClick={() => window.dispatchEvent(new Event("open-auth"))} className="btn-primary" style={{padding:"0 18px",height:"42px",fontSize:"13px"}}>Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth:"680px",margin:"0 auto",padding:"16px 14px 24px",color:"var(--text-body)"}}>

      {/* header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
        <div>
          <h1 style={{fontSize:"24px",fontFamily:"var(--font-heading)",letterSpacing:"-0.03em",marginBottom:"2px"}}>{headerDate}</h1>
          <div style={{color:"var(--text-muted)",fontSize:"12px"}}>{doneCount}/{items.length} done</div>
        </div>
        <div style={{display:"flex",gap:"7px"}}>
          <motion.button whileTap={{scale:0.9}} onClick={onGoToCalendar} className="btn-reset" title="Calendar"
            style={{width:"36px",height:"36px",borderRadius:"10px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </motion.button>
          <motion.button whileTap={{scale:0.9}} onClick={()=>setShowHelp(true)} className="btn-reset" title="Help"
            style={{width:"36px",height:"36px",borderRadius:"10px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </motion.button>
        </div>
      </div>

      {/* date strip */}
      <div ref={stripRef} className="hide-scrollbar" style={{overflowX:"auto",marginBottom:"12px"}}>
        <div style={{display:"flex",gap:"6px",width:"max-content"}}>
          {dates.map(date=>{
            const ds=formatLocalYMD(date),isTd=ds===todayStr,isSel=ds===selected;
            return (
              <motion.button key={ds} whileTap={{scale:0.94}} onClick={()=>setSelected(ds)} className="btn-reset"
                style={{minWidth:"48px",padding:"7px 9px",borderRadius:"12px",textAlign:"center",background:isSel?accent:"var(--surface)",color:isSel?"#fff":"var(--text-primary)",border:`1px solid ${isSel?accent:"var(--border)"}`,boxShadow:isSel?`0 3px 12px ${accent}40`:"none",transition:"all 150ms"}}>
                <div style={{fontSize:"9px",color:isSel?"rgba(255,255,255,0.75)":"var(--text-muted)",marginBottom:"4px",fontWeight:600,letterSpacing:"0.04em"}}>{DAY_LABELS[date.getDay()].slice(0,3)}</div>
                <div style={{fontSize:"18px",fontFamily:"var(--font-heading)",lineHeight:1,fontWeight:700}}>{date.getDate()}</div>
                {isTd&&!isSel&&<div style={{marginTop:"4px",width:"4px",height:"4px",borderRadius:"50%",background:accent,marginInline:"auto"}}/>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* filter bar */}
      <div style={{display:"flex",gap:"6px",marginBottom:"12px",alignItems:"center",overflowX:"auto"}} className="hide-scrollbar">
        <button className="btn-reset" style={{padding:"5px 13px",borderRadius:"999px",background:"var(--surface-elevated)",color:"var(--text-primary)",fontSize:"11px",fontWeight:700,border:"1px solid var(--border)",whiteSpace:"nowrap",flexShrink:0}}>All</button>
        <motion.button whileTap={{scale:0.95}} onClick={()=>setShowAdd(true)} className="btn-reset"
          style={{padding:"5px 12px",borderRadius:"999px",background:"var(--surface)",color:"var(--text-secondary)",fontSize:"11px",fontWeight:600,border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap",flexShrink:0}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New list
        </motion.button>
        <div style={{flex:1}}/>
        {/* sort */}
        <motion.button whileTap={{scale:0.9}} onClick={()=>setShowSort(true)} className="btn-reset" title="Sort"
          style={{padding:"5px 7px",borderRadius:"8px",color:sortMode!=="default"?"var(--accent)":"var(--text-muted)",background:sortMode!=="default"?"var(--accent-soft)":"var(--surface)",border:`1px solid ${sortMode!=="default"?"var(--accent)":"var(--border)"}`,display:"flex",alignItems:"center",flexShrink:0}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
        </motion.button>
        {/* help */}
        <motion.button whileTap={{scale:0.9}} onClick={()=>setShowHelp(true)} className="btn-reset" title="Help"
          style={{padding:"5px",borderRadius:"8px",color:"var(--text-muted)",background:"var(--surface)",border:"1px solid var(--border)",display:"flex",alignItems:"center",flexShrink:0}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </motion.button>
        {selected!==todayStr&&(
          <motion.button whileTap={{scale:0.9}} onClick={()=>setSelected(todayStr)} className="btn-reset" title="Today"
            style={{padding:"5px",borderRadius:"8px",color:"var(--text-muted)",background:"var(--surface)",border:"1px solid var(--border)",display:"flex",alignItems:"center",flexShrink:0}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </motion.button>
        )}
      </div>

      {/* future banner */}
      {isFutureDate&&(
        <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}}
          style={{background:"rgba(245,166,35,0.10)",border:"1px solid rgba(245,166,35,0.30)",borderRadius:"10px",padding:"8px 12px",marginBottom:"10px",display:"flex",alignItems:"center",gap:"7px",fontSize:"11px",color:"#F5A623",fontWeight:600}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Future date — habits are view-only. Tasks can still be completed.
        </motion.div>
      )}

      {/* agenda */}
      <div className="glass-panel" style={{borderRadius:"14px",padding:"0 12px"}}>
        {items.length===0?(
          <div style={{padding:"32px 8px",textAlign:"center"}}>
            <div style={{fontSize:"32px",marginBottom:"8px"}}>📭</div>
            <div style={{color:"var(--text-muted)",fontSize:"13px",marginBottom:"14px"}}>{selected===todayStr?"Nothing for today yet.":"Nothing on this day."}</div>
            <motion.button whileTap={{scale:0.96}} onClick={()=>setShowAdd(true)} className="btn-primary" style={{padding:"0 16px",height:"40px",fontSize:"13px"}}>Add item</motion.button>
          </div>
        ):(
          <AnimatePresence initial={false}>
            {items.map(item=>(
              <AgendaItem key={`${item.type}-${item.id}`} item={item} accent={accent} isFuture={isFutureDate}
                onToggleTask={() => toggleComplete(item.rawTask, selected)}
                onToggleHabit={(id,d)=>toggleHabit(id,d)}/>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* FAB */}
      <motion.button type="button" whileTap={{scale:0.9}} onClick={()=>setShowAdd(true)} className="btn-reset" aria-label="Add item"
        style={{position:"fixed",right:"16px",bottom:"calc(var(--mobile-nav-height) + 24px)",width:"54px",height:"54px",borderRadius:"16px",background:`linear-gradient(145deg,var(--accent-hover),var(--accent))`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${accent}55`,border:"1px solid rgba(255,255,255,0.2)"}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </motion.button>

      <AnimatePresence>
        {showAdd  && <AddTypeSheet onClose={()=>setShowAdd(false)}  onGoToTasks={onGoToTasks} onGoToHabits={onGoToHabits}/>}
        {showHelp && <HelpModal    onClose={()=>setShowHelp(false)}/>}
        {showSort && <SortSheet    current={sortMode} onSelect={setSortMode} onClose={()=>setShowSort(false)}/>}
      </AnimatePresence>
    </div>
  );
}