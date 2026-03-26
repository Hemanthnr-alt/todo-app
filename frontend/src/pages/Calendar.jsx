import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import toast from "react-hot-toast";

const PRIORITY_META = {
  high:   { color: "#f43f5e", bg: "rgba(244,63,94,0.15)",  label: "High",   dot: "🔴" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "Medium", dot: "🟡" },
  low:    { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "Low",    dot: "🟢" },
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function fmtHour(h) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function fmtTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtTimeRange(s, e) {
  if (!s && !e) return null;
  if (s && !e) return fmtTime(s);
  if (!s && e) return `Until ${fmtTime(e)}`;
  return `${fmtTime(s)} – ${fmtTime(e)}`;
}

const todayStr = () => new Date().toISOString().split("T")[0];
const isToday = (date) => date.toDateString() === new Date().toDateString();

const BLANK_FORM = {
  title: "", description: "", categoryId: "", priority: "medium",
  dueDate: "", startTime: "", endTime: "",
};

export default function Calendar() {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg = isDark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)";
  const border = isDark ? "rgba(255,107,157,0.1)" : "rgba(255,107,157,0.15)";

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    borderRadius: "10px",
    border: `1px solid ${border}`,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
    color: textColor, fontSize: "13px",
    fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
  };

  const loadData = useCallback(async () => {
    try {
      const [tr, cr] = await Promise.all([api.get("/tasks"), api.get("/categories")]);
      setTasks(tr.data);
      setCategories(cr.data);
    } catch {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (showAddModal || showDetailModal) return;
      if (e.key === "ArrowLeft") navigateDay(-1);
      if (e.key === "ArrowRight") navigateDay(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDate, showAddModal, showDetailModal]);

  const navigateDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
    setCurrentDate(d);
  };

  const changeMonth = (delta) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  const getTasksForDate = (date) => {
    const s = date.toISOString().split("T")[0];
    return tasks.filter((t) => t.dueDate === s);
  };

  const openAdd = (date) => {
    setForm({ ...BLANK_FORM, dueDate: date.toISOString().split("T")[0], startTime: "09:00", endTime: "10:00" });
    setShowAddModal(true);
  };

  const saveTask = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.dueDate) { toast.error("Due date is required"); return; }
    setSaving(true);
    try {
      const res = await api.post("/tasks", {
        title: form.title.trim(),
        description: form.description,
        priority: form.priority,
        categoryId: form.categoryId || null,
        dueDate: form.dueDate,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
      });
      setTasks((prev) => [res.data, ...prev]);
      setShowAddModal(false);
      setForm(BLANK_FORM);
      toast.success("Task added to calendar! 📅");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setShowDetailModal(false);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const toggleComplete = async (task) => {
    try {
      const res = await api.put(`/tasks/${task.id}`, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => t.id === task.id ? res.data : t));
      if (res.data.completed) toast.success("Task completed! 🎊");
    } catch {
      toast.error("Failed to update task");
    }
  };

  // ── Month view ─────────────────────────────────────────
  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), cur: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), cur: true });
    }
    while (days.length < 42) {
      days.push({ date: new Date(year, month + 1, days.length - firstDay - daysInMonth + 1), cur: false });
    }

    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "8px" }}>
          {WEEK_DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: "12px", fontWeight: 600, color: mutedColor, padding: "8px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "6px" }}>
          {days.map((day, i) => {
            const dayTasks = getTasksForDate(day.date);
            const isSelected = day.date.toDateString() === selectedDate.toDateString();
            const today = isToday(day.date);
            return (
              <div
                key={i}
                onClick={() => { setSelectedDate(day.date); setCurrentDate(day.date); }}
                onDoubleClick={() => openAdd(day.date)}
                style={{
                  minHeight: "100px", padding: "8px",
                  borderRadius: "12px", cursor: "pointer",
                  background: isSelected
                    ? (isDark ? "rgba(255,107,157,0.2)" : "rgba(255,107,157,0.12)")
                    : (isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.6)"),
                  border: today
                    ? "2px solid #ff6b9d"
                    : `1px solid ${border}`,
                  opacity: day.cur ? 1 : 0.4,
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{
                    fontSize: "13px", fontWeight: today ? 700 : 500,
                    color: today ? "#ff6b9d" : textColor,
                    width: "24px", height: "24px",
                    borderRadius: "50%",
                    background: today ? "rgba(255,107,157,0.12)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {day.date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span style={{
                      fontSize: "9px", fontWeight: 700,
                      background: "rgba(255,107,157,0.2)", color: "#ff6b9d",
                      padding: "1px 5px", borderRadius: "8px",
                    }}>{dayTasks.length}</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {dayTasks.slice(0, 3).map((t) => {
                    const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                    return (
                      <div
                        key={t.id}
                        onClick={(e) => { e.stopPropagation(); setEditingTask(t); setShowDetailModal(true); }}
                        style={{
                          fontSize: "10px", fontWeight: 500,
                          padding: "2px 6px", borderRadius: "5px",
                          background: pm.bg, color: pm.color,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          borderLeft: `2px solid ${pm.color}`,
                        }}
                      >
                        {t.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div style={{ fontSize: "9px", color: mutedColor, paddingLeft: "4px" }}>+{dayTasks.length - 3} more</div>
                  )}
                </div>
                {/* Quick add on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); openAdd(day.date); }}
                  className="cal-quick-add"
                  style={{
                    position: "absolute", bottom: "6px", right: "6px",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: "rgba(255,107,157,0.3)", border: "none",
                    color: "white", cursor: "pointer", fontSize: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0, transition: "opacity 0.15s",
                  }}
                >+</button>
              </div>
            );
          })}
        </div>
        <style>{`.cal-quick-add:hover { opacity: 1 !important; } div:hover > .cal-quick-add { opacity: 0.7 !important; }`}</style>
      </div>
    );
  };

  // ── Day view ───────────────────────────────────────────
  const renderDay = () => {
    const dayTasks = getTasksForDate(selectedDate);
    const byHour = {};
    dayTasks.forEach((t) => {
      const h = t.startTime ? parseInt(t.startTime.split(":")[0]) : null;
      if (h !== null) { if (!byHour[h]) byHour[h] = []; byHour[h].push(t); }
    });
    const noTimeTasks = dayTasks.filter((t) => !t.startTime);

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: textColor }}>
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            <p style={{ fontSize: "12px", color: mutedColor, margin: "3px 0 0" }}>{dayTasks.length} tasks</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => openAdd(selectedDate)}
            style={{
              padding: "8px 16px", borderRadius: "10px",
              background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
              border: "none", color: "white",
              cursor: "pointer", fontSize: "13px", fontWeight: 600,
              fontFamily: "inherit",
            }}
          >+ Add</motion.button>
        </div>

        {/* All-day tasks */}
        {noTimeTasks.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", color: mutedColor, fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>All day</div>
            {noTimeTasks.map((t) => {
              const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
              return (
                <div
                  key={t.id}
                  onClick={() => { setEditingTask(t); setShowDetailModal(true); }}
                  style={{
                    padding: "8px 12px", borderRadius: "8px",
                    background: pm.bg, borderLeft: `3px solid ${pm.color}`,
                    marginBottom: "6px", cursor: "pointer", fontSize: "13px",
                    color: pm.color, fontWeight: 500,
                  }}
                >{t.title}</div>
              );
            })}
          </div>
        )}

        {/* Hourly grid */}
        <div style={{ border: `1px solid ${border}`, borderRadius: "14px", overflow: "hidden" }}>
          {HOURS.map((h) => {
            const hTasks = byHour[h] || [];
            const isNow = new Date().getHours() === h && selectedDate.toDateString() === new Date().toDateString();
            return (
              <div key={h} style={{
                display: "flex", minHeight: "56px",
                borderBottom: `1px solid ${border}`,
                background: isNow ? (isDark ? "rgba(255,107,157,0.04)" : "rgba(255,107,157,0.03)") : "transparent",
              }}>
                <div style={{
                  width: "64px", flexShrink: 0, padding: "8px 10px",
                  fontSize: "11px", fontWeight: 500,
                  color: isNow ? "#ff6b9d" : mutedColor,
                  borderRight: `1px solid ${border}`,
                  display: "flex", alignItems: "flex-start",
                }}>
                  {fmtHour(h)}
                </div>
                <div style={{ flex: 1, padding: "4px 8px", position: "relative", display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "flex-start" }}>
                  {hTasks.map((t) => {
                    const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                    const timeRange = fmtTimeRange(t.startTime, t.endTime);
                    return (
                      <div
                        key={t.id}
                        onClick={() => { setEditingTask(t); setShowDetailModal(true); }}
                        style={{
                          padding: "6px 10px", borderRadius: "8px",
                          background: pm.bg, borderLeft: `3px solid ${pm.color}`,
                          cursor: "pointer", fontSize: "12px", fontWeight: 500,
                          color: pm.color, maxWidth: "200px",
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        {timeRange && <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>{timeRange}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Agenda view ────────────────────────────────────────
  const renderAgenda = () => {
    const sorted = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const grouped = {};
    sorted.forEach((t) => {
      if (!t.dueDate) return;
      if (!grouped[t.dueDate]) grouped[t.dueDate] = [];
      grouped[t.dueDate].push(t);
    });

    if (Object.keys(grouped).length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
          <p style={{ color: mutedColor, fontSize: "15px" }}>No tasks scheduled. Double-click any date to add one.</p>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {Object.entries(grouped).map(([dateStr, dateTasks]) => {
          const d = new Date(dateStr + "T00:00:00");
          const today = isToday(d);
          const past = d < new Date() && !today;
          return (
            <div key={dateStr}>
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                marginBottom: "10px", paddingBottom: "8px",
                borderBottom: `1px solid ${border}`,
              }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: today ? "#ff6b9d" : textColor }}>
                  {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
                {today && <span style={{ padding: "2px 8px", borderRadius: "20px", background: "rgba(255,107,157,0.15)", color: "#ff6b9d", fontSize: "10px", fontWeight: 700 }}>Today</span>}
                {past && <span style={{ padding: "2px 8px", borderRadius: "20px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", color: mutedColor, fontSize: "10px" }}>Past</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dateTasks.map((t) => {
                  const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const timeRange = fmtTimeRange(t.startTime, t.endTime);
                  return (
                    <div
                      key={t.id}
                      onClick={() => { setEditingTask(t); setShowDetailModal(true); }}
                      style={{
                        display: "flex", gap: "14px", alignItems: "flex-start",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: cardBg, backdropFilter: "blur(10px)",
                        border: `1px solid ${border}`,
                        borderLeft: `3px solid ${pm.color}`,
                        cursor: "pointer", opacity: t.completed ? 0.55 : 1,
                      }}
                    >
                      <div style={{ width: "90px", flexShrink: 0 }}>
                        <div style={{ fontSize: "12px", color: mutedColor }}>{timeRange || "All day"}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: textColor, textDecoration: t.completed ? "line-through" : "none", marginBottom: "4px" }}>{t.title}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "10px", background: pm.bg, color: pm.color, fontWeight: 600 }}>{pm.dot} {pm.label}</span>
                          {cat && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "10px", background: `${cat.color}18`, color: cat.color, fontWeight: 600 }}>{cat.icon} {cat.name}</span>}
                        </div>
                      </div>
                      <span style={{ color: pm.color, fontSize: "14px" }}>{pm.dot}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Mini calendar (sidebar) ────────────────────────────
  const renderMini = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return (
      <div style={{ padding: "16px", borderRadius: "16px", background: cardBg, backdropFilter: "blur(10px)", border: `1px solid ${border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: textColor, fontSize: "14px" }}>◀</button>
          <span style={{ fontSize: "13px", fontWeight: 700, color: textColor }}>
            {currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
          <button onClick={() => changeMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", color: textColor, fontSize: "14px" }}>▶</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "6px" }}>
          {WEEK_DAYS.map((d) => <div key={d} style={{ textAlign: "center", fontSize: "9px", fontWeight: 600, color: mutedColor, padding: "2px 0" }}>{d[0]}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={i} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(year, month, i + 1);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const today = isToday(date);
            const hasTasks = getTasksForDate(date).length > 0;
            return (
              <button
                key={i}
                onClick={() => { setSelectedDate(date); setCurrentDate(date); }}
                style={{
                  position: "relative",
                  aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%", fontSize: "11px", cursor: "pointer",
                  background: isSelected ? "#ff6b9d" : "transparent",
                  color: isSelected ? "white" : today ? "#ff6b9d" : textColor,
                  border: today && !isSelected ? "1px solid rgba(255,107,157,0.5)" : "none",
                  fontWeight: today || isSelected ? 700 : 400,
                }}
              >
                {i + 1}
                {hasTasks && !isSelected && (
                  <span style={{ position: "absolute", bottom: "1px", left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: "#ff6b9d" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Modal helpers ──────────────────────────────────────
  const ModalOverlay = ({ children, onClose }) => (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 1000 }} />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "90%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto",
          background: isDark ? "#0f172a" : "#ffffff",
          borderRadius: "24px", padding: "28px",
          border: `1px solid ${border}`,
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          zIndex: 1001, fontFamily: "inherit",
        }}
      >{children}</motion.div>
    </>
  );

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "24px 20px", fontFamily: "'DM Sans', sans-serif", color: textColor }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.04em" }}>
            <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Calendar</span>
          </h1>
          <p style={{ fontSize: "13px", color: mutedColor, margin: "4px 0 0" }}>
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · ← → to navigate
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
            style={{ padding: "8px 16px", borderRadius: "10px", border: `1px solid ${border}`, background: "transparent", color: textColor, cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
            Today
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => openAdd(selectedDate)}
            style={{ padding: "8px 18px", borderRadius: "10px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", border: "none", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 14px rgba(255,107,157,0.3)" }}>
            + Add Task
          </motion.button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* Sidebar */}
        <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {renderMini()}

          {/* Upcoming list */}
          <div style={{ padding: "16px", borderRadius: "16px", background: cardBg, backdropFilter: "blur(10px)", border: `1px solid ${border}` }}>
            <h3 style={{ fontSize: "12px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>Upcoming</h3>
            {tasks.filter((t) => !t.completed).slice(0, 5).map((t) => {
              const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
              return (
                <div key={t.id} onClick={() => { setEditingTask(t); setShowDetailModal(true); }}
                  style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "6px 0", cursor: "pointer", borderBottom: `1px solid ${border}` }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: pm.color, flexShrink: 0, marginTop: "5px" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 500, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: "10px", color: mutedColor }}>{t.dueDate}</div>
                  </div>
                </div>
              );
            })}
            {tasks.filter((t) => !t.completed).length === 0 && <p style={{ fontSize: "12px", color: mutedColor, textAlign: "center", padding: "10px 0" }}>All done! 🎉</p>}
          </div>
        </div>

        {/* Main area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* View tabs + month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "4px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: "12px", padding: "4px" }}>
              {["month", "day", "agenda"].map((v) => (
                <motion.button key={v} whileTap={{ scale: 0.96 }} onClick={() => setViewMode(v)}
                  style={{
                    padding: "7px 16px", borderRadius: "9px",
                    border: "none", cursor: "pointer",
                    background: viewMode === v ? (isDark ? "#1e293b" : "white") : "transparent",
                    color: viewMode === v ? textColor : mutedColor,
                    fontSize: "13px", fontWeight: viewMode === v ? 600 : 400,
                    boxShadow: viewMode === v ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    fontFamily: "inherit",
                  }}
                >
                  {v === "month" ? "Month" : v === "day" ? "Day" : "Agenda"}
                </motion.button>
              ))}
            </div>

            {viewMode !== "agenda" && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={() => viewMode === "month" ? changeMonth(-1) : navigateDay(-1)}
                  style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${border}`, background: "transparent", cursor: "pointer", color: textColor, fontSize: "14px" }}>◀</button>
                <span style={{ fontSize: "14px", fontWeight: 600, color: textColor, minWidth: "160px", textAlign: "center" }}>
                  {viewMode === "month"
                    ? currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <button onClick={() => viewMode === "month" ? changeMonth(1) : navigateDay(1)}
                  style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${border}`, background: "transparent", cursor: "pointer", color: textColor, fontSize: "14px" }}>▶</button>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: "36px", height: "36px", border: "3px solid rgba(255,107,157,0.2)", borderTopColor: "#ff6b9d", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ color: mutedColor, fontSize: "13px" }}>Loading calendar…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={viewMode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {viewMode === "month" && renderMonth()}
                {viewMode === "day" && renderDay()}
                {viewMode === "agenda" && renderAgenda()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Add task modal */}
      <AnimatePresence>
        {showAddModal && (
          <ModalOverlay onClose={() => setShowAddModal(false)}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 20px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Add Task
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input autoFocus placeholder="Task title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && saveTask()} style={inputStyle} />
              <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "4px" }}>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "4px" }}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "4px" }}>Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "4px" }}>End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "4px" }}>Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={inputStyle}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, ...inputStyle, cursor: "pointer", textAlign: "center" }}>Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={saveTask} disabled={saving}
                  style={{ flex: 2, padding: "11px", borderRadius: "10px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", border: "none", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: 700, fontFamily: "inherit" }}>
                  {saving ? "Adding…" : "Add Task"}
                </motion.button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Task detail modal */}
      <AnimatePresence>
        {showDetailModal && editingTask && (
          <ModalOverlay onClose={() => setShowDetailModal(false)}>
            {(() => {
              const pm = PRIORITY_META[editingTask.priority] || PRIORITY_META.medium;
              const cat = categories.find((c) => c.id === editingTask.categoryId);
              const timeRange = fmtTimeRange(editingTask.startTime, editingTask.endTime);
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "19px", fontWeight: 700, color: textColor, margin: 0, flex: 1, paddingRight: "12px", textDecoration: editingTask.completed ? "line-through" : "none", opacity: editingTask.completed ? 0.6 : 1 }}>
                      {editingTask.title}
                    </h2>
                    <button onClick={() => setShowDetailModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: mutedColor, flexShrink: 0 }}>✕</button>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: pm.bg, color: pm.color, fontWeight: 600 }}>{pm.dot} {pm.label}</span>
                    {cat && <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: `${cat.color}18`, color: cat.color, fontWeight: 600 }}>{cat.icon} {cat.name}</span>}
                    {editingTask.completed && <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 600 }}>✓ Completed</span>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                    {editingTask.dueDate && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ fontSize: "13px", color: mutedColor, width: "80px", flexShrink: 0 }}>📅 Due</span>
                        <span style={{ fontSize: "13px", color: textColor, fontWeight: 500 }}>{editingTask.dueDate}</span>
                      </div>
                    )}
                    {timeRange && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ fontSize: "13px", color: mutedColor, width: "80px", flexShrink: 0 }}>⏰ Time</span>
                        <span style={{ fontSize: "13px", color: textColor, fontWeight: 500 }}>{timeRange}</span>
                      </div>
                    )}
                    {editingTask.description && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ fontSize: "13px", color: mutedColor, width: "80px", flexShrink: 0 }}>📝 Notes</span>
                        <span style={{ fontSize: "13px", color: textColor, lineHeight: 1.5 }}>{editingTask.description}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => toggleComplete(editingTask)}
                      style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${border}`, background: "transparent", color: textColor, cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "inherit" }}>
                      {editingTask.completed ? "↩ Undo" : "✓ Complete"}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => deleteTask(editingTask.id)}
                      style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#f43f5e", cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "inherit" }}>
                      🗑 Delete
                    </motion.button>
                  </div>
                </>
              );
            })()}
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}