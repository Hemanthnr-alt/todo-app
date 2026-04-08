import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme }  from "../context/ThemeContext";
import { useAuth }   from "../context/AuthContext";
import { useTasks }  from "../hooks/useTasks";
import { useHabits } from "../hooks/useHabits";

const fmtDate = (d) => {
  const y  = d.getFullYear();
  const mo = String(d.getMonth()+1).padStart(2,"0");
  const dy = String(d.getDate()).padStart(2,"0");
  return `${y}-${mo}-${dy}`;
};

function buildDates(startOffset, endOffset) {
  const base = new Date();
  const b    = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const days = [];
  for (let i = startOffset; i <= endOffset; i++) {
    const d = new Date(b); d.setDate(b.getDate()+i); days.push(d);
  }
  return days;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

const DAY_LABELS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PRIORITY_CLR = { high:"#f43f5e", medium:"#f59e0b", low:"#10b981" };
const MISSED_KEY   = "thirty_missed_habits";
const getMissed    = () => { try { return JSON.parse(localStorage.getItem(MISSED_KEY)||"{}"); } catch { return {}; } };
const saveMissed   = (m) => localStorage.setItem(MISSED_KEY, JSON.stringify(m));

export default function Today({ onGoToTasks, onGoToHabits, onGoToCalendar, onGoToTimer, onGoToRewards }) {
  const { isDark, accent }        = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { tasks, categories, updateTask, deleteTask } = useTasks();
  const { habits, toggleHabit }   = useHabits();

  const todayStr = fmtDate(new Date());
  const ac       = accent || "#a855f7";

  const [rangeStart, setRangeStart] = useState(-30);
  const [rangeEnd,   setRangeEnd]   = useState(60);
  const [dates,      setDates]      = useState(() => buildDates(-30, 60));
  const [selected,   setSelected]   = useState(todayStr);
  const [missedMap,  setMissedMap]  = useState(getMissed);

  const stripRef   = useRef(null);
  const datesRef   = useRef(dates);
  datesRef.current = dates;

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.6)"     : "rgba(255,255,255,0.88)";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  /* ─────────────────────────────────────────────
     Core scroll helper — manually calculates the
     exact scrollLeft so the target cell lands
     perfectly in the centre of the strip.
  ───────────────────────────────────────────── */
  const scrollToDateStr = useCallback((dateStr, behavior = "smooth") => {
    const el = stripRef.current;
    if (!el) return;

    const currentDates = datesRef.current;
    const idx = currentDates.findIndex(d => fmtDate(d) === dateStr);
    if (idx < 0) return;

    const child = el.children[0]?.children[idx]; // inner flex div → nth child
    if (!child) return;

    // offsetLeft of the child relative to the scrollable container
    const childLeft   = child.offsetLeft;
    const childWidth  = child.offsetWidth;
    const stripWidth  = el.clientWidth;

    // We want the child centred: scrollLeft = childLeft - (stripWidth/2) + (childWidth/2)
    const targetScroll = childLeft - stripWidth / 2 + childWidth / 2;

    el.scrollTo({ left: targetScroll, behavior });
  }, []);

  /* ── On mount: jump (no animation) to today ── */
  useEffect(() => {
    // Use two rAFs to ensure the DOM has fully painted before measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToDateStr(todayStr, "auto");
      });
    });
  }, []); // eslint-disable-line

  /* ── When selected changes: smooth-scroll to it ── */
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToDateStr(selected, "smooth");
      });
    });
  }, [selected, scrollToDateStr]);

  /* ── Re-centre when tab becomes visible again ── */
  useEffect(() => {
    const handleVisible = () => {
      if (!document.hidden) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToDateStr(selected, "auto");
          });
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [selected, scrollToDateStr]);

  /* ── Go to today — single state update, effect handles scroll ── */
  const goToToday = useCallback(() => {
    setSelected(todayStr);
  }, [todayStr]);

  /* ── Infinite scroll ── */
  const rangeStartRef = useRef(rangeStart);
  const rangeEndRef   = useRef(rangeEnd);
  rangeStartRef.current = rangeStart;
  rangeEndRef.current   = rangeEnd;

  const handleStripScroll = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const THRESHOLD = 400;

    if (scrollLeft + clientWidth >= scrollWidth - THRESHOLD) {
      const newEnd = rangeEndRef.current + 30;
      setRangeEnd(newEnd);
      setDates(buildDates(rangeStartRef.current, newEnd));
    }
    if (scrollLeft <= THRESHOLD) {
      const newStart = rangeStartRef.current - 30;
      const newDates = buildDates(newStart, rangeEndRef.current);
      const prevScrollWidth = el.scrollWidth;
      setRangeStart(newStart);
      setDates(newDates);
      requestAnimationFrame(() => {
        if (!stripRef.current) return;
        const diff = stripRef.current.scrollWidth - prevScrollWidth;
        stripRef.current.scrollLeft += diff;
      });
    }
  }, []);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleStripScroll, { passive:true });
    return () => el.removeEventListener("scroll", handleStripScroll);
  }, [handleStripScroll]);

  /* ── Missed toggle ── */
  const toggleMissed = (habitId, date) => {
    const key = `${habitId}_${date}`;
    const cur = getMissed();
    if (cur[key]) { delete cur[key]; }
    else {
      cur[key] = true;
      const h = habits.find(x => x.id === habitId);
      if (h && (h.completedDates||[]).includes(date)) toggleHabit(habitId, date);
    }
    saveMissed(cur);
    setMissedMap({...cur});
  };

  const dayTasks = tasks.filter(t => t.dueDate === selected);
  const dayHabits = habits.filter(h => {
    if (h.frequency === "daily") return true;
    if (h.frequency === "weekly")
      return (h.recurringDays||[]).includes(new Date(selected+"T00:00:00").getDay());
    return true;
  });

  const completedItems = dayTasks.filter(t=>t.completed).length
    + dayHabits.filter(h=>(h.completedDates||[]).includes(selected)).length;
  const totalItems  = dayTasks.length + dayHabits.length;
  const missedItems = dayHabits.filter(h=>!!missedMap[`${h.id}_${selected}`]).length;
  const pct = totalItems > 0 ? Math.round((completedItems/totalItems)*100) : 0;

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth:"520px",margin:"0 auto",padding:"60px 20px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",color:textColor }}>
        <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
          style={{ padding:"52px 28px",background:cardBg,backdropFilter:"blur(16px)",borderRadius:"28px",border:`1px solid ${border}` }}>
          <div style={{ width:"68px",height:"68px",borderRadius:"20px",background:`linear-gradient(135deg,${ac},${ac}cc)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",fontWeight:900,color:"white",margin:"0 auto 20px",boxShadow:`0 8px 28px ${ac}44`,letterSpacing:"-0.04em" }}>30</div>
          <h2 style={{ fontSize:"22px",fontWeight:800,margin:"0 0 10px",color:textColor,letterSpacing:"-0.03em" }}>
            Welcome to <span style={{ color:ac }}>Thirty</span>
          </h2>
          <p style={{ fontSize:"14px",color:mutedColor,margin:"0 0 24px",lineHeight:1.6 }}>
            Your premium productivity companion. Sign in to get started.
          </p>
          <div style={{ display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap" }}>
            {["Tasks", "Habits", "Calendar", "Timer", "Rewards"].map(f => {
              const handlers = {
                Tasks: onGoToTasks,
                Habits: onGoToHabits,
                Calendar: onGoToCalendar,
                Timer: onGoToTimer,
                Rewards: onGoToRewards
              };
              return (
                <motion.button
                  key={f}
                  whileHover={{ scale: 1.05, background: `${ac}22` }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlers[f]}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: `${ac}15`,
                    color: ac,
                    fontSize: "12px",
                    fontWeight: 600,
                    border: `1px solid ${ac}30`,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s"
                  }}
                >
                  {f}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",color:textColor,paddingBottom:"20px" }}>

      {/* Header */}
      <div style={{ padding:"20px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div style={{ minWidth:0,flex:1 }}>
          <p style={{ fontSize:"12px",color:mutedColor,margin:"0 0 2px",letterSpacing:"0.02em" }}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </p>
          <h1 style={{ fontSize:"clamp(20px,5vw,30px)",fontWeight:800,margin:"0 0 2px",letterSpacing:"-0.03em",lineHeight:1.15 }}>
            {getGreeting()},{" "}
            <span style={{ background:`linear-gradient(135deg,${ac},${ac}99)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
              {user?.name?.split(" ")[0]||"there"}
            </span>{" "}👋
          </h1>
          {totalItems > 0 && (
            <p style={{ fontSize:"12px",color:mutedColor,margin:0 }}>
              {completedItems}/{totalItems} done
              {missedItems>0 && <span style={{ color:"#f43f5e" }}> · {missedItems} missed</span>}
              {" · "}{pct}%
            </p>
          )}
          {totalItems === 0 && selected !== todayStr && (
            <p style={{ fontSize:"12px",color:mutedColor,margin:0 }}>
              Viewing {new Date(selected+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </p>
          )}
        </div>

        {/* Right buttons */}
        <div style={{ display:"flex",gap:"8px",alignItems:"center",flexShrink:0,marginTop:"4px" }}>
          <AnimatePresence>
            {selected !== todayStr && (
              <motion.button
                initial={{opacity:0,scale:0.85,x:10}}
                animate={{opacity:1,scale:1,x:0}}
                exit={{opacity:0,scale:0.85,x:10}}
                whileTap={{scale:0.9}}
                onClick={goToToday}
                style={{ padding:"7px 14px",borderRadius:"10px",border:`1px solid ${ac}55`,background:`${ac}15`,cursor:"pointer",fontSize:"12px",fontWeight:700,color:ac,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation",whiteSpace:"nowrap" }}>
                ← Today
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button whileTap={{scale:0.9}} onClick={onGoToCalendar}
            style={{ width:"40px",height:"40px",borderRadius:"12px",border:`1px solid ${border}`,background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:textColor,WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div style={{ padding:"0 20px 14px" }}>
          <div style={{ height:"3px",background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",borderRadius:"2px",overflow:"hidden" }}>
            <motion.div animate={{width:`${pct}%`}} transition={{duration:0.5}}
              style={{ height:"100%",background:`linear-gradient(90deg,${ac},${ac}aa)`,borderRadius:"2px" }}/>
          </div>
        </div>
      )}

      {/* Date strip */}
      <div style={{ position:"relative",marginBottom:"20px" }}>
        {/* Fade edges */}
        <div style={{ position:"absolute",left:0,top:0,bottom:0,width:"40px",background:isDark?"linear-gradient(90deg,#080610,transparent)":"linear-gradient(90deg,#f5f0ff,transparent)",zIndex:2,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",right:0,top:0,bottom:0,width:"40px",background:isDark?"linear-gradient(-90deg,#080610,transparent)":"linear-gradient(-90deg,#f5f0ff,transparent)",zIndex:2,pointerEvents:"none" }}/>

        {/* Scrollable strip — ref is on THIS element */}
        <div
          ref={stripRef}
          style={{ overflowX:"auto",padding:"6px 20px",WebkitOverflowScrolling:"touch" }}
          className="hide-scrollbar"
        >
          {/* Single inner flex row — children[idx] is each date button */}
          <div style={{ display:"flex",gap:"6px",width:"max-content" }}>
            {dates.map((d) => {
              const ds       = fmtDate(d);
              const isToday  = ds === todayStr;
              const isSel    = ds === selected;
              const isWeekend= d.getDay()===0 || d.getDay()===6;
              const hasTask  = tasks.some(t=>t.dueDate===ds);
              const hasDone  = habits.some(h=>(h.completedDates||[]).includes(ds));

              return (
                <motion.button key={ds} whileTap={{scale:0.9}}
                  onClick={() => setSelected(ds)}
                  style={{
                    display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",
                    padding:"10px 10px 8px",borderRadius:"14px",border:"none",cursor:"pointer",
                    minWidth:"52px",
                    background: isSel ? `linear-gradient(135deg,${ac},${ac}cc)` : isToday ? `${ac}20` : isDark ? (isWeekend?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.05)") : (isWeekend?"rgba(0,0,0,0.03)":"rgba(0,0,0,0.04)"),
                    boxShadow: isSel ? `0 4px 18px ${ac}44` : "none",
                    transition:"background 0.15s,box-shadow 0.15s",
                    WebkitTapHighlightColor:"transparent",touchAction:"manipulation",
                    outline:"none",
                    borderTop: d.getDate()===1 ? `2px solid ${ac}44` : "2px solid transparent",
                  }}>
                  {d.getDate() === 1 && (
                    <span style={{ fontSize:"7px",fontWeight:800,color:isSel?"rgba(255,255,255,0.7)":ac,letterSpacing:"0.06em",textTransform:"uppercase",lineHeight:1,marginBottom:"-1px" }}>
                      {d.toLocaleDateString("en-US",{month:"short"})}
                    </span>
                  )}
                  <span style={{ fontSize:"9px",fontWeight:600,letterSpacing:"0.05em",color:isSel?"rgba(255,255,255,0.75)":isWeekend?ac:mutedColor,textTransform:"uppercase" }}>
                    {DAY_LABELS[d.getDay()].slice(0,3)}
                  </span>
                  <span style={{ fontSize:"17px",fontWeight:800,color:isSel?"white":isToday?ac:isWeekend?(isDark?"rgba(255,255,255,0.75)":"rgba(0,0,0,0.6)"):textColor,lineHeight:1 }}>
                    {d.getDate()}
                  </span>
                  <div style={{ width:"4px",height:"4px",borderRadius:"50%",background:isSel?"rgba(255,255,255,0.6)":hasTask?ac:hasDone?"#10b981":"transparent",transition:"background 0.2s" }}/>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign:"center",marginTop:"6px" }}>
          <span style={{ fontSize:"10px",fontWeight:600,color:mutedColor,letterSpacing:"0.06em" }}>
            {new Date(selected+"T00:00:00").toLocaleDateString("en-US",{month:"long",year:"numeric"})}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:"0 16px" }}>
        {dayTasks.length===0 && dayHabits.length===0 && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            style={{ textAlign:"center",padding:"56px 20px",background:cardBg,backdropFilter:"blur(14px)",borderRadius:"22px",border:`1px solid ${border}` }}>
            <div style={{ fontSize:"40px",marginBottom:"12px" }}>✨</div>
            <h3 style={{ fontSize:"16px",fontWeight:700,margin:"0 0 6px",color:textColor }}>
              {selected===todayStr ? "Nothing scheduled" : "Nothing on this day"}
            </h3>
            <p style={{ fontSize:"13px",color:mutedColor,margin:"0 0 20px" }}>
              {selected===todayStr ? "Add a task or build a habit" : "Tap + in Tasks to add something"}
            </p>
            <motion.button whileTap={{scale:0.97}} onClick={onGoToTasks}
              style={{ padding:"10px 24px",borderRadius:"99px",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit",boxShadow:`0 4px 14px ${ac}44`,WebkitTapHighlightColor:"transparent" }}>
              Go to Tasks →
            </motion.button>
          </motion.div>
        )}

        {/* Habits */}
        {dayHabits.length > 0 && (
          <div style={{ marginBottom:"16px" }}>
            <div style={{ fontSize:"10px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 4px 10px" }}>
              Habits · {dayHabits.filter(h=>(h.completedDates||[]).includes(selected)).length}/{dayHabits.length}
            </div>
            <AnimatePresence>
              {dayHabits.map((h,i) => {
                const done     = (h.completedDates||[]).includes(selected);
                const isMissed = !!missedMap[`${h.id}_${selected}`];
                let bg=cardBg, bdr=border;
                if (done)     { bg=isDark?"rgba(16,185,129,0.1)":"rgba(16,185,129,0.06)"; bdr="rgba(16,185,129,0.25)"; }
                if (isMissed) { bg=isDark?"rgba(244,63,94,0.08)":"rgba(244,63,94,0.04)";  bdr="rgba(244,63,94,0.22)";  }
                return (
                  <motion.div key={h.id}
                    initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.95}}
                    transition={{delay:i*0.03}}
                    style={{ display:"flex",alignItems:"center",gap:"12px",padding:"13px 14px",borderRadius:"16px",marginBottom:"8px",background:bg,backdropFilter:"blur(10px)",border:`1px solid ${bdr}`,transition:"all 0.2s" }}>
                    <div style={{ width:"40px",height:"40px",borderRadius:"12px",background:`${h.color}22`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"19px" }}>{h.icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:"14px",fontWeight:600,color:textColor,textDecoration:(done||isMissed)?"line-through":"none",opacity:(done||isMissed)?0.6:1 }}>{h.name}</div>
                      <div style={{ fontSize:"10px",color:mutedColor,marginTop:"2px",display:"flex",gap:"6px",alignItems:"center" }}>
                        <span style={{ padding:"1px 6px",borderRadius:"4px",fontSize:"10px",fontWeight:600,background:isMissed?"rgba(244,63,94,0.15)":done?"rgba(16,185,129,0.15)":`${h.color}18`,color:isMissed?"#f43f5e":done?"#10b981":h.color }}>
                          {isMissed?"Missed":done?"Done":"Habit"}
                        </span>
                        {h.streak>0 && !isMissed && <span style={{ color:"#f59e0b" }}>🔥 {h.streak}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:"6px",flexShrink:0 }}>
                      <motion.button whileTap={{scale:0.85}} onClick={() => toggleMissed(h.id,selected)}
                        style={{ width:"30px",height:"30px",borderRadius:"50%",border:`2px solid ${isMissed?"#f43f5e":"rgba(244,63,94,0.3)"}`,background:isMissed?"linear-gradient(135deg,#f43f5e,#f97316)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",color:isMissed?"white":"#f43f5e",fontSize:"12px",fontWeight:800,WebkitTapHighlightColor:"transparent" }}>
                        ✕
                      </motion.button>
                      <motion.button whileTap={{scale:0.85}} onClick={() => { if(!isMissed) toggleHabit(h.id,selected); }}
                        style={{ width:"30px",height:"30px",borderRadius:"50%",border:`2px solid ${done?"#10b981":isMissed?"rgba(255,255,255,0.08)":isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)"}`,background:done?"linear-gradient(135deg,#10b981,#34d399)":"transparent",cursor:isMissed?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",opacity:isMissed?0.3:1,WebkitTapHighlightColor:"transparent" }}>
                        {done && <span style={{ color:"white",fontSize:"13px",fontWeight:800 }}>✓</span>}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Tasks */}
        {dayTasks.length > 0 && (
          <div>
            <div style={{ fontSize:"10px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 4px 10px" }}>
              Tasks · {dayTasks.filter(t=>t.completed).length}/{dayTasks.length}
            </div>
            <AnimatePresence>
              {dayTasks.map((task,i) => {
                const cat = categories.find(c=>c.id===task.categoryId);
                const pm  = PRIORITY_CLR[task.priority]||PRIORITY_CLR.medium;
                return (
                  <motion.div key={task.id}
                    initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.95}}
                    transition={{delay:i*0.03}}
                    style={{ display:"flex",alignItems:"center",gap:"12px",padding:"13px 14px",borderRadius:"16px",marginBottom:"8px",background:task.completed?(isDark?"rgba(15,23,42,0.3)":"rgba(255,255,255,0.5)"):cardBg,backdropFilter:"blur(10px)",border:`1px solid ${border}`,borderLeft:`3px solid ${pm}`,opacity:task.completed?0.6:1,transition:"all 0.2s" }}>
                    <motion.div whileTap={{scale:0.85}} onClick={() => updateTask(task.id,{completed:!task.completed})}
                      style={{ width:"20px",height:"20px",borderRadius:"6px",flexShrink:0,border:`2px solid ${task.completed?ac:isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)"}`,background:task.completed?`linear-gradient(135deg,${ac},${ac}cc)`:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",WebkitTapHighlightColor:"transparent" }}>
                      {task.completed && <span style={{ color:"white",fontSize:"11px",fontWeight:800 }}>✓</span>}
                    </motion.div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:"14px",fontWeight:600,color:textColor,textDecoration:task.completed?"line-through":"none",marginBottom:"3px" }}>{task.title}</div>
                      <div style={{ display:"flex",gap:"5px",flexWrap:"wrap",alignItems:"center" }}>
                        {cat && <span style={{ fontSize:"10px",fontWeight:600,padding:"1px 7px",borderRadius:"4px",background:`${cat.color}18`,color:cat.color }}>{cat.icon} {cat.name}</span>}
                        <span style={{ fontSize:"10px",fontWeight:600,padding:"1px 7px",borderRadius:"4px",background:`${pm}15`,color:pm }}>{task.priority}</span>
                      </div>
                    </div>
                    <motion.button whileTap={{scale:0.9}} onClick={() => deleteTask(task.id)}
                      style={{ width:"26px",height:"26px",borderRadius:"8px",background:"rgba(244,63,94,0.08)",border:"none",cursor:"pointer",color:"#f43f5e",fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,WebkitTapHighlightColor:"transparent" }}>
                      ✕
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
