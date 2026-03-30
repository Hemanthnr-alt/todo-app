import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { useHabits } from "../hooks/useHabits";

const fmtDate = (d) => d.toISOString().split("T")[0];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Build a 14-day window centred around today
function buildDateStrip() {
  const days = [];
  const now  = new Date();
  for (let i = -3; i <= 10; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PRIORITY_COLOR = { high: "#f43f5e", medium: "#f59e0b", low: "#10b981" };

export default function Today({ onGoToTasks, onGoToHabits }) {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { tasks, categories, updateTask, deleteTask, addTask } = useTasks();
  const { habits, toggleHabit } = useHabits();

  const todayStr   = fmtDate(new Date());
  const [selected, setSelected] = useState(todayStr);
  const stripRef   = useRef(null);
  const dates      = buildDateStrip();

  // Scroll selected date into view
  useEffect(() => {
    if (!stripRef.current) return;
    const idx  = dates.findIndex(d => fmtDate(d) === selected);
    const item = stripRef.current.children[idx];
    if (item) item.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selected]);

  // Scroll to today on mount
  useEffect(() => {
    setTimeout(() => {
      if (!stripRef.current) return;
      const idx  = dates.findIndex(d => fmtDate(d) === todayStr);
      const item = stripRef.current.children[idx];
      if (item) item.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
    }, 100);
  }, []);

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.55)"    : "rgba(255,255,255,0.85)";
  const border     = isDark ? "rgba(255,107,157,0.1)"  : "rgba(255,107,157,0.15)";
  const pageBg     = isDark ? "rgba(8,6,16,0.0)"       : "rgba(245,240,255,0.0)";

  // Tasks for selected date — only exact dueDate match
  const dayTasks = tasks.filter(t => t.dueDate === selected);

  // Habits for selected date — all habits (daily ones always show)
  const dayHabits = habits.filter(h => {
    if (h.frequency === "daily") return true;
    if (h.frequency === "weekly") {
      const day = new Date(selected + "T00:00:00").getDay();
      return (h.recurringDays || []).includes(day);
    }
    return true;
  });

  const totalItems     = dayTasks.length + dayHabits.length;
  const completedItems = dayTasks.filter(t => t.completed).length +
    dayHabits.filter(h => (h.completedDates||[]).includes(selected)).length;
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "60px 20px", textAlign: "center", fontFamily: "'DM Sans',sans-serif", color: textColor }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ padding: "48px 28px", background: cardBg, backdropFilter: "blur(12px)", borderRadius: "28px", border: `1px solid ${border}` }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "18px",
            background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: 900, color: "white",
            margin: "0 auto 20px", boxShadow: "0 8px 28px rgba(255,107,157,0.35)",
          }}>30</div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 10px", color: textColor }}>
            Welcome to <span style={{ color: "#ff6b9d" }}>30</span>
          </h2>
          <p style={{ fontSize: "14px", color: mutedColor, margin: "0 0 24px", lineHeight: 1.6 }}>
            Your personal task manager. Sign in to start tracking your tasks, habits, and goals.
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            {["Tasks","Calendar","Habits","Categories","Timer"].map(f => (
              <span key={f} style={{ padding: "5px 12px", borderRadius: "20px", background: "rgba(255,107,157,0.1)", color: "#ff6b9d", fontSize: "12px", fontWeight: 600, border: "1px solid rgba(255,107,157,0.2)" }}>{f}</span>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: textColor, paddingBottom: "20px" }}>

      {/* Greeting */}
      <div style={{ padding: "20px 16px 12px" }}>
        <p style={{ fontSize: "12px", color: mutedColor, margin: "0 0 2px" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 style={{ fontSize: "clamp(22px,5vw,30px)", fontWeight: 800, margin: "0 0 2px", letterSpacing: "-0.03em" }}>
          {getGreeting()},{" "}
          <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {user?.name?.split(" ")[0] || "there"}
          </span> 👋
        </h1>
        {totalItems > 0 && (
          <p style={{ fontSize: "13px", color: mutedColor, margin: 0 }}>
            {completedItems}/{totalItems} done today · {pct}%
          </p>
        )}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ height: "4px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: "100%", background: "linear-gradient(90deg,#ff6b9d,#ff99cc)", borderRadius: "2px" }}
            />
          </div>
        </div>
      )}

      {/* ── Date strip ── */}
      <div style={{ overflowX: "auto", paddingBottom: "4px", marginBottom: "16px" }}
        className="hide-scrollbar">
        <div ref={stripRef} style={{
          display: "flex", gap: "8px",
          padding: "4px 16px",
          width: "max-content",
        }}>
          {dates.map((d) => {
            const ds      = fmtDate(d);
            const isToday = ds === todayStr;
            const isSel   = ds === selected;
            const hasItems = tasks.filter(t => t.dueDate === ds).length +
              habits.filter(h => (h.completedDates||[]).includes(ds)).length > 0;

            return (
              <motion.button
                key={ds}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelected(ds)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "4px", padding: "10px 14px",
                  borderRadius: "16px", border: "none", cursor: "pointer",
                  background: isSel
                    ? "linear-gradient(135deg,#ff6b9d,#ff99cc)"
                    : isToday
                    ? (isDark ? "rgba(255,107,157,0.15)" : "rgba(255,107,157,0.1)")
                    : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                  minWidth: "56px",
                  boxShadow: isSel ? "0 4px 16px rgba(255,107,157,0.35)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <span style={{
                  fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em",
                  color: isSel ? "rgba(255,255,255,0.8)" : mutedColor,
                  textTransform: "uppercase",
                }}>
                  {DAY_LABELS[d.getDay()]}
                </span>
                <span style={{
                  fontSize: "18px", fontWeight: 800,
                  color: isSel ? "white" : isToday ? "#ff6b9d" : textColor,
                }}>
                  {d.getDate()}
                </span>
                {/* Dot if has activity */}
                <div style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: isSel ? "rgba(255,255,255,0.6)" : hasItems ? "#ff6b9d" : "transparent",
                }} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Content for selected day ── */}
      <div style={{ padding: "0 12px" }}>

        {/* Empty state */}
        {dayTasks.length === 0 && dayHabits.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              textAlign: "center", padding: "48px 20px",
              background: cardBg, backdropFilter: "blur(12px)",
              borderRadius: "20px", border: `1px solid ${border}`,
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>✨</div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px", color: textColor }}>
              {selected === todayStr ? "Nothing scheduled" : "Nothing on this day"}
            </h3>
            <p style={{ fontSize: "13px", color: mutedColor, margin: "0 0 20px" }}>
              {selected === todayStr ? "Add a task or habit to get started" : "Tap + to add something"}
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onGoToTasks}
              style={{
                padding: "10px 24px", borderRadius: "99px",
                background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                border: "none", color: "white", cursor: "pointer",
                fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
              }}>
              Go to Tasks →
            </motion.button>
          </motion.div>
        )}

        {/* Habits section */}
        {dayHabits.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 4px 10px" }}>
              Habits · {dayHabits.filter(h => (h.completedDates||[]).includes(selected)).length}/{dayHabits.length}
            </div>
            <AnimatePresence>
              {dayHabits.map((h, i) => {
                const done = (h.completedDates || []).includes(selected);
                return (
                  <motion.div key={h.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      padding: "14px 16px", borderRadius: "16px", marginBottom: "8px",
                      background: done
                        ? (isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.06)")
                        : cardBg,
                      backdropFilter: "blur(10px)",
                      border: `1px solid ${done ? "rgba(16,185,129,0.25)" : border}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "14px",
                      background: `${h.color}22`, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "20px",
                    }}>{h.icon}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "15px", fontWeight: 600, color: textColor,
                        textDecoration: done ? "line-through" : "none",
                        opacity: done ? 0.6 : 1,
                      }}>{h.name}</div>
                      <div style={{ fontSize: "11px", color: mutedColor, marginTop: "2px", display: "flex", gap: "8px" }}>
                        <span style={{ color: "#ff6b9d", fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px", background: "rgba(255,107,157,0.1)" }}>Habit</span>
                        {h.streak > 0 && <span style={{ color: "#f59e0b" }}>🔥 {h.streak} streak</span>}
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => toggleHabit(h.id, selected)}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${done ? "#10b981" : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)")}`,
                        background: done ? "linear-gradient(135deg,#10b981,#34d399)" : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      {done && <span style={{ color: "white", fontSize: "14px", fontWeight: 800 }}>✓</span>}
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Tasks section */}
        {dayTasks.length > 0 && (
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 4px 10px" }}>
              Tasks · {dayTasks.filter(t => t.completed).length}/{dayTasks.length}
            </div>
            <AnimatePresence>
              {dayTasks.map((task, i) => {
                const cat = categories.find(c => c.id === task.categoryId);
                const pm  = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium;
                return (
                  <motion.div key={task.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      padding: "14px 16px", borderRadius: "16px", marginBottom: "8px",
                      background: task.completed
                        ? (isDark ? "rgba(15,23,42,0.3)" : "rgba(255,255,255,0.5)")
                        : cardBg,
                      backdropFilter: "blur(10px)",
                      border: `1px solid ${border}`,
                      borderLeft: `3px solid ${pm}`,
                      opacity: task.completed ? 0.65 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    <motion.div whileTap={{ scale: 0.85 }}
                      onClick={() => updateTask(task.id, { completed: !task.completed })}
                      style={{
                        width: "22px", height: "22px", borderRadius: "7px", flexShrink: 0,
                        border: `2px solid ${task.completed ? "#10b981" : (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)")}`,
                        background: task.completed ? "linear-gradient(135deg,#10b981,#34d399)" : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      {task.completed && <span style={{ color: "white", fontSize: "12px", fontWeight: 800 }}>✓</span>}
                    </motion.div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "15px", fontWeight: 600, color: textColor,
                        textDecoration: task.completed ? "line-through" : "none",
                        marginBottom: "4px",
                      }}>{task.title}</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        {cat && (
                          <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "4px", background: `${cat.color}18`, color: cat.color }}>
                            {cat.icon} {cat.name}
                          </span>
                        )}
                        <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "4px", background: `${pm}15`, color: pm }}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteTask(task.id)}
                      style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(244,63,94,0.08)", border: "none", cursor: "pointer", color: "#f43f5e", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      ✕
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}