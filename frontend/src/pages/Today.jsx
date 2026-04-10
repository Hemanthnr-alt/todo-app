import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";
import { PremiumCompleteTitle, PremiumRoundComplete } from "../components/PremiumChrome";
import { PremiumHabitTile, PremiumTaskMark } from "../components/PremiumMarks";
import { formatLocalYMD, localTodayYMD } from "../utils/date";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MISSED_KEY = "thirty_missed_habits";

const fmtDate = formatLocalYMD;
const getMissed = () => {
  try {
    return JSON.parse(localStorage.getItem(MISSED_KEY) || "{}");
  } catch {
    return {};
  }
};

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

function EmptyState({ selectedIsToday, onGoToTasks }) {
  return (
    <div style={{ padding: "36px 10px", textAlign: "center" }}>
      <div style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>
        {selectedIsToday ? "Nothing for today yet." : "Nothing planned for this day."}
      </div>
      <button onClick={onGoToTasks} className="btn-primary" style={{ padding: "0 18px", height: "44px" }}>
        Add task
      </button>
    </div>
  );
}

function AgendaItem({ item, accent, onToggleTask, onToggleHabit }) {
  const color = item.color || accent;
  const checked = item.done;
  const lineColor = typeof color === "string" && color.startsWith("var(") ? "var(--accent)" : color;

  const isTask = item.type === "task";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 8px",
        borderBottom: "1px solid var(--border)",
        borderLeft: checked ? `3px solid ${color}` : "3px solid transparent",
        borderRadius: "0 14px 14px 0",
        background: checked ? `linear-gradient(90deg, ${color}18, transparent 58%)` : undefined,
        boxShadow: checked ? `inset 0 0 20px ${color}0f` : "none",
      }}
    >
      {isTask ? <PremiumTaskMark size={32} /> : <PremiumHabitTile emoji={item.icon} color={color} size={32} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        <PremiumCompleteTitle complete={checked} lineColor={lineColor}>
          {item.title}
        </PremiumCompleteTitle>
        <div style={{ marginTop: "6px", fontSize: "11px", color, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.95 }}>{item.kind}</div>
      </div>

      <PremiumRoundComplete
        checked={checked}
        onClick={() => {
          if (isTask) onToggleTask(item.id, !checked);
          else onToggleHabit(item.id, item.date);
        }}
        color={color}
        ariaLabel={checked ? "Mark incomplete" : "Mark complete"}
      />
    </div>
  );
}

export default function Today({ onGoToTasks, onGoToCalendar }) {
  const { accent } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { tasks, updateTask } = useTasks();
  const { habits, toggleHabit } = useHabits();

  const todayStr = localTodayYMD();
  const [rangeStart, setRangeStart] = useState(-5);
  const [rangeEnd, setRangeEnd] = useState(8);
  const [dates, setDates] = useState(() => buildDates(-5, 8));
  const [selected, setSelected] = useState(todayStr);
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
    element.scrollTo({ left: Math.max(0, target), behavior });
  }, []);

  useLayoutEffect(() => {
    scrollToDateStr(selected, "auto");
  }, [scrollToDateStr, selected, dates]);

  useEffect(() => {
    const element = stripRef.current;
    if (!element) return undefined;

    const handleStripScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = element;
      const threshold = 180;
      if (scrollLeft + clientWidth >= scrollWidth - threshold) {
        const newEnd = rangeEndRef.current + 7;
        setRangeEnd(newEnd);
        setDates(buildDates(rangeStartRef.current, newEnd));
      }
      if (scrollLeft <= threshold) {
        const newStart = rangeStartRef.current - 7;
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

  const selectedDate = new Date(`${selected}T00:00:00`);
  const missedMap = getMissed();

  const dayTasks = tasks
    .filter((task) => task.dueDate === selected)
    .map((task) => ({
      type: "task",
      id: task.id,
      title: task.title,
      icon: "◉",
      color: "#E84A8A",
      kind: "Task",
      done: task.completed,
    }));

  const dayHabits = habits
    .filter((habit) => {
      if (habit.frequency === "daily") return true;
      if (habit.frequency === "weekly") {
        return (habit.recurringDays || []).includes(selectedDate.getDay());
      }
      return true;
    })
    .map((habit) => ({
      type: "habit",
      id: habit.id,
      title: habit.name,
      icon: habit.icon,
      color: habit.color,
      kind: missedMap[`${habit.id}_${selected}`] ? "Missed" : "Habit",
      done: (habit.completedDates || []).includes(selected),
      date: selected,
    }));

  const items = useMemo(() => [...dayHabits, ...dayTasks], [dayHabits, dayTasks]);
  const completedCount = items.filter((item) => item.done).length;

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: "620px", margin: "0 auto", padding: "28px 16px 24px" }}>
        <div className="glass-panel" style={{ borderRadius: "20px", padding: "24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "8px", letterSpacing: "-0.04em" }}>Today</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "18px" }}>
            Sign in to see your daily task and habit list.
          </p>
          <button onClick={onGoToTasks} className="btn-primary" style={{ padding: "0 18px" }}>
            Open Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px 24px", color: "var(--text-body)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "4px" }}>Today</h1>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {user?.name ? `${user.name.split(" ")[0]}'s list` : "Your list"} · {completedCount}/{items.length} done
          </div>
        </div>

        <button
          onClick={onGoToCalendar}
          className="btn-reset"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-label="Open calendar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      <div ref={stripRef} className="hide-scrollbar" style={{ overflowX: "auto", marginBottom: "18px" }}>
        <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
          {dates.map((date) => {
            const dateStr = fmtDate(date);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selected;
            return (
              <button
                key={dateStr}
                onClick={() => setSelected(dateStr)}
                className="btn-reset"
                style={{
                  minWidth: "52px",
                  padding: "8px 10px",
                  borderRadius: "14px",
                  background: isSelected ? accent : "var(--surface)",
                  color: isSelected ? "#fff" : "var(--text-primary)",
                  border: `1px solid ${isSelected ? accent : "var(--border)"}`,
                }}
              >
                <div style={{ fontSize: "11px", color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-muted)", marginBottom: "6px" }}>
                  {DAY_LABELS[date.getDay()].slice(0, 3)}
                </div>
                <div style={{ fontSize: "22px", fontFamily: "var(--font-heading)", lineHeight: 1 }}>
                  {date.getDate()}
                </div>
                {isToday && !isSelected && (
                  <div style={{ marginTop: "6px", width: "6px", height: "6px", borderRadius: "50%", background: accent, marginInline: "auto" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "8px" }}>
        {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>

      <div className="glass-panel" style={{ borderRadius: "18px", padding: "0 14px" }}>
        {items.length === 0 ? (
          <EmptyState selectedIsToday={selected === todayStr} onGoToTasks={onGoToTasks} />
        ) : (
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <AgendaItem
                key={`${item.type}-${item.id}`}
                item={item}
                accent={accent}
                onToggleTask={(id, completed) => updateTask(id, { completed })}
                onToggleHabit={(id, date) => toggleHabit(id, date)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
