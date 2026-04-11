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
  return { pct, bestDay: best.dateStr, bestCount: best.count, perDay };
}
