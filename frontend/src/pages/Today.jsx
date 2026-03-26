import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import toast from "react-hot-toast";

const TICK_SPRING = { type: "spring", stiffness: 380, damping: 30, mass: 0.85 };

const PRIORITY_META = {
  high:   { color: "#f43f5e", bg: "rgba(244,63,94,0.1)",  label: "High",   dot: "🔴" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Medium", dot: "🟡" },
  low:    { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Low",    dot: "🟢" },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function Today({ onGoToTasks }) {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, catsRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/categories"),
      ]);
      const todayStr = new Date().toISOString().split("T")[0];
      const todayTasks = tasksRes.data.filter(
        (t) => t.dueDate === todayStr || new Date(t.createdAt).toISOString().split("T")[0] === todayStr
      );
      setTasks(todayTasks);
      setCategories(catsRes.data);
    } catch {
      toast.error("Failed to load today's tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleComplete = async (task) => {
    try {
      const res = await api.put(`/tasks/${task.id}`, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => t.id === task.id ? res.data : t));
      if (res.data.completed) toast.success("Task completed! 🎊");
    } catch {
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
    highPriority: tasks.filter((t) => t.priority === "high" && !t.completed).length,
  };

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const todayLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg = isDark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)";
  const border = isDark ? "rgba(255,107,157,0.1)" : "rgba(255,107,157,0.15)";

  return (
    <div style={{
      maxWidth: "760px",
      margin: "0 auto",
      padding: "32px 20px",
      fontFamily: "'DM Sans', sans-serif",
      color: textColor,
    }}>

      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: "32px" }}
      >
        <p style={{ fontSize: "13px", color: mutedColor, margin: "0 0 4px", fontWeight: 500 }}>
          {todayLabel}
        </p>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 800,
          margin: "0 0 6px",
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
        }}>
          {getGreeting()} 👋
        </h1>
        <p style={{ fontSize: "15px", color: mutedColor, margin: 0 }}>
          {stats.pending === 0 && stats.total > 0
            ? "You've completed everything today 🎉"
            : stats.pending > 0
            ? `You have ${stats.pending} task${stats.pending > 1 ? "s" : ""} left for today`
            : "No tasks yet — enjoy the calm or add something"}
        </p>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total", value: stats.total,       color: "#ff6b9d" },
          { label: "Done",  value: stats.completed,   color: "#10b981" },
          { label: "Left",  value: stats.pending,     color: "#f59e0b" },
          { label: "🔥 High", value: stats.highPriority, color: "#f43f5e" },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "14px 16px",
            borderRadius: "14px",
            background: cardBg,
            backdropFilter: "blur(10px)",
            border: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: mutedColor, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            padding: "16px 20px",
            borderRadius: "14px",
            background: cardBg,
            backdropFilter: "blur(10px)",
            border: `1px solid ${border}`,
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: textColor }}>Today's progress</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#ff6b9d" }}>{completionPct}%</span>
          </div>
          <div style={{ height: "6px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", borderRadius: "3px", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #ff6b9d, #ff99cc)",
                borderRadius: "3px",
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Task list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              height: "80px", borderRadius: "16px",
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
        </div>
      ) : tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: "center",
            padding: "56px 28px",
            background: cardBg,
            backdropFilter: "blur(12px)",
            borderRadius: "24px",
            border: `1px solid ${border}`,
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "14px" }}>✨</div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: textColor }}>
            You're all clear
          </h3>
          <p style={{ fontSize: "14px", color: mutedColor, margin: "0 0 24px", lineHeight: 1.6, maxWidth: "320px", marginLeft: "auto", marginRight: "auto" }}>
            No tasks due today. Add something or enjoy the peace!
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGoToTasks}
            style={{
              padding: "11px 28px",
              background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
              border: "none", borderRadius: "999px",
              color: "white", cursor: "pointer",
              fontSize: "14px", fontWeight: 700,
              boxShadow: "0 4px 16px rgba(255,107,157,0.35)",
              fontFamily: "inherit",
            }}
          >
            Go to all tasks →
          </motion.button>
        </motion.div>
      ) : (
        <div>
          {/* Pending tasks */}
          {tasks.filter((t) => !t.completed).length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                Pending · {tasks.filter((t) => !t.completed).length}
              </h2>
              <AnimatePresence>
                {tasks.filter((t) => !t.completed).map((task, i) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    index={i}
                    categories={categories}
                    onToggle={toggleComplete}
                    onDelete={deleteTask}
                    isDark={isDark}
                    textColor={textColor}
                    mutedColor={mutedColor}
                    cardBg={cardBg}
                    border={border}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Completed tasks */}
          {tasks.filter((t) => t.completed).length > 0 && (
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                Completed · {tasks.filter((t) => t.completed).length}
              </h2>
              <AnimatePresence>
                {tasks.filter((t) => t.completed).map((task, i) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    index={i}
                    categories={categories}
                    onToggle={toggleComplete}
                    onDelete={deleteTask}
                    isDark={isDark}
                    textColor={textColor}
                    mutedColor={mutedColor}
                    cardBg={cardBg}
                    border={border}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Quick nav to tasks */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: "center", marginTop: "32px" }}
        >
          <button
            onClick={onGoToTasks}
            style={{
              background: "none", border: "none",
              color: "#ff6b9d", cursor: "pointer",
              fontSize: "13px", fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            View all tasks →
          </button>
        </motion.div>
      )}
    </div>
  );
}

function TaskRow({ task, index, categories, onToggle, onDelete, isDark, textColor, mutedColor, cardBg, border }) {
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const cat = categories.find((c) => c.id === task.categoryId);
  const today = new Date().toISOString().split("T")[0];
  const overdue = task.dueDate && task.dueDate < today && !task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ delay: index * 0.05 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "16px 18px",
        borderRadius: "16px",
        background: task.completed
          ? (isDark ? "rgba(15,23,42,0.3)" : "rgba(255,255,255,0.5)")
          : cardBg,
        backdropFilter: "blur(10px)",
        border: `1px solid ${overdue ? "rgba(244,63,94,0.25)" : border}`,
        borderLeft: `3px solid ${task.completed ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)") : pm.color}`,
        marginBottom: "10px",
        opacity: task.completed ? 0.65 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Checkbox */}
      <motion.div
        whileTap={{ scale: 0.88 }}
        transition={TICK_SPRING}
        onClick={() => onToggle(task)}
        style={{
          width: "22px", height: "22px",
          borderRadius: "7px", flexShrink: 0, marginTop: "1px",
          border: `2px solid ${task.completed ? "#10b981" : (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)")}`,
          background: task.completed ? "linear-gradient(135deg,#10b981,#34d399)" : "transparent",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {task.completed && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={TICK_SPRING}
            style={{ color: "white", fontSize: "12px", fontWeight: 800 }}
          >✓</motion.span>
        )}
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: "15px", fontWeight: 600,
          color: textColor,
          textDecoration: task.completed ? "line-through" : "none",
          display: "block", marginBottom: "6px",
        }}>
          {task.title}
        </span>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          {/* Priority */}
          <span style={{
            fontSize: "10px", fontWeight: 600,
            padding: "2px 8px", borderRadius: "20px",
            background: pm.bg, color: pm.color,
          }}>
            {pm.dot} {pm.label}
          </span>

          {/* Category */}
          {cat && (
            <span style={{
              fontSize: "10px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "20px",
              background: `${cat.color}18`, color: cat.color,
            }}>
              {cat.icon} {cat.name}
            </span>
          )}

          {/* Due time */}
          {task.startTime && (
            <span style={{ fontSize: "10px", color: mutedColor }}>
              ⏰ {formatTime(task.startTime)}{task.endTime ? ` – ${formatTime(task.endTime)}` : ""}
            </span>
          )}

          {/* Overdue */}
          {overdue && (
            <span style={{
              fontSize: "10px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "20px",
              background: "rgba(244,63,94,0.1)", color: "#f43f5e",
            }}>
              ⚠️ Overdue
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(task.id)}
        style={{
          width: "28px", height: "28px", flexShrink: 0,
          borderRadius: "8px",
          background: isDark ? "rgba(244,63,94,0.1)" : "rgba(244,63,94,0.07)",
          border: "none", cursor: "pointer",
          color: "#f43f5e", fontSize: "12px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >✕</motion.button>
    </motion.div>
  );
}