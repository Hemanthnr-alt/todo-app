import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, unlockAccentForStreak } from "../context/ThemeContext";
import { useTasks }  from "../hooks/useTasks";
import { useHabits } from "../hooks/useHabits";
import { formatLocalYMD, localTodayYMD } from "../utils/date";

const BADGES = [
  { id:"first_task",     icon:"🎯", name:"First Step",      desc:"Complete your first task",            cat:"tasks",  check:(t)=>t.completed>=1 },
  { id:"tasks_5",        icon:"✅", name:"Getting Started",  desc:"Complete 5 tasks",                    cat:"tasks",  check:(t)=>t.completed>=5 },
  { id:"tasks_25",       icon:"🏅", name:"Task Master",      desc:"Complete 25 tasks",                   cat:"tasks",  check:(t)=>t.completed>=25 },
  { id:"tasks_100",      icon:"💯", name:"Century Club",     desc:"Complete 100 tasks",                  cat:"tasks",  check:(t)=>t.completed>=100 },
  { id:"high_prio_10",   icon:"🔥", name:"High Achiever",    desc:"Complete 10 high-priority tasks",     cat:"tasks",  check:(t)=>t.highPrio>=10 },
  { id:"no_overdue",     icon:"⚡", name:"Always On Time",   desc:"0 overdue with tasks due today",      cat:"tasks",  check:(t)=>t.dueToday>0&&t.overdue===0 },
  { id:"categories_3",   icon:"🗂", name:"Organiser",        desc:"Create 3 categories",                 cat:"org",    check:(t)=>t.categories>=3 },
  { id:"all_done",       icon:"🌟", name:"Perfect Day",      desc:"Complete all tasks for today",        cat:"tasks",  check:(t)=>t.dueToday>0&&t.dueToday===t.completedToday },
  { id:"first_habit",    icon:"🌱", name:"Habit Sprout",     desc:"Create your first habit",             cat:"habits", check:(t)=>t.habitsTotal>=1 },
  { id:"habit_streak_3", icon:"🔥", name:"On Fire",          desc:"3-day streak on any habit",           cat:"habits", check:(t)=>t.bestStreak>=3 },
  { id:"habit_streak_7", icon:"💫", name:"Week Warrior",     desc:"7-day streak on any habit",           cat:"habits", check:(t)=>t.bestStreak>=7 },
  { id:"habit_streak_30",icon:"🏆", name:"Habit Hero",       desc:"30-day streak on any habit",          cat:"habits", check:(t)=>t.bestStreak>=30 },
  { id:"habits_5",       icon:"🎗", name:"Multi-habit",      desc:"Maintain 5 habits at once",           cat:"habits", check:(t)=>t.habitsTotal>=5 },
  { id:"perfect_week",   icon:"📅", name:"Perfect Week",     desc:"Complete all habits 7 days in a row", cat:"habits", check:(t)=>t.perfectWeek },
  { id:"early_bird",     icon:"🌅", name:"Early Bird",       desc:"Complete a task before 9am",          cat:"special",check:(t)=>t.earlyBird },
  { id:"night_owl",      icon:"🦉", name:"Night Owl",        desc:"Complete a task after 10pm",          cat:"special",check:(t)=>t.nightOwl },
  { id:"comeback",       icon:"💪", name:"Comeback",         desc:"Return after 3+ days away",           cat:"special",check:(t)=>t.comeback },
];

const CAT_COLORS = { tasks:"var(--danger)", habits:"var(--success)", org:"var(--accent)", special:"var(--streak)" };
const CAT_LABELS = { tasks:"Tasks", habits:"Habits", org:"Organisation", special:"Special" };

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatLocalYMD(d));
  }
  return days;
}
function checkPerfectWeek(habits){
  const last7=getLastNDays(7);
  return habits.length>0&&habits.every(h=>last7.every(d=>(h.completedDates||[]).includes(d)));
}

/* ── Mini confetti burst ── */
function ConfettiBurst({ active }) {
  const pieces = Array.from({length:12},(_,i)=>i);
  if (!active) return null;
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:"12px",zIndex:10}}>
      {pieces.map(i=>(
        <motion.div key={i}
          initial={{opacity:1,y:0,x:0,rotate:0,scale:1}}
          animate={{opacity:0,y:Math.random()*80+20,x:(Math.random()-0.5)*80,rotate:Math.random()*360,scale:0.5}}
          transition={{duration:0.8,delay:i*0.04,ease:"easeOut"}}
          style={{
            position:"absolute",
            top:"30%",left:"50%",
            width:"6px",height:"6px",
            borderRadius:i%3===0?"50%":"2px",
            background:["var(--accent)","var(--success)","var(--streak)","var(--text-body)","var(--accent-hover)"][i%5],
          }}
        />
      ))}
    </div>
  );
}

export default function Rewards() {
  const { isDark, accent }           = useTheme();
  const { tasks, categories, stats } = useTasks();
  const { habits }                   = useHabits();
  const [filter,   setFilter]  = useState("all");
  const [selected, setSelected]= useState(null);
  const [newlyEarned, setNewlyEarned] = useState(new Set());
  const prevEarnedIds = useRef(new Set());
  const ac = accent || "#6B46FF";

  const textColor  = "var(--text-primary)";
  const mutedColor = "var(--text-muted)";
  const cardBg     = "var(--surface)";
  const border     = "var(--border)";

  const today             = localTodayYMD();
  const bestStreak        = habits.length ? Math.max(0,...habits.map(h=>h.streak||0)) : 0;
  const totalCompleted    = tasks.filter(t=>t.completed).length;
  const highPrioCompleted = tasks.filter(t=>t.completed&&t.priority==="high").length;
  const completedToday    = tasks.filter(t=>t.completed&&t.dueDate===today).length;
  const dueToday          = tasks.filter(t=>t.dueDate===today).length;
  const totalHabitDays    = habits.reduce((s,h)=>s+(h.completedDates?.length||0),0);
  const getFlag = (k) => { try{return JSON.parse(localStorage.getItem(`thirty_flag_${k}`)||"false");}catch{return false;} };

  const ctx = {
    completed:totalCompleted,highPrio:highPrioCompleted,overdue:stats?.overdue||0,
    dueToday,completedToday,habitsTotal:habits.length,bestStreak,
    categories:categories.length,perfectWeek:checkPerfectWeek(habits),
    earlyBird:getFlag("earlyBird"),nightOwl:getFlag("nightOwl"),comeback:getFlag("comeback"),
  };

  useEffect(()=>{
    const h=new Date().getHours();
    if(totalCompleted>0){if(h<9)localStorage.setItem("thirty_flag_earlyBird","true");if(h>=22)localStorage.setItem("thirty_flag_nightOwl","true");}
  },[totalCompleted]);

  useEffect(() => {
    unlockAccentForStreak(bestStreak);
  }, [bestStreak]);

  const earned = useMemo(()=>BADGES.filter(b=>b.check(ctx)),[totalCompleted,habits,categories,dueToday,completedToday]);
  const locked  = useMemo(()=>BADGES.filter(b=>!b.check(ctx)),[totalCompleted,habits,categories,dueToday,completedToday]);

  /* Detect newly unlocked badges for confetti */
  useEffect(()=>{
    const currentIds = new Set(earned.map(b=>b.id));
    const fresh = new Set([...currentIds].filter(id=>!prevEarnedIds.current.has(id)));
    if(fresh.size>0){ setNewlyEarned(fresh); setTimeout(()=>setNewlyEarned(new Set()),1200); }
    prevEarnedIds.current = currentIds;
  },[earned]);

  const filteredDisplay = filter==="earned"?earned:filter==="locked"?locked:filter==="all"?BADGES:BADGES.filter(b=>b.cat===filter);

  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"24px 16px 40px",fontFamily:"var(--font-body)",color:textColor}}>
      {/* Header */}
      <div style={{marginBottom:"22px"}}>
        <h1 style={{fontSize:"28px",fontWeight:700,margin:"0 0 6px",letterSpacing:"-0.03em",fontFamily:"var(--font-heading)",color:"var(--text-primary)"}}>Rewards</h1>
        <p style={{fontSize:"13px",color:mutedColor,margin:0,lineHeight:1.5}}>Unlock badges as you build habits and clear tasks · {earned.length}/{BADGES.length} earned</p>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"12px",marginBottom:"22px"}}>
        {[
          { label:"Badges Earned", value:`${earned.length}/${BADGES.length}`, color:"var(--accent)",        icon:"🏆" },
          { label:"Best Streak",   value:`${bestStreak}d`,                    color:"var(--warning)", icon:"🔥" },
          { label:"Tasks Done",    value:totalCompleted,                       color:"var(--success)", icon:"✅" },
          { label:"Habit Days",    value:totalHabitDays,                       color:"var(--accent)", icon:"📅" },
        ].map(s=>(
          <div key={s.label} style={{
            padding:"14px 14px 16px",
            borderRadius:"16px",
            background:`linear-gradient(145deg, var(--surface-raised), var(--surface))`,
            border:`1px solid ${border}`,
            boxShadow:`0 8px 28px rgba(0,0,0,0.12), 0 0 0 1px ${s.color}18`,
            display:"flex",
            alignItems:"center",
            gap:"12px",
          }}>
            <div style={{
              width:"40px",
              height:"40px",
              borderRadius:"12px",
              background:`linear-gradient(145deg, ${s.color}35, ${s.color}12)`,
              border:`1px solid ${s.color}44`,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              fontSize:"20px",
              flexShrink:0,
              boxShadow:`0 4px 12px ${s.color}22`,
            }}>{s.icon}</div>
            <div>
              <div style={{fontSize:"28px",fontWeight:800,fontFamily:"var(--font-heading)",color:s.color,lineHeight:1,letterSpacing:"-0.03em"}}>{s.value}</div>
              <div className="section-label" style={{marginTop:"6px",opacity:0.95}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Habit streak bars */}
      {habits.length>0&&(
        <div style={{background:cardBg,borderRadius:"12px",border:"1px solid rgba(255,255,255,0.07)",padding:"16px",marginBottom:"20px"}}>
          <div className="section-label" style={{marginBottom:"12px"}}>Habit Streaks</div>
          {habits.slice(0,5).map(h=>{
            const pct=bestStreak>0?Math.min(100,(h.streak||0)/Math.max(bestStreak,7)*100):0;
            return(
              <div key={h.id} style={{marginBottom:"10px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
                  <span style={{fontSize:"12px",fontWeight:600,color:textColor}}>{h.icon} {h.name}</span>
                  <span style={{fontSize:"11px",fontWeight:700,color:h.color||ac}}>🔥 {h.streak||0}</span>
                </div>
                <div style={{height:"4px",background:"var(--surface-elevated)",borderRadius:"2px",overflow:"hidden"}}>
                  <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.7}}
                    style={{height:"100%",background:`linear-gradient(90deg,${h.color||ac},${h.color||ac}88)`,borderRadius:"2px"}}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter pills */}
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"16px"}}>
        {[
          {v:"all",l:`All (${BADGES.length})`,c:ac},
          {v:"earned",l:`Earned (${earned.length})`,c:"#22C97E"},
          {v:"locked",l:`Locked (${locked.length})`,c:mutedColor},
          ...Object.entries(CAT_LABELS).map(([v,l])=>({v,l,c:CAT_COLORS[v]})),
        ].map(f=>(
          <button key={f.v} onClick={()=>setFilter(f.v)}
            style={{padding:"5px 13px",borderRadius:"8px",
              border:filter===f.v?`1px solid ${f.c}`:`1px solid var(--border)`,
              background:filter===f.v?`${f.c}22`:"transparent",
              color:filter===f.v?f.c:mutedColor,
              cursor:"pointer",fontSize:"13px",fontWeight:filter===f.v?600:400,
              fontFamily:"inherit",transition:"all 0.13s",
              WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <motion.div layout style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"10px"}}>
        <AnimatePresence>
          {filteredDisplay.map((badge,i)=>{
            const isEarned=earned.some(b=>b.id===badge.id);
            const catColor=CAT_COLORS[badge.cat];
            const isNew=newlyEarned.has(badge.id);
            return(
              <motion.div key={badge.id}
                initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}}
                transition={{delay:i*0.025}} whileHover={{y:-3,scale:1.02}} whileTap={{scale:0.97}}
                onClick={()=>setSelected(selected?.id===badge.id?null:badge)}
                style={{
                  padding:"16px 12px",borderRadius:"14px",cursor:"pointer",textAlign:"center",
                  background:isEarned?`var(--surface-raised)`:cardBg,
                  backdropFilter:"blur(12px)",
                  border:isEarned?`2px solid var(--accent)`:`1px solid ${border}`,
                  boxShadow:isEarned
                    ?`0 0 10px var(--accent-glow)`
                    :"none",
                  opacity:isEarned?1:0.35,
                  position:"relative",
                  transition:"all var(--motion-duration)",
                  animation:isNew?"ring-pulse 0.8s ease":"none",
                }}>
                <ConfettiBurst active={isNew}/>
                {isEarned&&(
                  <div style={{position:"absolute",top:"8px",right:"8px",width:"18px",height:"18px",borderRadius:"50%",background:`var(--accent)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:"9px",color:"white",fontWeight:900}}>✓</span>
                  </div>
                )}
                <div style={{position:"relative",display:"inline-block",marginBottom:"8px"}}>
                  <div style={{fontSize:"32px",filter:isEarned?"none":"grayscale(100%)"}}>{badge.icon}</div>
                  {!isEarned&&(
                    <div style={{position:"absolute",bottom:"-4px",right:"-4px",width:"16px",height:"16px",borderRadius:"50%",background:"var(--bg)",border:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px"}}>
                      🔒
                    </div>
                  )}
                </div>
                <div style={{fontSize:"14px",fontFamily:"var(--font-heading)",fontWeight:700,color:isEarned?textColor:mutedColor,marginBottom:"3px",lineHeight:1.3}}>{badge.name}</div>
                <div style={{fontSize:"11px",color:mutedColor,lineHeight:1.4}}>{badge.desc}</div>
                {isEarned&&(
                  <div style={{marginTop:"8px",display:"inline-flex",alignItems:"center",gap:"3px",padding:"4px 10px",borderRadius:"20px",background:"var(--accent-subtle)",color:"var(--accent-hover)",fontSize:"10px",fontWeight:600}}>
                    {CAT_LABELS[badge.cat]}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredDisplay.length===0&&(
        <div style={{textAlign:"center",padding:"56px 20px",color:mutedColor}}>
          <div style={{fontSize:"40px",marginBottom:"12px"}}>🔍</div>
          <p style={{fontSize:"14px"}}>No badges here yet</p>
        </div>
      )}

      {/* Badge detail modal */}
      <AnimatePresence>
        {selected&&(()=>{
          const isEarned=earned.some(b=>b.id===selected.id);
          const catColor=CAT_COLORS[selected.cat];
          return(
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}
                style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:9000,backdropFilter:"blur(10px)"}}/>
              <div style={{position:"fixed",inset:0,zIndex:9001,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",pointerEvents:"none"}}>
                <motion.div
                  initial={{opacity:0,scale:0.82,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.82,y:20}}
                  transition={{type:"spring",damping:26,stiffness:320}}
                  onClick={e=>e.stopPropagation()}
                  style={{width:"100%",maxWidth:"320px",
                    background:"var(--surface)",
                    backdropFilter:"blur(32px)",borderRadius:"20px",
                    border:isEarned?"1px solid var(--accent)":`1px solid var(--border)`,
                    boxShadow:isEarned?"0 28px 72px rgba(0,0,0,0.5), 0 0 0 1px var(--accent-subtle)":"0 28px 72px rgba(0,0,0,0.5)",
                    padding:"28px 22px 22px",textAlign:"center",fontFamily:"var(--font-body)",
                    pointerEvents:"all"}}>
                  <div style={{width:"80px",height:"80px",borderRadius:"20px",background:`linear-gradient(135deg,${catColor}28,${catColor}55)`,border:`1.5px solid ${catColor}66`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:"40px",boxShadow:`0 8px 24px ${catColor}33`}}>
                    {selected.icon}
                  </div>
                  <h3 style={{fontSize:"22px",fontWeight:700,color:textColor,margin:"0 0 7px",letterSpacing:"-0.02em"}}>{selected.name}</h3>
                  <p style={{fontSize:"13px",color:mutedColor,margin:"0 0 20px",lineHeight:1.65}}>{selected.desc}</p>
                  <div style={{display:"inline-flex",alignItems:"center",gap:"7px",padding:"8px 18px",borderRadius:"var(--radius-pill)",marginBottom:"14px",
                    background:isEarned?"var(--accent-subtle)":"var(--surface-raised)",
                    color:isEarned?"var(--accent)":mutedColor,
                    fontSize:"13px",fontWeight:700,
                    border:`1px solid ${isEarned?"var(--accent)":"var(--border)"}`,
                    boxShadow:isEarned?"0 4px 16px var(--accent-glow)":"none"}}>
                    {isEarned?"✓ Earned":"🔒 Not yet earned"}
                  </div>
                  <div style={{fontSize:"11px",color:mutedColor,marginBottom:"22px"}}>Category: <span style={{color:catColor,fontWeight:700}}>{CAT_LABELS[selected.cat]}</span></div>
                  {!isEarned&&(
                    <div style={{padding:"10px 14px",borderRadius:"10px",
                      background:"var(--surface-raised)",border:"1px solid var(--border)",
                      marginBottom:"16px"}}>
                      <p style={{fontSize:"11px",color:mutedColor,margin:0,lineHeight:1.5}}>Keep going — complete the requirement above to unlock this badge.</p>
                    </div>
                  )}
                  <button onClick={()=>setSelected(null)}
                    style={{display:"block",width:"100%",padding:"13px",borderRadius:"12px",
                      background:"var(--surface-raised)",border:"1px solid var(--border)",
                      color:"var(--text-muted)",cursor:"pointer",fontSize:"14px",
                      fontWeight:600,fontFamily:"inherit",
                      WebkitTapHighlightColor:"transparent",touchAction:"manipulation",
                      transition:"background 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--surface-elevated)"}
                    onMouseLeave={e=>e.currentTarget.style.background="var(--surface-raised)"}>
                    Close
                  </button>
                </motion.div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}