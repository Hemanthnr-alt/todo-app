import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useTasks } from "../hooks/useTasks";
import { addDaysToYMD, localTodayYMD } from "../utils/date";
import { lifecycleOf } from "../utils/recurringTask";
import { taskInsights, weeklyHabitStats, weeklyTaskStats } from "../utils/weeklyStats";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeeklySummary() {
  const { accent } = useTheme();
  const { tasks, categories, loading: tLoad } = useTasks();
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

  const taskInsight = useMemo(
    () => taskInsights(activeTasks, categories, weekStart, weekEnd),
    [activeTasks, categories, weekStart, weekEnd],
  );

  const habitWeek = useMemo(() => weeklyHabitStats(habits, 7), [habits]);

  const loading = tLoad || hLoad;

  const bestDayLabel = habitWeek.bestDay
    ? `${habitWeek.bestDay.slice(8, 10)}/${habitWeek.bestDay.slice(5, 7)} (${DAY_NAMES[new Date(`${habitWeek.bestDay}T12:00:00`).getDay()]})`
    : null;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px 36px", color: "var(--text-body)" }}>
      <h1 style={{ fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "6px", fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        Insights
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "22px", lineHeight: 1.5 }}>
        Rolling 7-day window ({weekStart} → {weekEnd}). Tasks use due dates in this range; habits use your last 7 check-ins.
      </p>

      {loading ? (
        <div className="glass-panel" style={{ borderRadius: "18px", padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          <div className="glass-panel" style={{ borderRadius: "18px", padding: "18px", border: "1px solid var(--border)" }}>
            <div className="section-label" style={{ marginBottom: "10px" }}>Tasks · scheduled this week</div>
            <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-heading)", color: accent }}>
              {done}
              <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 600 }}> / {planned} completed</span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              Of {taskInsight.plannedWithDue} tasks with a due date in range, {taskInsight.pendingInWin} still open.
            </div>
            <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                On-time rate: {taskInsight.rate}%
              </span>
              {taskInsight.overdue > 0 && (
                <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", background: "var(--danger-subtle)", color: "var(--danger)", fontWeight: 700 }}>
                  {taskInsight.overdue} overdue (before this week)
                </span>
              )}
              {taskInsight.recurringActive > 0 && (
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {taskInsight.recurringActive} recurring still active
                </span>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: "18px", padding: "18px", border: "1px solid var(--border)" }}>
            <div className="section-label" style={{ marginBottom: "10px" }}>Done by priority</div>
            <div style={{ display: "grid", gap: "8px" }}>
              {[
                { key: "high", label: "High", color: "var(--danger)" },
                { key: "medium", label: "Medium", color: "var(--warning)" },
                { key: "low", label: "Low", color: "var(--success)" },
              ].map(({ key, label, color }) => {
                const n = taskInsight.byPriority[key];
                const max = Math.max(1, taskInsight.doneInWin || 1);
                const w = Math.round((n / max) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color }}>{label}</span>
                      <span style={{ color: "var(--text-muted)" }}>{n}</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "6px", background: "var(--surface-raised)", overflow: "hidden" }}>
                      <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: "6px", transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {taskInsight.topCategories.length > 0 && (
            <div className="glass-panel" style={{ borderRadius: "18px", padding: "18px", border: "1px solid var(--border)" }}>
              <div className="section-label" style={{ marginBottom: "10px" }}>Top categories (completed)</div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {taskInsight.topCategories.map(([name, count]) => (
                  <li key={name}>
                    <strong style={{ color: "var(--text-primary)" }}>{name}</strong>
                    {" · "}
                    {count} done
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="glass-panel" style={{ borderRadius: "18px", padding: "18px", border: "1px solid var(--border)" }}>
            <div className="section-label" style={{ marginBottom: "10px" }}>Habits</div>
            <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--success)" }}>
              {habitWeek.pct}%
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              Check-in density: {habitWeek.totalLogs} logs across {habitWeek.habitCount} habit{habitWeek.habitCount === 1 ? "" : "s"} (7×7 grid).
            </div>
            {habitWeek.topHabitName && (
              <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
                Longest streak: <strong style={{ color: accent }}>{habitWeek.topHabitName}</strong>
                {" "}
                ({habitWeek.topHabitStreak} days)
              </div>
            )}
            {bestDayLabel && habitWeek.bestCount > 0 ? (
              <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "14px", background: "var(--surface-raised)", fontSize: "13px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Busiest habit day:</strong>{" "}
                <span style={{ color: accent }}>{bestDayLabel}</span>
                {" · "}
                {habitWeek.bestCount} check-in{habitWeek.bestCount === 1 ? "" : "s"}
              </div>
            ) : null}
          </div>

          <div className="glass-panel" style={{ borderRadius: "18px", padding: "18px", border: "1px solid var(--border)" }}>
            <div className="section-label" style={{ marginBottom: "10px" }}>Habit rhythm (last 7 days)</div>
            <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", minHeight: "100px" }}>
              {habitWeek.perDay.map((row) => {
                const maxC = Math.max(1, ...habitWeek.perDay.map((p) => p.count));
                const h = Math.round((row.count / maxC) * 72);
                return (
                  <div key={row.dateStr} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <div
                      title={`${row.dateStr}: ${row.count}`}
                      style={{
                        width: "100%",
                        maxWidth: "36px",
                        height: `${8 + h}px`,
                        minHeight: "8px",
                        borderRadius: "8px 8px 4px 4px",
                        background: row.count ? `linear-gradient(180deg, ${accent}, ${accent}88)` : "var(--surface-elevated)",
                        margin: "0 auto",
                      }}
                    />
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
                      {row.dateStr.slice(8, 10)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
