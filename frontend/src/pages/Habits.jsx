import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import { IconFlame, IconPlus, IconTrash, PremiumCompleteTitle, PremiumIconButton } from "../components/PremiumChrome";
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
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(ymd, n) {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + n);
  return formatLocalYMD(d);
}

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

// ── Emoji picker ──────────────────────────────────────────────────────────────
const EmojiPickerGrid = memo(function EmojiPickerGrid({ value, onChange, isExpanded, onToggle }) {
  return (
    <div>
      <div className="section-label" style={{ marginBottom: "8px" }}>Icon</div>
      <button
        type="button"
        onClick={onToggle}
        className="glass-tile"
        style={{
          width: "100%",
          borderRadius: "16px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          color: "var(--text-primary)",
          fontWeight: 600,
          marginBottom: isExpanded ? "12px" : 0,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px", lineHeight: 1 }}>{value}</span>
          {isExpanded ? "Hide icons" : "Choose icon"}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 700 }}>
          {isExpanded ? "Collapse" : "Open"}
        </span>
      </button>
      {isExpanded && (
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
      )}
    </div>
  );
});

// ── Quantity log modal ────────────────────────────────────────────────────────
function QuantityModal({ habit, isOpen, onClose, onLog }) {
  const today = localTodayYMD();
  const existing = (habit?.completedDates || []).filter((d) => d === today).length;
  const max = habit?.goalMaxPerDay || null;
  const [value, setValue] = useState(existing || 1);
  const [mode, setMode] = useState("replace");

  useEffect(() => {
    if (isOpen) setValue(existing || 1);
  }, [isOpen, existing]);

  if (!isOpen || !habit) return null;

  const displayed = mode === "add" ? existing + value : value;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        style={{
          background: "#1a1a1a",
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 36px",
          width: "100%", maxWidth: "420px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#f3f3f3", marginBottom: "4px" }}>{habit.name}</div>
            <div
              style={{
                display: "inline-block",
                background: `${habit.color}22`, color: habit.color,
                fontSize: "12px", fontWeight: 700,
                padding: "3px 10px", borderRadius: "999px",
                border: `1px solid ${habit.color}44`,
              }}
            >
              {scheduleLabel(habit)}
            </div>
          </div>
          <div
            style={{
              width: "36px", height: "36px", borderRadius: "12px",
              background: habit.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}
          >
            {habit.icon}
          </div>
        </div>

        <div
          style={{
            background: "#242424", borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px", marginBottom: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            type="button"
            onClick={() => setValue((v) => Math.max(0, v - 1))}
            className="btn-reset"
            style={{
              width: "52px", height: "52px", borderRadius: "12px",
              background: "#2d2d2d", color: "#f3f3f3",
              fontSize: "24px", fontWeight: 300,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >−</button>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "42px", fontWeight: 800, color: habit.color,
                fontFamily: "var(--font-heading)", lineHeight: 1,
              }}
            >
              {value}
            </div>
            {max && (
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.42)", marginTop: "2px" }}>
                of {max} {habit.unit || "times"}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setValue((v) => v + 1)}
            className="btn-reset"
            style={{
              width: "52px", height: "52px", borderRadius: "12px",
              background: habit.color, color: "#111",
              fontSize: "24px", fontWeight: 300,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px ${habit.color}55`,
            }}
          >+</button>
        </div>

        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            background: "#242424", borderRadius: "12px",
            padding: "4px", marginBottom: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {["replace", "add"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="btn-reset"
              style={{
                padding: "9px", borderRadius: "9px",
                background: mode === m ? `${habit.color}30` : "transparent",
                color: mode === m ? habit.color : "rgba(255,255,255,0.42)",
                fontWeight: 700, fontSize: "13px",
                border: mode === m ? `1px solid ${habit.color}55` : "1px solid transparent",
                transition: "all 160ms ease",
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div
          style={{
            background: "#242424", borderRadius: "12px",
            padding: "12px 16px", marginBottom: "20px",
            border: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.42)", marginBottom: "2px" }}>Today</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f3f3" }}>
            {displayed}{max ? ` / ${max}` : ""} {habit.unit || "times"}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-reset"
            style={{
              flex: 1, padding: "13px", borderRadius: "14px",
              background: "#242424", color: "rgba(255,255,255,0.7)",
              fontWeight: 700, fontSize: "14px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >CANCEL</button>
          <button
            type="button"
            onClick={() => { onLog(habit.id, value, mode); onClose(); }}
            className="btn-reset"
            style={{
              flex: 1, padding: "13px", borderRadius: "14px",
              background: habit.color, color: "#111",
              fontWeight: 800, fontSize: "14px",
              boxShadow: `0 4px 20px ${habit.color}55`,
            }}
          >OK</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Habit Card ────────────────────────────────────────────────────────────────
function HabitCard({ habit, onToggle, onDelete, onEdit, onOpenQuantity }) {
  const today = localTodayYMD();
  const startDate = habit.startDate || habit.createdAt?.slice(0, 10) || today;
  const doneSet = new Set(habit.completedDates || []);
  const completeToday = doneSet.has(today);

  const windowDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));
    return days;
  }, [today]);

  const activeDays = windowDays.filter((d) => d >= startDate && d <= today);
  const totalDone = activeDays.filter((d) => doneSet.has(d)).length;
  const pct = activeDays.length > 0 ? Math.round((totalDone / activeDays.length) * 100) : 0;
  const streak = habit.streak ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{
        background: "#141414",
        borderRadius: "20px",
        padding: "16px",
        marginBottom: "12px",
        border: "1px solid rgba(255,255,255,0.07)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: "absolute", left: 0, top: "16px", bottom: "16px",
          width: "3px", borderRadius: "0 3px 3px 0",
          background: habit.color,
          boxShadow: `0 0 12px ${habit.color}88`,
        }}
      />

      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", paddingLeft: "12px" }}>
        <div style={{ minWidth: 0, display: "flex", gap: "12px", alignItems: "center" }}>
          <PremiumHabitTile emoji={habit.icon} color={habit.color} size={44} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f3f3", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              <PremiumCompleteTitle complete={completeToday} lineColor={habit.color}>
                {habit.name}
              </PremiumCompleteTitle>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "7px" }}>
              <span
                style={{
                  fontSize: "11px", fontWeight: 700, color: habit.color,
                  background: `${habit.color}1a`, padding: "2px 8px",
                  borderRadius: "999px", border: `1px solid ${habit.color}33`,
                }}
              >
                {scheduleLabel(habit)}
              </span>
              {streak > 0 && (
                <span
                  style={{
                    fontSize: "11px", fontWeight: 800,
                    padding: "2px 8px 2px 6px", borderRadius: "999px",
                    background: "rgba(255,154,60,0.12)", color: "#ff9a3c",
                    border: "1px solid rgba(255,154,60,0.25)",
                    display: "inline-flex", alignItems: "center", gap: "4px",
                  }}
                >
                  <IconFlame size={11} fill="#ff9a3c" />
                  {streak}d streak
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => habit.goalMaxPerDay ? onOpenQuantity(habit) : onToggle(habit.id, today)}
          className="btn-reset"
          aria-label="Log today"
          style={{
            width: "42px", height: "42px", borderRadius: "13px",
            background: completeToday ? `${habit.color}22` : `linear-gradient(145deg, ${habit.color}, ${habit.color}cc)`,
            color: completeToday ? habit.color : "#111",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: completeToday ? `0 0 0 1px ${habit.color}44 inset` : `0 4px 16px ${habit.color}55`,
            border: completeToday ? `1px solid ${habit.color}44` : "1px solid rgba(255,255,255,0.2)",
            transition: "all 180ms ease",
            flexShrink: 0,
          }}
        >
          {completeToday
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <IconPlus size={20} stroke="currentColor" />}
        </button>
      </div>

      {/* 7-day row */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "4px", marginBottom: "14px", paddingLeft: "12px" }}>
        {windowDays.map((dateStr) => {
          const isFuture = dateStr > today;
          const beforeStart = dateStr < startDate;
          const isDone = doneSet.has(dateStr);
          const isToday = dateStr === today;
          const dayNum = new Date(`${dateStr}T00:00:00`).getDate();
          const dayLabel = WEEKDAY_SHORT[new Date(`${dateStr}T00:00:00`).getDay()];
          const isLocked = isFuture || beforeStart;

          return (
            <div key={dateStr} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flex: 1 }}>
              <span
                style={{
                  color: isToday ? habit.color : "rgba(255,255,255,0.3)",
                  fontSize: "10px", fontWeight: isToday ? 800 : 500,
                }}
              >
                {dayLabel}
              </span>
              <button
                type="button"
                onClick={() => !isLocked && onToggle(habit.id, dateStr)}
                className="btn-reset"
                disabled={isLocked}
                title={isFuture ? "Future — locked" : beforeStart ? "Habit started later" : undefined}
                style={{
                  width: "32px", height: "32px",
                  borderRadius: "10px",
                  border: isLocked
                    ? "1px solid rgba(255,255,255,0.05)"
                    : `1.5px solid ${isDone ? habit.color : isToday ? `${habit.color}66` : "rgba(255,255,255,0.1)"}`,
                  background: isDone
                    ? habit.color
                    : isLocked
                      ? "rgba(255,255,255,0.02)"
                      : isToday ? `${habit.color}12` : "rgba(255,255,255,0.04)",
                  color: isDone ? "#000" : isLocked ? "rgba(255,255,255,0.12)" : isToday ? habit.color : "rgba(255,255,255,0.4)",
                  boxShadow: isDone ? `0 0 0 3px ${habit.color}20` : "none",
                  fontSize: "12px", fontWeight: isDone || isToday ? 800 : 500,
                  cursor: isLocked ? "not-allowed" : "pointer",
                  transition: "all 150ms ease",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {isFuture
                  ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" style={{ opacity: 0.2 }}>
                      <rect x="5" y="11" width="14" height="11" rx="2" fill="currentColor" />
                      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  )
                  : beforeStart
                    ? <span style={{ fontSize: "8px", opacity: 0.2 }}>–</span>
                    : dayNum}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingLeft: "12px", paddingTop: "10px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "80px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%", borderRadius: "999px",
                width: `${pct}%`, background: habit.color,
                boxShadow: `0 0 8px ${habit.color}88`,
                transition: "width 400ms ease",
              }}
            />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: habit.color, letterSpacing: "0.04em" }}>{pct}%</span>
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => onEdit(habit)}
            className="btn-reset"
            style={{
              color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700,
              padding: "6px 10px", borderRadius: "9px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >Edit</button>
          <PremiumIconButton label="Delete habit" onClick={() => onDelete(habit.id)}>
            <IconTrash size={15} stroke="currentColor" />
          </PremiumIconButton>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Habits() {
  const { accent } = useTheme();
  const { habits, loading, addHabit, toggleHabit, deleteHabit, updateHabit } = useHabits();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [quantityHabit, setQuantityHabit] = useState(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💧");
  const [color, setColor] = useState(accent);
  const [frequency, setFrequency] = useState("daily");
  const [recurringDaysStr, setRecurringDaysStr] = useState("1,2,3,4,5");
  const [everyNDays, setEveryNDays] = useState(2);
  const [targetTimesPerWeek, setTargetTimesPerWeek] = useState("");
  const [goalMinMinutes, setGoalMinMinutes] = useState("");
  const [goalMaxPerDay, setGoalMaxPerDay] = useState("");
  const [unit, setUnit] = useState("times");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [canRenderEmojiPicker, setCanRenderEmojiPicker] = useState(false);

  const resetForm = useCallback(() => {
    setName(""); setIcon("💧"); setColor(accent); setEditingId(null);
    setFrequency("daily"); setRecurringDaysStr("1,2,3,4,5"); setEveryNDays(2);
    setTargetTimesPerWeek(""); setGoalMinMinutes(""); setGoalMaxPerDay("");
    setUnit("times"); setReminderEnabled(false); setReminderTime("09:00");
    setShowEmojiPicker(false); setCanRenderEmojiPicker(false);
  }, [accent]);

  const openCreate = useCallback(() => { resetForm(); setShowModal(true); }, [resetForm]);

  const openEdit = useCallback((habit) => {
    setEditingId(habit.id); setName(habit.name); setIcon(habit.icon || "💧");
    setColor(habit.color || accent); setFrequency(habit.frequency || "daily");
    setRecurringDaysStr((habit.recurringDays || []).length ? habit.recurringDays.join(",") : "1,2,3,4,5");
    setEveryNDays(habit.everyNDays ?? 2);
    setTargetTimesPerWeek(habit.targetTimesPerWeek != null ? String(habit.targetTimesPerWeek) : "");
    setGoalMinMinutes(habit.goalMinMinutes != null ? String(habit.goalMinMinutes) : "");
    setGoalMaxPerDay(habit.goalMaxPerDay != null ? String(habit.goalMaxPerDay) : "");
    setUnit(habit.unit || "times");
    setReminderEnabled(!!habit.reminderEnabled);
    const rt = habit.reminderTime;
    setReminderTime(typeof rt === "string" && rt.length >= 5 ? rt.slice(0, 5) : "09:00");
    setShowModal(true);
  }, [accent]);

  const handleClose = useCallback(() => { setShowModal(false); resetForm(); }, [resetForm]);

  useEffect(() => {
    if (!showModal) { setCanRenderEmojiPicker(false); return undefined; }
    const timer = window.setTimeout(() => setCanRenderEmojiPicker(true), 120);
    return () => window.clearTimeout(timer);
  }, [showModal]);

  const buildHabitPayload = useCallback(() => {
    const recurringDays = frequency === "weekly"
      ? recurringDaysStr.split(/[,\s]+/).map((x) => Number.parseInt(x, 10)).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
      : [];
    const targetWeek = String(targetTimesPerWeek).trim();
    return {
      name: name.trim(), icon, color, frequency,
      recurringDays: frequency === "weekly" ? recurringDays : [],
      everyNDays: frequency === "interval" ? Math.max(1, Number(everyNDays) || 2) : null,
      targetTimesPerWeek: targetWeek ? Math.min(7, Math.max(1, Number(targetWeek))) : null,
      goalMinMinutes: String(goalMinMinutes).trim() === "" ? null : Math.max(0, Number(goalMinMinutes) || 0),
      goalMaxPerDay: String(goalMaxPerDay).trim() === "" ? null : Math.max(0, Number(goalMaxPerDay) || 0),
      unit: unit.trim() || "times",
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : null,
    };
  }, [color, everyNDays, frequency, goalMaxPerDay, goalMinMinutes, icon, name, recurringDaysStr, reminderEnabled, reminderTime, targetTimesPerWeek, unit]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) { toast.error("Enter a habit name"); return; }
    const payload = buildHabitPayload();
    if (editingId) {
      await updateHabit(editingId, payload);
    } else {
      // Attach startDate = today so history before creation is not shown
      await addHabit({ ...payload, startDate: localTodayYMD() });
    }
    handleClose();
  }, [addHabit, buildHabitPayload, editingId, handleClose, updateHabit]);

  const handleQuantityLog = useCallback((id, qty, mode) => {
    const today = localTodayYMD();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const alreadyDone = (habit.completedDates || []).includes(today);
    if (mode === "replace") {
      if (qty > 0 && !alreadyDone) toggleHabit(id, today);
      if (qty === 0 && alreadyDone) toggleHabit(id, today);
    } else if (!alreadyDone) {
      toggleHabit(id, today);
    }
    toast.success(`${habit.name} logged!`);
  }, [habits, toggleHabit]);

  const today = localTodayYMD();
  const doneToday = habits.filter((h) => (h.completedDates || []).includes(today)).length;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px 32px", color: "var(--text-body)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "3px" }}>Habits</h1>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {habits.length} active · {doneToday} done today
          </div>
        </div>

        {habits.length > 0 && (() => {
          const r = 18;
          const circ = 2 * Math.PI * r;
          const progress = circ * (1 - doneToday / habits.length);
          return (
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
              <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
              <circle
                cx="24" cy="24" r={r} fill="none"
                stroke={accent}
                strokeWidth="3.5"
                strokeDasharray={circ}
                strokeDashoffset={progress}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
                style={{ transition: "stroke-dashoffset 600ms ease", filter: `drop-shadow(0 0 6px ${accent}88)` }}
              />
              <text x="24" y="29" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="800" fontFamily="var(--font-heading)">
                {doneToday}/{habits.length}
              </text>
            </svg>
          );
        })()}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Loading...</div>
      ) : habits.length === 0 ? (
        <div
          className="glass-panel"
          style={{ borderRadius: "20px", padding: "40px 24px", textAlign: "center", border: "1px dashed var(--border)" }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🌱</div>
          <div style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: "14px" }}>No habits yet. Start building one.</div>
          <button type="button" onClick={openCreate} className="btn-primary" style={{ padding: "0 18px" }}>
            Create habit
          </button>
        </div>
      ) : (
        <AnimatePresence>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={toggleHabit}
              onDelete={deleteHabit}
              onEdit={openEdit}
              onOpenQuantity={setQuantityHabit}
            />
          ))}
        </AnimatePresence>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={openCreate}
        className="btn-reset"
        aria-label="New habit"
        style={{
          position: "fixed",
          right: "18px",
          bottom: "calc(var(--mobile-nav-height) + 28px)",
          width: "58px", height: "58px",
          borderRadius: "18px",
          background: "linear-gradient(145deg, var(--accent-hover), var(--accent))",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "var(--shadow-glow), 0 8px 28px var(--accent-glow)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <IconPlus size={26} stroke="#fff" />
      </button>

      {/* Quantity modal */}
      <AnimatePresence>
        {quantityHabit && (
          <QuantityModal
            habit={quantityHabit}
            isOpen={!!quantityHabit}
            onClose={() => setQuantityHabit(null)}
            onLog={handleQuantityLog}
          />
        )}
      </AnimatePresence>

      {/* Create / Edit modal */}
      <CenteredModal isOpen={showModal} onClose={handleClose} title={editingId ? "Edit habit" : "New habit"} maxWidth="440px">
        <div style={{ display: "grid", gap: "14px" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Habit name"
            style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
          />

          <EmojiPickerGrid
            value={icon}
            onChange={setIcon}
            isExpanded={showEmojiPicker && canRenderEmojiPicker}
            onToggle={() => { if (!canRenderEmojiPicker) return; setShowEmojiPicker((c) => !c); }}
          />

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
                    width: "30px", height: "30px", borderRadius: "50%",
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
                  type="number" min={1} value={everyNDays}
                  onChange={(e) => setEveryNDays(Math.max(1, Number(e.target.value) || 1))}
                  style={{ padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontWeight: 700 }}
                />
              </label>
            )}
            <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", lineHeight: 1.35 }}>Target / week (optional)</span>
              <input
                value={targetTimesPerWeek}
                onChange={(e) => setTargetTimesPerWeek(e.target.value)}
                placeholder="e.g. 5"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </label>
          </div>

          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", border: "1px solid var(--border)", display: "grid", gap: "12px", minWidth: 0, overflow: "visible" }}>
            <span className="section-label">Goals &amp; unit (optional)</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Min minutes</span>
                <input value={goalMinMinutes} onChange={(e) => setGoalMinMinutes(e.target.value)} placeholder="—" inputMode="numeric"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", boxSizing: "border-box" }} />
              </label>
              <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Max per day</span>
                <input value={goalMaxPerDay} onChange={(e) => setGoalMaxPerDay(e.target.value)} placeholder="—" inputMode="numeric"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", boxSizing: "border-box" }} />
              </label>
            </div>
            <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Unit (glasses, pages, km…)</span>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="times"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "13px", boxSizing: "border-box" }} />
            </label>
          </div>

          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", border: "1px solid var(--border)", display: "grid", gap: "10px", minWidth: 0, overflow: "visible" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", lineHeight: 1.4 }}>
              <input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
              <span>Reminder in app (daily ping at the time below)</span>
            </label>
            {reminderEnabled && (
              <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
                style={{ padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
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