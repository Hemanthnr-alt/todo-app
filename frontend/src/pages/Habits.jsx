import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme }  from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import CenteredModal  from "../components/CenteredModal";
import toast          from "react-hot-toast";

const ICON_OPTIONS = [
  "🧘","💧","📚","🏃","🎵","💪","🥗","🧹","✍️","🌅",
  "🎯","💊","🛏️","🚴","🧩","🌿","☕","🎨","🧗","🏊",
  "🔥","⭐","🏋️","🥦","🎮","🌍","📝","🧠","💡","🏆",
];

const COLOR_OPTIONS = [
  "#FF453A","#FF9F0A","#30D158","#0A84FF",
  "#6B46FF","#5E5CE6","#FF375F","#64D2FF",
  "#FFD60A","#32D74B",
];

const DAY_SHORT = ["Mo","Tu","We","Th","Fr","Sa","Su"];

const MISSED_KEY = "thirty_missed_habits";
const getMissed  = () => { try { return JSON.parse(localStorage.getItem(MISSED_KEY)||"{}"); } catch { return {}; } };
const saveMissed = (m) => localStorage.setItem(MISSED_KEY, JSON.stringify(m));

function getLastNDays(n) {
  const days = [];
  for (let i = n-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

/* ── HabitCard ── */
function HabitCard({ habit, isDark, onToggle, onDelete }) {
  const last7   = getLastNDays(7);
  const today   = new Date().toISOString().split("T")[0];
  const doneSet = new Set(habit.completedDates||[]);
  const todayDone = doneSet.has(today);

  const [missedMap, setMissedMap] = useState(getMissed);
  const isMissed = !!missedMap[`${habit.id}_${today}`];

  const handleMiss = () => {
    const cur = getMissed();
    const key = `${habit.id}_${today}`;
    if (cur[key]) { delete cur[key]; }
    else { cur[key] = true; if (todayDone) onToggle(habit.id, today); }
    saveMissed(cur); setMissedMap({...cur});
  };

  const last7Done = last7.filter(d => doneSet.has(d)).length;
  const pct       = Math.round((last7Done/7)*100);

  /* Card background — missed gets a very subtle red wash */
  const cardBg = isMissed
    ? (isDark ? "rgba(255,69,58,0.08)" : "rgba(255,69,58,0.05)")
    : "var(--surface)";

  return (
    <motion.div layout
      initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.95}}
      style={{
        borderRadius:"16px", marginBottom:"10px", overflow:"hidden",
        background: cardBg,
        /* No border in dark — depth from #000 vs #1C1C1E */
        border: isDark
          ? (isMissed ? "1px solid rgba(255,69,58,0.25)" : "none")
          : `1px solid var(--border)`,
        transition:"background 0.2s, border 0.2s",
      }}>

      {/* ── Header row ── */}
      <div style={{ padding:"16px 16px 12px", display:"flex", alignItems:"center", gap:"12px" }}>
        {/* Icon square — solid habit colour */}
        <div style={{
          width:"44px", height:"44px", borderRadius:"12px",
          background: habit.color,
          flexShrink:0, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:"22px",
        }}>
          {habit.icon}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:"17px", fontWeight:600, color:"var(--text-primary)",
            textDecoration:(todayDone||isMissed)?"line-through":"none",
            opacity:(todayDone||isMissed)?0.45:1,
            fontFamily:"var(--font-body)",
          }}>
            {habit.name}
          </div>
          {/* Frequency pill */}
          <span style={{
            display:"inline-block", marginTop:"4px",
            padding:"3px 8px", borderRadius:"6px", fontSize:"12px", fontWeight:600,
            background: isMissed ? "rgba(255,69,58,0.18)"
              : todayDone ? "rgba(48,209,88,0.18)"
              : `${habit.color}30`,
            color: isMissed ? "var(--danger)"
              : todayDone ? "var(--success)"
              : habit.color,
          }}>
            {isMissed ? "Missed" : todayDone ? "Done" : "Daily"}
          </span>
        </div>

        {/* Streak chip */}
        {habit.streak > 0 && !isMissed && (
          <div style={{
            display:"flex", alignItems:"center", gap:"3px",
            padding:"4px 8px", borderRadius:"6px",
            background:"rgba(255,159,10,0.15)",
            fontSize:"12px", fontWeight:700, color:"var(--streak)",
            flexShrink:0,
          }}>
            🔥 {habit.streak}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
          <motion.button whileTap={{scale:0.85}} onClick={handleMiss}
            style={{
              width:"34px", height:"34px", borderRadius:"50%",
              border:`2px solid ${isMissed ? "var(--danger)" : "rgba(255,69,58,0.35)"}`,
              background: isMissed ? "var(--danger)" : "transparent",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.15s", color: isMissed ? "white" : "var(--danger)",
              fontSize:"13px", fontWeight:800,
              WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
            }}>
            ✕
          </motion.button>
          <motion.button whileTap={{scale:0.85}}
            onClick={() => { if (!isMissed) onToggle(habit.id, today); }}
            style={{
              width:"34px", height:"34px", borderRadius:"50%",
              border:`2px solid ${todayDone ? "var(--success)" : isMissed ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.25)"}`,
              background: todayDone ? "var(--success)" : "transparent",
              cursor: isMissed ? "default" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.15s", opacity: isMissed ? 0.3 : 1,
              boxShadow: todayDone ? "0 0 8px rgba(48,209,88,0.4)" : "none",
              WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
            }}>
            {todayDone && <span style={{ color:"white", fontSize:"15px", fontWeight:800 }}>✓</span>}
          </motion.button>
        </div>
      </div>

      {/* ── Footer separator ── */}
      <div style={{ height:"0.5px", background:"rgba(255,255,255,0.06)", margin:"0 16px" }}/>

      {/* ── Week strip ── */}
      <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:"6px" }}>
          {last7.map((d) => {
            const done     = doneSet.has(d);
            const isToday  = d === today;
            const isFuture = d > today;
            const miss     = getMissed()[`${habit.id}_${d}`];
            const dayIdx   = new Date(d+"T00:00:00").getDay();
            const dayLabel = DAY_SHORT[dayIdx === 0 ? 6 : dayIdx-1];

            /* Circle fill colours per spec */
            let circleBg, circleColor, circleBorder;
            if (miss)        { circleBg="var(--danger)";  circleColor="#FFFFFF"; circleBorder="none"; }
            else if (done)   { circleBg="var(--success)"; circleColor="#FFFFFF"; circleBorder="none"; }
            else if (isToday){ circleBg="transparent";    circleColor="#FFFFFF"; circleBorder="2px solid var(--accent)"; }
            else if (isFuture){ circleBg="var(--surface-raised)"; circleColor="rgba(255,255,255,0.2)"; circleBorder="none"; }
            else              { circleBg="var(--surface-raised)"; circleColor="rgba(255,255,255,0.3)"; circleBorder="none"; }

            return (
              <motion.button key={d} whileTap={{scale:0.9}}
                onClick={() => onToggle(habit.id, d)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px",
                  background:"none", border:"none", cursor:"pointer", padding:0,
                  WebkitTapHighlightColor:"transparent", touchAction:"manipulation" }}>
                <span style={{ fontSize:"10px", color:"rgba(235,235,245,0.4)", fontWeight:500 }}>
                  {dayLabel}
                </span>
                <div style={{
                  width:"42px", height:"42px", borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"15px", fontWeight:700,
                  background: circleBg,
                  border: circleBorder || "none",
                  color: circleColor,
                  transition:"all 0.2s",
                }}>
                  {miss ? "✕" : new Date(d+"T00:00:00").getDate()}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"14px", fontWeight:700, color:"var(--success)" }}>{pct}%</div>
            <div style={{ fontSize:"10px", color:"var(--text-muted)" }}>7 days</div>
          </div>
          <motion.button whileTap={{scale:0.9}} onClick={() => onDelete(habit.id)}
            style={{ width:"28px", height:"28px", borderRadius:"8px",
              background:"rgba(255,69,58,0.12)", border:"none", cursor:"pointer",
              color:"var(--danger)", fontSize:"13px",
              display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent", touchAction:"manipulation" }}>
            🗑
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Habits page ── */
export default function Habits() {
  const { isDark, accent }  = useTheme();
  const { habits, loading, addHabit, toggleHabit, deleteHabit } = useHabits();

  const [showModal, setShowModal] = useState(false);
  const [name,      setName]      = useState("");
  const [icon,      setIcon]      = useState("🧘");
  const [color,     setColor]     = useState("#6B46FF");

  const ac = accent || "#6B46FF";

  const today          = new Date().toISOString().split("T")[0];
  const completedToday = habits.filter(h=>(h.completedDates||[]).includes(today)).length;
  const bestStreak     = habits.length ? Math.max(0,...habits.map(h=>h.streak||0)) : 0;

  const inputBg  = "var(--surface-raised)";
  const border   = "var(--border)";
  const textColor = "var(--text-primary)";
  const mutedColor = "var(--text-muted)";

  const inputStyle = {
    width:"100%", padding:"12px 14px", borderRadius:"10px",
    border:`1px solid ${border}`, background: inputBg, color: textColor,
    fontSize:"14px", fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  };

  const handleAdd = useCallback(async () => {
    if (!name.trim()) { toast.error("Habit name is required"); return; }
    await addHabit({ name:name.trim(), icon, color, frequency:"daily" });
    setName(""); setIcon("🧘"); setColor(ac);
    setShowModal(false);
    toast.success("Habit created! 🚀");
  }, [name, icon, color, addHabit, ac]);

  return (
    <div style={{ maxWidth:"680px", margin:"0 auto", padding:"20px 12px",
      fontFamily:"var(--font-body)", color: textColor }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <div>
          <h1 style={{ fontSize:"28px", fontWeight:700, margin:"0 0 3px",
            letterSpacing:"-0.03em", fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>
            Habits
          </h1>
          <p style={{ fontSize:"13px", color: mutedColor, margin:0 }}>
            {completedToday}/{habits.length} done today
          </p>
        </div>
        {/* FAB — square-ish, solid purple, no gradient */}
        <motion.button whileTap={{scale:0.95}} onClick={() => { setColor(ac); setShowModal(true); }}
          style={{
            width:"56px", height:"56px", borderRadius:"16px",
            background: ac, border:"none", color:"white", cursor:"pointer",
            fontSize:"22px", display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 20px ${ac}80`,
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          }}>
          +
        </motion.button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", marginBottom:"16px" }}>
        {[
          { label:"Total",      value: habits.length,   color: ac },
          { label:"Done Today", value: completedToday,  color: "var(--success)" },
          { label:"Best 🔥",   value: `${bestStreak}d`, color: "var(--streak)" },
        ].map(s => (
          <div key={s.label} style={{
            padding:"14px", borderRadius:"14px", background:"var(--surface)",
            border: isDark ? "none" : "1px solid var(--border)",
          }}>
            <div style={{ fontSize:"24px", fontWeight:700, color: s.color,
              fontFamily:"var(--font-heading)" }}>{s.value}</div>
            <div style={{ fontSize:"11px", color: mutedColor, marginTop:"4px",
              textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <div style={{ padding:"14px 16px", borderRadius:"14px", background:"var(--surface)",
          border: isDark ? "none" : "1px solid var(--border)", marginBottom:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ fontSize:"13px", fontWeight:600, color: textColor }}>Today's progress</span>
            <span style={{ fontSize:"13px", fontWeight:700, color: ac }}>
              {habits.length > 0 ? Math.round((completedToday/habits.length)*100) : 0}%
            </span>
          </div>
          <div style={{ height:"4px", background:"var(--surface-raised)", borderRadius:"2px", overflow:"hidden" }}>
            <motion.div
              animate={{ width:`${habits.length>0?(completedToday/habits.length)*100:0}%` }}
              transition={{ duration:0.5 }}
              style={{ height:"100%", background: ac, borderRadius:"2px" }}/>
          </div>
        </div>
      )}

      {/* Habit list */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"40px 0", color: mutedColor }}>
          <div style={{ fontSize:"24px", animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</div>
        </div>
      ) : habits.length === 0 ? (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          style={{ textAlign:"center", padding:"56px 20px", background:"var(--surface)",
            borderRadius:"20px", border: isDark ? "none" : "1px solid var(--border)" }}>
          <div style={{ fontSize:"44px", marginBottom:"12px" }}>🌱</div>
          <h3 style={{ fontSize:"16px", fontWeight:700, margin:"0 0 6px", color: textColor }}>No habits yet</h3>
          <p style={{ fontSize:"13px", color: mutedColor, marginBottom:"18px" }}>Start building better habits today</p>
          <motion.button whileTap={{scale:0.97}} onClick={() => setShowModal(true)}
            style={{ padding:"11px 24px", borderRadius:"12px", background: ac, border:"none",
              color:"white", cursor:"pointer", fontSize:"14px", fontWeight:700,
              fontFamily:"inherit", boxShadow:`0 4px 16px ${ac}55`,
              WebkitTapHighlightColor:"transparent", touchAction:"manipulation" }}>
            Create first habit
          </motion.button>
        </motion.div>
      ) : (
        <AnimatePresence>
          {habits.map(h => (
            <HabitCard key={h.id} habit={h} isDark={isDark}
              onToggle={toggleHabit} onDelete={deleteHabit} />
          ))}
        </AnimatePresence>
      )}

      {/* Add Habit Modal */}
      <CenteredModal isOpen={showModal} onClose={() => setShowModal(false)} title="New Habit" maxWidth="400px">
        <div style={{ fontFamily:"var(--font-body)" }}>
          <input autoFocus placeholder="Habit name" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key==="Enter" && handleAdd()}
            style={{ ...inputStyle, marginBottom:"18px" }}
            onFocus={e => e.target.style.borderColor = ac}
            onBlur={e  => e.target.style.borderColor = border}
          />

          <label style={{ fontSize:"11px", color: mutedColor, display:"block", marginBottom:"8px",
            fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Icon</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"18px" }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)}
                style={{ width:"38px", height:"38px", borderRadius:"10px", fontSize:"18px",
                  border: ic===icon ? `2px solid ${ac}` : `1px solid ${border}`,
                  background: ic===icon ? `${ac}20` : "var(--surface-raised)",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  WebkitTapHighlightColor:"transparent", touchAction:"manipulation" }}>
                {ic}
              </button>
            ))}
          </div>

          <label style={{ fontSize:"11px", color: mutedColor, display:"block", marginBottom:"8px",
            fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Colour</label>
          <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
            {COLOR_OPTIONS.map(c => (
              <div key={c} onClick={() => setColor(c)}
                style={{ width:"28px", height:"28px", borderRadius:"50%", background:c,
                  cursor:"pointer",
                  border: color===c ? "3px solid white" : "2px solid transparent",
                  boxShadow: color===c ? `0 0 0 2px ${c}` : "none",
                  transition:"all 0.14s" }}/>
            ))}
          </div>

          {/* Preview */}
          <div style={{ padding:"12px 14px", borderRadius:"12px", background:"var(--surface-raised)",
            border:`1px solid ${border}`, display:"flex", alignItems:"center", gap:"10px", marginBottom:"18px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"10px", background: color,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>{icon}</div>
            <div>
              <div style={{ fontSize:"14px", fontWeight:600, color: textColor }}>{name||"Habit name"}</div>
              <div style={{ fontSize:"11px", color }}>Daily</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={() => setShowModal(false)}
              style={{ flex:1, padding:"12px", borderRadius:"10px", border:`1px solid ${border}`,
                background:"transparent", color: mutedColor, cursor:"pointer",
                fontFamily:"inherit", fontSize:"14px",
                WebkitTapHighlightColor:"transparent", touchAction:"manipulation" }}>
              Cancel
            </button>
            <motion.button whileTap={{scale:0.97}} onClick={handleAdd}
              style={{ flex:2, padding:"12px", borderRadius:"10px", background: color,
                border:"none", color:"white", cursor:"pointer", fontSize:"14px", fontWeight:700,
                fontFamily:"inherit", WebkitTapHighlightColor:"transparent", touchAction:"manipulation" }}>
              Create Habit
            </motion.button>
          </div>
        </div>
      </CenteredModal>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}