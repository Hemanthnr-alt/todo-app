import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import MonthSelect from "../components/MonthSelect";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";

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

export default function Calendar() {
  const { accent, isDark } = useTheme();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const [curr, setCurr] = useState(new Date());
  const year = curr.getFullYear();
  const month = curr.getMonth();
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

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

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px 32px", color: "var(--text-body)" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "4px" }}>Calendar</h1>
        <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Simple monthly view</div>
      </div>

      <div className="glass-panel" style={{ borderRadius: "18px", padding: "16px", marginBottom: "18px" }}>
        <MonthSelect curr={curr} setCurr={setCurr} isDark={isDark} accent={accent} />

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

      <div style={{ marginBottom: "10px", color: "var(--text-muted)", fontSize: "12px" }}>
        {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
      </div>

      <div className="glass-panel" style={{ borderRadius: "18px", padding: "0 14px" }}>
        {selectedTasks.length === 0 && selectedHabits.length === 0 ? (
          <div style={{ padding: "28px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            Nothing scheduled.
          </div>
        ) : (
          <>
            {selectedHabits.map((habit) => (
              <div key={`habit-${habit.id}`} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px 4px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: habit.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  {habit.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>{habit.name}</div>
                  <div style={{ color: habit.color, fontSize: "12px" }}>Habit</div>
                </div>
              </div>
            ))}

            {selectedTasks.map((task) => (
              <div key={`task-${task.id}`} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px 4px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "#E84A8A", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontSize: "14px" }}>
                  ◉
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600, textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.56 : 1 }}>
                    {task.title}
                  </div>
                  <div style={{ color: "#E84A8A", fontSize: "12px" }}>Task</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
