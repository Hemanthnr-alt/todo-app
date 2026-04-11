import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import { IconFlame, IconPlus, IconTrash, PremiumIconButton } from "../components/PremiumChrome";
import { PremiumHabitTile } from "../components/PremiumMarks";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { formatLocalYMD, localTodayYMD } from "../utils/date";

const EMOJI_PRESETS = [
  "💧", "📚", "🏃", "🎯", "🧘", "✍️", "💪", "🥗", "🌙", "☕",
  "🔥", "💯", "🎉", "🌟", "⚡", "🎵", "📖", "🍎", "💤", "🚶",
  "🧠", "💻", "🎨", "🌅", "❤️", "🌿", "🧴", "🦷", "💊", "🚰",
  "🎮", "📝", "📅", "⏰", "🧹", "🛁", "🍳", "🥛", "🏋️", "🚴",
  "☀️", "🌈", "🦋", "🐝", "🌸", "⚽", "🎸", "📱", "✨", "🌱",
  "🍊", "💭", "🎧", "🧩", "📌", "🏠", "🚗", "✈️", "🧗", "🤝",
];
const COLOR_OPTIONS = ["#94D82D", "#FFB020", "#E84A8A", "#5CC5D4", "#FF7A59", "#8A6CFF"];
const DAY_LABELS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function scheduleLabel(h) {
  const f = h.frequency || "daily";
  const days = h.recurringDays || [];
  if (f === "interval" && h.everyNDays) return `Every ${h.everyNDays} days`;
  if (f === "weekly" && days.length) {
    const label = [...days].sort((a, b) => a - b).map((d) => WEEKDAY_SHORT[d] ?? d).join(", ");
    return `Weekly · ${label}`;
  }
  if (h.targetTimesPerWeek >= 1) return `${h.targetTimesPerWeek}× / week`;
  if (f === "monthly") return "Monthly";
  if (f === "daily") return "Daily";
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function getLast7() {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
}

function EmojiPickerGrid({ value, onChange }) {
  return (
    <div>
      <div className="section-label" style={{ marginBottom: "8px" }}>Icon</div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          maxHeight: "160px",
          overflowY: "auto",
          padding: "4px 2px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {EMOJI_PRESETS.map((em, index) => (
          <button
            key={`${em}-${index}`}
            type="button"
            onClick={() => onChange(em)}
            className="btn-reset"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: em === value ? "var(--accent-subtle)" : "var(--surface-raised)",
              border: `1px solid ${em === value ? "var(--accent)" : "var(--border)"}`,
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}

function HabitCard({ habit, onToggle, onDelete, onEdit }) {
  const last7 = getLast7();
  const today = localTodayYMD();
  const doneSet = new Set(habit.completedDates || []);
  const totalDone = last7.filter((date) => doneSet.has(formatLocalYMD(date))).length;
  const pct = Math.round((totalDone / 7) * 100);
  const streak = habit.streak ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="glass-panel"
      style={{ borderRadius: "18px", padding: "14px", marginBottom: "12px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ minWidth: 0, display: "flex", gap: "12px", alignItems: "center" }}>
          <PremiumHabitTile emoji={habit.icon} color={habit.color} size={46} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
              {habit.name}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
              <span style={{ color: habit.color, fontSize: "12px", fontWeight: 600 }}>{scheduleLabel(habit)}</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "4px 11px 4px 8px",
                  borderRadius: "999px",
                  background: `linear-gradient(135deg, ${habit.color}38, ${habit.color}16)`,
                  color: habit.color,
                  border: `1px solid ${habit.color}50`,
                  letterSpacing: "0.02em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <IconFlame size={13} fill={habit.color} />
                {streak} day{streak === 1 ? "" : "s"} streak
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggle(habit.id, today)}
          className="btn-reset"
          aria-label="Log today"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "14px",
            background: `linear-gradient(145deg, ${habit.color}, ${habit.color}cc)`,
            color: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 6px 18px ${habit.color}50, inset 0 1px 0 rgba(255,255,255,0.35)`,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <IconPlus size={22} stroke="currentColor" />
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "6px", marginBottom: "12px" }}>
        {last7.map((date, index) => {
          const dateStr = formatLocalYMD(date);
          const isDone = doneSet.has(dateStr);
          const isToday = dateStr === today;
          return (
            <div key={dateStr} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{DAY_LABELS[index]}</span>
              <button
                type="button"
                onClick={() => onToggle(habit.id, dateStr)}
                className="btn-reset"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: `2px solid ${isDone || isToday ? habit.color : "var(--border)"}`,
                  background: isDone ? habit.color : "var(--surface-raised)",
                  color: isDone ? "#fff" : isToday ? habit.color : "var(--text-muted)",
                  boxShadow: isDone ? `0 0 0 4px ${habit.color}1f` : "none",
                  fontSize: "14px",
                  fontWeight: isDone || isToday ? 700 : 500,
                }}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "12px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ color: habit.color, fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase" }}>7d · {Number.isFinite(pct) ? `${pct}%` : "—"}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button type="button" onClick={() => onEdit(habit)} className="btn-reset" style={{ color: "var(--accent)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "8px 10px", borderRadius: "10px", background: "var(--accent-subtle)", border: "1px solid var(--accent-subtle)" }}>
            Edit
          </button>
          <PremiumIconButton label="Delete habit" onClick={() => onDelete(habit.id)}>
            <IconTrash size={17} stroke="currentColor" />
          </PremiumIconButton>
        </div>
      </div>
    </motion.div>
  );
}

export default function Habits() {
  const { accent } = useTheme();
  const { habits, loading, addHabit, toggleHabit, deleteHabit, updateHabit } = useHabits();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💧");
  const [color, setColor] = useState(accent);
  const [frequency, setFrequency] = useState("daily");
  const [recurringDaysStr, setRecurringDaysStr] = useState("1,2,3,4,5");
  const [everyNDays, setEveryNDays] = useState(2);
  const [targetTimesPerWeek, setTargetTimesPerWeek] = useState("");
  const [goalMinMinutes, setGoalMinMinutes] = useState("");
  const [goalMaxPerDay, setGoalMaxPerDay] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  const resetForm = useCallback(() => {
    setName("");
    setIcon("💧");
    setColor(accent);
    setEditingId(null);
    setFrequency("daily");
    setRecurringDaysStr("1,2,3,4,5");
    setEveryNDays(2);
    setTargetTimesPerWeek("");
    setGoalMinMinutes("");
    setGoalMaxPerDay("");
    setReminderEnabled(false);
    setReminderTime("09:00");
  }, [accent]);

  const openCreate = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const openEdit = useCallback(
    (habit) => {
      setEditingId(habit.id);
      setName(habit.name);
      setIcon(habit.icon || "💧");
      setColor(habit.color || accent);
      setFrequency(habit.frequency || "daily");
      setRecurringDaysStr((habit.recurringDays || []).length ? habit.recurringDays.join(",") : "1,2,3,4,5");
      setEveryNDays(habit.everyNDays ?? 2);
      setTargetTimesPerWeek(habit.targetTimesPerWeek != null ? String(habit.targetTimesPerWeek) : "");
      setGoalMinMinutes(habit.goalMinMinutes != null ? String(habit.goalMinMinutes) : "");
      setGoalMaxPerDay(habit.goalMaxPerDay != null ? String(habit.goalMaxPerDay) : "");
      setReminderEnabled(!!habit.reminderEnabled);
      const rt = habit.reminderTime;
      setReminderTime(typeof rt === "string" && rt.length >= 5 ? rt.slice(0, 5) : "09:00");
      setShowModal(true);
    },
    [accent],
  );

  const handleClose = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [resetForm]);

  const buildHabitPayload = useCallback(() => {
    const recurringDays = frequency === "weekly"
      ? recurringDaysStr.split(/[,\s]+/).map((x) => Number.parseInt(x, 10)).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
      : [];
    const targetWeek = String(targetTimesPerWeek).trim();
    return {
      name: name.trim(),
      icon,
      color,
      frequency,
      recurringDays: frequency === "weekly" ? recurringDays : [],
      everyNDays: frequency === "interval" ? Math.max(1, Number(everyNDays) || 2) : null,
      targetTimesPerWeek: targetWeek ? Math.min(7, Math.max(1, Number(targetWeek))) : null,
      goalMinMinutes: String(goalMinMinutes).trim() === "" ? null : Math.max(0, Number(goalMinMinutes) || 0),
      goalMaxPerDay: String(goalMaxPerDay).trim() === "" ? null : Math.max(0, Number(goalMaxPerDay) || 0),
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : null,
    };
  }, [color, everyNDays, frequency, goalMaxPerDay, goalMinMinutes, icon, name, recurringDaysStr, reminderEnabled, reminderTime, targetTimesPerWeek]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Enter a habit name");
      return;
    }
    const payload = buildHabitPayload();
    if (editingId) {
      await updateHabit(editingId, payload);
    } else {
      await addHabit(payload);
    }
    handleClose();
  }, [addHabit, buildHabitPayload, editingId, handleClose, updateHabit]);

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px 32px", color: "var(--text-body)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "4px" }}>Habits</h1>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{habits.length} active habits</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Loading...</div>
      ) : habits.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: "18px", padding: "24px", textAlign: "center" }}>
          <div style={{ color: "var(--text-muted)", marginBottom: "16px" }}>No habits yet.</div>
          <button type="button" onClick={openCreate} className="btn-primary" style={{ padding: "0 18px" }}>
            Create habit
          </button>
        </div>
      ) : (
        <AnimatePresence>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onDelete={deleteHabit} onEdit={openEdit} />
          ))}
        </AnimatePresence>
      )}

      <button
        type="button"
        onClick={openCreate}
        className="btn-reset"
        aria-label="New habit"
        style={{
          position: "fixed",
          right: "18px",
          bottom: "calc(var(--mobile-nav-height) + 28px)",
          width: "58px",
          height: "58px",
          borderRadius: "18px",
          background: "linear-gradient(145deg, var(--accent-hover), var(--accent))",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-glow), 0 8px 28px var(--accent-glow)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <IconPlus size={26} stroke="#fff" />
      </button>

      <CenteredModal isOpen={showModal} onClose={handleClose} title={editingId ? "Edit habit" : "New habit"} maxWidth="440px">
        <div style={{ display: "grid", gap: "14px" }}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Habit name"
            style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
          />

          <EmojiPickerGrid value={icon} onChange={setIcon} />

          <div>
            <div className="section-label" style={{ marginBottom: "8px" }}>Color</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  className="btn-reset"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: value,
                    boxShadow: color === value ? `0 0 0 2px #121212, 0 0 0 4px ${value}` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", border: "1px solid var(--border)", display: "grid", gap: "12px", minWidth: 0, overflow: "visible" }}>
            <span className="section-label">Schedule</span>
            <CustomSelect
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly (pick days)" },
                { value: "interval", label: "Every N days" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
            {frequency === "weekly" && (
              <div>
                <span className="section-label" style={{ marginBottom: "6px", display: "block" }}>Days 0–6 (Sun–Sat)</span>
                <input
                  value={recurringDaysStr}
                  onChange={(e) => setRecurringDaysStr(e.target.value)}
                  placeholder="1,2,3,4,5"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "13px" }}
                />
              </div>
            )}
            {frequency === "interval" && (
              <label style={{ display: "grid", gap: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
                Repeat every N days
                <input
                  type="number"
                  min={1}
                  value={everyNDays}
                  onChange={(e) => setEveryNDays(Math.max(1, Number(e.target.value) || 1))}
                  style={{ padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontWeight: 700 }}
                />
              </label>
            )}
            <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", lineHeight: 1.35 }}>
                Target / week (optional)
              </span>
              <input
                value={targetTimesPerWeek}
                onChange={(e) => setTargetTimesPerWeek(e.target.value)}
                placeholder="e.g. 5"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </label>
          </div>

          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", border: "1px solid var(--border)", display: "grid", gap: "12px", minWidth: 0, overflow: "visible" }}>
            <span className="section-label">Goals (optional)</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
              <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Min minutes</span>
                <input
                  value={goalMinMinutes}
                  onChange={(e) => setGoalMinMinutes(e.target.value)}
                  placeholder="—"
                  inputMode="numeric"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", boxSizing: "border-box" }}
                />
              </label>
              <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Max per day</span>
                <input
                  value={goalMaxPerDay}
                  onChange={(e) => setGoalMaxPerDay(e.target.value)}
                  placeholder="—"
                  inputMode="numeric"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", boxSizing: "border-box" }}
                />
              </label>
            </div>
          </div>

          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", border: "1px solid var(--border)", display: "grid", gap: "10px", minWidth: 0, overflow: "visible" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", lineHeight: 1.4 }}>
              <input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
              <span>Reminder in app (daily ping at the time below)</span>
            </label>
            {reminderEnabled && (
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                style={{ padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
              />
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={handleClose} className="glass-tile" style={{ flex: 1, borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)" }}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary" style={{ flex: 1 }}>
              {editingId ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}
