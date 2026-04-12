import { addDaysToYMD, localTodayYMD } from "../utils/date";

/**
 * Compute the next due date for a recurring task.
 * Fixed:
 *  - weekly: correctly finds next matching weekday even across month/year boundary
 *  - monthly: preserves original day-of-month (clamped to month length, not hardcoded 28)
 *  - interval/custom: uses correct interval field
 */
export function computeNextDueDate(task, fromYmd = null) {
  const base = fromYmd || task.dueDate || localTodayYMD();
  const freq = task.recurringFrequency || "daily";
  const interval = Math.max(1, Number(task.recurringInterval) || 1);

  // ── daily ────────────────────────────────────────────────────────────────────
  if (freq === "daily") {
    return addDaysToYMD(base, 1);
  }

  // ── every N days ─────────────────────────────────────────────────────────────
  if (freq === "custom" || freq === "interval") {
    return addDaysToYMD(base, interval);
  }

  // ── weekly: find the next matching weekday ───────────────────────────────────
  if (freq === "weekly") {
    const allowedDays =
      Array.isArray(task.recurringDays) && task.recurringDays.length > 0
        ? task.recurringDays.map(Number)
        : [0, 1, 2, 3, 4, 5, 6]; // fallback: every day

    // Walk forward up to 14 days to find the next allowed weekday
    const [y, m, d] = base.split("-").map(Number);
    const baseDate = new Date(y, m - 1, d);

    for (let i = 1; i <= 14; i++) {
      const candidate = new Date(baseDate);
      candidate.setDate(baseDate.getDate() + i);
      if (allowedDays.includes(candidate.getDay())) {
        const cy = candidate.getFullYear();
        const cm = String(candidate.getMonth() + 1).padStart(2, "0");
        const cd = String(candidate.getDate()).padStart(2, "0");
        return `${cy}-${cm}-${cd}`;
      }
    }
    // Should never reach here with a valid days array, but safe fallback
    return addDaysToYMD(base, 7);
  }

  // ── monthly: keep the same day-of-month ──────────────────────────────────────
  if (freq === "monthly") {
    const [y, m, day] = base.split("-").map(Number);
    const nextMonth = m; // m is 1-based, so adding 0 to month index gives next month
    const nextYear = m === 12 ? y + 1 : y;
    const nextMonthNum = m === 12 ? 1 : m + 1;

    // Clamp day to valid days in target month (handles Feb 28/29, short months)
    const daysInNextMonth = new Date(nextYear, nextMonthNum, 0).getDate();
    const clampedDay = Math.min(day, daysInNextMonth);

    return `${nextYear}-${String(nextMonthNum).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
  }

  // ── fallback ─────────────────────────────────────────────────────────────────
  return addDaysToYMD(base, 1);
}

export function lifecycleOf(task) {
  return task.lifecycleStatus || "active";
}