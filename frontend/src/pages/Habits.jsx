/**
 * Habits.jsx
 * - SVG icon picker (no emojis)
 * - Red = not started today, Orange = in progress, Green = complete
 * - startDate: habits only show from creation date, future locked
 * - Calendar modal, Statistics modal, Action sheet
 * - Clean minimal HabitsNow-style cards
 */
import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import {
  HabitIconTile,
  HABIT_ICON_LIST,
  HABIT_ICONS,
  IconFlame,
  IconPlus,
  PremiumCompleteTitle,
  PremiumRoundComplete,
  IconBarChart,
  IconCalendar,
} from "../components/PremiumChrome";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { addDaysToYMD, formatLocalYMD, localTodayYMD } from "../utils/date";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  "#FF7A59","#FF5A5F","#F5A623","#3DD68C","#49B9FF","#8B5CF6",
  "#EC4899","#14B8A6","#6366F1","#EAB308","#F43F5E","#06B6D4",
];
const WEEKDAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FREQ_OPTIONS  = [
  { value:"daily",    label:"Every day" },
  { value:"weekly",   label:"Weekly — pick days" },
  { value:"interval", label:"Every N days" },
  { value:"monthly",  label:"Monthly" },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
// pct = 0 → red, 0<pct<100 → orange, 100 → green
function statusColor(pct) {
  if (pct === 100) return "#3DD68C";
  if (pct > 0)    return "#F5A623";
  return "#FF5A5F";
}

function getLast7(today) {
  const out = [];
  for (let i = 6; i >= 0; i--) out.push(addDaysToYMD(today, -i));
  return out;
}

function getMonthGrid(y, m) {
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

function scheduleLabel(h) {
  const f = h.frequency || "daily";
  const d = h.recurringDays || [];
  if (f === "interval" && h.everyNDays) return `Every ${h.everyNDays} days`;
  if (f === "weekly"   && d.length)     return d.sort((a,b)=>a-b).map(x=>WEEKDAY_SHORT[x]).join(", ");
  if (h.targetTimesPerWeek >= 1)        return `${h.targetTimesPerWeek}× / week`;
  if (f === "monthly") return "Monthly";
  return "Every day";
}

// ─── Icon picker grid ──────────────────────────────────────────────────────────
const IconPickerGrid = memo(function IconPickerGrid({ value, onChange, color }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
      {HABIT_ICON_LIST.map(key => (
        <button key={key} type="button" onClick={() => onChange(key)} className="btn-reset"
          style={{
            width:"40px", height:"40px", borderRadius:"10px",
            background: key===value ? `${color}28` : "var(--surface-elevated)",
            border: `1.5px solid ${key===value ? color : "var(--border)"}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"8px",
          }}>
          <div style={{ width:"100%", height:"100%", color }}>
            {HABIT_ICONS[key]?.(color)}
          </div>
        </button>
      ))}
    </div>
  );
});

// ─── Lock SVG ─────────────────────────────────────────────────────────────────
function LockIcon({ size=9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 26" fill="currentColor" aria-hidden>
      <rect x="4" y="12" width="16" height="12" rx="2.5"/>
      <path d="M8 12V8a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Quantity sheet ───────────────────────────────────────────────────────────
function QuantitySheet({ habit, onClose, onLog }) {
  const today    = localTodayYMD();
  const existing = useMemo(() => (habit?.completedDates||[]).filter(d=>d===today).length, [habit, today]);
  const [qty,  setQty]  = useState(existing || 0);
  const [mode, setMode] = useState("replace");
  useEffect(() => { setQty(existing||0); }, [existing]);
  if (!habit) return null;

  const max  = habit.goalMaxPerDay || null;
  const unit = habit.unit || "times";
  const shown = mode==="add" ? existing+qty : qty;

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{y:100,opacity:0}} animate={{y:0,opacity:1}} exit={{y:100,opacity:0}}
        transition={{type:"spring",stiffness:340,damping:30}}
        style={{ width:"100%",maxWidth:"440px",background:"var(--surface-raised)",borderRadius:"20px 20px 0 0",padding:"18px 18px 44px",border:"1px solid var(--border-strong)",borderBottom:"none" }}>

        <div style={{ width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"0 auto 16px" }}/>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px" }}>
          <div>
            <div style={{ fontSize:"17px",fontWeight:700,color:"var(--text-primary)" }}>{habit.name}</div>
            <div style={{ fontSize:"11px",color:habit.color,fontWeight:600,marginTop:"3px" }}>
              {today.slice(8,10)}/{today.slice(5,7)}/{today.slice(0,4)}
            </div>
          </div>
          <HabitIconTile iconKey={habit.icon||"default"} color={habit.color} size={36}/>
        </div>

        <div style={{ background:"var(--surface)",borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px",marginBottom:"10px",border:"1px solid var(--border)" }}>
          <button type="button" onClick={()=>setQty(v=>Math.max(0,v-1))} className="btn-reset"
            style={{ width:"50px",height:"50px",borderRadius:"10px",background:"var(--surface-elevated)",color:"var(--text-primary)",fontSize:"24px",display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"44px",fontWeight:900,color:habit.color,fontFamily:"var(--font-heading)",lineHeight:1 }}>{qty}</div>
            {max && <div style={{ fontSize:"11px",color:"var(--text-muted)",marginTop:"1px" }}>of {max} {unit}</div>}
          </div>
          <button type="button" onClick={()=>setQty(v=>v+1)} className="btn-reset"
            style={{ width:"50px",height:"50px",borderRadius:"10px",background:habit.color,color:"#111",fontSize:"24px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 14px ${habit.color}44` }}>+</button>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",background:"var(--surface)",borderRadius:"10px",padding:"3px",marginBottom:"10px",border:"1px solid var(--border)" }}>
          {["replace","add"].map(m=>(
            <button key={m} type="button" onClick={()=>setMode(m)} className="btn-reset"
              style={{ padding:"8px",borderRadius:"8px",background:mode===m?`${habit.color}20`:"transparent",color:mode===m?habit.color:"var(--text-muted)",fontWeight:700,fontSize:"13px",border:mode===m?`1px solid ${habit.color}44`:"1px solid transparent",transition:"all 140ms" }}>
              {m.charAt(0).toUpperCase()+m.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ background:"var(--surface)",borderRadius:"10px",padding:"10px 14px",marginBottom:"16px",border:"1px solid var(--border)",textAlign:"center" }}>
          <div style={{ fontSize:"11px",color:"var(--text-muted)",marginBottom:"2px" }}>Today</div>
          <div style={{ fontSize:"15px",fontWeight:700,color:"var(--text-primary)" }}>{shown}{max?` / ${max}`:""} {unit}</div>
        </div>

        <div style={{ display:"flex",gap:"8px" }}>
          <button type="button" onClick={onClose} className="btn-reset"
            style={{ flex:1,padding:"12px",borderRadius:"12px",background:"var(--surface)",color:"var(--text-secondary)",fontWeight:700,fontSize:"13px",border:"1px solid var(--border)",letterSpacing:"0.04em" }}>CANCEL</button>
          <button type="button" onClick={()=>{onLog(habit.id,qty,mode);onClose();}} className="btn-reset"
            style={{ flex:1,padding:"12px",borderRadius:"12px",background:habit.color,color:"#111",fontWeight:800,fontSize:"13px",boxShadow:`0 4px 16px ${habit.color}44`,letterSpacing:"0.04em" }}>OK</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Calendar modal ───────────────────────────────────────────────────────────
function CalendarModal({ habit, onClose }) {
  const today   = localTodayYMD();
  const [view,  setView]  = useState(() => new Date());
  const year    = view.getFullYear();
  const month   = view.getMonth();
  const grid    = getMonthGrid(year, month);
  const doneSet = new Set(habit?.completedDates||[]);
  const start   = habit?.startDate || habit?.createdAt?.slice(0,10) || today;
  if (!habit) return null;

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9100,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
        transition={{type:"spring",stiffness:380,damping:28}}
        style={{ background:"var(--surface-raised)",borderRadius:"20px",padding:"18px",width:"100%",maxWidth:"340px",border:"1px solid var(--border-strong)" }}>

        {/* header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            <HabitIconTile iconKey={habit.icon||"default"} color={habit.color} size={34}/>
            <div>
              <div style={{ fontSize:"14px",fontWeight:700,color:"var(--text-primary)" }}>{habit.name}</div>
              <div style={{ fontSize:"11px",color:habit.color,fontWeight:600 }}>{scheduleLabel(habit)}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-reset"
            style={{ width:"28px",height:"28px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px" }}>×</button>
        </div>

        {/* month nav */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
          <button type="button" onClick={()=>setView(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} className="btn-reset"
            style={{ width:"30px",height:"30px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-primary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px" }}>‹</button>
          <span style={{ fontSize:"13px",fontWeight:700,color:"var(--text-primary)" }}>{MONTH_NAMES[month]} {year}</span>
          <button type="button" onClick={()=>setView(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} className="btn-reset"
            style={{ width:"30px",height:"30px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-primary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px" }}>›</button>
        </div>

        {/* weekday row */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:"4px" }}>
          {["S","M","T","W","T","F","S"].map((d,i)=>(
            <div key={i} style={{ textAlign:"center",fontSize:"10px",fontWeight:700,color:"var(--text-muted)",padding:"3px 0" }}>{d}</div>
          ))}
        </div>

        {/* days */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px" }}>
          {grid.map((day,i) => {
            if (!day) return <div key={`e-${i}`}/>;
            const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const done = doneSet.has(ds), isToday=ds===today, future=ds>today, before=ds<start;
            return (
              <div key={ds} style={{
                aspectRatio:"1",borderRadius:"7px",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"11px",fontWeight:done||isToday?800:400,
                background: done?habit.color:isToday?`${habit.color}20`:"transparent",
                color: done?"#000":future||before?"var(--text-tertiary)":isToday?habit.color:"var(--text-secondary)",
                border:isToday&&!done?`1.5px solid ${habit.color}66`:"none",
                opacity:future||before?0.3:1,
              }}>{day}</div>
            );
          })}
        </div>

        <div style={{ display:"flex",gap:"10px",marginTop:"12px",paddingTop:"10px",borderTop:"1px solid var(--border)" }}>
          {[{color:habit.color,label:"Done"},{color:"var(--border-strong)",label:"Missed"}].map(l=>(
            <div key={l.label} style={{ display:"flex",alignItems:"center",gap:"5px",fontSize:"11px",color:"var(--text-muted)" }}>
              <div style={{ width:"9px",height:"9px",borderRadius:"3px",background:l.color }}/>
              {l.label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Statistics modal ─────────────────────────────────────────────────────────
function StatsModal({ habit, onClose }) {
  const today   = localTodayYMD();
  if (!habit) return null;
  const doneSet   = new Set(habit.completedDates||[]);
  const start     = habit.startDate || habit.createdAt?.slice(0,10) || today;
  const totalDone = (habit.completedDates||[]).length;
  const streak    = habit.streak ?? 0;

  // best streak
  let best=0, cur=0;
  const sorted = [...(habit.completedDates||[])].sort();
  sorted.forEach((d,i) => {
    if (i===0) { cur=1; }
    else { cur = d===addDaysToYMD(sorted[i-1],1)?cur+1:1; }
    if (cur>best) best=cur;
  });

  // 30 day window
  const days30 = [];
  for (let i=29;i>=0;i--) days30.push(addDaysToYMD(today,-i));
  const active30 = days30.filter(d=>d>=start);
  const done30   = active30.filter(d=>doneSet.has(d)).length;
  const pct30    = active30.length>0?Math.round((done30/active30.length)*100):0;

  const sc = statusColor(pct30);

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9100,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
        transition={{type:"spring",stiffness:380,damping:28}}
        style={{ background:"var(--surface-raised)",borderRadius:"20px",padding:"18px",width:"100%",maxWidth:"340px",border:"1px solid var(--border-strong)" }}>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            <HabitIconTile iconKey={habit.icon||"default"} color={habit.color} size={34}/>
            <div>
              <div style={{ fontSize:"14px",fontWeight:700,color:"var(--text-primary)" }}>{habit.name}</div>
              <div style={{ fontSize:"11px",color:"var(--text-muted)" }}>Since {start}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-reset"
            style={{ width:"28px",height:"28px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px" }}>×</button>
        </div>

        {/* score ring */}
        <div style={{ display:"flex",justifyContent:"center",marginBottom:"16px" }}>
          <div style={{ position:"relative",width:"90px",height:"90px" }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="36" fill="none" stroke="var(--surface-elevated)" strokeWidth="8"/>
              <circle cx="45" cy="45" r="36" fill="none"
                stroke={sc} strokeWidth="8"
                strokeDasharray={`${2*Math.PI*36}`}
                strokeDashoffset={`${2*Math.PI*36*(1-pct30/100)}`}
                strokeLinecap="round" transform="rotate(-90 45 45)"
                style={{ transition:"stroke-dashoffset 600ms ease" }}/>
            </svg>
            <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
              <div style={{ fontSize:"20px",fontWeight:900,color:sc,fontFamily:"var(--font-heading)",lineHeight:1 }}>{pct30}</div>
              <div style={{ fontSize:"9px",color:"var(--text-muted)",fontWeight:600 }}>SCORE</div>
            </div>
          </div>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px" }}>
          {[
            { label:"Current streak", value:`${streak}d`,  icon:"🔥", color:"#F5A623" },
            { label:"Best streak",    value:`${best}d`,    icon:"🏆", color:"#EAB308"  },
            { label:"Total logged",   value:totalDone,     icon:"✅", color:"#3DD68C"  },
            { label:"This month",     value:`${pct30}%`,   icon:"📊", color:habit.color },
          ].map(s=>(
            <div key={s.label} style={{ background:"var(--surface)",borderRadius:"12px",padding:"12px",border:`1px solid ${s.color}20` }}>
              <div style={{ fontSize:"18px",marginBottom:"4px" }}>{s.icon}</div>
              <div style={{ fontSize:"20px",fontWeight:900,color:s.color,fontFamily:"var(--font-heading)",lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"10px",color:"var(--text-muted)",marginTop:"2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 30 day bar */}
        <div>
          <div style={{ fontSize:"10px",fontWeight:700,color:"var(--text-muted)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:"6px" }}>Last 30 days</div>
          <div style={{ display:"flex",gap:"2px",alignItems:"flex-end",height:"36px" }}>
            {days30.map(d=>{
              const done=doneSet.has(d), before=d<start;
              return <div key={d} style={{ flex:1,height:done?"100%":before?"12%":"28%",borderRadius:"2px 2px 0 0",background:done?habit.color:before?"var(--border)":"var(--surface-elevated)",opacity:before?0.3:1 }}/>;
            })}
          </div>
        </div>

        <button type="button" onClick={onClose} className="btn-primary" style={{ width:"100%",marginTop:"14px",height:"44px",fontSize:"13px" }}>Close</button>
      </motion.div>
    </div>
  );
}

// ─── Action sheet ─────────────────────────────────────────────────────────────
function ActionSheet({ habit, onClose, onEdit, onDelete, onCalendar, onStats }) {
  if (!habit) return null;
  const actions = [
    { icon:<IconCalendar size={18} stroke="var(--text-secondary)"/>,  label:"Calendar",   fn:()=>{onCalendar(habit);onClose();} },
    { icon:<IconBarChart  size={18} stroke="var(--text-secondary)"/>,  label:"Statistics", fn:()=>{onStats(habit);onClose();} },
    { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, label:"Edit", fn:()=>{onEdit(habit);onClose();} },
    { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>, label:"Archive", fn:()=>{toast("Archive coming soon");onClose();} },
    { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>, label:"Delete", fn:()=>{onDelete(habit.id);onClose();}, danger:true },
  ];

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <motion.div onClick={e=>e.stopPropagation()}
        initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}}
        transition={{type:"spring",stiffness:340,damping:30}}
        style={{ width:"100%",maxWidth:"440px",background:"var(--surface-raised)",borderRadius:"20px 20px 0 0",padding:"12px 0 44px",border:"1px solid var(--border-strong)",borderBottom:"none" }}>

        <div style={{ width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"0 auto 10px" }}/>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px 10px" }}>
          <div>
            <div style={{ fontSize:"16px",fontWeight:700,color:"var(--text-primary)" }}>{habit.name}</div>
            <div style={{ fontSize:"11px",color:habit.color,fontWeight:600,marginTop:"2px" }}>{scheduleLabel(habit)}</div>
          </div>
          <HabitIconTile iconKey={habit.icon||"default"} color={habit.color} size={36}/>
        </div>

        <div style={{ height:"1px",background:"var(--border)",marginBottom:"2px" }}/>

        {actions.map(a=>(
          <button key={a.label} type="button" onClick={a.fn} className="btn-reset"
            style={{ width:"100%",padding:"13px 18px",display:"flex",alignItems:"center",gap:"14px",color:a.danger?"var(--danger)":"var(--text-primary)",fontSize:"14px",fontWeight:500,background:"transparent" }}>
            <span style={{ width:"22px",display:"flex",alignItems:"center",justifyContent:"center" }}>{a.icon}</span>
            {a.label}
            <span style={{ marginLeft:"auto",color:"var(--text-muted)",fontSize:"16px" }}>›</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Confirm delete ───────────────────────────────────────────────────────────
function ConfirmDelete({ habit, onCancel, onConfirm }) {
  if (!habit) return null;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:9200,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
      <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.88,opacity:0}}
        style={{ background:"var(--surface-raised)",borderRadius:"18px",padding:"22px",maxWidth:"300px",width:"100%",border:"1px solid var(--border-strong)",textAlign:"center" }}>
        <div style={{ fontSize:"30px",marginBottom:"8px" }}>🗑️</div>
        <div style={{ fontSize:"15px",fontWeight:700,color:"var(--text-primary)",marginBottom:"6px" }}>Delete "{habit.name}"?</div>
        <div style={{ fontSize:"12px",color:"var(--text-muted)",marginBottom:"18px",lineHeight:1.5 }}>All logs and streak data will be permanently deleted.</div>
        <div style={{ display:"flex",gap:"8px" }}>
          <button type="button" onClick={onCancel} className="glass-tile" style={{ flex:1,borderRadius:"12px",padding:"10px",color:"var(--text-primary)",fontWeight:600,fontSize:"13px" }}>Cancel</button>
          <button type="button" onClick={onConfirm} className="btn-reset"
            style={{ flex:1,borderRadius:"12px",padding:"10px",background:"var(--danger)",color:"#fff",fontWeight:700,fontSize:"13px",boxShadow:"0 4px 14px rgba(255,92,106,0.4)" }}>Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Habit Card ────────────────────────────────────────────────────────────────
function HabitCard({ habit, onToggle, onDelete, onEdit, onOpenQty, onOpenAction, onCalendar, onStats }) {
  const today      = localTodayYMD();
  const startDate  = habit.startDate || habit.createdAt?.slice(0,10) || today;
  const doneSet    = new Set(habit.completedDates||[]);
  const doneToday  = doneSet.has(today);
  const window7    = useMemo(()=>getLast7(today),[today]);
  const activeDays = window7.filter(d=>d>=startDate&&d<=today);
  const doneInWin  = activeDays.filter(d=>doneSet.has(d)).length;
  const pct        = activeDays.length>0?Math.round((doneInWin/activeDays.length)*100):0;
  const streak     = habit.streak??0;
  const sc         = statusColor(pct);

  return (
    <motion.div layout
      initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.97}}
      className="glass-panel"
      style={{ borderRadius:"16px",padding:"14px",marginBottom:"8px",position:"relative",overflow:"hidden",borderLeft:`3px solid ${sc}` }}>

      {/* header row */}
      <div style={{ display:"flex",gap:"12px",alignItems:"flex-start",marginBottom:"12px" }}>
        <HabitIconTile iconKey={habit.icon||"default"} color={habit.color} size={44}/>

        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:"15px",marginBottom:"4px" }}>
            <PremiumCompleteTitle complete={doneToday} lineColor={sc}>
              {habit.name}
            </PremiumCompleteTitle>
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:"5px",alignItems:"center" }}>
            <span style={{ fontSize:"10px",fontWeight:700,color:habit.color,background:`${habit.color}18`,padding:"1px 7px",borderRadius:"999px",border:`1px solid ${habit.color}28` }}>
              {scheduleLabel(habit)}
            </span>
            {streak>0&&(
              <span style={{ fontSize:"10px",fontWeight:700,display:"inline-flex",alignItems:"center",gap:"2px",color:"#F5A623",background:"rgba(245,166,35,0.12)",padding:"1px 6px 1px 5px",borderRadius:"999px",border:"1px solid rgba(245,166,35,0.22)" }}>
                <IconFlame size={10} fill="#F5A623"/> {streak}
              </span>
            )}
          </div>
        </div>

        {/* log btn */}
        <motion.button type="button" whileTap={{scale:0.88}}
          onClick={()=>habit.goalMaxPerDay?onOpenQty(habit):onToggle(habit.id,today)}
          className="btn-reset" aria-label="Log today"
          style={{
            width:"40px",height:"40px",borderRadius:"12px",flexShrink:0,
            background:doneToday?`${sc}20`:`linear-gradient(145deg,${habit.color},${habit.color}cc)`,
            color:doneToday?sc:"#111",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:doneToday?`inset 0 0 0 1.5px ${sc}55`:`0 4px 14px ${habit.color}44`,
            border:doneToday?`1.5px solid ${sc}44`:"1px solid rgba(255,255,255,0.2)",
          }}>
          {doneToday
            ?<motion.svg initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:500,damping:20}} width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></motion.svg>
            :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          }
        </motion.button>
      </div>

      {/* 7-day row */}
      <div style={{ display:"flex",gap:"3px",justifyContent:"space-between",marginBottom:"10px" }}>
        {window7.map(dateStr=>{
          const isFuture=dateStr>today, before=dateStr<startDate;
          const isDone=doneSet.has(dateStr), isToday=dateStr===today;
          const locked=isFuture||before;
          const dayN=new Date(`${dateStr}T00:00:00`).getDate();
          const dayL=WEEKDAY_SHORT[new Date(`${dateStr}T00:00:00`).getDay()];
          return (
            <div key={dateStr} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",flex:1 }}>
              <span style={{ fontSize:"9px",fontWeight:isToday?800:400,color:isToday?habit.color:"var(--text-muted)" }}>{dayL}</span>
              <motion.button type="button" whileTap={!locked?{scale:0.85}:{}}
                onClick={()=>!locked&&onToggle(habit.id,dateStr)}
                disabled={locked} className="btn-reset"
                style={{
                  width:"28px",height:"28px",borderRadius:"8px",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:locked?"not-allowed":"pointer",
                  fontSize:"10px",fontWeight:isDone||isToday?700:400,
                  background:isDone?habit.color:locked?"transparent":isToday?`${habit.color}12`:"var(--surface-raised)",
                  border:locked?"1px solid var(--border)":isDone?"none":isToday?`1.5px solid ${habit.color}55`:"1px solid var(--border)",
                  color:isDone?"#000":locked?"var(--text-tertiary)":isToday?habit.color:"var(--text-secondary)",
                  boxShadow:isDone?`0 0 0 2px ${habit.color}18`:"none",
                }}>
                {isFuture?<LockIcon/>:before?<span style={{opacity:.25}}>–</span>:dayN}
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:"8px",borderTop:"1px solid var(--border)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
          {/* chain */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span style={{ fontSize:"12px",fontWeight:700,color:"var(--text-secondary)" }}>{streak}</span>
          <span style={{ color:"var(--border-strong)",fontSize:"11px" }}>·</span>
          {/* check */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>
          </svg>
          <span style={{ fontSize:"12px",fontWeight:700,color:sc }}>{pct}%</span>
        </div>

        <div style={{ display:"flex",gap:"5px",alignItems:"center" }}>
          {[
            {fn:()=>onCalendar(habit),icon:<IconCalendar size={12} stroke="currentColor"/>,title:"Calendar"},
            {fn:()=>onStats(habit),   icon:<IconBarChart  size={12} stroke="currentColor"/>,title:"Statistics"},
            {fn:()=>onOpenAction(habit),icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,title:"More"},
          ].map(b=>(
            <motion.button key={b.title} type="button" whileTap={{scale:0.88}} onClick={b.fn} title={b.title} className="btn-reset"
              style={{ width:"28px",height:"28px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              {b.icon}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Habits() {
  const { accent } = useTheme();
  const { habits, loading, addHabit, toggleHabit, deleteHabit, updateHabit } = useHabits();

  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [qtyHabit,    setQtyHabit]    = useState(null);
  const [actionHabit, setActionHabit] = useState(null);
  const [calHabit,    setCalHabit]    = useState(null);
  const [statsHabit,  setStatsHabit]  = useState(null);
  const [delHabit,    setDelHabit]    = useState(null);

  // form
  const [fName,      setFName]      = useState("");
  const [fIcon,      setFIcon]      = useState("default");
  const [fColor,     setFColor]     = useState(accent);
  const [fFreq,      setFFreq]      = useState("daily");
  const [fRecurDays, setFRecurDays] = useState("1,2,3,4,5");
  const [fEveryN,    setFEveryN]    = useState(2);
  const [fTargetW,   setFTargetW]   = useState("");
  const [fMinMins,   setFMinMins]   = useState("");
  const [fMaxDay,    setFMaxDay]    = useState("");
  const [fUnit,      setFUnit]      = useState("times");
  const [fReminder,  setFReminder]  = useState(false);
  const [fRemTime,   setFRemTime]   = useState("09:00");
  const [showIcons,  setShowIcons]  = useState(false);

  const resetForm = useCallback(()=>{
    setFName(""); setFIcon("default"); setFColor(accent); setEditingId(null);
    setFFreq("daily"); setFRecurDays("1,2,3,4,5"); setFEveryN(2);
    setFTargetW(""); setFMinMins(""); setFMaxDay(""); setFUnit("times");
    setFReminder(false); setFRemTime("09:00"); setShowIcons(false);
  },[accent]);

  const openCreate = useCallback(()=>{ resetForm(); setShowForm(true); },[resetForm]);

  const openEdit = useCallback((h)=>{
    setEditingId(h.id); setFName(h.name); setFIcon(h.icon||"default"); setFColor(h.color||accent);
    setFFreq(h.frequency||"daily");
    setFRecurDays((h.recurringDays||[]).length?h.recurringDays.join(","):"1,2,3,4,5");
    setFEveryN(h.everyNDays??2);
    setFTargetW(h.targetTimesPerWeek!=null?String(h.targetTimesPerWeek):"");
    setFMinMins(h.goalMinMinutes!=null?String(h.goalMinMinutes):"");
    setFMaxDay(h.goalMaxPerDay!=null?String(h.goalMaxPerDay):"");
    setFUnit(h.unit||"times");
    setFReminder(!!h.reminderEnabled);
    const rt=h.reminderTime; setFRemTime(typeof rt==="string"&&rt.length>=5?rt.slice(0,5):"09:00");
    setShowIcons(false); setShowForm(true);
  },[accent]);

  const closeForm = useCallback(()=>{ setShowForm(false); resetForm(); },[resetForm]);

  const buildPayload = useCallback(()=>({
    name:fName.trim(), icon:fIcon, color:fColor, frequency:fFreq,
    recurringDays:fFreq==="weekly"?fRecurDays.split(/[,\s]+/).map(x=>parseInt(x,10)).filter(n=>!isNaN(n)&&n>=0&&n<=6):[],
    everyNDays:fFreq==="interval"?Math.max(1,Number(fEveryN)||2):null,
    targetTimesPerWeek:fTargetW?Math.min(7,Math.max(1,Number(fTargetW))):null,
    goalMinMinutes:fMinMins===""?null:Math.max(0,Number(fMinMins)||0),
    goalMaxPerDay:fMaxDay===""?null:Math.max(0,Number(fMaxDay)||0),
    unit:fUnit.trim()||"times",
    reminderEnabled:fReminder, reminderTime:fReminder?fRemTime:null,
  }),[fColor,fEveryN,fFreq,fMaxDay,fMinMins,fIcon,fName,fRecurDays,fReminder,fRemTime,fTargetW,fUnit]);

  const handleSave = useCallback(async()=>{
    if(!fName.trim()){toast.error("Enter a habit name");return;}
    const p=buildPayload();
    if(editingId){await updateHabit(editingId,p);toast.success("Habit updated");}
    else{await addHabit({...p,startDate:localTodayYMD()});toast.success("Habit created");}
    closeForm();
  },[addHabit,buildPayload,editingId,closeForm,updateHabit,fName]);

  const handleQtyLog = useCallback((id,qty,mode)=>{
    const today=localTodayYMD();
    const h=habits.find(h=>h.id===id); if(!h)return;
    const done=(h.completedDates||[]).includes(today);
    if(mode==="replace"){if(qty>0&&!done)toggleHabit(id,today);if(qty===0&&done)toggleHabit(id,today);}
    else if(!done)toggleHabit(id,today);
    toast.success(`${h.name} logged`);
  },[habits,toggleHabit]);

  const handleDelete = useCallback((id)=>{ deleteHabit(id); setDelHabit(null); toast.success("Deleted"); },[deleteHabit]);

  const today     = localTodayYMD();
  const doneToday = useMemo(()=>habits.filter(h=>(h.completedDates||[]).includes(today)).length,[habits,today]);
  const total     = habits.length;
  const R=16, CIRC=2*Math.PI*R;
  const dash=total>0?CIRC*(1-doneToday/total):CIRC;

  const IS = { width:"100%",padding:"10px 12px",borderRadius:"12px",border:"1px solid var(--border)",background:"var(--surface-raised)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"13px",outline:"none",boxSizing:"border-box" };
  const SL = { fontSize:"10px",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"6px" };

  return (
    <div style={{ maxWidth:"680px",margin:"0 auto",padding:"16px 14px 100px",color:"var(--text-body)" }}>

      {/* header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px" }}>
        <div>
          <h1 style={{ fontSize:"24px",fontFamily:"var(--font-heading)",letterSpacing:"-0.03em",marginBottom:"2px" }}>Habits</h1>
          <div style={{ color:"var(--text-muted)",fontSize:"12px" }}>{total} habits · {doneToday}/{total} done today</div>
        </div>
        {total>0&&(
          <svg width="46" height="46" viewBox="0 0 46 46" style={{flexShrink:0}}>
            <circle cx="23" cy="23" r={R} fill="none" stroke="var(--border-strong)" strokeWidth="3"/>
            <circle cx="23" cy="23" r={R} fill="none" stroke={accent} strokeWidth="3"
              strokeDasharray={CIRC} strokeDashoffset={dash} strokeLinecap="round" transform="rotate(-90 23 23)"
              style={{transition:"stroke-dashoffset 600ms ease",filter:`drop-shadow(0 0 4px ${accent}66)`}}/>
            <text x="23" y="27.5" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="800" fontFamily="var(--font-heading)">{doneToday}/{total}</text>
          </svg>
        )}
      </div>

      {/* status legend */}
      <div style={{ display:"flex",gap:"12px",marginBottom:"14px" }}>
        {[{c:"#FF5A5F",l:"Not started"},{c:"#F5A623",l:"In progress"},{c:"#3DD68C",l:"Complete"}].map(s=>(
          <div key={s.l} style={{ display:"flex",alignItems:"center",gap:"5px",fontSize:"10px",fontWeight:600,color:"var(--text-muted)" }}>
            <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:s.c }}/>
            {s.l}
          </div>
        ))}
      </div>

      {/* list */}
      {loading?(
        <div style={{padding:"48px 0",textAlign:"center",color:"var(--text-muted)"}}>Loading…</div>
      ):habits.length===0?(
        <div className="glass-panel" style={{borderRadius:"16px",padding:"40px 20px",textAlign:"center",border:"1px dashed var(--border-strong)"}}>
          <div style={{fontSize:"36px",marginBottom:"10px"}}>🌱</div>
          <div style={{color:"var(--text-muted)",marginBottom:"16px",fontSize:"13px"}}>No habits yet. Build your first one.</div>
          <button type="button" onClick={openCreate} className="btn-primary" style={{padding:"0 20px",height:"42px",fontSize:"13px"}}>Add habit</button>
        </div>
      ):(
        <AnimatePresence>
          {habits.map(h=>(
            <HabitCard key={h.id} habit={h}
              onToggle={toggleHabit}
              onDelete={id=>setDelHabit(habits.find(h=>h.id===id))}
              onEdit={openEdit}
              onOpenQty={setQtyHabit}
              onOpenAction={setActionHabit}
              onCalendar={setCalHabit}
              onStats={setStatsHabit}
            />
          ))}
        </AnimatePresence>
      )}

      {/* FAB */}
      <motion.button type="button" whileTap={{scale:0.9}} onClick={openCreate} className="btn-reset" aria-label="New habit"
        style={{position:"fixed",right:"16px",bottom:"calc(var(--mobile-nav-height) + 24px)",width:"54px",height:"54px",borderRadius:"16px",background:`linear-gradient(145deg,var(--accent-hover),var(--accent))`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${accent}55`,border:"1px solid rgba(255,255,255,0.2)"}}>
        <IconPlus size={22} stroke="#fff"/>
      </motion.button>

      {/* Sheets */}
      <AnimatePresence>
        {qtyHabit    && <QuantitySheet habit={qtyHabit} onClose={()=>setQtyHabit(null)} onLog={handleQtyLog}/>}
        {actionHabit && <ActionSheet  habit={actionHabit} onClose={()=>setActionHabit(null)} onEdit={openEdit} onDelete={id=>setDelHabit(habits.find(h=>h.id===id))} onCalendar={setCalHabit} onStats={setStatsHabit}/>}
        {calHabit    && <CalendarModal   habit={calHabit}   onClose={()=>setCalHabit(null)}/>}
        {statsHabit  && <StatsModal      habit={statsHabit} onClose={()=>setStatsHabit(null)}/>}
        {delHabit    && <ConfirmDelete   habit={delHabit}   onCancel={()=>setDelHabit(null)} onConfirm={()=>handleDelete(delHabit.id)}/>}
      </AnimatePresence>

      {/* Create / Edit modal */}
      <CenteredModal isOpen={showForm} onClose={closeForm} title={editingId?"Edit habit":"New habit"} maxWidth="440px">
        <div style={{display:"grid",gap:"14px"}}>

          <div>
            <div style={SL}>Habit name</div>
            <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Drink water" style={IS} autoFocus/>
          </div>

          {/* icon + color */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <div>
              <div style={SL}>Icon</div>
              <button type="button" onClick={()=>setShowIcons(v=>!v)} className="glass-tile"
                style={{width:"100%",padding:"9px 12px",borderRadius:"12px",display:"flex",alignItems:"center",gap:"8px",color:"var(--text-primary)",fontWeight:600,fontSize:"12px"}}>
                <div style={{width:"20px",height:"20px",color:fColor}}>{HABIT_ICONS[fIcon]?.(fColor)}</div>
                {showIcons?"Collapse":"Pick icon"}
              </button>
            </div>
            <div>
              <div style={SL}>Color</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px",paddingTop:"3px"}}>
                {COLOR_OPTIONS.slice(0,8).map(c=>(
                  <button key={c} type="button" onClick={()=>setFColor(c)} className="btn-reset"
                    style={{width:"24px",height:"24px",borderRadius:"50%",background:c,boxShadow:fColor===c?`0 0 0 2px var(--bg),0 0 0 3.5px ${c}`:"none"}}/>
                ))}
              </div>
            </div>
          </div>

          {showIcons && <IconPickerGrid value={fIcon} onChange={v=>{setFIcon(v);setShowIcons(false);}} color={fColor}/>}

          <div className="glass-tile" style={{borderRadius:"14px",padding:"12px",border:"1px solid var(--border)",display:"grid",gap:"10px"}}>
            <div style={SL}>Schedule</div>
            <CustomSelect value={fFreq} onChange={setFFreq} options={FREQ_OPTIONS}/>
            {fFreq==="weekly"&&(
              <div>
                <div style={{...SL,marginBottom:"4px"}}>Days (0=Sun…6=Sat)</div>
                <input value={fRecurDays} onChange={e=>setFRecurDays(e.target.value)} placeholder="1,2,3,4,5" style={{...IS,fontSize:"12px"}}/>
              </div>
            )}
            {fFreq==="interval"&&(
              <label style={{display:"grid",gap:"4px"}}>
                <span style={{fontSize:"11px",fontWeight:600,color:"var(--text-muted)"}}>Every N days</span>
                <input type="number" min={1} value={fEveryN} onChange={e=>setFEveryN(Math.max(1,Number(e.target.value)||1))} style={{...IS,fontSize:"12px"}}/>
              </label>
            )}
            <label style={{display:"grid",gap:"4px"}}>
              <span style={{fontSize:"11px",fontWeight:600,color:"var(--text-muted)"}}>Target / week (optional)</span>
              <input value={fTargetW} onChange={e=>setFTargetW(e.target.value)} placeholder="e.g. 5" style={{...IS,fontSize:"12px"}}/>
            </label>
          </div>

          <div className="glass-tile" style={{borderRadius:"14px",padding:"12px",border:"1px solid var(--border)",display:"grid",gap:"10px"}}>
            <div style={SL}>Goals &amp; unit</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              <label style={{display:"grid",gap:"4px"}}>
                <span style={{fontSize:"10px",fontWeight:600,color:"var(--text-muted)"}}>Min minutes</span>
                <input value={fMinMins} onChange={e=>setFMinMins(e.target.value)} placeholder="—" inputMode="numeric" style={{...IS,fontSize:"12px"}}/>
              </label>
              <label style={{display:"grid",gap:"4px"}}>
                <span style={{fontSize:"10px",fontWeight:600,color:"var(--text-muted)"}}>Max per day</span>
                <input value={fMaxDay} onChange={e=>setFMaxDay(e.target.value)} placeholder="—" inputMode="numeric" style={{...IS,fontSize:"12px"}}/>
              </label>
            </div>
            <label style={{display:"grid",gap:"4px"}}>
              <span style={{fontSize:"10px",fontWeight:600,color:"var(--text-muted)"}}>Unit (glasses, km, pages…)</span>
              <input value={fUnit} onChange={e=>setFUnit(e.target.value)} placeholder="times" style={{...IS,fontSize:"12px"}}/>
            </label>
          </div>

          <div className="glass-tile" style={{borderRadius:"14px",padding:"12px",border:"1px solid var(--border)",display:"grid",gap:"8px"}}>
            <label style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}}>
              <input type="checkbox" checked={fReminder} onChange={e=>setFReminder(e.target.checked)}/>
              <span style={{fontSize:"13px",fontWeight:600}}>Daily reminder</span>
            </label>
            {fReminder&&<input type="time" value={fRemTime} onChange={e=>setFRemTime(e.target.value)} style={{...IS,fontSize:"12px"}}/>}
          </div>

          <div style={{display:"flex",gap:"8px"}}>
            <button type="button" onClick={closeForm} className="glass-tile" style={{flex:1,borderRadius:"12px",padding:"10px",color:"var(--text-primary)",fontWeight:600,fontSize:"13px"}}>Cancel</button>
            <button type="button" onClick={handleSave} className="btn-primary" style={{flex:2,height:"44px",fontSize:"13px"}}>{editingId?"Save changes":"Create habit"}</button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}