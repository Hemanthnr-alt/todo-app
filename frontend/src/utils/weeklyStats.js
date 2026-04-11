import { formatLocalYMD } from "./date";

/** @param {object[]} tasks */
export function weeklyTaskStats(tasks, weekStartYmd, weekEndYmd) {
  const done = tasks.filter(
    (t) => t.completed && t.dueDate && t.dueDate >= weekStartYmd && t.dueDate <= weekEndYmd,
  ).length;
  const planned = tasks.filter(
    (t) => t.dueDate && t.dueDate >= weekStartYmd && t.dueDate <= weekEndYmd,
  ).length;
  return { done, planned };
}

/** Tasks completed in window (by due date), grouped for insights */
export function taskInsights(tasks, categories, weekStartYmd, weekEndYmd) {
  const inWin = (d) => d && d >= weekStartYmd && d <= weekEndYmd;
  const withDue = tasks.filter((t) => inWin(t.dueDate));
  const doneInWin = withDue.filter((t) => t.completed);
  const pendingInWin = withDue.filter((t) => !t.completed);
  const rate = withDue.length ? Math.round((doneInWin.length / withDue.length) * 100) : 0;

  const byPriority = { high: 0, medium: 0, low: 0 };
  doneInWin.forEach((t) => {
    const p = t.priority || "medium";
    if (byPriority[p] !== undefined) byPriority[p] += 1;
  });

  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < weekStartYmd && !t.completed,
  ).length;

  const catMap = new Map();
  doneInWin.forEach((t) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    const name = cat ? `${cat.icon || ""} ${cat.name}`.trim() : "Uncategorized";
    catMap.set(name, (catMap.get(name) || 0) + 1);
  });
  const topCategories = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recurringActive = tasks.filter((t) => t.isRecurring && !t.completed).length;

  return {
    plannedWithDue: withDue.length,
    doneInWin: doneInWin.length,
    pendingInWin: pendingInWin.length,
    rate,
    byPriority,
    overdue,
    topCategories,
    recurringActive,
  };
}

/** @param {object[]} habits */
export function weeklyHabitStats(habits, days = 7) {
  const today = new Date();
  const dates = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(formatLocalYMD(d));
  }
  let totalSlots = habits.length * dates.length;
  let filled = 0;
  const perDay = dates.map((dateStr) => {
    let c = 0;
    habits.forEach((h) => {
      if ((h.completedDates || []).includes(dateStr)) {
        c += 1;
        filled += 1;
      }
    });
    return { dateStr, count: c };
  });
  const pct = totalSlots ? Math.round((filled / totalSlots) * 100) : 0;
  const best = perDay.reduce((a, b) => (b.count > a.count ? b : a), perDay[0] || { dateStr: "", count: 0 });
  const totalLogs = filled;
  const topHabit = habits.length
    ? habits.reduce((a, b) => ((b.streak || 0) > (a.streak || 0) ? b : a), habits[0])
    : null;
  return {
    pct,
    bestDay: best.dateStr,
    bestCount: best.count,
    perDay,
    totalLogs,
    topHabitName: topHabit?.name || null,
    topHabitStreak: topHabit?.streak ?? 0,
    habitCount: habits.length,
  };
}
