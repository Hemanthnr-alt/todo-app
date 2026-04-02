import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_FULL  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_SHORT = ["S","M","T","W","T","F","S"];

const PRIORITY_META = {
  high:   { color: "#f43f5e" },
  medium: { color: "#f59e0b" },
  low:    { color: "#10b981" },
};

// Helper: convert hex to rgba with opacity
function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function Calendar() {
  const { isDark, accent } = useTheme();
  const ac = accent || "#ff6b9d";

  const { tasks, categories, addTask, updateTask, deleteTask } = useTasks();

  const [currentDate,    setCurrentDate]    = useState(new Date());
  const [selectedDate,   setSelectedDate]   = useState(null);
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [newTaskTitle,   setNewTaskTitle]   = useState("");
  const [newTaskPriority,setNewTaskPriority]= useState("medium");
  const [newTaskCategory,setNewTaskCategory]= useState("");
  const [addingTask,     setAddingTask]     = useState(false);
  const [showDaySheet,   setShowDaySheet]   = useState(false);

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.7)"     : "rgba(255,255,255,0.9)";
  const border     = hexToRgba(ac, isDark ? 0.12 : 0.18);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().toISOString().split("T")[0];

  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const prevMonthDays= new Date(year, month, 0).getDate();

  const fmt = (y, m, d) =>
    `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const getTasksForDate = (ds) => tasks.filter(t => t.dueDate === ds);

  // Build 42-cell grid
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevMonthDays - i, current: false, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true, dateStr: fmt(year, month, d) });
  while (cells.length < 42)
    cells.push({ day: cells.length - firstDay - daysInMonth + 1, current: false, dateStr: null });

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedDate) return;
    setAddingTask(true);
    await addTask({ title: newTaskTitle.trim(), priority: newTaskPriority, categoryId: newTaskCategory || null, dueDate: selectedDate });
    setNewTaskTitle(""); setNewTaskPriority("medium"); setNewTaskCategory("");
    setShowAddModal(false); setAddingTask(false);
  };

  const handleDayClick = (cell) => {
    if (!cell.current || !cell.dateStr) return;
    setSelectedDate(cell.dateStr);
    setShowDaySheet(true);
  };

  const inputStyle = {
    padding: "10px 14px", borderRadius: "10px",
    border: `1px solid ${border}`,
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.9)",
    color: textColor, fontSize: "13px", fontFamily: "inherit", outline: "none",
    width: "100%", boxSizing: "border-box",
  };

  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;
  const monthTasks = tasks.filter(t => t.dueDate?.startsWith(monthStr));
  const done = monthTasks.filter(t => t.completed).length;
  const pct  = monthTasks.length > 0 ? Math.round((done/monthTasks.length)*100) : 0;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px 12px", fontFamily: "'DM Sans',sans-serif", color: textColor }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(22px,5vw,28px)", fontWeight: 800, margin: 0, letterSpacing: "-0.04em" }}>
            <span style={{ background: `linear-gradient(135deg,${ac},${ac}cc)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Calendar</span>
          </h1>
          <p style={{ fontSize: "12px", color: mutedColor, margin: 0 }}>{monthTasks.length} tasks this month</p>
        </div>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setCurrentDate(new Date(year, month-1, 1))}
            style={{ width: "34px", height: "34px", borderRadius: "10px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", cursor: "pointer", color: textColor, fontSize: "16px" }}>‹</motion.button>
          <span style={{ fontSize: "14px", fontWeight: 700, minWidth: "110px", textAlign: "center" }}>{MONTHS[month].slice(0,3)} {year}</span>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setCurrentDate(new Date(year, month+1, 1))}
            style={{ width: "34px", height: "34px", borderRadius: "10px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", cursor: "pointer", color: textColor, fontSize: "16px" }}>›</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrentDate(new Date()); setSelectedDate(today); }}
            style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: hexToRgba(ac, 0.1), color: ac, cursor: "pointer", fontSize: "12px", fontWeight: 600, fontFamily: "inherit" }}>
            Today
          </motion.button>
        </div>
      </div>

      {/* Month stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "14px" }}>
        {[
          { label: "Total", value: monthTasks.length, color: ac },
          { label: "Done",  value: done,              color: "#10b981" },
          { label: `${pct}% done`, value: monthTasks.length - done, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ padding: "10px 12px", borderRadius: "12px", background: cardBg, backdropFilter: "blur(10px)", border: `1px solid ${border}` }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: mutedColor }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ background: cardBg, backdropFilter: "blur(12px)", borderRadius: "16px", border: `1px solid ${border}`, overflow: "hidden" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: `1px solid ${border}` }}>
          {DAYS_FULL.map((d, i) => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: "10px", fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span className="day-full">{d}</span>
              <span className="day-short">{DAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {cells.map((cell, i) => {
            const isToday    = cell.dateStr === today;
            const isSelected = cell.dateStr === selectedDate;
            const cellTasks  = cell.dateStr ? getTasksForDate(cell.dateStr) : [];

            return (
              <motion.div
                key={i}
                whileTap={cell.current ? { scale: 0.94 } : {}}
                onClick={() => handleDayClick(cell)}
                style={{
                  minHeight: "clamp(52px, 10vw, 80px)",
                  padding: "6px 4px",
                  cursor: cell.current ? "pointer" : "default",
                  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                  borderRight:  `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                  background: isSelected ? hexToRgba(ac, 0.14)
                            : isToday    ? hexToRgba(ac, 0.07)
                            : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div style={{
                  width: "clamp(22px,5vw,26px)", height: "clamp(22px,5vw,26px)",
                  borderRadius: "7px", margin: "0 auto 3px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "clamp(11px,2.5vw,13px)", fontWeight: isToday ? 800 : 500,
                  background: isToday ? `linear-gradient(135deg,${ac},${ac}cc)` : "transparent",
                  color: isToday ? "white" : cell.current ? textColor : mutedColor,
                }}>{cell.day}</div>

                {/* Task dots */}
                {cellTasks.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "2px" }}>
                    {cellTasks.slice(0, 3).map((t, ti) => (
                      <div key={ti} style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: PRIORITY_META[t.priority]?.color || ac,
                        opacity: t.completed ? 0.4 : 1,
                      }} />
                    ))}
                    {cellTasks.length > 3 && (
                      <span style={{ fontSize: "8px", color: mutedColor, lineHeight: 1 }}>+{cellTasks.length - 3}</span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Desktop: side panel */}
      {selectedDate && (
        <div className="calendar-side-desktop" style={{ marginTop: "16px" }}>
          <DayPanel
            selectedDate={selectedDate}
            selectedTasks={selectedTasks}
            categories={categories}
            isDark={isDark} textColor={textColor} mutedColor={mutedColor}
            cardBg={cardBg} border={border} ac={ac}
            onAdd={() => setShowAddModal(true)}
            onToggle={(task) => updateTask(task.id, { completed: !task.completed })}
            onDelete={deleteTask}
          />
        </div>
      )}

      {/* Mobile: bottom sheet for day detail */}
      <AnimatePresence>
        {showDaySheet && selectedDate && (
          <motion.div
            className="mobile-day-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              zIndex: 500,
              background: isDark ? "rgba(8,11,20,0.98)" : "rgba(248,250,252,0.98)",
              backdropFilter: "blur(24px)",
              borderRadius: "20px 20px 0 0",
              border: `1px solid ${border}`,
              paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)",
              maxHeight: "75vh", overflowY: "auto",
            }}
          >
            {/* Sheet handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
            </div>

            {/* Sheet header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 12px" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: textColor }}>
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </div>
                <div style={{ fontSize: "12px", color: mutedColor }}>{selectedTasks.length} tasks</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)}
                  style={{ padding: "7px 14px", borderRadius: "8px", background: `linear-gradient(135deg,${ac},${ac}cc)`, border: "none", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "inherit" }}>
                  + Add
                </motion.button>
                <button onClick={() => setShowDaySheet(false)}
                  style={{ width: "34px", height: "34px", borderRadius: "8px", border: `1px solid ${border}`, background: "none", color: mutedColor, cursor: "pointer", fontSize: "16px" }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Tasks list */}
            <div style={{ padding: "0 12px 12px" }}>
              {selectedTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌿</div>
                  <p style={{ fontSize: "13px", color: mutedColor }}>No tasks on this day</p>
                </div>
              ) : (
                selectedTasks.map((task, i) => {
                  const pm  = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                  const cat = categories.find(c => c.id === task.categoryId);
                  return (
                    <motion.div key={task.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "12px 14px", borderRadius: "12px", marginBottom: "8px",
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        borderLeft: `3px solid ${pm.color}`,
                      }}
                    >
                      <div onClick={() => updateTask(task.id, { completed: !task.completed })}
                        style={{
                          width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                          border: `2px solid ${task.completed ? "#10b981" : "rgba(255,255,255,0.25)"}`,
                          background: task.completed ? "#10b981" : "transparent",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        {task.completed && <span style={{ color: "white", fontSize: "11px" }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: textColor, textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.5 : 1 }}>
                          {task.title}
                        </div>
                        {cat && <div style={{ fontSize: "11px", color: cat.color, marginTop: "2px" }}>{cat.icon} {cat.name}</div>}
                      </div>
                      <button onClick={() => { deleteTask(task.id); }}
                        style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer", fontSize: "14px", padding: "4px" }}>✕</button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile sheet */}
      <AnimatePresence>
        {showDaySheet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDaySheet(false)}
            className="mobile-day-sheet"
            style={{ position: "fixed", inset: 0, zIndex: 499, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          />
        )}
      </AnimatePresence>

      {/* Add task modal */}
      <CenteredModal isOpen={showAddModal && !!selectedDate} onClose={() => setShowAddModal(false)} title="Add Task" maxWidth="380px">
        <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
          <p style={{ fontSize: "12px", color: mutedColor, margin: "0 0 14px" }}>
            {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input autoFocus placeholder="Task title *" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddTask()}
              style={inputStyle} />
            <CustomSelect value={newTaskPriority} onChange={setNewTaskPriority} options={[
              { value: "high", label: "🔴 High" }, { value: "medium", label: "🟡 Medium" }, { value: "low", label: "🟢 Low" },
            ]} />
            <CustomSelect value={newTaskCategory} onChange={setNewTaskCategory} options={[
              { value: "", label: "No category" },
              ...categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })),
            ]} />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => setShowAddModal(false)}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${border}`, background: "transparent", color: textColor, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddTask} disabled={addingTask}
              style={{ flex: 2, padding: "10px", borderRadius: "10px", background: `linear-gradient(135deg,${ac},${ac}cc)`, border: "none", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "inherit" }}>
              {addingTask ? "Adding…" : "Add Task"}
            </motion.button>
          </div>
        </div>
      </CenteredModal>

      <style>{`
        .day-short { display: none; }
        .calendar-side-desktop { display: block; }
        .mobile-day-sheet { display: block; }

        @media (max-width: 600px) {
          .day-full  { display: none; }
          .day-short { display: inline; }
          .calendar-side-desktop { display: none; }
        }
        @media (min-width: 601px) {
          .mobile-day-sheet { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// Reusable day panel (desktop sidebar)
function DayPanel({ selectedDate, selectedTasks, categories, isDark, textColor, mutedColor, cardBg, border, ac, onAdd, onToggle, onDelete }) {
  return (
    <div style={{ background: cardBg, backdropFilter: "blur(12px)", borderRadius: "16px", border: `1px solid ${border}`, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: textColor }}>
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </div>
          <div style={{ fontSize: "11px", color: mutedColor }}>{selectedTasks.length} tasks</div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onAdd}
          style={{ padding: "6px 12px", borderRadius: "8px", background: `linear-gradient(135deg,${ac},${ac}cc)`, border: "none", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: "inherit" }}>
          + Add
        </motion.button>
      </div>
      <div style={{ maxHeight: "300px", overflowY: "auto", padding: "8px" }}>
        {selectedTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🌿</div>
            <p style={{ fontSize: "13px", color: mutedColor }}>No tasks on this day</p>
          </div>
        ) : selectedTasks.map((task, i) => {
          const pm  = { high: "#f43f5e", medium: "#f59e0b", low: "#10b981" };
          const cat = categories.find(c => c.id === task.categoryId);
          return (
            <div key={task.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", borderRadius: "10px", marginBottom: "6px",
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              borderLeft: `3px solid ${pm[task.priority] || pm.medium}`,
            }}>
              <div onClick={() => onToggle(task)} style={{
                width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                border: `2px solid ${task.completed ? "#10b981" : "rgba(255,255,255,0.25)"}`,
                background: task.completed ? "#10b981" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {task.completed && <span style={{ color: "white", fontSize: "10px" }}>✓</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: textColor, textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.5 : 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {task.title}
                </div>
                {cat && <div style={{ fontSize: "10px", color: cat.color }}>{cat.icon} {cat.name}</div>}
              </div>
              <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer", fontSize: "11px" }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
