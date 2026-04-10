/** Minutes from midnight, or null if unparseable / empty */
export function timeToMinutes(time) {
  if (time == null || time === "") return null;
  const s = String(time).trim();
  const parts = s.split(":");
  if (parts.length < 2) return null;
  const h = Number.parseInt(parts[0], 10);
  const m = Number.parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return ((h % 24) * 60 + (m % 60) + 24 * 60) % (24 * 60);
}

/** "09:30:00" | "09:30" → "9:00 AM" */
export function formatTimeDisplay(time) {
  const mins = timeToMinutes(time);
  if (mins === null) return "";
  const h24 = Math.floor(mins / 60);
  const mm = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
}

export function getTaskScheduleMinutes(task) {
  if (!task) return null;
  const fromStart = timeToMinutes(task.startTime);
  if (fromStart !== null) return fromStart;
  const fromEnd = timeToMinutes(task.endTime);
  if (fromEnd !== null) return fromEnd;
  if (task.dueTime) return timeToMinutes(task.dueTime);
  return null;
}

/** Habits sort into the morning block by default when mixed with timed tasks */
export const HABIT_DEFAULT_SORT_MINUTES = 8 * 60 + 30;

export function normalizeTimeForApi(value) {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  const parts = v.split(":");
  if (parts.length === 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
  return v;
}

/** Single line for list UI: start, end, or range */
export function formatTaskScheduleLabel(task) {
  const a = task?.startTime;
  const b = task?.endTime;
  if (!a && !b) return "";
  const fa = a ? formatTimeDisplay(a) : "";
  const fb = b ? formatTimeDisplay(b) : "";
  if (fa && fb) {
    const startCompact = fa.replace(/\s+(AM|PM)$/i, "").trim();
    return `${startCompact} – ${fb}`;
  }
  return fa || fb;
}

/**
 * Bucket id for grouping the day view.
 * late night 12a–5a → night; 5a–9a early; …; unscheduled → anytime
 */
export function getTimeBucketId(minutes) {
  if (minutes === null) return "anytime";
  const m = minutes % (24 * 60);
  if (m < 5 * 60) return "night";
  if (m < 9 * 60) return "early";
  if (m < 12 * 60) return "morning";
  if (m < 17 * 60) return "afternoon";
  if (m < 21 * 60) return "evening";
  return "night";
}

export const AGENDA_BUCKET_META = {
  early: { label: "Early", sub: "5:00 – 9:00" },
  morning: { label: "Morning", sub: "9:00 – 12:00" },
  afternoon: { label: "Afternoon", sub: "12:00 – 5:00" },
  evening: { label: "Evening", sub: "5:00 – 9:00" },
  night: { label: "Night", sub: "After 9:00" },
  anytime: { label: "Anytime", sub: "No time set" },
};

const BUCKET_ORDER = ["early", "morning", "afternoon", "evening", "night", "anytime"];

export function compareAgendaItems(a, b) {
  const aNull = a.sortMinutes === null;
  const bNull = b.sortMinutes === null;
  if (aNull !== bNull) return aNull ? 1 : -1;
  if (!aNull && a.sortMinutes !== b.sortMinutes) return a.sortMinutes - b.sortMinutes;
  if (a.type !== b.type) return a.type === "habit" ? -1 : 1;
  return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
}

/** @returns {{ bucketId: string, label: string, sub: string, items: object[] }[]} */
export function buildAgendaGroups(items) {
  const sorted = [...items].sort(compareAgendaItems);
  const groups = [];
  let current = null;

  for (const item of sorted) {
    const bucketId = item.sortMinutes === null ? "anytime" : getTimeBucketId(item.sortMinutes);
    if (!current || current.bucketId !== bucketId) {
      const meta = AGENDA_BUCKET_META[bucketId] || AGENDA_BUCKET_META.anytime;
      current = { bucketId, label: meta.label, sub: meta.sub, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }

  return groups.sort((ga, gb) => BUCKET_ORDER.indexOf(ga.bucketId) - BUCKET_ORDER.indexOf(gb.bucketId));
}
