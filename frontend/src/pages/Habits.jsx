/**
 * Habits.jsx — HabitsNow-inspired design
 * Features:
 *  - startDate tracking: new habits only show from creation day forward
 *  - Future dates locked (lock icon, disabled)
 *  - Pre-startDate days greyed out (–)
 *  - Quantity log bottom-sheet modal (Replace / Add toggle, unit label)
 *  - Stats: streak, completion %, progress bar
 *  - Header completion ring
 *  - Full create/edit modal
 */

import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import {
  IconFlame,
  IconPlus,
  IconTrash,
  PremiumCompleteTitle,
  PremiumIconButton,
} from "../components/PremiumChrome";
import { PremiumHabitTile } from "../components/PremiumMarks";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { addDaysToYMD, formatLocalYMD, localTodayYMD } from "../utils/date";

// ─── constants ────────────────────────────────────────────────────────────────
const EMOJI_PRESETS = [
  "💧","📚","🏃","🎯","🧘","✍️","💪","🥗","🌙","☕",
  "🔥","💯","🎉","🌟","⚡","🎵","📖","🍎","💤","🚶",
  "🧠","💻","🎨","🌅","❤️","🌿","🧴","🦷","💊","🚰",
  "🎮","📝","📅","⏰","🧹","🛁","🍳","🥛","🏋️","🚴",
  "☀️","🌈","🦋","🐝","🌸","⚽","🎸","📱","✨","🌱",
];
const COLOR_OPTIONS = [
  "#94D82D","#FFB020","#E84A8A","#5CC5D4","#FF7A59","#8A6CFF",
  "#FF6B6B","#4ECDC4","#45B7D1","#96CEB4",
];
const WEEKDAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const FREQ_OPTIONS = [
  { value: "daily",    label: "Every day" },
  { value: "weekly",   label: "Weekly (pick days)" },
  { value: "interval", label: "Every N days" },
  { value: "monthly",  label: "Monthly" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function scheduleLabel(h) {
  const f = h.frequency || "daily";
  const days = h.recurringDays || [];
  if (f === "interval" && h.everyNDays) return `Every ${h.everyNDays} days`;
  if (f === "weekly" && days.length) {
    return `${[...days].sort((a,b)=>a-b).map(d=>WEEKDAY_SHORT[d]).join(", ")}`;
  }
  if (h.targetTimesPerWeek >= 1) return `${h.targetTimesPerWeek}× / week`;
  if (f === "monthly") return "Monthly";
  return "Every day";
}

function getLast7(today) {
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDaysToYMD(today, -i));
  return days;
}

// ─── sub-components ───────────────────────────────────────────────────────────

/** Compact emoji grid inside modal */
const EmojiGrid = memo(function EmojiGrid({ value, onChange }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", maxHeight:"130px", overflowY:"auto", padding:"2px 0" }}>
      {EMOJI_PRESETS.map((em, i) => (
        <button
          key={`${em}-${i}`}
          type="button"
          onClick={() => onChange(em)}
          className="btn-reset"
          style={{
            width:"36px", height:"36px", borderRadius:"10px", fontSize:"17px",
            background: em === value ? "var(--accent-subtle)" : "var(--surface-raised)",
            border: `1px solid ${em === value ? "var(--accent)" : "var(--border)"}`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >{em}</button>
      ))}
    </div>
  );
});

/** Lock SVG */
function LockIcon() {
  return (
    <svg width="10" height="11" viewBox="0 0 24 26" fill="currentColor">
      <rect x="4" y="12" width="16" height="12" rx="2.5"/>
      <path d="M8 12V8a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

/** Quantity bottom-sheet */
function QuantitySheet({ habit, onClose, onLog }) {
  const today = localTodayYMD();
  const existing = useMemo(
    () => (habit?.completedDates || []).filter(d => d === today).length,
    [habit, today]
  );
  const [qty, setQty] = useState(existing || 0);
  const [mode, setMode] = useState("replace");

  useEffect(() => { setQty(existing || 0); }, [existing]);

  if (!habit) return null;
  const max = habit.goalMaxPerDay || null;
  const unit = habit.unit || "times";
  const displayed = mode === "add" ? existing + qty : qty;
  const todayDisplay = `${today.slice(8,10)}/${today.slice(5,7)}/${today.slice(0,4)}`;

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:9000,
        background:"rgba(0,0,0,0.65)", backdropFilter:"blur(6px)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ y:100, opacity:0 }}
        animate={{ y:0, opacity:1 }}
        exit={{ y:100, opacity:0 }}
        transition={{ type:"spring", stiffness:340, damping:30 }}
        style={{
          width:"100%", maxWidth:"440px",
          background:"var(--surface-raised)",
          borderRadius:"24px 24px 0 0",
          padding:"20px 18px 40px",
          border:"1px solid var(--border-strong)",
          borderBottom:"none",
        }}
      >
        {/* drag handle */}
        <div style={{ width:"40px", height:"4px", borderRadius:"999px", background:"var(--border-strong)", margin:"0 auto 18px" }} />

        {/* header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"18px" }}>
          <div>
            <div style={{ fontSize:"17px", fontWeight:700, color:"var(--text-primary)" }}>{habit.name}</div>
            <div style={{
              display:"inline-block", marginTop:"5px",
              background:`${habit.color}22`, color:habit.color,
              fontSize:"11px", fontWeight:700, padding:"2px 9px",
              borderRadius:"999px", border:`1px solid ${habit.color}44`,
            }}>{today.slice(8,10)}/{today.slice(5,7)}/{today.slice(0,4)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-reset"
            style={{
              width:"32px", height:"32px", borderRadius:"10px",
              background:`${habit.color}cc`, color:"#111",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"16px", fontWeight:700,
            }}
          >
            {habit.icon}
          </button>
        </div>

        {/* stepper */}
        <div style={{
          background:"var(--surface)", borderRadius:"16px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"6px", marginBottom:"10px",
          border:"1px solid var(--border)",
        }}>
          <button type="button" onClick={() => setQty(v => Math.max(0, v-1))} className="btn-reset"
            style={{ width:"52px", height:"52px", borderRadius:"12px", background:"var(--surface-elevated)", color:"var(--text-primary)", fontSize:"26px", fontWeight:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
            −
          </button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"44px", fontWeight:900, color:habit.color, fontFamily:"var(--font-heading)", lineHeight:1 }}>{qty}</div>
            {max && <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"1px" }}>of {max} {unit}</div>}
          </div>
          <button type="button" onClick={() => setQty(v => v+1)} className="btn-reset"
            style={{ width:"52px", height:"52px", borderRadius:"12px", background:habit.color, color:"#111", fontSize:"26px", fontWeight:300, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px ${habit.color}55` }}>
            +
          </button>
        </div>

        {/* replace / add */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"var(--surface)", borderRadius:"12px", padding:"3px", marginBottom:"10px", border:"1px solid var(--border)" }}>
          {["replace","add"].map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} className="btn-reset"
              style={{
                padding:"9px", borderRadius:"9px",
                background: mode===m ? `${habit.color}28` : "transparent",
                color: mode===m ? habit.color : "var(--text-muted)",
                fontWeight:700, fontSize:"13px",
                border: mode===m ? `1px solid ${habit.color}44` : "1px solid transparent",
                transition:"all 150ms",
              }}>
              {m.charAt(0).toUpperCase()+m.slice(1)}
            </button>
          ))}
        </div>

        {/* summary */}
        <div style={{ background:"var(--surface)", borderRadius:"12px", padding:"11px 16px", marginBottom:"18px", border:"1px solid var(--border)", textAlign:"center" }}>
          <div style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"2px" }}>Today</div>
          <div style={{ fontSize:"15px", fontWeight:700, color:"var(--text-primary)" }}>
            {displayed}{max ? ` / ${max}` : ""} {unit}
          </div>
        </div>

        {/* actions */}
        <div style={{ display:"flex", gap:"10px" }}>
          <button type="button" onClick={onClose} className="btn-reset"
            style={{ flex:1, padding:"13px", borderRadius:"14px", background:"var(--surface)", color:"var(--text-secondary)", fontWeight:700, fontSize:"13px", border:"1px solid var(--border)", letterSpacing:"0.04em" }}>
            CANCEL
          </button>
          <button type="button" onClick={() => { onLog(habit.id, qty, mode); onClose(); }} className="btn-reset"
            style={{ flex:1, padding:"13px", borderRadius:"14px", background:habit.color, color:"#111", fontWeight:800, fontSize:"13px", boxShadow:`0 4px 20px ${habit.color}55`, letterSpacing:"0.04em" }}>
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/** Action bottom-sheet (Calendar / Statistics / Edit / Archive / Delete) */
function ActionSheet({ habit, onClose, onEdit, onDelete }) {
  if (!habit) return null;
  const actions = [
    { icon:"📅", label:"Calendar",   action: () => { toast("Calendar view coming soon"); onClose(); } },
    { icon:"📊", label:"Statistics", action: () => { toast("Statistics coming soon"); onClose(); } },
    { icon:"✏️",  label:"Edit",       action: () => { onEdit(habit); onClose(); } },
    { icon:"🗃️", label:"Archive",    action: () => { toast("Archived"); onClose(); } },
    { icon:"🗑️", label:"Delete",     action: () => { onDelete(habit.id); onClose(); }, danger:true },
  ];

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ y:80, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:80, opacity:0 }}
        transition={{ type:"spring", stiffness:340, damping:30 }}
        style={{ width:"100%", maxWidth:"440px", background:"var(--surface-raised)", borderRadius:"24px 24px 0 0", padding:"16px 0 40px", border:"1px solid var(--border-strong)", borderBottom:"none" }}
      >
        <div style={{ width:"40px", height:"4px", borderRadius:"999px", background:"var(--border-strong)", margin:"0 auto 12px" }} />

        {/* habit header inside sheet */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 18px 14px" }}>
          <div>
            <div style={{ fontSize:"17px", fontWeight:700, color:"var(--text-primary)" }}>{habit.name}</div>
            <div style={{ fontSize:"12px", color:habit.color, fontWeight:600, marginTop:"3px" }}>{scheduleLabel(habit)}</div>
          </div>
          <div style={{ width:"38px", height:"38px", borderRadius:"12px", background:`${habit.color}cc`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>
            {habit.icon}
          </div>
        </div>

        <div style={{ borderTop:"1px solid var(--border)", marginBottom:"4px" }} />

        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.action} className="btn-reset"
            style={{ width:"100%", padding:"15px 20px", display:"flex", alignItems:"center", gap:"14px", color: a.danger ? "var(--danger)" : "var(--text-primary)", fontSize:"15px", fontWeight:600, background:"transparent", transition:"background 120ms" }}
          >
            <span style={{ fontSize:"20px", width:"26px", textAlign:"center" }}>{a.icon}</span>
            {a.label}
            <span style={{ marginLeft:"auto", color:"var(--text-muted)" }}>›</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ─── HabitCard ─────────────────────────────────────────────────────────────────
function HabitCard({ habit, onToggle, onDelete, onEdit, onOpenQty, onOpenAction }) {
  const today = localTodayYMD();
  const startDate = habit.startDate || habit.createdAt?.slice(0,10) || today;
  const doneSet = new Set(habit.completedDates || []);
  const completeToday = doneSet.has(today);

  const window7 = useMemo(() => getLast7(today), [today]);

  // Calculate stats only from startDate → today
  const activeDays = window7.filter(d => d >= startDate && d <= today);
  const doneInWindow = activeDays.filter(d => doneSet.has(d)).length;
  const pct = activeDays.length > 0 ? Math.round((doneInWindow / activeDays.length) * 100) : 0;
  const streak = habit.streak ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, scale:0.96 }}
      className="glass-panel"
      style={{ borderRadius:"20px", padding:"16px 16px 14px", marginBottom:"10px", position:"relative", overflow:"hidden" }}
    >
      {/* colored accent top bar */}
      <div style={{ position:"absolute", top:0, left:"16px", right:"16px", height:"2.5px", borderRadius:"0 0 3px 3px", background:habit.color, boxShadow:`0 0 10px ${habit.color}88` }} />

      {/* top row: tile + info + log-btn */}
      <div style={{ display:"flex", gap:"12px", alignItems:"flex-start", marginBottom:"13px" }}>
        <PremiumHabitTile emoji={habit.icon} color={habit.color} size={46} />

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"16px", marginBottom:"5px" }}>
            <PremiumCompleteTitle complete={completeToday} lineColor={habit.color}>
              {habit.name}
            </PremiumCompleteTitle>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", alignItems:"center" }}>
            {/* frequency pill */}
            <span style={{
              fontSize:"11px", fontWeight:700, color:habit.color,
              background:`${habit.color}1a`, padding:"2px 8px", borderRadius:"999px",
              border:`1px solid ${habit.color}30`,
            }}>
              {scheduleLabel(habit)}
            </span>
            {/* streak */}
            {streak > 0 && (
              <span style={{
                fontSize:"11px", fontWeight:800, display:"inline-flex", alignItems:"center", gap:"3px",
                color:"#ff9a3c", background:"rgba(255,154,60,0.12)", padding:"2px 7px 2px 5px",
                borderRadius:"999px", border:"1px solid rgba(255,154,60,0.22)",
              }}>
                <IconFlame size={11} fill="#ff9a3c"/> {streak}
              </span>
            )}
          </div>
        </div>

        {/* + / check log button */}
        <button
          type="button"
          onClick={() => habit.goalMaxPerDay ? onOpenQty(habit) : onToggle(habit.id, today)}
          className="btn-reset"
          aria-label="Log today"
          style={{
            width:"42px", height:"42px", borderRadius:"13px", flexShrink:0,
            background: completeToday ? `${habit.color}22` : `linear-gradient(145deg,${habit.color},${habit.color}cc)`,
            color: completeToday ? habit.color : "#111",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow: completeToday ? `inset 0 0 0 1.5px ${habit.color}66` : `0 4px 16px ${habit.color}55`,
            border: completeToday ? `1.5px solid ${habit.color}55` : "1px solid rgba(255,255,255,0.22)",
            transition:"all 180ms ease",
          }}
        >
          {completeToday
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <IconPlus size={20} stroke="currentColor"/>}
        </button>
      </div>

      {/* 7-day dot row */}
      <div style={{ display:"flex", gap:"4px", justifyContent:"space-between", marginBottom:"12px" }}>
        {window7.map((dateStr) => {
          const isFuture = dateStr > today;
          const beforeStart = dateStr < startDate;
          const isDone = doneSet.has(dateStr);
          const isToday = dateStr === today;
          const dayNum = new Date(`${dateStr}T00:00:00`).getDate();
          const dayLabel = WEEKDAY_SHORT[new Date(`${dateStr}T00:00:00`).getDay()];
          const locked = isFuture || beforeStart;

          return (
            <div key={dateStr} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", flex:1 }}>
              <span style={{
                fontSize:"9px", fontWeight: isToday ? 800 : 500,
                color: isToday ? habit.color : "var(--text-muted)",
                letterSpacing:"0.02em",
              }}>
                {dayLabel}
              </span>
              <button
                type="button"
                onClick={() => !locked && onToggle(habit.id, dateStr)}
                className="btn-reset"
                disabled={locked}
                title={isFuture ? "Future — locked" : beforeStart ? "Before habit started" : undefined}
                style={{
                  width:"30px", height:"30px", borderRadius:"9px",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor: locked ? "not-allowed" : "pointer",
                  transition:"all 140ms ease",
                  fontSize:"11px", fontWeight: isDone || isToday ? 800 : 500,
                  background: isDone
                    ? habit.color
                    : locked ? "rgba(255,255,255,0.02)" : isToday ? `${habit.color}14` : "var(--surface-raised)",
                  border: locked
                    ? "1px solid rgba(255,255,255,0.04)"
                    : isDone ? "none"
                    : isToday ? `1.5px solid ${habit.color}66` : "1px solid var(--border)",
                  color: isDone ? "#000" : locked ? "var(--text-tertiary)" : isToday ? habit.color : "var(--text-secondary)",
                  boxShadow: isDone ? `0 0 0 3px ${habit.color}1f` : "none",
                }}
              >
                {isFuture ? <LockIcon/> : beforeStart ? <span style={{ opacity:.3 }}>–</span> : dayNum}
              </button>
            </div>
          );
        })}
      </div>

      {/* footer: progress + stats + actions */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:"10px", borderTop:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {/* chain icon + streak */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={habit.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span style={{ fontSize:"12px", fontWeight:700, color:"var(--text-secondary)" }}>{streak}</span>

          {/* separator */}
          <span style={{ color:"var(--border-strong)", fontSize:"12px" }}>·</span>

          {/* pct */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={pct===100?"#59d68d":"var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12l3 3 5-6"/>
          </svg>
          <span style={{ fontSize:"12px", fontWeight:700, color: pct===100?"var(--success)":"var(--text-secondary)" }}>{pct}%</span>
        </div>

        {/* right: calendar / stats / more */}
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          <button type="button" onClick={() => toast("Calendar view coming soon")} className="btn-reset"
            style={{ width:"30px", height:"30px", borderRadius:"9px", background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <button type="button" onClick={() => toast("Statistics coming soon")} className="btn-reset"
            style={{ width:"30px", height:"30px", borderRadius:"9px", background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </button>
          <button type="button" onClick={() => onOpenAction(habit)} className="btn-reset"
            style={{ width:"30px", height:"30px", borderRadius:"9px", background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:700, letterSpacing:"0.06em" }}>
            ⋮
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function Habits() {
  const { accent } = useTheme();
  const { habits, loading, addHabit, toggleHabit, deleteHabit, updateHabit } = useHabits();

  // modals
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [qtyHabit, setQtyHabit]       = useState(null);
  const [actionHabit, setActionHabit] = useState(null);

  // form fields
  const [fName,        setFName]        = useState("");
  const [fIcon,        setFIcon]        = useState("💧");
  const [fColor,       setFColor]       = useState(accent);
  const [fFreq,        setFFreq]        = useState("daily");
  const [fRecurDays,   setFRecurDays]   = useState("1,2,3,4,5");
  const [fEveryN,      setFEveryN]      = useState(2);
  const [fTargetWeek,  setFTargetWeek]  = useState("");
  const [fMinMins,     setFMinMins]     = useState("");
  const [fMaxDay,      setFMaxDay]      = useState("");
  const [fUnit,        setFUnit]        = useState("times");
  const [fReminder,    setFReminder]    = useState(false);
  const [fRemTime,     setFRemTime]     = useState("09:00");
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [emojiReady,   setEmojiReady]   = useState(false);

  const resetForm = useCallback(() => {
    setFName(""); setFIcon("💧"); setFColor(accent); setEditingId(null);
    setFFreq("daily"); setFRecurDays("1,2,3,4,5"); setFEveryN(2);
    setFTargetWeek(""); setFMinMins(""); setFMaxDay(""); setFUnit("times");
    setFReminder(false); setFRemTime("09:00");
    setShowEmoji(false); setEmojiReady(false);
  }, [accent]);

  const openCreate = useCallback(() => { resetForm(); setShowForm(true); }, [resetForm]);

  const openEdit = useCallback((h) => {
    setEditingId(h.id); setFName(h.name); setFIcon(h.icon||"💧"); setFColor(h.color||accent);
    setFFreq(h.frequency||"daily");
    setFRecurDays((h.recurringDays||[]).length ? h.recurringDays.join(",") : "1,2,3,4,5");
    setFEveryN(h.everyNDays??2);
    setFTargetWeek(h.targetTimesPerWeek!=null?String(h.targetTimesPerWeek):"");
    setFMinMins(h.goalMinMinutes!=null?String(h.goalMinMinutes):"");
    setFMaxDay(h.goalMaxPerDay!=null?String(h.goalMaxPerDay):"");
    setFUnit(h.unit||"times");
    setFReminder(!!h.reminderEnabled);
    const rt=h.reminderTime; setFRemTime(typeof rt==="string"&&rt.length>=5?rt.slice(0,5):"09:00");
    setShowForm(true);
  }, [accent]);

  const closeForm = useCallback(() => { setShowForm(false); resetForm(); }, [resetForm]);

  useEffect(() => {
    if (!showForm) { setEmojiReady(false); return; }
    const t = setTimeout(() => setEmojiReady(true), 100);
    return () => clearTimeout(t);
  }, [showForm]);

  const buildPayload = useCallback(() => {
    const recurringDays = fFreq==="weekly"
      ? fRecurDays.split(/[,\s]+/).map(x=>parseInt(x,10)).filter(n=>!isNaN(n)&&n>=0&&n<=6)
      : [];
    return {
      name:fName.trim(), icon:fIcon, color:fColor, frequency:fFreq,
      recurringDays: fFreq==="weekly"?recurringDays:[],
      everyNDays: fFreq==="interval"?Math.max(1,Number(fEveryN)||2):null,
      targetTimesPerWeek: fTargetWeek?Math.min(7,Math.max(1,Number(fTargetWeek))):null,
      goalMinMinutes: fMinMins===""?null:Math.max(0,Number(fMinMins)||0),
      goalMaxPerDay:  fMaxDay===""?null:Math.max(0,Number(fMaxDay)||0),
      unit:fUnit.trim()||"times",
      reminderEnabled:fReminder,
      reminderTime:fReminder?fRemTime:null,
    };
  }, [fColor,fEveryN,fFreq,fMaxDay,fMinMins,fIcon,fName,fRecurDays,fReminder,fRemTime,fTargetWeek,fUnit]);

  const handleSave = useCallback(async () => {
    if (!fName.trim()) { toast.error("Enter a habit name"); return; }
    const payload = buildPayload();
    if (editingId) {
      await updateHabit(editingId, payload);
      toast.success("Habit updated");
    } else {
      await addHabit({ ...payload, startDate: localTodayYMD() });
      toast.success("Habit created");
    }
    closeForm();
  }, [addHabit, buildPayload, editingId, closeForm, updateHabit, fName]);

  const handleQtyLog = useCallback((id, qty, mode) => {
    const today = localTodayYMD();
    const h = habits.find(h => h.id===id);
    if (!h) return;
    const done = (h.completedDates||[]).includes(today);
    if (mode==="replace") {
      if (qty>0 && !done) toggleHabit(id, today);
      if (qty===0 && done) toggleHabit(id, today);
    } else if (!done) {
      toggleHabit(id, today);
    }
    toast.success(`${h.name} logged`);
  }, [habits, toggleHabit]);

  const today = localTodayYMD();
  const doneToday = useMemo(() => habits.filter(h => (h.completedDates||[]).includes(today)).length, [habits, today]);
  const total = habits.length;

  // completion ring
  const R = 17, CIRC = 2*Math.PI*R;
  const dash = total>0 ? CIRC*(1-doneToday/total) : CIRC;

  const sectionLabel = { fontSize:"11px", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"8px" };
  const inputStyle = { width:"100%", padding:"11px 13px", borderRadius:"13px", border:"1px solid var(--border)", background:"var(--surface-raised)", color:"var(--text-primary)", fontFamily:"var(--font-body)", fontSize:"14px", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ maxWidth:"720px", margin:"0 auto", padding:"20px 16px 100px", color:"var(--text-body)" }}>

      {/* ── header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
        <div>
          <h1 style={{ fontSize:"28px", fontFamily:"var(--font-heading)", letterSpacing:"-0.04em", marginBottom:"3px" }}>Habits</h1>
          <div style={{ color:"var(--text-muted)", fontSize:"13px" }}>
            {total} habits · {doneToday}/{total} done today
          </div>
        </div>

        {/* completion ring */}
        {total > 0 && (
          <svg width="50" height="50" viewBox="0 0 50 50" style={{ flexShrink:0 }}>
            <circle cx="25" cy="25" r={R} fill="none" stroke="var(--border-strong)" strokeWidth="3.5"/>
            <circle cx="25" cy="25" r={R} fill="none"
              stroke={accent} strokeWidth="3.5"
              strokeDasharray={CIRC} strokeDashoffset={dash}
              strokeLinecap="round" transform="rotate(-90 25 25)"
              style={{ transition:"stroke-dashoffset 600ms ease", filter:`drop-shadow(0 0 5px ${accent}88)` }}
            />
            <text x="25" y="30" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="800" fontFamily="var(--font-heading)">
              {doneToday}/{total}
            </text>
          </svg>
        )}
      </div>

      {/* ── list ── */}
      {loading ? (
        <div style={{ padding:"60px 0", textAlign:"center", color:"var(--text-muted)" }}>Loading…</div>
      ) : habits.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius:"20px", padding:"48px 24px", textAlign:"center", border:"1px dashed var(--border-strong)" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🌱</div>
          <div style={{ color:"var(--text-muted)", marginBottom:"18px", fontSize:"14px" }}>No habits yet. Start building one.</div>
          <button type="button" onClick={openCreate} className="btn-primary" style={{ padding:"0 20px" }}>Add habit</button>
        </div>
      ) : (
        <AnimatePresence>
          {habits.map(h => (
            <HabitCard
              key={h.id} habit={h}
              onToggle={toggleHabit}
              onDelete={deleteHabit}
              onEdit={openEdit}
              onOpenQty={setQtyHabit}
              onOpenAction={setActionHabit}
            />
          ))}
        </AnimatePresence>
      )}

      {/* ── FAB ── */}
      <button type="button" onClick={openCreate} className="btn-reset" aria-label="New habit"
        style={{
          position:"fixed", right:"18px", bottom:"calc(var(--mobile-nav-height) + 28px)",
          width:"58px", height:"58px", borderRadius:"18px",
          background:`linear-gradient(145deg,var(--accent-hover),var(--accent))`,
          color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"var(--shadow-glow), 0 8px 28px var(--accent-glow)",
          border:"1px solid rgba(255,255,255,0.2)",
        }}>
        <IconPlus size={26} stroke="#fff"/>
      </button>

      {/* ── Quantity sheet ── */}
      <AnimatePresence>
        {qtyHabit && (
          <QuantitySheet habit={qtyHabit} onClose={() => setQtyHabit(null)} onLog={handleQtyLog}/>
        )}
      </AnimatePresence>

      {/* ── Action sheet ── */}
      <AnimatePresence>
        {actionHabit && (
          <ActionSheet
            habit={actionHabit}
            onClose={() => setActionHabit(null)}
            onEdit={openEdit}
            onDelete={(id) => { deleteHabit(id); setActionHabit(null); toast("Habit deleted"); }}
          />
        )}
      </AnimatePresence>

      {/* ── Create / Edit modal ── */}
      <CenteredModal isOpen={showForm} onClose={closeForm} title={editingId ? "Edit habit" : "New habit"} maxWidth="460px">
        <div style={{ display:"grid", gap:"16px" }}>

          {/* name */}
          <div>
            <div style={sectionLabel}>Name</div>
            <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Drink water" style={inputStyle} autoFocus/>
          </div>

          {/* icon + color row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <div>
              <div style={sectionLabel}>Icon</div>
              <button type="button" onClick={() => { if(emojiReady) setShowEmoji(v=>!v); }} className="glass-tile"
                style={{ width:"100%", padding:"10px 13px", borderRadius:"13px", display:"flex", alignItems:"center", gap:"9px", color:"var(--text-primary)", fontWeight:600 }}>
                <span style={{ fontSize:"20px" }}>{fIcon}</span>
                <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{showEmoji?"Collapse":"Pick"}</span>
              </button>
            </div>
            <div>
              <div style={sectionLabel}>Color</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", paddingTop:"4px" }}>
                {COLOR_OPTIONS.slice(0,6).map(c => (
                  <button key={c} type="button" onClick={()=>setFColor(c)} className="btn-reset"
                    style={{ width:"26px", height:"26px", borderRadius:"50%", background:c, boxShadow:fColor===c?`0 0 0 2px var(--bg),0 0 0 4px ${c}`:"none" }}/>
                ))}
              </div>
            </div>
          </div>

          {/* emoji grid (lazy) */}
          {showEmoji && emojiReady && <EmojiGrid value={fIcon} onChange={v=>{setFIcon(v);setShowEmoji(false);}}/>}

          {/* schedule */}
          <div className="glass-tile" style={{ borderRadius:"16px", padding:"13px", border:"1px solid var(--border)", display:"grid", gap:"11px" }}>
            <div style={sectionLabel}>Schedule</div>
            <CustomSelect value={fFreq} onChange={setFFreq} options={FREQ_OPTIONS}/>
            {fFreq==="weekly" && (
              <div>
                <div style={{ ...sectionLabel, marginBottom:"5px" }}>Days (0=Sun, 6=Sat)</div>
                <input value={fRecurDays} onChange={e=>setFRecurDays(e.target.value)} placeholder="0,1,2,3,4"
                  style={{ ...inputStyle, fontSize:"13px" }}/>
              </div>
            )}
            {fFreq==="interval" && (
              <label style={{ display:"grid", gap:"5px" }}>
                <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text-muted)" }}>Every N days</span>
                <input type="number" min={1} value={fEveryN} onChange={e=>setFEveryN(Math.max(1,Number(e.target.value)||1))}
                  style={{ ...inputStyle, fontSize:"13px" }}/>
              </label>
            )}
            <label style={{ display:"grid", gap:"5px" }}>
              <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text-muted)" }}>Target / week (optional)</span>
              <input value={fTargetWeek} onChange={e=>setFTargetWeek(e.target.value)} placeholder="e.g. 5" style={{ ...inputStyle, fontSize:"13px" }}/>
            </label>
          </div>

          {/* goals */}
          <div className="glass-tile" style={{ borderRadius:"16px", padding:"13px", border:"1px solid var(--border)", display:"grid", gap:"11px" }}>
            <div style={sectionLabel}>Goals &amp; unit (optional)</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <label style={{ display:"grid", gap:"5px" }}>
                <span style={{ fontSize:"11px", fontWeight:600, color:"var(--text-muted)" }}>Min minutes</span>
                <input value={fMinMins} onChange={e=>setFMinMins(e.target.value)} placeholder="—" inputMode="numeric" style={{ ...inputStyle, fontSize:"13px" }}/>
              </label>
              <label style={{ display:"grid", gap:"5px" }}>
                <span style={{ fontSize:"11px", fontWeight:600, color:"var(--text-muted)" }}>Max per day</span>
                <input value={fMaxDay} onChange={e=>setFMaxDay(e.target.value)} placeholder="—" inputMode="numeric" style={{ ...inputStyle, fontSize:"13px" }}/>
              </label>
            </div>
            <label style={{ display:"grid", gap:"5px" }}>
              <span style={{ fontSize:"11px", fontWeight:600, color:"var(--text-muted)" }}>Unit label (glasses, pages, km…)</span>
              <input value={fUnit} onChange={e=>setFUnit(e.target.value)} placeholder="times" style={{ ...inputStyle, fontSize:"13px" }}/>
            </label>
          </div>

          {/* reminder */}
          <div className="glass-tile" style={{ borderRadius:"16px", padding:"13px", border:"1px solid var(--border)", display:"grid", gap:"10px" }}>
            <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }}>
              <input type="checkbox" checked={fReminder} onChange={e=>setFReminder(e.target.checked)} style={{ flexShrink:0 }}/>
              <span style={{ fontSize:"13px", fontWeight:600 }}>Daily reminder</span>
            </label>
            {fReminder && (
              <input type="time" value={fRemTime} onChange={e=>setFRemTime(e.target.value)} style={{ ...inputStyle, fontSize:"13px" }}/>
            )}
          </div>

          {/* CTA row */}
          <div style={{ display:"flex", gap:"8px" }}>
            <button type="button" onClick={closeForm} className="glass-tile"
              style={{ flex:1, borderRadius:"14px", padding:"11px 14px", color:"var(--text-primary)" }}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary" style={{ flex:2 }}>
              {editingId ? "Save changes" : "Create habit"}
            </button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}