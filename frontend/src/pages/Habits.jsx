import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const ICON_OPTIONS = ["🧘","💧","📚","🏃","🎵","💪","🥗","🧹","✍️","🌅","🎯","💊","🛏️","🚴","🧩"];
const COLOR_OPTIONS = ["#ff6b9d","#f43f5e","#f59e0b","#10b981","#3b82f6","#8b5cf6","#06b6d4","#ec4899"];

const STORAGE_KEY = "tp_habits";

function loadHabits() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || []; } catch { return []; }
}

function saveHabits(h) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
}

const todayKey = () => new Date().toISOString().split("T")[0];

export default function Habits() {
  const { isDark } = useTheme();
  const [habits, setHabits] = useState(loadHabits);
  const [showModal, setShowModal] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitIcon, setHabitIcon] = useState("🧘");
  const [habitColor, setHabitColor] = useState("#ff6b9d");

  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg = isDark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)";
  const border = isDark ? "rgba(255,107,157,0.1)" : "rgba(255,107,157,0.15)";

  useEffect(() => { saveHabits(habits); }, [habits]);

  const today = todayKey();
  const completedToday = habits.filter((h) => h.completedDates?.includes(today)).length;

  const addHabit = useCallback(() => {
    if (!habitName.trim()) { toast.error("Habit name is required"); return; }
    const habit = {
      id: crypto.randomUUID(),
      name: habitName.trim(),
      icon: habitIcon,
      color: habitColor,
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [habit, ...prev]);
    setHabitName(""); setHabitIcon("🧘"); setHabitColor("#ff6b9d");
    setShowModal(false);
    toast.success("Habit created! Keep it up 🚀");
  }, [habitName, habitIcon, habitColor]);

  const toggleHabit = useCallback((id) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== id) return h;
      const dates = h.completedDates || [];
      const done = dates.includes(today);
      if (done) {
        toast("Habit unmarked");
        return { ...h, completedDates: dates.filter((d) => d !== today), streak: Math.max(0, h.streak - 1) };
      } else {
        toast.success(`${h.icon} ${h.name} — done!`);
        return { ...h, completedDates: [...dates, today], streak: h.streak + 1 };
      }
    }));
  }, [today]);

  const deleteHabit = useCallback((id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    toast.success("Habit deleted");
  }, []);

  const isCompletedToday = (h) => (h.completedDates || []).includes(today);

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    borderRadius: "10px", border: `1px solid ${border}`,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
    color: textColor, fontSize: "13px",
    fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px", fontFamily: "'DM Sans', sans-serif", color: textColor }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.04em" }}>
          Daily <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Habits</span>
        </h1>
        <p style={{ fontSize: "14px", color: mutedColor, margin: 0 }}>
          {completedToday}/{habits.length} done today — keep the streak going 🔥
        </p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Habits", value: habits.length, color: "#ff6b9d" },
          { label: "Done Today", value: completedToday, color: "#10b981" },
          { label: "Best Streak 🔥", value: Math.max(0, ...habits.map((h) => h.streak)), color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "14px 16px", borderRadius: "14px", background: cardBg, backdropFilter: "blur(10px)", border: `1px solid ${border}` }}>
            <div style={{ fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: mutedColor, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <div style={{ padding: "14px 18px", borderRadius: "14px", background: cardBg, backdropFilter: "blur(10px)", border: `1px solid ${border}`, marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: textColor }}>Today's progress</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#ff6b9d" }}>{habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0}%</span>
          </div>
          <div style={{ height: "6px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", borderRadius: "3px", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${habits.length > 0 ? (completedToday / habits.length) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg,#ff6b9d,#ff99cc)", borderRadius: "3px" }}
            />
          </div>
        </div>
      )}

      {/* Add button */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => setShowModal(true)}
        style={{
          width: "100%", padding: "13px",
          background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
          border: "none", borderRadius: "14px",
          color: "white", fontSize: "14px", fontWeight: 700,
          cursor: "pointer", marginBottom: "20px",
          boxShadow: "0 4px 16px rgba(255,107,157,0.3)",
          fontFamily: "inherit",
        }}
      >+ New Habit</motion.button>

      {/* Habits list */}
      {habits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "60px 20px", background: cardBg, backdropFilter: "blur(10px)", borderRadius: "20px", border: `1px solid ${border}` }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌱</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: textColor }}>No habits yet</h3>
          <p style={{ fontSize: "13px", color: mutedColor }}>Start building better habits today</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {habits.map((h, i) => {
            const done = isCompletedToday(h);
            return (
              <motion.div
                key={h.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "16px 18px",
                  borderRadius: "16px",
                  background: done
                    ? (isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)")
                    : cardBg,
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${done ? "rgba(16,185,129,0.2)" : border}`,
                  marginBottom: "10px",
                  transition: "all 0.2s",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "14px",
                  background: `${h.color}18`, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px",
                }}>
                  {h.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "15px", fontWeight: 600,
                    color: textColor,
                    textDecoration: done ? "line-through" : "none",
                    opacity: done ? 0.65 : 1,
                    marginBottom: "3px",
                  }}>
                    {h.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: h.streak > 0 ? "#f59e0b" : mutedColor }}>
                      🔥 {h.streak} day streak
                    </span>
                    {done && <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>✓ Done today</span>}
                  </div>
                </div>

                {/* Toggle */}
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  onClick={() => toggleHabit(h.id)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${done ? "#10b981" : h.color}`,
                    background: done ? "linear-gradient(135deg,#10b981,#34d399)" : "transparent",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {done && <span style={{ color: "white", fontSize: "14px", fontWeight: 800 }}>✓</span>}
                </motion.div>

                {/* Delete */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteHabit(h.id)}
                  style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    background: "rgba(244,63,94,0.08)", border: "none",
                    cursor: "pointer", color: "#f43f5e", fontSize: "12px",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 1000 }} />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: "90%", maxWidth: "380px",
                background: isDark ? "#0f172a" : "#ffffff",
                borderRadius: "24px", padding: "28px",
                border: `1px solid ${border}`,
                boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
                zIndex: 1001, fontFamily: "inherit",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 20px", color: textColor }}>New Habit</h2>

              <input autoFocus placeholder="Habit name" value={habitName} onChange={(e) => setHabitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                style={{ ...inputStyle, marginBottom: "14px" }} />

              {/* Icon picker */}
              <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>Icon</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                {ICON_OPTIONS.map((ic) => (
                  <button key={ic} onClick={() => setHabitIcon(ic)}
                    style={{ width: "36px", height: "36px", borderRadius: "10px", fontSize: "18px", border: ic === habitIcon ? `2px solid #ff6b9d` : `1px solid ${border}`, background: ic === habitIcon ? "rgba(255,107,157,0.12)" : "transparent", cursor: "pointer" }}>
                    {ic}
                  </button>
                ))}
              </div>

              {/* Color picker */}
              <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>Color</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {COLOR_OPTIONS.map((c) => (
                  <div key={c} onClick={() => setHabitColor(c)}
                    style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, cursor: "pointer", border: habitColor === c ? "3px solid white" : "2px solid transparent", boxShadow: habitColor === c ? `0 0 0 2px ${c}` : "none", transition: "all 0.15s" }} />
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, ...inputStyle, cursor: "pointer", textAlign: "center", padding: "10px" }}>Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addHabit}
                  style={{ flex: 2, padding: "10px", borderRadius: "10px", background: `linear-gradient(135deg,${habitColor},${habitColor}cc)`, border: "none", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "inherit" }}>
                  Create Habit
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}