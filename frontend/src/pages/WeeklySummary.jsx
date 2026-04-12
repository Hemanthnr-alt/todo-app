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

  const scoreColor = productivityScore >= 80 ? "var(--success)" : productivityScore >= 50 ? accent : "var(--danger)";
  const scoreLabel = productivityScore >= 80 ? "Excellent" : productivityScore >= 50 ? "On track" : "Needs focus";
  // SVG donut for productivity score
  const radius = 44, circ = 2 * Math.PI * radius;
  const dash = circ * (productivityScore / 100);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px 80px", color: "var(--text-body)" }}>
      <header style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "32px", letterSpacing: "-0.04em", marginBottom: "6px", fontFamily: "var(--font-heading)", color: "var(--text-primary)", fontWeight: 800 }}>
          Insights
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.5 }}>
          Rolling 7-day window · {weekStart} → {weekEnd}
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
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {/* Hero: Productivity Score */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            style={{ gridColumn: "1 / -1", borderRadius: "24px", padding: "28px 24px",
              background: `linear-gradient(135deg, ${accent}18, var(--surface-raised))`,
              border: `1px solid ${accent}33`, display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>

            {/* Donut */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--surface-elevated)" strokeWidth="10"/>
                <motion.circle cx="55" cy="55" r={radius} fill="none" stroke={scoreColor} strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - dash }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "55px 55px",
                    filter: `drop-shadow(0 0 8px ${scoreColor}66)` }}/>
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "26px", fontWeight: 800, color: scoreColor, fontFamily: "var(--font-heading)", lineHeight: 1 }}>{productivityScore}</div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Score</div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: "160px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: scoreColor, marginBottom: "6px" }}>
                {scoreLabel}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)", marginBottom: "8px" }}>
                Productivity Score
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                {productivityScore >= 80 ? "🎉 You're crushing it! Exceptional performance this week." :
                 productivityScore >= 50 ? "💪 Solid effort. Keep building those habits." :
                 "🎯 Time to re-focus. Small wins add up fast."}
              </div>
              {/* Mini stat pills */}
              <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                <span style={{ padding: "4px 12px", borderRadius: "999px", background: `${accent}20`, border: `1px solid ${accent}44`, fontSize: "11px", fontWeight: 700, color: accent }}>
                  {done}/{planned} tasks
                </span>
                <span style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--success-subtle)", border: "1px solid rgba(61,214,140,0.25)", fontSize: "11px", fontWeight: 700, color: "var(--success)" }}>
                  {habitWeek.pct}% habits
                </span>
              </div>
            </div>
          </motion.div>

          {/* Task Completion */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="glass-panel" style={{ borderRadius: "22px", padding: "22px", border: "1px solid var(--border-strong)" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "16px" }}>Task Completion</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--text-primary)", lineHeight: 1 }}>{done}</span>
              <span style={{ fontSize: "18px", color: "var(--text-muted)", fontWeight: 600 }}>/ {planned}</span>
            </div>
            {/* Progress bar */}
            <div style={{ height: "8px", borderRadius: "999px", background: "var(--surface-elevated)", overflow: "hidden", marginBottom: "16px" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${planned > 0 ? Math.round((done/planned)*100) : 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: "999px", background: `linear-gradient(90deg, ${accent}, var(--accent-hover))`, boxShadow: `0 0 8px ${accent}55` }}/>
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {[
                { l: "On-time rate", v: `${taskInsight.rate}%`, c: taskInsight.rate >= 75 ? "var(--success)" : "var(--warning)" },
                { l: "Pending", v: taskInsight.pendingInWin },
                taskInsight.overdue > 0 && { l: "Overdue", v: taskInsight.overdue, c: "var(--danger)" },
              ].filter(Boolean).map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{r.l}</span>
                  <span style={{ fontWeight: 700, color: r.c || "var(--text-primary)" }}>{r.v}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Habit Consistency */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="glass-panel" style={{ borderRadius: "22px", padding: "22px", border: "1px solid var(--border-strong)" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "16px" }}>Habit Consistency</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--success)", lineHeight: 1 }}>{habitWeek.pct}%</span>
            </div>
            <div style={{ height: "8px", borderRadius: "999px", background: "var(--surface-elevated)", overflow: "hidden", marginBottom: "16px" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${habitWeek.pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, var(--success), #69D025)", boxShadow: "0 0 8px rgba(61,214,140,0.5)" }}/>
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Total logs</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{habitWeek.totalLogs}</span>
              </div>
              {habitWeek.topHabitName && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Top streak</span>
                  <span style={{ fontWeight: 700, color: accent }}>{habitWeek.topHabitName} · {habitWeek.topHabitStreak}d</span>
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

          {/* Habit Rhythm */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="glass-panel" style={{ gridColumn: "1 / -1", borderRadius: "22px", padding: "22px", border: "1px solid var(--border-strong)" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "20px" }}>Daily Activity</div>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", minHeight: "100px", paddingBottom: "4px" }}>
              {habitWeek.perDay.map((row) => {
                const maxC = Math.max(1, ...habitWeek.perDay.map((p) => p.count));
                const h = Math.round((row.count / maxC) * 80);
                const dayName = DAY_NAMES[new Date(`${row.dateStr}T12:00:00`).getDay()];
                const isToday = row.dateStr === weekEnd;
                return (
                  <div key={row.dateStr} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <motion.div whileHover={{ scale: 1.05 }}
                      title={`${row.dateStr}: ${row.count} check-ins`}
                      initial={{ height: 0 }} animate={{ height: `${10 + h}px` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      style={{ width: "100%", maxWidth: "44px", minHeight: "10px",
                        borderRadius: "10px 10px 4px 4px",
                        background: row.count
                          ? `linear-gradient(180deg, ${isToday ? accent : accent+"aa"}, ${accent}44)`
                          : "var(--surface-elevated)",
                        margin: "0 auto",
                        boxShadow: row.count > 0 ? `0 4px 12px ${accent}33` : "none" }}/>
                    <span style={{ fontSize: "9px", color: isToday ? accent : "var(--text-muted)", fontWeight: isToday ? 800 : 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {dayName.slice(0,1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Priority Breakdown */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="glass-panel" style={{ borderRadius: "22px", padding: "22px", border: "1px solid var(--border-strong)" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "18px" }}>Tasks by Priority</div>
            <div style={{ display: "grid", gap: "14px" }}>
              {[
                { key: "high", label: "High", color: "var(--danger)" },
                { key: "medium", label: "Medium", color: "var(--warning)" },
                { key: "low", label: "Low", color: "var(--success)" },
              ].map(({ key, label, color }) => {
                const n = taskInsight.byPriority[key];
                const max = Math.max(1, Object.values(taskInsight.byPriority).reduce((a,b)=>a+b,0));
                const w = Math.round((n / max) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, color }}>{label}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{n}</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "999px", background: "var(--surface-elevated)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.9, delay: 0.2 }}
                        style={{ height: "100%", borderRadius: "999px", background: color }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Categories */}
          {taskInsight.topCategories.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="glass-panel" style={{ borderRadius: "22px", padding: "22px", border: "1px solid var(--border-strong)" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "18px" }}>Top Categories</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "8px" }}>
                {taskInsight.topCategories.map(([name, count], i) => (
                  <motion.li key={name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", background: "var(--surface-raised)", borderRadius: "12px",
                      border: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "13px" }}>{name}</span>
                    <span style={{ fontWeight: 800, color: accent, fontSize: "14px",
                      background: `${accent}18`, padding: "2px 10px", borderRadius: "999px" }}>{count}</span>
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
