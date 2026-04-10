import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRIORITY_CLR = { high: "var(--danger)", medium: "var(--warning)", low: "var(--success)" };
const MISSED_KEY = "thirty_missed_habits";

const fmtDate = (date) => date.toISOString().split("T")[0];
const getMissed = () => {
  try {
    return JSON.parse(localStorage.getItem(MISSED_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveMissed = (value) => localStorage.setItem(MISSED_KEY, JSON.stringify(value));

function buildDates(startOffset, endOffset) {
  const base = new Date();
  const midnight = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const values = [];
  for (let offset = startOffset; offset <= endOffset; offset += 1) {
    const date = new Date(midnight);
    date.setDate(midnight.getDate() + offset);
    values.push(date);
  }
  return values;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function AuthPreview({ accent, onGoToTasks, onGoToHabits, onGoToCalendar, onGoToTimer, onGoToRewards }) {
  const actions = [
    ["Tasks", onGoToTasks],
    ["Habits", onGoToHabits],
    ["Calendar", onGoToCalendar],
    ["Timer", onGoToTimer],
    ["Rewards", onGoToRewards],
  ];

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", padding: "56px 20px" }}>
      <div className="glass-panel" style={{ borderRadius: "34px", padding: "34px 28px", textAlign: "center" }}>
        <div
          style={{
            width: "76px",
            height: "76px",
            borderRadius: "24px",
            margin: "0 auto 20px",
            background: `linear-gradient(135deg, ${accent}, var(--accent-hover))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "22px",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          30
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "10px" }}>
          Daily focus studio
        </p>
        <h2 style={{ fontSize: "clamp(28px, 7vw, 38px)", letterSpacing: "-0.05em", marginBottom: "10px" }}>Plan the day with more intention</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7, marginBottom: "24px" }}>
          Sign in to sync your tasks, streaks, and progress across every view.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          {actions.map(([label, action]) => (
            <button
              key={label}
              onClick={action}
              className="glass-tile"
              style={{
                borderRadius: "999px",
                padding: "10px 14px",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "var(--font-body)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ selectedIsToday, onGoToTasks }) {
  return (
    <div className="glass-panel" style={{ borderRadius: "28px", padding: "42px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "40px", marginBottom: "10px" }}>✦</div>
      <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>{selectedIsToday ? "Nothing scheduled yet" : "This day is still open"}</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
        {selectedIsToday ? "Add a task or set a habit to give today a clear shape." : "Tap into Tasks to add something for this date."}
      </p>
      <button onClick={onGoToTasks} className="btn-primary" style={{ padding: "0 22px" }}>
        Go to Tasks
      </button>
    </div>
  );
}

export default function Today({ onGoToTasks, onGoToHabits, onGoToCalendar, onGoToTimer, onGoToRewards }) {
  const { accent } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { tasks, categories, updateTask, deleteTask } = useTasks();
  const { habits, toggleHabit } = useHabits();

  const todayStr = fmtDate(new Date());
  const [rangeStart, setRangeStart] = useState(-30);
  const [rangeEnd, setRangeEnd] = useState(60);
  const [dates, setDates] = useState(() => buildDates(-30, 60));
  const [selected, setSelected] = useState(todayStr);
  const [missedMap, setMissedMap] = useState(getMissed);
  const stripRef = useRef(null);
  const datesRef = useRef(dates);
  const rangeStartRef = useRef(rangeStart);
  const rangeEndRef = useRef(rangeEnd);
  datesRef.current = dates;
  rangeStartRef.current = rangeStart;
  rangeEndRef.current = rangeEnd;

  const scrollToDateStr = useCallback((dateStr, behavior = "smooth") => {
    const element = stripRef.current;
    if (!element) return;
    const index = datesRef.current.findIndex((date) => fmtDate(date) === dateStr);
    if (index < 0) return;
    const child = element.children[0]?.children[index];
    if (!child) return;
    const target = child.offsetLeft - element.clientWidth / 2 + child.offsetWidth / 2;
    element.scrollTo({ left: target, behavior });
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToDateStr(todayStr, "auto")));
  }, [scrollToDateStr, todayStr]);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToDateStr(selected, "smooth")));
  }, [scrollToDateStr, selected]);

  useEffect(() => {
    const handleVisible = () => {
      if (!document.hidden) {
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToDateStr(selected, "auto")));
      }
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [scrollToDateStr, selected]);

  useEffect(() => {
    const element = stripRef.current;
    if (!element) return undefined;
    const handleStripScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = element;
      const threshold = 400;
      if (scrollLeft + clientWidth >= scrollWidth - threshold) {
        const newEnd = rangeEndRef.current + 30;
        setRangeEnd(newEnd);
        setDates(buildDates(rangeStartRef.current, newEnd));
      }
      if (scrollLeft <= threshold) {
        const newStart = rangeStartRef.current - 30;
        const nextDates = buildDates(newStart, rangeEndRef.current);
        const previousWidth = element.scrollWidth;
        setRangeStart(newStart);
        setDates(nextDates);
        requestAnimationFrame(() => {
          if (!stripRef.current) return;
          stripRef.current.scrollLeft += stripRef.current.scrollWidth - previousWidth;
        });
      }
    };
    element.addEventListener("scroll", handleStripScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleStripScroll);
  }, []);

  const toggleMissed = (habitId, date) => {
    const key = `${habitId}_${date}`;
    const current = getMissed();
    if (current[key]) {
      delete current[key];
    } else {
      current[key] = true;
      const habit = habits.find((item) => item.id === habitId);
      if (habit && (habit.completedDates || []).includes(date)) {
        toggleHabit(habitId, date);
      }
    }
    saveMissed(current);
    setMissedMap({ ...current });
  };

  const dayTasks = tasks.filter((task) => task.dueDate === selected);
  const dayHabits = habits.filter((habit) => {
    if (habit.frequency === "daily") return true;
    if (habit.frequency === "weekly") {
      return (habit.recurringDays || []).includes(new Date(`${selected}T00:00:00`).getDay());
    }
    return true;
  });

  const completedItems = dayTasks.filter((task) => task.completed).length
    + dayHabits.filter((habit) => (habit.completedDates || []).includes(selected)).length;
  const totalItems = dayTasks.length + dayHabits.length;
  const missedItems = dayHabits.filter((habit) => missedMap[`${habit.id}_${selected}`]).length;
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const selectedDate = new Date(`${selected}T00:00:00`);

  if (!isAuthenticated) {
    return (
      <AuthPreview
        accent={accent}
        onGoToTasks={onGoToTasks}
        onGoToHabits={onGoToHabits}
        onGoToCalendar={onGoToCalendar}
        onGoToTimer={onGoToTimer}
        onGoToRewards={onGoToRewards}
      />
    );
  }

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "28px 16px 24px", color: "var(--text-body)" }}>
      <div className="today-hero-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.9fr)", gap: "16px", marginBottom: "18px" }}>
        <div className="glass-panel" style={{ borderRadius: "32px", padding: "24px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "12px" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 44px)", lineHeight: 1.04, letterSpacing: "-0.06em", marginBottom: "12px" }}>
            {getGreeting()}, <span style={{ color: accent }}>{user?.name?.split(" ")[0] || "there"}</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7, maxWidth: "52ch" }}>
            A calm command center for the day. Review what matters, keep streaks alive, and move tasks across the finish line.
          </p>
        </div>

        <div className="glass-panel" style={{ borderRadius: "32px", padding: "24px" }}>
          <div className="section-label" style={{ marginBottom: "12px" }}>Progress</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "14px" }}>
            <span style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", fontSize: "42px", letterSpacing: "-0.06em" }}>{pct}%</span>
            <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{completedItems}/{totalItems} complete</span>
          </div>
          <div style={{ height: "10px", borderRadius: "999px", background: "var(--surface-elevated)", overflow: "hidden", marginBottom: "14px" }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.45 }}
              style={{
                height: "100%",
                borderRadius: "inherit",
                background: `linear-gradient(90deg, ${accent}, var(--accent-hover))`,
                boxShadow: "var(--shadow-glow)",
              }}
            />
          </div>
          <div className="today-progress-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {[
              { label: "Tasks", value: dayTasks.length, color: "var(--accent)" },
              { label: "Habits", value: dayHabits.length, color: "var(--success)" },
              { label: "Missed", value: missedItems, color: "var(--danger)" },
            ].map((stat) => (
              <div key={stat.label} className="glass-tile" style={{ borderRadius: "18px", padding: "14px" }}>
                <div style={{ color: stat.color, fontFamily: "var(--font-heading)", fontSize: "24px", letterSpacing: "-0.05em" }}>{stat.value}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ borderRadius: "28px", padding: "16px", marginBottom: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
          <div>
            <div className="section-label" style={{ marginBottom: "6px" }}>Timeline</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <AnimatePresence>
              {selected !== todayStr && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  onClick={() => setSelected(todayStr)}
                  className="glass-tile"
                  style={{ borderRadius: "999px", padding: "10px 14px", color: "var(--text-primary)", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}
                >
                  Return to today
                </motion.button>
              )}
            </AnimatePresence>
            <button
              onClick={onGoToCalendar}
              className="glass-tile"
              style={{ width: "42px", height: "42px", borderRadius: "14px", cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "44px", background: "linear-gradient(90deg, var(--surface), transparent)", zIndex: 1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "44px", background: "linear-gradient(-90deg, var(--surface), transparent)", zIndex: 1, pointerEvents: "none" }} />
          <div ref={stripRef} className="hide-scrollbar" style={{ overflowX: "auto", padding: "4px 0" }}>
            <div style={{ display: "flex", gap: "8px", width: "max-content", padding: "2px 2px 8px" }}>
              {dates.map((date) => {
                const dateStr = fmtDate(date);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selected;
                const hasTask = tasks.some((task) => task.dueDate === dateStr);
                const hasDone = habits.some((habit) => (habit.completedDates || []).includes(dateStr));
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelected(dateStr)}
                    className={isSelected ? "glass-panel" : "glass-tile"}
                    style={{
                      minWidth: "66px",
                      borderRadius: "18px",
                      padding: "12px 10px",
                      cursor: "pointer",
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      background: isSelected ? `linear-gradient(180deg, ${accent}22, var(--surface-raised))` : undefined,
                    }}
                  >
                    <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: isSelected ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {DAY_LABELS[date.getDay()]}
                    </div>
                    <div
                      style={{
                        margin: "8px 0 6px",
                        fontFamily: "var(--font-heading)",
                        fontSize: "26px",
                        letterSpacing: "-0.06em",
                        color: isSelected ? "var(--text-primary)" : isToday ? accent : "var(--text-primary)",
                      }}
                    >
                      {date.getDate()}
                    </div>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", margin: "0 auto", background: hasTask ? accent : hasDone ? "var(--success)" : "transparent" }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="today-sections-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px" }}>
        <section className="glass-panel" style={{ borderRadius: "28px", padding: "18px" }}>
          <div className="section-label" style={{ marginBottom: "14px" }}>
            Habits · {dayHabits.filter((habit) => (habit.completedDates || []).includes(selected)).length}/{dayHabits.length}
          </div>
          {dayHabits.length === 0 ? (
            <EmptyState selectedIsToday={selected === todayStr} onGoToTasks={onGoToHabits} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dayHabits.map((habit, index) => {
                const done = (habit.completedDates || []).includes(selected);
                const isMissed = Boolean(missedMap[`${habit.id}_${selected}`]);
                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass-tile"
                    style={{ borderRadius: "20px", padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}
                  >
                    <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: `${habit.color}22`, color: habit.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                      {habit.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: 700, textDecoration: done || isMissed ? "line-through" : "none", opacity: done || isMissed ? 0.58 : 1 }}>
                        {habit.name}
                      </div>
                      <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ padding: "4px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: isMissed ? "var(--danger-subtle)" : done ? "var(--success-subtle)" : `${habit.color}18`, color: isMissed ? "var(--danger)" : done ? "var(--success)" : habit.color }}>
                          {isMissed ? "Missed" : done ? "Done" : "Habit"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => toggleMissed(habit.id, selected)}
                        className="btn-reset"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "12px",
                          border: `1px solid ${isMissed ? "var(--danger)" : "var(--border-danger)"}`,
                          background: isMissed ? "var(--danger)" : "transparent",
                          color: isMissed ? "#fff" : "var(--danger)",
                        }}
                      >
                        ×
                      </button>
                      <button
                        onClick={() => {
                          if (!isMissed) toggleHabit(habit.id, selected);
                        }}
                        className="btn-reset"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "12px",
                          border: `1px solid ${done ? "var(--success)" : "var(--border-strong)"}`,
                          background: done ? "var(--success)" : "transparent",
                          color: done ? "#fff" : "var(--text-muted)",
                          opacity: isMissed ? 0.35 : 1,
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <section className="glass-panel" style={{ borderRadius: "28px", padding: "18px" }}>
          <div className="section-label" style={{ marginBottom: "14px" }}>
            Tasks · {dayTasks.filter((task) => task.completed).length}/{dayTasks.length}
          </div>
          {dayTasks.length === 0 ? (
            <EmptyState selectedIsToday={selected === todayStr} onGoToTasks={onGoToTasks} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dayTasks.map((task, index) => {
                const category = categories.find((item) => item.id === task.categoryId);
                const priorityColor = PRIORITY_CLR[task.priority] || PRIORITY_CLR.medium;
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass-tile"
                    style={{
                      borderRadius: "20px",
                      padding: "14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      borderLeft: `4px solid ${priorityColor}`,
                      opacity: task.completed ? 0.62 : 1,
                    }}
                  >
                    <button
                      onClick={() => updateTask(task.id, { completed: !task.completed })}
                      className="btn-reset"
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "8px",
                        marginTop: "2px",
                        border: `1px solid ${task.completed ? accent : "var(--border-strong)"}`,
                        background: task.completed ? accent : "transparent",
                        color: "#fff",
                        fontWeight: 800,
                      }}
                    >
                      {task.completed ? "✓" : ""}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: 700, textDecoration: task.completed ? "line-through" : "none", marginBottom: "6px" }}>
                        {task.title}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ padding: "4px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: `${priorityColor}20`, color: priorityColor }}>
                          {task.priority}
                        </span>
                        {category && (
                          <span style={{ padding: "4px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: `${category.color}18`, color: category.color }}>
                            {category.icon} {category.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="btn-reset"
                      style={{ width: "30px", height: "30px", borderRadius: "12px", background: "var(--danger-subtle)", color: "var(--danger)" }}
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .today-sections-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 820px) {
          .today-hero-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 520px) {
          .today-progress-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
