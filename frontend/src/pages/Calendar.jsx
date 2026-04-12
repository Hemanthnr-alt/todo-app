/**
 * Calendar.jsx — Clean HabitsNow-style calendar
 * - Month grid with habit dots + task dots
 * - Selected day panel: habits done + tasks
 * - Task statistics view (week/month/year/all)
 * - Add task for any date
 * - SVG icon tiles
 */
import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import {
  IconCalendar, IconPlus, IconRepeat, IconBarChart,
  PremiumCompleteTitle, PremiumRoundComplete,
  HabitIconTile, TaskIconTile,
} from "../components/PremiumChrome";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";
import { localTodayYMD } from "../utils/date";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_SHORT   = ["S","M","T","W","T","F","S"];
const PRIORITY = {
  high:   { color:"#FF5A5F", bg:"rgba(255,90,95,0.12)", label:"High" },
  medium: { color:"#F5A623", bg:"rgba(245,166,35,0.12)", label:"Medium" },
  low:    { color:"#3DD68C", bg:"rgba(61,214,140,0.12)", label:"Low" },
};

function getMonthData(year, month) {
  const first    = new Date(year, month, 1);
  const last     = new Date(year, month+1, 0);
  const startDay = first.getDay();
  const daysInM  = last.getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const cells    = [];
  for (let i = startDay-1; i >= 0; i--) cells.push({ d:prevLast-i, cur:false, off:-1 });
  for (let i = 1; i <= daysInM; i++)    cells.push({ d:i, cur:true, off:0 });
  const rem = cells.length % 7;
  for (let i = 1; i <= (rem===0?0:7-rem); i++) cells.push({ d:i, cur:false, off:1 });
  return cells;
}

function toDateStr(year, month, day, offset) {
  let y=year, m=month;
  if (offset===-1){m--;if(m<0){m=11;y--;}}
  if (offset===1) {m++;if(m>11){m=0;y++;}}
  return `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// ── Stats view ────────────────────────────────────────────────────────────────
function StatsView({ tasks, habits, accent }) {
  const [range, setRange] = useState("month");
  const today = localTodayYMD();
  const now   = new Date();

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d  = new Date(`${dateStr}T00:00:00`);
    const t  = new Date(`${today}T00:00:00`);
    if (range==="week")  { const ws=new Date(t); ws.setDate(t.getDate()-6); return d>=ws && d<=t; }
    if (range==="month") { return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth(); }
    if (range==="year")  { return d.getFullYear()===t.getFullYear(); }
    return true; // all
  };

  const tasksInRange    = tasks.filter(t => inRange(t.dueDate)||inRange(t.completedAt));
  const doneInRange     = tasksInRange.filter(t=>t.completed).length;
  const totalInRange    = tasksInRange.length;
  const pct             = totalInRange>0?Math.round((doneInRange/totalInRange)*100):0;

  // habit completions in range
  const habitDone = habits.reduce((acc, h) => {
    return acc + (h.completedDates||[]).filter(d=>inRange(d)).length;
  }, 0);

  // best habit streak in range
  const bestStreak = Math.max(0, ...habits.map(h=>h.streak||0));

  const stats = [
    { label:"Tasks done",      value:doneInRange,  color:"#3DD68C",   icon:"✅" },
    { label:"Completion",      value:`${pct}%`,    color:accent,       icon:"📊" },
    { label:"Habits logged",   value:habitDone,    color:"#49B9FF",   icon:"🔁" },
    { label:"Best streak",     value:`${bestStreak}d`, color:"#F5A623", icon:"🔥" },
  ];

  // by-priority breakdown
  const byPriority = ["high","medium","low"].map(k=>({
    ...PRIORITY[k],
    key:k,
    total:tasksInRange.filter(t=>t.priority===k).length,
    done:tasksInRange.filter(t=>t.priority===k&&t.completed).length,
  }));

  return (
    <div>
      {/* range pills */}
      <div style={{ display:"flex",gap:"5px",marginBottom:"14px" }}>
        {[{v:"week",l:"Week"},{v:"month",l:"Month"},{v:"year",l:"Year"},{v:"all",l:"All"}].map(r=>(
          <button key={r.v} type="button" onClick={()=>setRange(r.v)} className="btn-reset"
            style={{ padding:"5px 12px",borderRadius:"999px",background:range===r.v?"var(--accent-subtle)":"var(--surface)",border:`1px solid ${range===r.v?"var(--accent)":"var(--border)"}`,color:range===r.v?"var(--accent)":"var(--text-muted)",fontSize:"11px",fontWeight:range===r.v?700:500 }}>
            {r.l}
          </button>
        ))}
      </div>

      {/* stat cards */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px" }}>
        {stats.map(s=>(
          <div key={s.label} className="glass-panel" style={{ borderRadius:"12px",padding:"12px",border:`1px solid ${s.color}20` }}>
            <div style={{ fontSize:"18px",marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontSize:"22px",fontWeight:900,color:s.color,fontFamily:"var(--font-heading)",lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:"10px",color:"var(--text-muted)",marginTop:"2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* priority breakdown */}
      <div className="glass-panel" style={{ borderRadius:"12px",padding:"12px",marginBottom:"14px" }}>
        <div style={{ fontSize:"10px",fontWeight:700,color:"var(--text-muted)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:"10px" }}>By priority</div>
        {byPriority.map(p=>(
          <div key={p.key} style={{ marginBottom:"8px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"4px" }}>
              <span style={{ fontSize:"12px",fontWeight:600,color:p.color }}>{p.label}</span>
              <span style={{ fontSize:"11px",color:"var(--text-muted)" }}>{p.done}/{p.total}</span>
            </div>
            <div style={{ height:"4px",borderRadius:"999px",background:"var(--surface-elevated)",overflow:"hidden" }}>
              <motion.div initial={{width:0}} animate={{width:`${p.total>0?Math.round((p.done/p.total)*100):0}%`}} transition={{duration:0.6}}
                style={{ height:"100%",borderRadius:"999px",background:p.color }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Calendar ──────────────────────────────────────────────────────────────
export default function Calendar() {
  const { accent } = useTheme();
  const { tasks, addTask, updateTask, categories } = useTasks();
  const { habits, toggleHabit } = useHabits();

  const [curr,       setCurr]       = useState(new Date());
  const [selected,   setSelected]   = useState(localTodayYMD());
  const [view,       setView]       = useState("calendar"); // "calendar" | "stats"
  const [showAdd,    setShowAdd]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [draft,      setDraft]      = useState({ title:"", priority:"medium", categoryId:"", dueDate:"" });

  const year  = curr.getFullYear();
  const month = curr.getMonth();
  const today = localTodayYMD();
  const cells = getMonthData(year, month);

  const tasksByDate = useMemo(() => {
    const m = {};
    tasks.forEach(t => { if(t.dueDate){if(!m[t.dueDate])m[t.dueDate]=[];m[t.dueDate].push(t);} });
    return m;
  }, [tasks]);

  const habitsByDate = useMemo(() => {
    const m = {};
    habits.forEach(h => {
      (h.completedDates||[]).forEach(d => { if(!m[d])m[d]=[]; m[d].push(h); });
    });
    return m;
  }, [habits]);

  const selTasks  = tasksByDate[selected]  || [];
  const selHabits = habitsByDate[selected] || [];

  const catOpts = [
    { value:"", label:"No category" },
    ...categories.map(c=>({ value:c.id, label:`${c.icon||""} ${c.name}` })),
  ];

  const openAdd = useCallback(() => {
    setDraft({ title:"", priority:"medium", categoryId:"", dueDate:selected });
    setShowAdd(true);
  }, [selected]);

  const handleSave = async () => {
    if (!draft.title.trim()) { toast.error("Task title required"); return; }
    setSaving(true);
    await addTask({ title:draft.title.trim(), priority:draft.priority, categoryId:draft.categoryId||null, dueDate:draft.dueDate||null });
    setSaving(false); setShowAdd(false);
  };

  const IS = { width:"100%",padding:"10px 12px",borderRadius:"12px",border:"1px solid var(--border)",background:"var(--surface-raised)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"13px",outline:"none",boxSizing:"border-box" };
  const SL = { fontSize:"10px",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"5px" };

  return (
    <div style={{ maxWidth:"680px",margin:"0 auto",padding:"16px 14px 100px",color:"var(--text-body)" }}>

      {/* header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px" }}>
        <div>
          <h1 style={{ fontSize:"24px",fontFamily:"var(--font-heading)",letterSpacing:"-0.03em",marginBottom:"2px" }}>Calendar</h1>
          <div style={{ color:"var(--text-muted)",fontSize:"12px" }}>Plan & review</div>
        </div>
        {/* view toggle */}
        <div style={{ display:"flex",background:"var(--surface)",borderRadius:"10px",padding:"3px",border:"1px solid var(--border)" }}>
          {[{v:"calendar",icon:<IconCalendar size={14} stroke="currentColor"/>},{v:"stats",icon:<IconBarChart size={14} stroke="currentColor"/>}].map(b=>(
            <button key={b.v} type="button" onClick={()=>setView(b.v)} className="btn-reset"
              style={{ width:"32px",height:"28px",borderRadius:"7px",background:view===b.v?"var(--surface-elevated)":"transparent",color:view===b.v?"var(--accent)":"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",border:view===b.v?"1px solid var(--border)":"1px solid transparent",transition:"all 130ms" }}>
              {b.icon}
            </button>
          ))}
        </div>
      </div>

      {view==="stats" ? (
        <StatsView tasks={tasks} habits={habits} accent={accent}/>
      ) : (
        <>
          {/* calendar card */}
          <div className="glass-panel" style={{ borderRadius:"14px",padding:"14px",marginBottom:"14px" }}>
            {/* month nav */}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px" }}>
              <button type="button" onClick={()=>setCurr(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} className="btn-reset"
                style={{ width:"30px",height:"30px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-primary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px" }}>‹</button>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"15px",fontWeight:700,color:"var(--text-primary)" }}>{MONTH_NAMES[month]}</div>
                <div style={{ fontSize:"11px",color:"var(--text-muted)" }}>{year}</div>
              </div>
              <div style={{ display:"flex",gap:"6px",alignItems:"center" }}>
                <button type="button" onClick={()=>{ setCurr(new Date()); setSelected(today); }} className="btn-reset"
                  style={{ padding:"4px 9px",borderRadius:"7px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--accent)",fontSize:"10px",fontWeight:700 }}>Today</button>
                <button type="button" onClick={()=>setCurr(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} className="btn-reset"
                  style={{ width:"30px",height:"30px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-primary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px" }}>›</button>
              </div>
            </div>

            {/* weekday labels */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:"6px" }}>
              {DAY_SHORT.map((d,i)=>(
                <div key={i} style={{ textAlign:"center",fontSize:"10px",fontWeight:700,color:"var(--text-muted)",padding:"2px 0" }}>{d}</div>
              ))}
            </div>

            {/* days grid */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px" }}>
              {cells.map((cell,i)=>{
                const ds       = toDateStr(year, month, cell.d, cell.off);
                const isTd     = ds===today;
                const isSel    = ds===selected;
                const hasTask  = (tasksByDate[ds]||[]).length>0;
                const hasHabit = (habitsByDate[ds]||[]).length>0;
                return (
                  <motion.button key={`${ds}-${i}`} whileTap={{scale:0.88}} type="button"
                    onClick={()=>{ setSelected(ds); if(!cell.cur) setCurr(new Date(year,month+cell.off,1)); }}
                    className="btn-reset"
                    style={{
                      aspectRatio:"1",borderRadius:"9px",
                      background:isSel?accent:isTd?"var(--accent-subtle)":"transparent",
                      border:`1px solid ${isSel?accent:isTd?"var(--accent)44":"transparent"}`,
                      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"2px",
                      color:isSel?"#fff":isTd?"var(--accent)":cell.cur?"var(--text-secondary)":"var(--text-tertiary)",
                    }}>
                    <span style={{ fontSize:"12px",fontWeight:isTd||isSel?800:400,lineHeight:1 }}>{cell.d}</span>
                    <div style={{ display:"flex",gap:"2px",height:"5px",alignItems:"center" }}>
                      {hasTask  && <div style={{ width:"4px",height:"4px",borderRadius:"50%",background:isSel?"rgba(255,255,255,0.8)":"#E84A8A" }}/>}
                      {hasHabit && <div style={{ width:"4px",height:"4px",borderRadius:"50%",background:isSel?"rgba(255,255,255,0.7)":accent }}/>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* selected day panel */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px" }}>
            <div style={{ fontSize:"12px",color:"var(--text-muted)",fontWeight:600 }}>
              {new Date(`${selected}T12:00:00`).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
            </div>
            <motion.button whileTap={{scale:0.92}} type="button" onClick={openAdd} className="btn-reset"
              style={{ display:"flex",alignItems:"center",gap:"5px",padding:"5px 11px",borderRadius:"10px",background:"var(--accent-subtle)",border:"1px solid var(--accent)44",color:"var(--accent)",fontSize:"11px",fontWeight:700 }}>
              <IconPlus size={11} stroke="currentColor"/>
              Add task
            </motion.button>
          </div>

          <div className="glass-panel" style={{ borderRadius:"14px",padding:"0 10px" }}>
            {selTasks.length===0 && selHabits.length===0 ? (
              <div style={{ padding:"28px 8px",textAlign:"center" }}>
                <div style={{ fontSize:"28px",marginBottom:"6px" }}>📭</div>
                <div style={{ color:"var(--text-muted)",fontSize:"13px" }}>Nothing scheduled for this day.</div>
              </div>
            ):(
              <>
                {/* habits */}
                {selHabits.map(h=>(
                  <div key={h.id} style={{ display:"flex",gap:"10px",alignItems:"center",padding:"11px 6px",borderBottom:"1px solid var(--border)" }}>
                    <HabitIconTile iconKey={h.icon||"default"} color={h.color} size={32}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:"13px",fontWeight:600,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h.name}</div>
                      <div style={{ fontSize:"10px",color:h.color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:"2px" }}>Habit · Done</div>
                    </div>
                    <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:"#3DD68C",flexShrink:0 }}/>
                  </div>
                ))}
                {/* tasks */}
                {selTasks.map(t=>{
                  const p=PRIORITY[t.priority]||PRIORITY.medium;
                  return (
                    <div key={t.id} style={{ display:"flex",gap:"10px",alignItems:"center",padding:"11px 6px",borderBottom:"1px solid var(--border)",borderLeft:t.completed?`3px solid ${p.color}`:"3px solid transparent",borderRadius:"0 10px 10px 0",background:t.completed?`linear-gradient(90deg,${p.color}10,transparent 50%)`:undefined }}>
                      <PremiumRoundComplete checked={t.completed} onClick={()=>updateTask(t.id,{completed:!t.completed})} color={p.color} ariaLabel={t.completed?"Mark incomplete":"Complete"}/>
                      <TaskIconTile iconKey={t.icon||"check"} color={t.color||p.color} size={32}/>
                      <div style={{ flex:1,minWidth:0 }}>
                        <PremiumCompleteTitle complete={t.completed} lineColor="var(--text-secondary)">
                          {t.title}
                        </PremiumCompleteTitle>
                        <div style={{ display:"flex",alignItems:"center",gap:"5px",marginTop:"2px" }}>
                          <span style={{ fontSize:"10px",fontWeight:700,color:p.color,background:p.bg,padding:"1px 5px",borderRadius:"999px" }}>{p.label}</span>
                          {t.isRecurring&&<span style={{ fontSize:"10px",color:"var(--text-muted)",display:"inline-flex",alignItems:"center",gap:"2px" }}><IconRepeat size={9} stroke="currentColor"/> Recurring</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}

      {/* Add task modal */}
      <CenteredModal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Add task" maxWidth="380px">
        <div style={{ display:"grid",gap:"12px" }}>
          <div>
            <div style={SL}>Task name</div>
            <input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} placeholder="What needs to be done?" style={IS} autoFocus/>
          </div>
          <div>
            <div style={SL}>Priority</div>
            <div style={{ display:"flex",gap:"5px" }}>
              {["high","medium","low"].map(k=>{
                const p=PRIORITY[k], act=draft.priority===k;
                return (
                  <button key={k} type="button" onClick={()=>setDraft(d=>({...d,priority:k}))} className="btn-reset"
                    style={{ flex:1,padding:"7px",borderRadius:"9px",border:act?`1.5px solid ${p.color}`:"1px solid var(--border)",background:act?p.bg:"var(--surface)",color:p.color,fontWeight:700,fontSize:"11px",textTransform:"uppercase" }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={SL}>Category</div>
            <CustomSelect value={draft.categoryId} onChange={v=>setDraft(d=>({...d,categoryId:v}))} options={catOpts}/>
          </div>
          <div>
            <div style={SL}>Due date</div>
            <input type="date" value={draft.dueDate} onChange={e=>setDraft(d=>({...d,dueDate:e.target.value}))} style={IS}/>
          </div>
          <div style={{ display:"flex",gap:"8px" }}>
            <button type="button" onClick={()=>setShowAdd(false)} className="glass-tile" style={{ flex:1,borderRadius:"12px",padding:"10px",color:"var(--text-primary)",fontWeight:600,fontSize:"13px" }}>Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex:2,height:"42px",fontSize:"13px" }}>{saving?"Saving…":"Add task"}</button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}