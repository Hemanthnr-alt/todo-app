import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";
import { addDaysToYMD, localTodayYMD } from "../utils/date";
import { lifecycleOf } from "../utils/recurringTask";
import { weeklyHabitStats, weeklyTaskStats } from "../utils/weeklyStats";

export default function WeeklySummary() {
  const { accent } = useTheme();
  const { tasks, loading: tLoad } = useTasks();
  const { habits, loading: hLoad } = useHabits();

  const weekEnd = localTodayYMD();
  const weekStart = addDaysToYMD(weekEnd, -6);

  const activeTasks = useMemo(
    () => tasks.filter((t) => lifecycleOf(t) === "active"),
    [tasks],
  );

  const { done, planned } = useMemo(
    () => weeklyTaskStats(activeTasks, weekStart, weekEnd),
    [activeTasks, weekStart, weekEnd],
  );

  const habitWeek = useMemo(() => weeklyHabitStats(habits, 7), [habits]);

  const loading = tLoad || hLoad;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px 36px", color: "var(--text-body)" }}>
      <h1 style={{ fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "6px", fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        Weekly insights
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "22px", lineHeight: 1.5 }}>
        Last 7 days · tasks with due dates in this window and habit check-ins across the week.
      </p>

      {loading ? (
        <div className="glass-panel" style={{ borderRadius: "18px", padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          <div className="glass-panel" style={{ borderRadius: "18px", padding: "18px", border: `1px solid var(--border)` }}>
            <div className="section-label" style={{ marginBottom: "10px" }}>Tasks</div>
            <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-heading)", color: accent }}>
              {done}
              <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 600 }}> / {planned} done</span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              Completed with a due date between {weekStart} and {weekEnd}.
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: "18px", padding: "18px", border: `1px solid var(--border)` }}>
            <div className="section-label" style={{ marginBottom: "10px" }}>Habits</div>
            <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--success)" }}>
              {habitWeek.pct}%
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              Check-in density across all habits (last 7 days).
            </div>
            {habitWeek.bestDay ? (
              <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "14px", background: "var(--surface-raised)", fontSize: "13px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Best day:</strong>{" "}
                <span style={{ color: accent }}>{habitWeek.bestDay}</span>
                {" · "}
                {habitWeek.bestCount} habit{habitWeek.bestCount === 1 ? "" : "s"} logged
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
