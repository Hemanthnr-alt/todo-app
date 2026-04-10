/**
 * Calendar day strings (YYYY-MM-DD) must use the user's local calendar,
 * not UTC (`Date#toISOString`), or dates shift by one in many timezones.
 */
export function formatLocalYMD(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localTodayYMD() {
  return formatLocalYMD(new Date());
}

/** Add calendar days to a YYYY-MM-DD string (local). */
export function addDaysToYMD(ymd, deltaDays) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return formatLocalYMD(dt);
}
