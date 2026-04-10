import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";

const ICON_OPTIONS = ["💧", "📚", "🏃", "🎯", "🧘", "✍️", "💪", "🥗", "🌙", "☕"];
const COLOR_OPTIONS = ["#94D82D", "#FFB020", "#E84A8A", "#5CC5D4", "#FF7A59", "#8A6CFF"];
const DAY_LABELS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const todayStr = () => new Date().toISOString().split("T")[0];

function getLast7() {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
}

function HabitCard({ habit, onToggle, onDelete }) {
  const last7 = getLast7();
  const today = todayStr();
  const doneSet = new Set(habit.completedDates || []);
  const totalDone = last7.filter((date) => doneSet.has(date.toISOString().split("T")[0])).length;
  const pct = Math.round((totalDone / 7) * 100);

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
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
            {habit.name}
          </div>
          <div style={{ color: habit.color, fontSize: "12px" }}>Every day</div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => onToggle(habit.id, today)}
            className="btn-reset"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: habit.color,
              color: "#111",
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "6px", marginBottom: "12px" }}>
        {last7.map((date, index) => {
          const dateStr = date.toISOString().split("T")[0];
          const isDone = doneSet.has(dateStr);
          const isToday = dateStr === today;
          return (
            <div key={dateStr} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{DAY_LABELS[index]}</span>
              <button
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
        <div style={{ display: "flex", gap: "12px" }}>
          <span style={{ color: habit.color }}>◌ 0</span>
          <span style={{ color: habit.color }}>◔ {Number.isFinite(pct) ? `${pct}%` : "-"}</span>
        </div>
        <button onClick={() => onDelete(habit.id)} className="btn-reset" style={{ color: "var(--text-muted)", fontSize: "18px" }}>
          ⋮
        </button>
      </div>
    </motion.div>
  );
}

export default function Habits() {
  const { accent } = useTheme();
  const { habits, loading, addHabit, toggleHabit, deleteHabit } = useHabits();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💧");
  const [color, setColor] = useState(accent);

  const handleAdd = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Enter a habit name");
      return;
    }
    await addHabit({ name: name.trim(), icon, color, frequency: "daily" });
    setName("");
    setIcon("💧");
    setColor(accent);
    setShowModal(false);
  }, [addHabit, color, icon, name, accent]);

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
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: "0 18px" }}>
            Create habit
          </button>
        </div>
      ) : (
        <AnimatePresence>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onDelete={deleteHabit} />
          ))}
        </AnimatePresence>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="btn-reset"
        style={{
          position: "fixed",
          right: "18px",
          bottom: "calc(var(--mobile-nav-height) + 28px)",
          width: "58px",
          height: "58px",
          borderRadius: "18px",
          background: `linear-gradient(135deg, var(--accent-hover), var(--accent))`,
          color: "#fff",
          fontSize: "30px",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        +
      </button>

      <CenteredModal isOpen={showModal} onClose={() => setShowModal(false)} title="New Habit" maxWidth="380px">
        <div style={{ display: "grid", gap: "14px" }}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Habit name"
            style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
          />

          <div>
            <div className="section-label" style={{ marginBottom: "8px" }}>Icon</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {ICON_OPTIONS.map((value) => (
                <button
                  key={value}
                  onClick={() => setIcon(value)}
                  className="btn-reset"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    background: value === icon ? "var(--accent-subtle)" : "var(--surface-raised)",
                    border: `1px solid ${value === icon ? "var(--accent)" : "var(--border)"}`,
                    fontSize: "18px",
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="section-label" style={{ marginBottom: "8px" }}>Color</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map((value) => (
                <button
                  key={value}
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

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowModal(false)} className="glass-tile" style={{ flex: 1, borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)" }}>
              Cancel
            </button>
            <button onClick={handleAdd} className="btn-primary" style={{ flex: 1 }}>
              Create
            </button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}
