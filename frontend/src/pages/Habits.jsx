import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import CenteredModal from "../components/CenteredModal";
import toast from "react-hot-toast";

const ICON_OPTIONS = [
  "🧘","💧","📚","🏃","🎵","💪","🥗","🧹","✍️","🌅",
  "🎯","💊","🛏️","🚴","🧩","🌿","☕","🎨","🧗","🏊",
  "🔥","⭐","🏋️","🥦","🎮","🌍","📝","🧠","💡","🏆",
];

const COLOR_OPTIONS = [
  "#f43f5e","#f59e0b","#10b981","#3b82f6",
  "#8b5cf6","#06b6d4","#ec4899","#ff6b9d",
  "#84cc16","#f97316",
];

const DAY_SHORT = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function HabitCard({ habit, isDark, textColor, mutedColor, border, cardBg, onToggle, onDelete }) {
  const last7    = getLastNDays(7);
  const today    = new Date().toISOString().split("T")[0];
  const doneSet  = new Set(habit.completedDates || []);
  const todayDone = doneSet.has(today);

  const totalDays = habit.completedDates?.length || 0;
  const last7Done = last7.filter(d => doneSet.has(d)).length;
  const pct       = Math.round((last7Done / 7) * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: cardBg, backdropFilter: "blur(12px)",
        borderRadius: "18px", marginBottom: "12px",
        border: `1px solid ${border}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "46px", height: "46px", borderRadius: "14px",
          background: `${habit.color}22`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px",
        }}>{habit.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: textColor }}>{habit.name}</div>
          <div style={{ fontSize: "11px", marginTop: "2px", display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{
              padding: "1px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600,
              background: `${habit.color}20`, color: habit.color,
            }}>Every day</span>
            {habit.streak > 0 && (
              <span style={{ color: "#f59e0b", fontSize: "11px" }}>🔥 {habit.streak}</span>
            )}
          </div>
        </div>

        {/* Complete button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onToggle(habit.id, today)}
          style={{
            width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${todayDone ? "#10b981" : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)")}`,
            background: todayDone ? "linear-gradient(135deg,#10b981,#34d399)" : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {todayDone && <span style={{ color: "white", fontSize: "16px", fontWeight: 800 }}>✓</span>}
        </motion.button>
      </div>

      {/* Last 7 days */}
      <div style={{
        padding: "10px 16px",
        borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {last7.map((d, i) => {
            const done    = doneSet.has(d);
            const isToday = d === today;
            return (
              <motion.button
                key={d}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggle(habit.id, d)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                <span style={{ fontSize: "9px", color: isToday ? "#ff6b9d" : mutedColor, fontWeight: isToday ? 700 : 400 }}>
                  {DAY_SHORT[new Date(d + "T00:00:00").getDay() === 0 ? 6 : new Date(d + "T00:00:00").getDay() - 1]}
                </span>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: 700,
                  background: done
                    ? `${habit.color}`
                    : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"),
                  border: isToday && !done
                    ? `2px solid ${habit.color}60`
                    : "2px solid transparent",
                  color: done ? "white" : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"),
                  transition: "all 0.15s",
                }}>
                  {new Date(d + "T00:00:00").getDate()}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Stats + delete */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: habit.color }}>{pct}%</div>
            <div style={{ fontSize: "9px", color: mutedColor }}>7 days</div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(habit.id)}
            style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(244,63,94,0.08)", border: "none", cursor: "pointer", color: "#f43f5e", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Habits() {
  const { isDark }  = useTheme();
  const { habits, loading, addHabit, toggleHabit, deleteHabit } = useHabits();
  const [showModal, setShowModal] = useState(false);
  const [name,      setName]      = useState("");
  const [icon,      setIcon]      = useState("🧘");
  const [color,     setColor]     = useState("#ff6b9d");

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.88)";
  const border     = isDark ? "rgba(255,107,157,0.1)"  : "rgba(255,107,157,0.18)";
  const inputBg    = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const iconBtnBg  = isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9";

  const today          = new Date().toISOString().split("T")[0];
  const completedToday = habits.filter(h => (h.completedDates||[]).includes(today)).length;
  const bestStreak     = habits.length ? Math.max(0, ...habits.map(h => h.streak || 0)) : 0;

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    borderRadius: "10px", border: `1px solid ${border}`,
    background: inputBg, color: textColor,
    fontSize: "13px", fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };

  const handleAdd = useCallback(async () => {
    if (!name.trim()) { toast.error("Habit name is required"); return; }
    await addHabit({ name: name.trim(), icon, color, frequency: "daily" });
    setName(""); setIcon("🧘"); setColor("#ff6b9d");
    setShowModal(false);
    toast.success("Habit created! 🚀");
  }, [name, icon, color, addHabit]);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 12px", fontFamily: "'DM Sans',sans-serif", color: textColor }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(22px,5vw,28px)", fontWeight: 800, margin: "0 0 3px", letterSpacing: "-0.03em" }}>
            Daily <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Habits</span>
          </h1>
          <p style={{ fontSize: "12px", color: mutedColor, margin: 0 }}>
            {completedToday}/{habits.length} done today
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
          style={{
            width: "44px", height: "44px", borderRadius: "14px",
            background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
            border: "none", color: "white", cursor: "pointer",
            fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(255,107,157,0.35)",
          }}>+</motion.button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "Total",      value: habits.length,  color: "#ff6b9d" },
          { label: "Done Today", value: completedToday, color: "#10b981" },
          { label: "Best 🔥",    value: bestStreak,     color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ padding: "12px 14px", borderRadius: "14px", background: cardBg, backdropFilter: "blur(10px)", border: `1px solid ${border}` }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: mutedColor, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {habits.length > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: "14px", background: cardBg, backdropFilter: "blur(10px)", border: `1px solid ${border}`, marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: textColor }}>Today's progress</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ff6b9d" }}>
              {habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0}%
            </span>
          </div>
          <div style={{ height: "5px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", borderRadius: "3px", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${habits.length > 0 ? (completedToday / habits.length) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: "100%", background: "linear-gradient(90deg,#ff6b9d,#ff99cc)", borderRadius: "3px" }}
            />
          </div>
        </div>
      )}

      {/* Habit list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: mutedColor }}>
          <div style={{ fontSize: "24px", animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
        </div>
      ) : habits.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "56px 20px", background: cardBg, backdropFilter: "blur(10px)", borderRadius: "20px", border: `1px solid ${border}` }}>
          <div style={{ fontSize: "44px", marginBottom: "12px" }}>🌱</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: textColor }}>No habits yet</h3>
          <p style={{ fontSize: "13px", color: mutedColor }}>Start building better habits today</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {habits.map(h => (
            <HabitCard
              key={h.id} habit={h}
              isDark={isDark} textColor={textColor} mutedColor={mutedColor}
              border={border} cardBg={cardBg}
              onToggle={toggleHabit} onDelete={deleteHabit}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Add Habit Modal */}
      <CenteredModal isOpen={showModal} onClose={() => setShowModal(false)} title="New Habit" maxWidth="400px">
        <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
          <input autoFocus placeholder="Habit name" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={{ ...inputStyle, marginBottom: "18px" }}
            onFocus={e => e.target.style.borderColor = "#ff6b9d"}
            onBlur={e => e.target.style.borderColor = border}
          />

          <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Icon</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: "38px", height: "38px", borderRadius: "10px", fontSize: "18px",
                border: ic === icon ? `2px solid #ff6b9d` : `1px solid ${border}`,
                background: ic === icon ? "rgba(255,107,157,0.14)" : iconBtnBg,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>{ic}</button>
            ))}
          </div>

          <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Colour</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {COLOR_OPTIONS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: "28px", height: "28px", borderRadius: "50%", background: c, cursor: "pointer",
                border: color === c ? "3px solid white" : "2px solid transparent",
                boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                transition: "all 0.14s",
              }} />
            ))}
          </div>

          {/* Preview */}
          <div style={{ padding: "12px 14px", borderRadius: "12px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{icon}</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: textColor }}>{name || "Habit name"}</div>
              <div style={{ fontSize: "11px", color: color }}>Every day</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: `1px solid ${border}`, background: "transparent", color: mutedColor, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd} style={{
              flex: 2, padding: "11px", borderRadius: "10px",
              background: `linear-gradient(135deg,${color},${color}cc)`,
              border: "none", color: "white", cursor: "pointer",
              fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
            }}>Create Habit</motion.button>
          </div>
        </div>
      </CenteredModal>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}