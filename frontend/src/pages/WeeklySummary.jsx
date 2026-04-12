import { AnimatePresence, motion } from "framer-motion";
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

  // New Productivity Score Metric
  const productivityScore = useMemo(() => {
    if (planned === 0 && habits.length === 0) return 0;
    const taskScore = planned > 0 ? (done / planned) * 100 : 0;
    const habitScore = habitWeek.pct;
    
    if (planned === 0) return habitScore;
    if (habits.length === 0) return Math.round(taskScore);
    
    return Math.round((taskScore + habitScore) / 2);
  }, [done, planned, habitWeek.pct, habits.length]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px 80px", color: "var(--text-body)" }}>
      <header style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "32px", letterSpacing: "-0.04em", marginBottom: "8px", fontFamily: "var(--font-heading)", color: "var(--text-primary)", fontWeight: 800 }}>
          Insights
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.5, maxWidth: "500px" }}>
          Your performance over the rolling 7-day window ({weekStart} → {weekEnd}).
        </p>
      </header>

      {loading ? (
        <div className="glass-panel" style={{ borderRadius: "24px", padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1 }}>
            Syncing analytics...
          </motion.div>
        </div>
      ) : (
        <motion.div 
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
        >
          {/* Top Level Metric: Productivity Score */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} 
            style={{ gridColumn: "1 / -1", borderRadius: "24px", padding: "24px", background: `linear-gradient(135deg, var(--surface-raised), var(--surface))`, border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: `linear-gradient(135deg, ${accent}, var(--accent-pressed))`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "28px", boxShadow: `0 8px 32px ${accent}44` }}>
              {productivityScore}
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "4px" }}>Productivity Score</div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Based on task completion and habit check-in density over the past 7 days. {productivityScore >= 80 ? "You're crushing it!" : productivityScore >= 50 ? "Solid effort, keep going." : "Time to step it up."}
              </div>
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} 
            className="glass-panel" style={{ borderRadius: "24px", padding: "24px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "16px" }}>Task Completion</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                <span style={{ fontSize: "42px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--text-primary)", lineHeight: 1 }}>
                  {done}
                </span>
                <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 600 }}>/ {planned} done</span>
              </div>
            </div>
            
            <div style={{ marginTop: "24px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)" }}>On-time rate</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{taskInsight.rate}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Pending in window</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{taskInsight.pendingInWin}</span>
              </div>
              {taskInsight.overdue > 0 && (
                <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "10px", background: "var(--danger-subtle)", color: "var(--danger)", fontSize: "12px", fontWeight: 700, display: "inline-block" }}>
                  {taskInsight.overdue} task(s) overdue
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} 
            className="glass-panel" style={{ borderRadius: "24px", padding: "24px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "16px" }}>Habit Consistency</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                <span style={{ fontSize: "42px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--success)", lineHeight: 1 }}>
                  {habitWeek.pct}%
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: "24px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Total check-ins</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{habitWeek.totalLogs} logs</span>
              </div>
              {habitWeek.topHabitName && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Top streak</span>
                  <span style={{ fontWeight: 700, color: accent }}>{habitWeek.topHabitName} ({habitWeek.topHabitStreak}d)</span>
                </div>
              )}
              {bestDayLabel && habitWeek.bestCount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Best day</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{bestDayLabel}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Habit Rhythm Grid */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} 
            className="glass-panel" style={{ gridColumn: "1 / -1", borderRadius: "24px", padding: "24px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "20px" }}>Habit Rhythm</div>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", minHeight: "120px", padding: "10px 0" }}>
              {habitWeek.perDay.map((row) => {
                const maxC = Math.max(1, ...habitWeek.perDay.map((p) => p.count));
                const h = Math.round((row.count / maxC) * 90);
                return (
                  <div key={row.dateStr} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <motion.div
                      whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                      title={`${row.dateStr}: ${row.count} check-ins`}
                      style={{
                        width: "100%",
                        maxWidth: "48px",
                        height: `${12 + h}px`,
                        minHeight: "12px",
                        borderRadius: "12px 12px 6px 6px",
                        background: row.count ? `linear-gradient(180deg, ${accent}, ${accent}55)` : "var(--surface-elevated)",
                        margin: "0 auto",
                        transition: "background 0.2s"
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>
                      {DAY_NAMES[new Date(`${row.dateStr}T12:00:00`).getDay()].toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Priority Breakdown */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} 
            className="glass-panel" style={{ borderRadius: "24px", padding: "24px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "16px" }}>Tasks by Priority</div>
            <div style={{ display: "grid", gap: "14px" }}>
              {[
                { key: "high", label: "High Priority", color: "var(--danger)" },
                { key: "medium", label: "Medium", color: "var(--warning)" },
                { key: "low", label: "Low Priority", color: "var(--success)" },
              ].map(({ key, label, color }) => {
                const n = taskInsight.byPriority[key];
                const max = Math.max(1, taskInsight.doneInWin || 1);
                const w = Math.round((n / max) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 600, color }}>{label}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{n}</span>
                    </div>
                    <div style={{ height: "10px", borderRadius: "8px", background: "var(--surface-raised)", overflow: "hidden" }}>
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 1, delay: 0.2 }}
                        style={{ height: "100%", background: color, borderRadius: "8px" }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Categories */}
          {taskInsight.topCategories.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} 
              className="glass-panel" style={{ borderRadius: "24px", padding: "24px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "16px" }}>Top Categories (Done)</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "10px" }}>
                {taskInsight.topCategories.map(([name, count], i) => (
                  <motion.li key={name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
                    style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--surface-raised)", borderRadius: "10px" }}>
                    <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{name}</strong>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

        </motion.div>
      )}
    </div>
  );
}
