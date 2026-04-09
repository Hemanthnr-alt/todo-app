import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme }  from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import CenteredModal from "../components/CenteredModal";
import toast         from "react-hot-toast";

/* ─── Constants ─────────────────────────────── */
const ICON_OPTIONS = [
  "🧘","💧","📚","🏃","🎵","💪","🥗","🧹","✍️","🌅",
  "🎯","💊","🛏️","🚴","🧩","🌿","☕","🎨","🧗","🏊",
  "🔥","⭐","🏋️","🥦","🎮","🌍","📝","🧠","💡","🏆",
];
const COLOR_OPTIONS = [
  "#FF453A","#FF9F0A","#FFD60A","#30D158",
  "#0A84FF","#6B46FF","#BF5AF2","#FF375F",
  "#64D2FF","#32D74B",
];
const DAY_LABELS = ["M","T","W","T","F","S","S"];
const MISSED_KEY = "thirty_missed_habits";
const getMissed  = () => { try { return JSON.parse(localStorage.getItem(MISSED_KEY)||"{}"); } catch { return {}; } };
const saveMissed = (m) => localStorage.setItem(MISSED_KEY, JSON.stringify(m));

function getLast7() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}
const todayStr = () => new Date().toISOString().split("T")[0];

/* ─── Week circle ────────────────────────────── */
function DayCircle({ date, habitId, doneSet, onToggle, color, isToday, isFuture }) {
  const missed  = !!getMissed()[`${habitId}_${date}`];
  const done    = doneSet.has(date);
  const dayIdx  = (new Date(date + "T12:00:00").getDay() + 6) % 7; // Mon=0
  const dayLbl  = DAY_LABELS[dayIdx];
  const dateNum = parseInt(date.split("-")[2], 10);

  let bg = "var(--surface-raised)";
  let fg = "rgba(235,235,245,0.25)";
  let ring = "none";
  let glow = "none";

  if (missed) { bg = "var(--danger)";  fg = "#fff"; }
  else if (done) {
    bg = color;
    fg = "#fff";
    glow = `0 0 10px ${color}55`;
  } else if (isToday) {
    bg = "transparent";
    fg = "#fff";
    ring = `2px solid var(--accent)`;
  } else if (isFuture) {
    bg = "var(--surface-raised)";
    fg = "rgba(235,235,245,0.15)";
  }

  return (
    <motion.button
      whileTap={{ scale: 1.18 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      onClick={() => !isFuture && onToggle(habitId, date)}
      disabled={isFuture}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
        background: "none", border: "none", cursor: isFuture ? "default" : "pointer",
        padding: 0, WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
        opacity: isFuture ? 0.35 : 1,
      }}>
      <span style={{ fontSize: "10px", fontWeight: 500, color: "rgba(235,235,245,0.4)", letterSpacing: "0.04em" }}>
        {dayLbl}
      </span>
      <div style={{
        width: "38px", height: "38px", borderRadius: "50%",
        background: bg, border: ring,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "14px", fontWeight: 700, color: fg,
        boxShadow: glow,
        transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        fontFamily: "var(--font-heading)",
      }}>
        {missed ? "✕" : dateNum}
      </div>
    </motion.button>
  );
}

/* ─── Habit Card ─────────────────────────────── */
function HabitCard({ habit, isDark, onToggle, onDelete }) {
  const today   = todayStr();
  const last7   = getLast7();
  const doneSet = new Set(habit.completedDates || []);
  const todayDone = doneSet.has(today);

  const [missedMap,  setMissedMap]  = useState(getMissed);
  const [showDelete, setShowDelete] = useState(false);
  const isMissed = !!missedMap[`${habit.id}_${today}`];

  const handleMiss = () => {
    const cur = getMissed();
    const key = `${habit.id}_${today}`;
    if (cur[key]) { delete cur[key]; }
    else {
      cur[key] = true;
      if (todayDone) onToggle(habit.id, today);
    }
    saveMissed(cur);
    setMissedMap({ ...cur });
  };

  const handleDone = () => {
    if (!isMissed) onToggle(habit.id, today);
  };

  const last7Done = last7.filter(d => doneSet.has(d)).length;
  const pct = Math.round((last7Done / 7) * 100);

  // Status pill
  let pillBg, pillColor, pillLabel;
  if (isMissed)    { pillBg = "rgba(255,69,58,0.18)";  pillColor = "var(--danger)";  pillLabel = "Missed"; }
  else if (todayDone) { pillBg = "rgba(48,209,88,0.18)"; pillColor = "var(--success)"; pillLabel = "Done ✓"; }
  else             { pillBg = `${habit.color}28`;       pillColor = habit.color;      pillLabel = "Daily"; }

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      style={{
        borderRadius: "16px",
        marginBottom: "10px",
        overflow: "hidden",
        background: isMissed
          ? "rgba(255,69,58,0.07)"
          : "var(--surface)",
        /* depth by contrast in dark, border in light */
        border: isDark
          ? (isMissed ? "1px solid rgba(255,69,58,0.22)" : "none")
          : "1px solid var(--border)",
        transition: "all 0.2s",
      }}>

      {/* ── Top row ── */}
      <div style={{ padding: "14px 14px 12px", display: "flex", alignItems: "center", gap: "12px" }}>

        {/* Icon square */}
        <div style={{
          width: "46px", height: "46px", borderRadius: "12px",
          background: habit.color, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px",
          boxShadow: `0 4px 12px ${habit.color}44`,
        }}>
          {habit.icon}
        </div>

        {/* Name + pill */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "16px", fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            textDecoration: (todayDone || isMissed) ? "line-through" : "none",
            opacity: (todayDone || isMissed) ? 0.5 : 1,
            transition: "opacity 0.2s",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {habit.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
            <span style={{
              padding: "2px 8px", borderRadius: "6px",
              fontSize: "11px", fontWeight: 600,
              background: pillBg, color: pillColor,
            }}>
              {pillLabel}
            </span>
            {habit.streak > 0 && !isMissed && (
              <span style={{
                fontSize: "11px", fontWeight: 700,
                color: "var(--streak)",
                display: "flex", alignItems: "center", gap: "2px",
              }}>
                🔥 {habit.streak}d
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "7px", flexShrink: 0 }}>
          {/* Miss */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleMiss}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: `2px solid ${isMissed ? "var(--danger)" : "rgba(255,69,58,0.3)"}`,
              background: isMissed ? "var(--danger)" : "transparent",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              color: isMissed ? "#fff" : "var(--danger)",
              fontSize: "14px", fontWeight: 800,
              WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
            }}>
            ✕
          </motion.button>

          {/* Done */}
          <motion.button
            whileTap={!isMissed ? { scale: 1.2 } : {}}
            onClick={handleDone}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: `2px solid ${todayDone ? "var(--success)" : isMissed ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.25)"}`,
              background: todayDone ? "var(--success)" : "transparent",
              cursor: isMissed ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              opacity: isMissed ? 0.25 : 1,
              boxShadow: todayDone ? "0 0 12px rgba(48,209,88,0.45)" : "none",
              WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
            }}>
            {todayDone && <span style={{ color: "#fff", fontSize: "16px", fontWeight: 800, lineHeight: 1 }}>✓</span>}
          </motion.button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0" }} />

      {/* ── Week strip ── */}
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {last7.map(d => (
            <DayCircle
              key={d}
              date={d}
              habitId={habit.id}
              doneSet={doneSet}
              onToggle={onToggle}
              color={habit.color}
              isToday={d === today}
              isFuture={d > today}
            />
          ))}
        </div>

        {/* Stats + delete */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", paddingLeft: "10px" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: pct === 100 ? "var(--success)" : "var(--text-primary)", fontFamily: "var(--font-heading)", lineHeight: 1 }}>
            {pct}%
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>7d</div>
          <motion.button whileTap={{ scale: 0.88 }}
            onTouchStart={() => setShowDelete(true)}
            onTouchEnd={() => setShowDelete(false)}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
            onClick={() => onDelete(habit.id)}
            style={{
              width: "26px", height: "26px", borderRadius: "8px", marginTop: "2px",
              background: showDelete ? "rgba(255,69,58,0.18)" : "var(--surface-raised)",
              border: "none", cursor: "pointer",
              color: showDelete ? "var(--danger)" : "var(--text-muted)",
              fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
            }}>
            🗑
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────── */
export default function Habits() {
  const { isDark, accent } = useTheme();
  const { habits, loading, addHabit, toggleHabit, deleteHabit } = useHabits();

  const [showModal, setShowModal] = useState(false);
  const [name,   setName]   = useState("");
  const [icon,   setIcon]   = useState("🧘");
  const [color,  setColor]  = useState(accent || "#6B46FF");

  const ac    = accent || "#6B46FF";
  const today = todayStr();
  const completedToday = habits.filter(h => (h.completedDates || []).includes(today)).length;
  const bestStreak     = habits.length ? Math.max(0, ...habits.map(h => h.streak || 0)) : 0;

  const handleAdd = useCallback(async () => {
    if (!name.trim()) { toast.error("Enter a habit name"); return; }
    await addHabit({ name: name.trim(), icon, color, frequency: "daily" });
    setName(""); setIcon("🧘"); setColor(ac);
    setShowModal(false);
    toast.success("Habit created 🚀");
  }, [name, icon, color, addHabit, ac]);

  const openModal = () => { setColor(ac); setShowModal(true); };

  // ── Compact stat card
  const Stat = ({ label, value, color: c }) => (
    <div style={{
      flex: 1, padding: "14px 12px", borderRadius: "14px",
      background: "var(--surface)",
      border: isDark ? "none" : "1px solid var(--border)",
      display: "flex", flexDirection: "column", alignItems: "flex-start",
    }}>
      <div style={{ fontSize: "26px", fontWeight: 800, color: c, fontFamily: "var(--font-heading)", lineHeight: 1, marginBottom: "6px" }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
    </div>
  );

  const inputStyle = {
    width: "100%", padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--surface-raised)",
    color: "var(--text-primary)",
    fontSize: "15px", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "20px 14px 32px", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, letterSpacing: "-0.03em", fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
            Habits
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {completedToday} of {habits.length} done today
          </p>
        </div>

        {/* FAB */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={openModal}
          style={{
            width: "54px", height: "54px", borderRadius: "16px",
            background: ac, border: "none",
            color: "#fff", fontSize: "24px", fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 20px ${ac}66`,
            WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
          }}>
          +
        </motion.button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <Stat label="Total"      value={habits.length}   color="var(--text-primary)" />
        <Stat label="Done Today" value={completedToday}  color="var(--success)" />
        <Stat label="Best Streak" value={`${bestStreak}d`} color="var(--streak)" />
      </div>

      {/* ── Progress bar ── */}
      {habits.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Today's progress</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: ac }}>
              {Math.round((completedToday / habits.length) * 100)}%
            </span>
          </div>
          <div style={{ height: "5px", background: "var(--surface-raised)", borderRadius: "3px", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${(completedToday / habits.length) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ height: "100%", background: ac, borderRadius: "3px" }}
            />
          </div>
        </div>
      )}

      {/* ── Habit list ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "28px", animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
        </div>
      ) : habits.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: "center", padding: "60px 20px",
            background: "var(--surface)", borderRadius: "20px",
            border: isDark ? "none" : "1px solid var(--border)",
          }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌱</div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            No habits yet
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Build consistency, one day at a time
          </p>
          <motion.button whileTap={{ scale: 0.96 }} onClick={openModal}
            style={{
              padding: "12px 28px", borderRadius: "12px",
              background: ac, border: "none", color: "#fff",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", boxShadow: `0 4px 18px ${ac}55`,
              WebkitTapHighlightColor: "transparent",
            }}>
            Create first habit
          </motion.button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {habits.map(h => (
            <HabitCard
              key={h.id} habit={h} isDark={isDark}
              onToggle={toggleHabit} onDelete={deleteHabit}
            />
          ))}
        </AnimatePresence>
      )}

      {/* ── Add Habit Modal ── */}
      <CenteredModal isOpen={showModal} onClose={() => setShowModal(false)} title="New Habit" maxWidth="400px">
        <div style={{ fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Name */}
          <input
            autoFocus
            placeholder="Habit name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = ac}
            onBlur={e  => e.target.style.borderColor = "var(--border)"}
          />

          {/* Icon picker */}
          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "10px" }}>
              Icon
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {ICON_OPTIONS.map(ic => (
                <motion.button key={ic} whileTap={{ scale: 0.88 }} onClick={() => setIcon(ic)}
                  style={{
                    width: "40px", height: "40px", borderRadius: "10px", fontSize: "18px",
                    border: ic === icon ? `2px solid ${ac}` : "1.5px solid var(--border)",
                    background: ic === icon ? `${ac}20` : "var(--surface-raised)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                  {ic}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Colour picker */}
          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "10px" }}>
              Colour
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map(c => (
                <motion.button key={c} whileTap={{ scale: 0.88 }} onClick={() => setColor(c)}
                  style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    background: c, border: "none", cursor: "pointer",
                    boxShadow: color === c ? `0 0 0 3px var(--bg), 0 0 0 5px ${c}` : "none",
                    transition: "box-shadow 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{
            padding: "12px 14px", borderRadius: "12px",
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{name || "Habit name"}</div>
              <div style={{ fontSize: "11px", color, fontWeight: 600, marginTop: "2px" }}>Daily</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setShowModal(false)}
              style={{
                flex: 1, padding: "12px", borderRadius: "10px",
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text-muted)", cursor: "pointer", fontSize: "14px",
                fontFamily: "inherit",  WebkitTapHighlightColor: "transparent",
              }}>
              Cancel
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd}
              style={{
                flex: 2, padding: "12px", borderRadius: "10px",
                background: color, border: "none",
                color: "#fff", cursor: "pointer", fontSize: "15px",
                fontWeight: 700, fontFamily: "inherit",
                boxShadow: `0 4px 16px ${color}55`,
                WebkitTapHighlightColor: "transparent",
              }}>
              Create Habit
            </motion.button>
          </div>
        </div>
      </CenteredModal>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}