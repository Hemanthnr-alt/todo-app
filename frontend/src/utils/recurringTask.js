import { addDaysToYMD, localTodayYMD } from "./date";

/** Next YYYY-MM-DD after `fromYmd` for recurring task config */
export function computeNextDueDate(task, fromYmd = null) {
  const base = fromYmd || task.dueDate || localTodayYMD();
  const freq = task.recurringFrequency || "daily";
  const interval = Math.max(1, Number(task.recurringInterval) || 1);

  if (freq === "custom" || freq === "interval") {
    return addDaysToYMD(base, interval);
  }

  if (freq === "daily") {
    return addDaysToYMD(base, 1);
  }

  if (freq === "weekly") {
    const days = (task.recurringDays || []).length ? task.recurringDays : [0, 1, 2, 3, 4, 5, 6];
    const d = new Date(`${base}T12:00:00`);
    for (let i = 1; i <= 14; i += 1) {
      d.setDate(d.getDate() + 1);
      if (days.includes(d.getDay())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    }
    return addDaysToYMD(base, 7);
  }

  if (freq === "monthly") {
    const [y, m, day] = base.split("-").map(Number);
    const next = new Date(y, m - 1 + 1, Math.min(day, 28));
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  }

  return addDaysToYMD(base, 1);
}

export function lifecycleOf(task) {
  return task.lifecycleStatus || "active";
}
