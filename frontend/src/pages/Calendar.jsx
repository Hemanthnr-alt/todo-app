import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import toast from "react-hot-toast";
import api from "../services/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PRIORITY_META = {
  high:   { color: "#f43f5e", dot: "🔴" },
  medium: { color: "#f59e0b", dot: "🟡" },
  low:    { color: "#10b981", dot: "🟢" },
};

export default function Calendar() {
  const { isDark } = useTheme();
  const { tasks, categories, loading, addTask, updateTask, deleteTask } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg = isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.9)";
  const border = isDark ? "rgba(255,107,157,0.12)" : "rgba(255,107,157,0.18)";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const today = new Date().toISOString().split("T")[0];

  const getTasksForDate = (dateStr) => tasks.filter((t) => t.dueDate === dateStr);

  const formatDateStr = (y, m, d) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedDate) return;
    setAddingTask(true);
    await addTask({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      categoryId: newTaskCategory || null,
      dueDate: selectedDate,
    });
    setNewTaskTitle("");
    setNewTaskPriority("medium");
    setNewTaskCategory("");
    setShowAddModal(false);
    setAddingTask(false);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(today); };

  // Build calendar grid
  const calendarCells = [];
  // Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({ day: prevMonthDays - i, isCurrentMonth: false, dateStr: null });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, isCurrentMonth: true, dateStr: formatDateStr(year, month, d) });
  }
  // Next month leading days
  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    calendarCells.push({ day: d, isCurrentMonth: false, dateStr: null });
  }

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const inputStyle = {
    padding: "10px 14px", borderRadius: "10px",
    border: `1px solid ${border}`,
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.9)",
    color: textColor, fontSize: "13px", fontFamily: "inherit", outline: "none",
    width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 20px", fontFamily: "'DM Sans', sans-serif", color: textColor }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.04em" }}>
            <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Calendar</span>
          </h1>
          <p style={{ fontSize: "13px", color: mutedColor, margin: 0 }}>
            {tasks.filter(t => t.dueDate?.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length} tasks this month
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={goToToday}
            style={{ padding: "8px 16px", borderRadius: "10px", border: `1px solid ${border}`, background: "rgba(255,107,157,0.1)", color: "#ff6b9d", cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "inherit" }}>
            Today
          </motion.button>
          <motion.button whileTap={{ scale: 0.92 }} onClick={prevMonth}
            style={{ width: "36px", height: "36px", borderRadius: "10px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", cursor: "pointer", color: textColor, fontSize: "16px" }}>‹</motion.button>
          <span style={{ fontSize: "15px", fontWeight: 700, minWidth: "140px", textAlign: "center" }}>{MONTHS[month]} {year}</span>
          <motion.button whileTap={{ scale: 0.92 }} onClick={nextMonth}
            style={{ width: "36px", height: "36px", borderRadius: "10px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", cursor: "pointer", color: textColor, fontSize: "16px" }}>›</motion.button>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>
        {/* Calendar Grid */}
        <div style={{ background: cardBg, backdropFilter: "blur(12px)", borderRadius: "20px", border: `1px solid ${border}`, overflow: "hidden" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${border}` }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: "12px 0", textAlign: "center", fontSize: "11px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {calendarCells.map((cell, i) => {
              const isToday = cell.dateStr === today;
              const isSelected = cell.dateStr === selectedDate;
              const cellTasks = cell.dateStr ? getTasksForDate(cell.dateStr) : [];
              const hasOverdue = cellTasks.some(t => !t.completed);

              return (
                <motion.div
                  key={i}
                  whileHover={cell.isCurrentMonth ? { scale: 1.02 } : {}}
                  onClick={() => { if (cell.isCurrentMonth && cell.dateStr) setSelectedDate(cell.dateStr); }}
                  style={{
                    minHeight: "80px", padding: "8px", cursor: cell.isCurrentMonth ? "pointer" : "default",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                    borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                    background: isSelected ? "rgba(255,107,157,0.12)" : isToday ? "rgba(255,107,157,0.06)" : "transparent",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                >
                  {/* Day number */}
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: isToday ? 800 : 500,
                    background: isToday ? "linear-gradient(135deg,#ff6b9d,#ff99cc)" : "transparent",
                    color: isToday ? "white" : cell.isCurrentMonth ? textColor : mutedColor,
                    marginBottom: "4px",
                  }}>{cell.day}</div>

                  {/* Task dots */}
                  {cellTasks.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                      {cellTasks.slice(0, 3).map((t, ti) => (
                        <div key={ti} style={{
                          width: "6px", height: "6px", borderRadius: "50%",
                          background: PRIORITY_META[t.priority]?.color || "#ff6b9d",
                          opacity: t.completed ? 0.4 : 1,
                        }} />
                      ))}
                      {cellTasks.length > 3 && (
                        <span style={{ fontSize: "9px", color: mutedColor }}>+{cellTasks.length - 3}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div>
          {/* Selected day tasks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: cardBg, backdropFilter: "blur(12px)", borderRadius: "16px", border: `1px solid ${border}`, overflow: "hidden", marginBottom: "12px" }}
          >
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: textColor }}>
                  {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Select a day"}
                </div>
                {selectedDate && <div style={{ fontSize: "11px", color: mutedColor }}>{selectedTasks.length} tasks</div>}
              </div>
              {selectedDate && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)}
                  style={{ padding: "6px 12px", borderRadius: "8px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", border: "none", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: "inherit" }}>
                  + Add
                </motion.button>
              )}
            </div>

            <div style={{ maxHeight: "380px", overflowY: "auto", padding: "8px" }}>
              {!selectedDate ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: mutedColor, fontSize: "13px" }}>Click a date to view tasks</div>
              ) : selectedTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌿</div>
                  <p style={{ fontSize: "13px", color: mutedColor }}>No tasks on this day</p>
                </div>
              ) : (
                <AnimatePresence>
                  {selectedTasks.map((task, i) => {
                    const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                    const cat = categories.find(c => c.id === task.categoryId);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                          borderRadius: "10px", marginBottom: "6px",
                          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                          borderLeft: `3px solid ${pm.color}`,
                        }}
                      >
                        <div
                          onClick={() => updateTask(task.id, { completed: !task.completed })}
                          style={{
                            width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                            border: `2px solid ${task.completed ? "#10b981" : "rgba(255,255,255,0.25)"}`,
                            background: task.completed ? "#10b981" : "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {task.completed && <span style={{ color: "white", fontSize: "10px" }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: textColor, textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.5 : 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {task.title}
                          </div>
                          {cat && <div style={{ fontSize: "10px", color: cat.color, marginTop: "2px" }}>{cat.icon} {cat.name}</div>}
                        </div>
                        <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer", fontSize: "11px", flexShrink: 0 }}>✕</button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* Month stats */}
          <div style={{ background: cardBg, backdropFilter: "blur(12px)", borderRadius: "16px", border: `1px solid ${border}`, padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>Month Overview</div>
            {(() => {
              const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
              const monthTasks = tasks.filter(t => t.dueDate?.startsWith(monthStr));
              const done = monthTasks.filter(t => t.completed).length;
              const pct = monthTasks.length > 0 ? Math.round((done / monthTasks.length) * 100) : 0;
              return (
                <>
                  {[
                    { label: "Total", value: monthTasks.length, color: "#ff6b9d" },
                    { label: "Done", value: done, color: "#10b981" },
                    { label: "Pending", value: monthTasks.length - done, color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
                      <span style={{ fontSize: "12px", color: mutedColor }}>{s.label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: mutedColor }}>Completion</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#ff6b9d" }}>{pct}%</span>
                    </div>
                    <div style={{ height: "4px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
                        style={{ height: "100%", background: "linear-gradient(90deg,#ff6b9d,#ff99cc)", borderRadius: "2px" }} />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Add Task Modal — via Portal, always centered */}
      <CenteredModal
        isOpen={showAddModal && !!selectedDate}
        onClose={() => setShowAddModal(false)}
        title="Add Task"
        maxWidth="380px"
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <p style={{ fontSize: "12px", color: mutedColor, margin: "0 0 16px" }}>
            {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input autoFocus placeholder="Task title *" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddTask()}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
            <CustomSelect
              value={newTaskPriority}
              onChange={setNewTaskPriority}
              options={[
                { value: "high",   label: "🔴 High"   },
                { value: "medium", label: "🟡 Medium" },
                { value: "low",    label: "🟢 Low"    },
              ]}
            />
            <CustomSelect
              value={newTaskCategory}
              onChange={setNewTaskCategory}
              options={[
                { value: "", label: "No category" },
                ...categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })),
              ]}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => setShowAddModal(false)}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${border}`, background: "transparent", color: textColor, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddTask} disabled={addingTask}
              style={{ flex: 2, padding: "10px", borderRadius: "10px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", border: "none", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "inherit" }}>
              {addingTask ? "Adding…" : "Add Task"}
            </motion.button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}
