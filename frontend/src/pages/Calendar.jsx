import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import MonthSelect from "../components/MonthSelect";
import { PremiumHabitTile, PremiumTaskMark } from "../components/PremiumMarks";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";
import { localTodayYMD } from "../utils/date";

function getMonthData(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = last.getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const result = [];

  for (let index = startDay - 1; index >= 0; index -= 1) result.push({ dateNum: prevLast - index, isCurrentMonth: false, offset: -1 });
  for (let index = 1; index <= daysInMonth; index += 1) result.push({ dateNum: index, isCurrentMonth: true, offset: 0 });

  const total = result.length;
  for (let index = 1; index <= (total % 7 === 0 ? 0 : 7 - (total % 7)); index += 1) result.push({ dateNum: index, isCurrentMonth: false, offset: 1 });
  return result;
}

function toDateStr(year, month, day, offset) {
  let nextYear = year;
  let nextMonth = month;
  if (offset === -1) {
    nextMonth = month - 1;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear = year - 1;
    }
  }
  if (offset === 1) {
    nextMonth = month + 1;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear = year + 1;
    }
  }
  return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function Calendar() {
  const { accent, isDark } = useTheme();
  const { tasks, addTask, updateTask, categories } = useTasks();
  const { habits } = useHabits();
  const [curr, setCurr] = useState(new Date());
  const year = curr.getFullYear();
  const month = curr.getMonth();
  const todayStr = localTodayYMD();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showAddTask, setShowAddTask] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    description: "",
    priority: "medium",
    categoryId: "",
    dueDate: "",
  });

  const days = getMonthData(year, month);

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      if (!map[task.dueDate]) map[task.dueDate] = [];
      map[task.dueDate].push(task);
    });
    return map;
  }, [tasks]);

  const habitsByDate = useMemo(() => {
    const map = {};
    habits.forEach((habit) => {
      (habit.completedDates || []).forEach((date) => {
        if (!map[date]) map[date] = [];
        map[date].push(habit);
      });
    });
    return map;
  }, [habits]);

  const selectedTasks = tasksByDate[selectedDate] || [];
  const selectedHabits = habitsByDate[selectedDate] || [];

  const categoryOptions = [{ value: "", label: "No category" }, ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))];

  const openAddTask = useCallback(() => {
    setTaskDraft({
      title: "",
      description: "",
      priority: "medium",
      categoryId: "",
      dueDate: selectedDate,
    });
    setShowAddTask(true);
  }, [selectedDate]);

  const handleSaveCalendarTask = async () => {
    if (!taskDraft.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    setSavingTask(true);
    const created = await addTask({
      title: taskDraft.title.trim(),
      description: taskDraft.description,
      priority: taskDraft.priority,
      categoryId: taskDraft.categoryId || null,
      dueDate: taskDraft.dueDate || null,
    });
    setSavingTask(false);
    if (!created) return;
    setShowAddTask(false);
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px 32px", color: "var(--text-body)" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "4px" }}>Calendar</h1>
        <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Plan tasks and see habits at a glance</div>
      </div>

      <div className="glass-panel" style={{ borderRadius: "18px", padding: "16px", marginBottom: "18px" }}>
        <MonthSelect
          curr={curr}
          setCurr={setCurr}
          isDark={isDark}
          accent={accent}
          onToday={() => setSelectedDate(localTodayYMD())}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "8px" }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div key={label} style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", padding: "8px 0" }}>
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {days.map((day, index) => {
            const dateStr = toDateStr(year, month, day.dateNum, day.offset);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasTask = (tasksByDate[dateStr] || []).length > 0;
            const hasHabit = (habitsByDate[dateStr] || []).length > 0;

            return (
              <motion.button
                key={`${dateStr}-${index}`}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedDate(dateStr);
                  if (!day.isCurrentMonth) setCurr(new Date(year, month + day.offset, 1));
                }}
                className="btn-reset"
                style={{
                  aspectRatio: "1",
                  borderRadius: "14px",
                  background: isSelected ? `${accent}22` : "var(--surface-raised)",
                  border: `1px solid ${isSelected ? accent : "var(--border)"}`,
                  opacity: day.isCurrentMonth ? 1 : 0.45,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  color: isToday ? accent : "var(--text-primary)",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: isToday || isSelected ? 700 : 500 }}>{day.dateNum}</span>
                <span style={{ display: "flex", gap: "4px" }}>
                  {hasTask && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#E84A8A" }} />}
                  {hasHabit && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: accent }} />}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </div>
        <button type="button" onClick={openAddTask} className="btn-primary" style={{ padding: "0 16px", height: "40px", fontSize: "13px", fontWeight: 700 }}>
          + Task for this day
        </button>
      </div>

      <div className="glass-panel" style={{ borderRadius: "18px", padding: "0 14px" }}>
        {selectedTasks.length === 0 && selectedHabits.length === 0 ? (
          <div style={{ padding: "28px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            Nothing scheduled. Add a task for this date.
          </div>
        ) : (
          <>
            {selectedHabits.map((habit) => (
              <div key={`habit-${habit.id}`} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px 4px", borderBottom: "1px solid var(--border)" }}>
                <PremiumHabitTile emoji={habit.icon} color={habit.color} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>{habit.name}</div>
                  <div style={{ color: habit.color, fontSize: "12px", fontWeight: 600 }}>Habit · 🔥 {habit.streak ?? 0} streak</div>
                </div>
              </div>
            ))}

            {selectedTasks.map((task) => (
              <div
                key={`task-${task.id}`}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  padding: "14px 4px",
                  borderBottom: "1px solid var(--border)",
                  borderLeft: task.completed ? "3px solid #E84A8A" : "3px solid transparent",
                  borderRadius: "0 12px 12px 0",
                  background: task.completed ? "linear-gradient(90deg, rgba(232,74,138,0.1), transparent 55%)" : undefined,
                }}
              >
                <PremiumTaskMark size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      fontWeight: 600,
                      textDecoration: task.completed ? "line-through" : "none",
                      textDecorationThickness: task.completed ? "2px" : undefined,
                      textDecorationColor: "rgba(232,74,138,0.5)",
                      opacity: task.completed ? 0.52 : 1,
                    }}
                  >
                    {task.title}
                  </div>
                  <div style={{ color: "#E84A8A", fontSize: "12px", fontWeight: 600 }}>Task</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateTask(task.id, { completed: !task.completed })}
                  className="btn-reset"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: task.completed ? "#E84A8A" : "var(--surface-raised)",
                    border: `2px solid ${task.completed ? "#E84A8A" : "var(--border-strong)"}`,
                    color: task.completed ? "#fff" : "transparent",
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                  aria-label={task.completed ? "Mark incomplete" : "Complete"}
                >
                  ✓
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <CenteredModal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="New task" maxWidth="420px">
        <div style={{ display: "grid", gap: "12px" }}>
          <input
            value={taskDraft.title}
            onChange={(e) => setTaskDraft((c) => ({ ...c, title: e.target.value }))}
            placeholder="Task title"
            style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
          />
          <textarea
            value={taskDraft.description}
            onChange={(e) => setTaskDraft((c) => ({ ...c, description: e.target.value }))}
            rows={2}
            placeholder="Description (optional)"
            style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)", resize: "vertical" }}
          />
          <CustomSelect value={taskDraft.priority} onChange={(value) => setTaskDraft((c) => ({ ...c, priority: value }))} options={PRIORITY_OPTIONS} />
          <CustomSelect value={taskDraft.categoryId} onChange={(value) => setTaskDraft((c) => ({ ...c, categoryId: value }))} options={categoryOptions} />
          <div>
            <div className="section-label" style={{ marginBottom: "6px" }}>Due date</div>
            <input
              type="date"
              value={taskDraft.dueDate}
              onChange={(e) => setTaskDraft((c) => ({ ...c, dueDate: e.target.value }))}
              style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={() => setShowAddTask(false)} className="glass-tile" style={{ flex: 1, borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)" }}>
              Cancel
            </button>
            <button type="button" onClick={handleSaveCalendarTask} className="btn-primary" style={{ flex: 1 }} disabled={savingTask}>
              {savingTask ? "Saving…" : "Add task"}
            </button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}
