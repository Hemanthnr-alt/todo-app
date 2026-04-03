import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme }  from "../context/ThemeContext";
import { useTasks }  from "../hooks/useTasks";
import { useHabits } from "../hooks/useHabits";

const BADGES = [
  { id:"first_task",     icon:"🎯", name:"First Step",      desc:"Complete your first task",               cat:"tasks",  check:(t)=>t.completed>=1                           },
  { id:"tasks_5",        icon:"✅", name:"Getting Started",  desc:"Complete 5 tasks",                       cat:"tasks",  check:(t)=>t.completed>=5                           },
  { id:"tasks_25",       icon:"🏅", name:"Task Master",      desc:"Complete 25 tasks",                      cat:"tasks",  check:(t)=>t.completed>=25                          },
  { id:"tasks_100",      icon:"💯", name:"Century Club",     desc:"Complete 100 tasks",                     cat:"tasks",  check:(t)=>t.completed>=100                         },
  { id:"high_prio_10",   icon:"🔥", name:"High Achiever",    desc:"Complete 10 high-priority tasks",        cat:"tasks",  check:(t)=>t.highPrio>=10                           },
  { id:"no_overdue",     icon:"⚡", name:"Always On Time",   desc:"0 overdue with tasks due today",         cat:"tasks",  check:(t)=>t.dueToday>0&&t.overdue===0              },
  { id:"categories_3",   icon:"🗂", name:"Organiser",        desc:"Create 3 categories",                    cat:"org",    check:(t)=>t.categories>=3                          },
  { id:"all_done",       icon:"🌟", name:"Perfect Day",      desc:"Complete all tasks for today",           cat:"tasks",  check:(t)=>t.dueToday>0&&t.dueToday===t.completedToday},
  { id:"first_habit",    icon:"🌱", name:"Habit Sprout",     desc:"Create your first habit",                cat:"habits", check:(t)=>t.habitsTotal>=1                         },
  { id:"habit_streak_3", icon:"🔥", name:"On Fire",          desc:"3-day streak on any habit",              cat:"habits", check:(t)=>t.bestStreak>=3                          },
  { id:"habit_streak_7", icon:"💫", name:"Week Warrior",     desc:"7-day streak on any habit",              cat:"habits", check:(t)=>t.bestStreak>=7                          },
  { id:"habit_streak_30",icon:"🏆", name:"Habit Hero",       desc:"30-day streak on any habit",             cat:"habits", check:(t)=>t.bestStreak>=30                         },
  { id:"habits_5",       icon:"🎗", name:"Multi-habit",      desc:"Maintain 5 habits at once",              cat:"habits", check:(t)=>t.habitsTotal>=5                         },
  { id:"perfect_week",   icon:"📅", name:"Perfect Week",     desc:"Complete all habits 7 days in a row",    cat:"habits", check:(t)=>t.perfectWeek                            },
  { id:"early_bird",     icon:"🌅", name:"Early Bird",       desc:"Complete a task before 9am",             cat:"special",check:(t)=>t.earlyBird                             },
  { id:"night_owl",      icon:"🦉", name:"Night Owl",        desc:"Complete a task after 10pm",             cat:"special",check:(t)=>t.nightOwl                              },
  { id:"comeback",       icon:"💪", name:"Comeback",         desc:"Return after 3+ days away",              cat:"special",check:(t)=>t.comeback                              },
];

const CAT_COLORS = { tasks:"#f43f5e", habits:"#10b981", org:"#8b5cf6", special:"#f59e0b" };
const CAT_LABELS = { tasks:"Tasks", habits:"Habits", org:"Organisation", special:"Special" };

function getLastNDays(n) {
  const days = [];
  for (let i = n-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function checkPerfectWeek(habits) {
  const last7 = getLastNDays(7);
  return habits.length > 0 && habits.every(h =>
    last7.every(d => (h.completedDates||[]).includes(d))
  );
}

export default function Rewards() {
  const { isDark, accent }           = useTheme();
  const { tasks, categories, stats } = useTasks();
  const { habits }                   = useHabits();

  const [filter,   setFilter]  = useState("all");
  const [selected, setSelected]= useState(null);

  const ac = accent || "#a855f7";

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.9)";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const today             = new Date().toISOString().split("T")[0];
  const bestStreak        = habits.length ? Math.max(0,...habits.map(h=>h.streak||0)) : 0;
  const totalCompleted    = tasks.filter(t=>t.completed).length;
  const highPrioCompleted = tasks.filter(t=>t.completed&&t.priority==="high").length;
  const completedToday    = tasks.filter(t=>t.completed&&t.dueDate===today).length;
  const dueToday          = tasks.filter(t=>t.dueDate===today).length;
  const totalHabitDays    = habits.reduce((s,h)=>s+(h.completedDates?.length||0),0);

  const getFlag = (k) => {
    try { return JSON.parse(localStorage.getItem(`thirty_flag_${k}`)||"false"); }
    catch { return false; }
  };

  const ctx = {
    completed:      totalCompleted,
    highPrio:       highPrioCompleted,
    overdue:        stats?.overdue || 0,
    dueToday,
    completedToday,
    habitsTotal:    habits.length,
    bestStreak,
    categories:     categories.length,
    perfectWeek:    checkPerfectWeek(habits),
    earlyBird:      getFlag("earlyBird"),
    nightOwl:       getFlag("nightOwl"),
    comeback:       getFlag("comeback"),
  };

  // Track early bird / night owl
  useEffect(() => {
    const h = new Date().getHours();
    if (totalCompleted > 0) {
      if (h < 9)   localStorage.setItem("thirty_flag_earlyBird","true");
      if (h >= 22) localStorage.setItem("thirty_flag_nightOwl","true");
    }
  }, [totalCompleted]);

  const earned = useMemo(() => BADGES.filter(b => b.check(ctx)),  [totalCompleted, habits, categories, dueToday, completedToday]);
  const locked = useMemo(() => BADGES.filter(b => !b.check(ctx)), [totalCompleted, habits, categories, dueToday, completedToday]);

  const filteredDisplay =
    filter === "earned" ? earned
    : filter === "locked" ? locked
    : filter === "all"   ? BADGES
    : BADGES.filter(b => b.cat === filter);

  return (
    <div style={{ maxWidth:"900px",margin:"0 auto",padding:"24px 16px 40px",fontFamily:"'DM Sans',sans-serif",color:textColor }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontSize:"clamp(22px,5vw,28px)",fontWeight:800,margin:"0 0 4px",letterSpacing:"-0.04em" }}>
          <span style={{ background:`linear-gradient(135deg,${ac},${ac}99)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
            Rewards
          </span>
        </h1>
        <p style={{ fontSize:"12px",color:mutedColor,margin:0 }}>
          {earned.length}/{BADGES.length} badges earned
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"10px",marginBottom:"20px" }}>
        {[
          { label:"Badges Earned", value:`${earned.length}/${BADGES.length}`, color:ac,        icon:"🏆" },
          { label:"Best Streak",   value:`${bestStreak}d`,                    color:"#f59e0b", icon:"🔥" },
          { label:"Tasks Done",    value:totalCompleted,                       color:"#10b981", icon:"✅" },
          { label:"Habit Days",    value:totalHabitDays,                       color:"#8b5cf6", icon:"📅" },
        ].map(s => (
          <div key={s.label} style={{ padding:"14px",borderRadius:"16px",background:cardBg,backdropFilter:"blur(12px)",border:`1px solid ${border}`,display:"flex",alignItems:"center",gap:"10px" }}>
            <div style={{ width:"36px",height:"36px",borderRadius:"10px",background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize:"18px",fontWeight:800,color:s.color,lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"10px",color:mutedColor,marginTop:"2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Habit streak bars ── */}
      {habits.length > 0 && (
        <div style={{ background:cardBg,borderRadius:"16px",border:`1px solid ${border}`,padding:"16px",marginBottom:"20px" }}>
          <div style={{ fontSize:"11px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"12px" }}>
            Habit Streaks
          </div>
          {habits.slice(0,5).map(h => {
            const pct = bestStreak > 0 ? Math.min(100,(h.streak||0)/Math.max(bestStreak,7)*100) : 0;
            return (
              <div key={h.id} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"5px" }}>
                  <span style={{ fontSize:"12px",fontWeight:600,color:textColor }}>{h.icon} {h.name}</span>
                  <span style={{ fontSize:"11px",fontWeight:700,color:h.color||ac }}>🔥 {h.streak||0}</span>
                </div>
                <div style={{ height:"4px",background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",borderRadius:"2px",overflow:"hidden" }}>
                  <motion.div
                    initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.7}}
                    style={{ height:"100%",background:`linear-gradient(90deg,${h.color||ac},${h.color||ac}88)`,borderRadius:"2px" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={{ display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"16px" }}>
        {[
          { v:"all",    l:`All (${BADGES.length})`,    c:ac         },
          { v:"earned", l:`Earned (${earned.length})`, c:"#10b981"  },
          { v:"locked", l:`Locked (${locked.length})`, c:mutedColor },
          ...Object.entries(CAT_LABELS).map(([v,l]) => ({ v, l, c:CAT_COLORS[v] })),
        ].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            style={{ padding:"5px 12px",borderRadius:"99px",border:`1.5px solid ${filter===f.v?f.c:border}`,background:filter===f.v?`${f.c}15`:"transparent",color:filter===f.v?f.c:mutedColor,cursor:"pointer",fontSize:"11px",fontWeight:filter===f.v?700:400,fontFamily:"inherit",transition:"all 0.13s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
            {f.l}
          </button>
        ))}
      </div>

      {/* ── Badge grid ── */}
      <motion.div layout style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"10px" }}>
        <AnimatePresence>
          {filteredDisplay.map((badge, i) => {
            const isEarned = earned.some(b => b.id === badge.id);
            const catColor = CAT_COLORS[badge.cat];
            return (
              <motion.div key={badge.id}
                initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}}
                transition={{delay:i*0.025}} whileHover={{y:-3,scale:1.02}} whileTap={{scale:0.97}}
                onClick={() => setSelected(selected?.id === badge.id ? null : badge)}
                style={{
                  padding:"16px 12px",borderRadius:"16px",cursor:"pointer",textAlign:"center",
                  background:isEarned?(isDark?`${catColor}10`:cardBg):cardBg,
                  backdropFilter:"blur(12px)",
                  border:`1.5px solid ${isEarned?`${catColor}40`:border}`,
                  boxShadow:isEarned?`0 4px 20px ${catColor}18`:"none",
                  opacity:isEarned?1:0.42,
                  position:"relative",
                  transition:"all 0.2s",
                }}
              >
                {/* Earned checkmark */}
                {isEarned && (
                  <div style={{ position:"absolute",top:"8px",right:"8px",width:"16px",height:"16px",borderRadius:"50%",background:`linear-gradient(135deg,${catColor},${catColor}cc)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <span style={{ fontSize:"8px",color:"white",fontWeight:900 }}>✓</span>
                  </div>
                )}
                <div style={{ fontSize:"32px",marginBottom:"8px",filter:isEarned?"none":"grayscale(100%)" }}>
                  {badge.icon}
                </div>
                <div style={{ fontSize:"11px",fontWeight:700,color:isEarned?textColor:mutedColor,marginBottom:"3px",lineHeight:1.3 }}>
                  {badge.name}
                </div>
                <div style={{ fontSize:"9px",color:mutedColor,lineHeight:1.4 }}>
                  {badge.desc}
                </div>
                {isEarned && (
                  <div style={{ marginTop:"8px",display:"inline-flex",alignItems:"center",gap:"3px",padding:"2px 8px",borderRadius:"6px",background:`${catColor}18`,color:catColor,fontSize:"9px",fontWeight:700 }}>
                    {CAT_LABELS[badge.cat]}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredDisplay.length === 0 && (
        <div style={{ textAlign:"center",padding:"56px 20px",color:mutedColor }}>
          <div style={{ fontSize:"40px",marginBottom:"12px" }}>🔍</div>
          <p style={{ fontSize:"14px" }}>No badges here yet</p>
        </div>
      )}

      {/* ── Badge detail modal — properly centered ── */}
      <AnimatePresence>
        {selected && (() => {
          const isEarned  = earned.some(b => b.id === selected.id);
          const catColor  = CAT_COLORS[selected.cat];
          return (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                onClick={() => setSelected(null)}
                style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:9000,backdropFilter:"blur(10px)" }}
              />

              {/* Centering shell — no transform animation here */}
              <div style={{
                position:"fixed",inset:0,zIndex:9001,
                display:"flex",alignItems:"center",justifyContent:"center",
                padding:"24px",
                pointerEvents:"none",
              }}>
                <motion.div
                  initial={{opacity:0,scale:0.82,y:20}}
                  animate={{opacity:1,scale:1,y:0}}
                  exit={{opacity:0,scale:0.82,y:20}}
                  transition={{ type:"spring",damping:26,stiffness:320 }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width:"100%",maxWidth:"320px",
                    background:isDark
                      ? "linear-gradient(145deg,#0a0618,#110820)"
                      : "rgba(255,255,255,0.98)",
                    backdropFilter:"blur(32px)",
                    borderRadius:"26px",
                    border:`1px solid ${catColor}33`,
                    padding:"30px 24px 24px",
                    textAlign:"center",
                    fontFamily:"'DM Sans',sans-serif",
                    boxShadow:`0 28px 72px rgba(0,0,0,0.5), 0 0 0 1px ${catColor}22`,
                    pointerEvents:"all",
                  }}
                >
                  {/* Icon box */}
                  <div style={{
                    width:"80px",height:"80px",borderRadius:"24px",
                    background:`linear-gradient(135deg,${catColor}28,${catColor}55)`,
                    border:`1.5px solid ${catColor}66`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    margin:"0 auto 18px",
                    fontSize:"40px",
                    boxShadow:`0 8px 24px ${catColor}33`,
                  }}>
                    {selected.icon}
                  </div>

                  {/* Name */}
                  <h3 style={{ fontSize:"22px",fontWeight:800,color:textColor,margin:"0 0 7px",letterSpacing:"-0.03em" }}>
                    {selected.name}
                  </h3>

                  {/* Desc */}
                  <p style={{ fontSize:"13px",color:mutedColor,margin:"0 0 20px",lineHeight:1.65 }}>
                    {selected.desc}
                  </p>

                  {/* Status pill — uses ACCENT color */}
                  <div style={{
                    display:"inline-flex",alignItems:"center",gap:"7px",
                    padding:"8px 18px",borderRadius:"99px",marginBottom:"14px",
                    background:isEarned?`${ac}18`:(isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"),
                    color:isEarned?ac:mutedColor,
                    fontSize:"13px",fontWeight:700,
                    border:`1px solid ${isEarned?ac+"44":border}`,
                    boxShadow:isEarned?`0 4px 16px ${ac}22`:"none",
                  }}>
                    {isEarned ? `✓ Earned` : "🔒 Not yet earned"}
                  </div>

                  {/* Category */}
                  <div style={{ fontSize:"11px",color:mutedColor,marginBottom:"22px" }}>
                    Category:{" "}
                    <span style={{ color:catColor,fontWeight:700 }}>{CAT_LABELS[selected.cat]}</span>
                  </div>

                  {/* Progress hint if not earned */}
                  {!isEarned && (
                    <div style={{ padding:"10px 14px",borderRadius:"12px",background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:`1px solid ${border}`,marginBottom:"16px" }}>
                      <p style={{ fontSize:"11px",color:mutedColor,margin:0,lineHeight:1.5 }}>
                        Keep going — complete the requirement above to unlock this badge.
                      </p>
                    </div>
                  )}

                  {/* Close button */}
                  <button onClick={() => setSelected(null)}
                    style={{
                      display:"block",width:"100%",padding:"13px",borderRadius:"14px",
                      background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)",
                      border:`1px solid ${border}`,color:mutedColor,cursor:"pointer",
                      fontSize:"14px",fontWeight:600,fontFamily:"inherit",
                      WebkitTapHighlightColor:"transparent",touchAction:"manipulation",
                      transition:"background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark?"rgba(255,255,255,0.11)":"rgba(0,0,0,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"}
                  >
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