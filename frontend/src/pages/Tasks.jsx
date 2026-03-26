import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import api from "../services/api";
import toast from "react-hot-toast";

// ── helpers ───────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};
const weekEnd = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};

const PRIORITY_META = {
  high:   { color: "#f43f5e", bg: "rgba(244,63,94,0.1)",  label: "High",   dot: "🔴" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Medium", dot: "🟡" },
  low:    { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Low",    dot: "🟢" },
};

function formatDueDate(d) {
  if (!d) return null;
  if (d === today()) return "Today";
  if (d === tomorrow()) return "Tomorrow";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fileIcon(mime) {
  if (mime?.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime?.includes("word")) return "📝";
  if (mime?.includes("sheet") || mime?.includes("excel")) return "📊";
  if (mime === "text/plain") return "📃";
  if (mime?.includes("zip")) return "📦";
  return "📎";
}

function fmtSize(b) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

// ── SubTask mini component ────────────────────────────────
function SubTasks({ task, onUpdate }) {
  const [text, setText] = useState("");
  const subtasks = task.subtasks || [];

  const add = async () => {
    if (!text.trim()) return;
    const updated = [...subtasks, { id: Date.now(), title: text.trim(), done: false }];
    await onUpdate(task.id, { subtasks: updated });
    setText("");
  };

  const toggle = async (id) => {
    const updated = subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s);
    await onUpdate(task.id, { subtasks: updated });
  };

  const remove = async (id) => {
    const updated = subtasks.filter((s) => s.id !== id);
    await onUpdate(task.id, { subtasks: updated });
  };

  return (
    <div style={{ marginTop: "10px" }}>
      {subtasks.map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <input type="checkbox" checked={s.done} onChange={() => toggle(s.id)} style={{ cursor: "pointer", accentColor: "#ff6b9d" }} />
          <span style={{ fontSize: "12px", textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.5 : 1, flex: 1 }}>
            {s.title}
          </span>
          <button onClick={() => remove(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f43f5e", fontSize: "11px" }}>✕</button>
        </div>
      ))}
      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add subtask…"
          style={{
            flex: 1, padding: "5px 10px", borderRadius: "6px",
            border: "1px solid rgba(255,107,157,0.3)",
            background: "transparent", color: "inherit",
            fontSize: "12px", fontFamily: "inherit",
          }}
        />
        <button onClick={add} style={{
          padding: "5px 10px", borderRadius: "6px",
          background: "rgba(255,107,157,0.15)", border: "1px solid rgba(255,107,157,0.3)",
          color: "#ff6b9d", cursor: "pointer", fontSize: "12px",
        }}>+ Add</button>
      </div>
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────
function TaskCard({ task, categories, onUpdate, onDelete, isDark }) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const cat = categories.find((c) => c.id === task.categoryId);
  const overdue = task.dueDate && task.dueDate < today() && !task.completed;
  const dueFmt = formatDueDate(task.dueDate);
  const subtaskCount = task.subtasks?.length || 0;
  const subtaskDone = task.subtasks?.filter((s) => s.done).length || 0;

  const cardBg = isDark
    ? overdue ? "rgba(244,63,94,0.07)" : "rgba(15,23,42,0.6)"
    : overdue ? "rgba(244,63,94,0.05)" : "rgba(255,255,255,0.8)";

  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/tasks/${task.id}/upload`, fd);
      onUpdate(task.id, { attachments: [...(task.attachments || []), res.data.attachment] }, true);
      toast.success("File attached!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attId) => {
    try {
      await api.delete(`/tasks/${task.id}/attachments/${attId}`);
      onUpdate(task.id, {
        attachments: (task.attachments || []).filter((a) => a.id !== attId),
      }, true);
      toast.success("Attachment removed");
    } catch {
      toast.error("Failed to remove attachment");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      style={{
        background: cardBg,
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        border: `1px solid ${overdue ? "rgba(244,63,94,0.3)" : isDark ? "rgba(255,107,157,0.1)" : "rgba(255,107,157,0.15)"}`,
        borderLeft: `3px solid ${pm.color}`,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Main row */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Checkbox */}
        <div
          onClick={() => onUpdate(task.id, { completed: !task.completed })}
          style={{
            width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0, marginTop: "2px",
            border: `2px solid ${task.completed ? "#ff6b9d" : isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"}`,
            background: task.completed ? "linear-gradient(135deg,#ff6b9d,#ff99cc)" : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {task.completed && <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>✓</span>}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "14px", fontWeight: 600, color: textColor,
              textDecoration: task.completed ? "line-through" : "none",
              opacity: task.completed ? 0.5 : 1,
            }}>
              {task.title}
            </span>

            {/* Priority badge */}
            <span style={{
              fontSize: "10px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "20px",
              background: pm.bg, color: pm.color,
            }}>
              {pm.dot} {pm.label}
            </span>

            {/* Category */}
            {cat && (
              <span style={{
                fontSize: "10px", fontWeight: 600,
                padding: "2px 8px", borderRadius: "20px",
                background: `${cat.color}18`, color: cat.color,
              }}>
                {cat.icon} {cat.name}
              </span>
            )}

            {/* Due date */}
            {dueFmt && (
              <span style={{
                fontSize: "10px", fontWeight: 500,
                padding: "2px 8px", borderRadius: "20px",
                background: overdue ? "rgba(244,63,94,0.12)" : "rgba(255,107,157,0.1)",
                color: overdue ? "#f43f5e" : "#ff6b9d",
              }}>
                📅 {dueFmt}{overdue ? " · Overdue" : ""}
              </span>
            )}

            {/* Subtask progress */}
            {subtaskCount > 0 && (
              <span style={{ fontSize: "10px", color: mutedColor }}>
                {subtaskDone}/{subtaskCount} subtasks
              </span>
            )}

            {/* Attachments count */}
            {task.attachments?.length > 0 && (
              <span style={{ fontSize: "10px", color: mutedColor }}>
                📎 {task.attachments.length}
              </span>
            )}
          </div>

          {task.description && (
            <p style={{ fontSize: "12px", color: mutedColor, margin: "4px 0 0", lineHeight: 1.5 }}>
              {task.description}
            </p>
          )}

          {/* Subtask progress bar */}
          {subtaskCount > 0 && (
            <div style={{ marginTop: "8px", height: "3px", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                width: `${(subtaskDone / subtaskCount) * 100}%`,
                background: "linear-gradient(90deg,#ff6b9d,#ff99cc)",
                transition: "width 0.3s ease",
              }} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpanded(!expanded)}
            title="Expand / collapse"
            style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: expanded ? "rgba(255,107,157,0.15)" : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
              border: "none", cursor: "pointer", fontSize: "12px",
              color: expanded ? "#ff6b9d" : mutedColor,
            }}
          >
            {expanded ? "▲" : "▼"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(task.id)}
            title="Delete task"
            style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: isDark ? "rgba(244,63,94,0.1)" : "rgba(244,63,94,0.07)",
              border: "none", cursor: "pointer", fontSize: "13px", color: "#f43f5e",
            }}
          >✕</motion.button>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 16px 14px",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
              paddingTop: "12px",
            }}>
              {/* Edit fields */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "10px", color: mutedColor, fontWeight: 600, textTransform: "uppercase" }}>Priority</label>
                  <select
                    value={task.priority}
                    onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
                    style={{ padding: "5px 8px", borderRadius: "8px", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, background: isDark ? "rgba(255,255,255,0.05)" : "#fff", color: textColor, fontSize: "12px", fontFamily: "inherit" }}
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "10px", color: mutedColor, fontWeight: 600, textTransform: "uppercase" }}>Due Date</label>
                  <input
                    type="date"
                    value={task.dueDate || ""}
                    onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })}
                    style={{ padding: "5px 8px", borderRadius: "8px", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, background: isDark ? "rgba(255,255,255,0.05)" : "#fff", color: textColor, fontSize: "12px", fontFamily: "inherit" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "10px", color: mutedColor, fontWeight: 600, textTransform: "uppercase" }}>Start Time</label>
                  <input
                    type="time"
                    value={task.startTime || ""}
                    onChange={(e) => onUpdate(task.id, { startTime: e.target.value || null })}
                    style={{ padding: "5px 8px", borderRadius: "8px", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, background: isDark ? "rgba(255,255,255,0.05)" : "#fff", color: textColor, fontSize: "12px", fontFamily: "inherit" }}
                  />
                </div>
              </div>

              {/* Subtasks */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "10px", color: mutedColor, fontWeight: 600, textTransform: "uppercase" }}>Subtasks</label>
                <SubTasks task={task} onUpdate={onUpdate} />
              </div>

              {/* Attachments */}
              <div>
                <label style={{ fontSize: "10px", color: mutedColor, fontWeight: 600, textTransform: "uppercase" }}>Attachments</label>
                {task.attachments?.length > 0 && (
                  <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {task.attachments.map((att) => (
                      <div key={att.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                        <span>{fileIcon(att.mimeType)}</span>
                        <a href={att.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: "12px", color: "#ff6b9d", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {att.originalName}
                        </a>
                        <span style={{ fontSize: "10px", color: mutedColor }}>{fmtSize(att.size)}</span>
                        <button onClick={() => handleDeleteAttachment(att.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f43f5e", fontSize: "11px" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{
                    marginTop: "8px", padding: "5px 12px", borderRadius: "8px",
                    background: "rgba(255,107,157,0.1)", border: "1px dashed rgba(255,107,157,0.35)",
                    color: "#ff6b9d", cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
                  }}
                >
                  {uploading ? "Uploading…" : "📎 Attach file"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Tasks page ────────────────────────────────────────
export default function Tasks() {
  const { isDark } = useTheme();
  const { tasks, categories, loading, stats, addTask, updateTask, deleteTask, setTasks, addCategory } = useTasks();

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [search, setSearch] = useState("");
  const [fPriority, setFPriority] = useState("all");
  const [fCategory, setFCategory] = useState("all");
  const [fDue, setFDue] = useState("all");
  const [fCompleted, setFCompleted] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#ff6b9d");
  const [catIcon, setCatIcon] = useState("📁");
  const [addingTask, setAddingTask] = useState(false);

  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg = isDark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)";
  const border = isDark ? "rgba(255,107,157,0.1)" : "rgba(255,107,157,0.15)";
  const inputStyle = {
    padding: "10px 14px", borderRadius: "10px",
    border: `1px solid ${border}`,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
    color: textColor, fontSize: "13px", fontFamily: "inherit", outline: "none",
  };

  const filteredTasks = useMemo(() => {
    const t = today();
    const we = weekEnd();
    return tasks.filter((task) => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (fPriority !== "all" && task.priority !== fPriority) return false;
      if (fCategory !== "all" && task.categoryId !== fCategory) return false;
      if (fCompleted === "completed" && !task.completed) return false;
      if (fCompleted === "pending" && task.completed) return false;
      if (fDue === "today" && task.dueDate !== t) return false;
      if (fDue === "overdue" && !(task.dueDate && task.dueDate < t && !task.completed)) return false;
      if (fDue === "thisWeek" && !(task.dueDate && task.dueDate >= t && task.dueDate <= we)) return false;
      return true;
    });
  }, [tasks, search, fPriority, fCategory, fDue, fCompleted]);

  const handleAddTask = async () => {
    if (!newTitle.trim()) { toast.error("Task title is required"); return; }
    setAddingTask(true);
    await addTask({
      title: newTitle.trim(),
      description: newDesc,
      priority: newPriority,
      categoryId: newCategory || null,
      dueDate: newDueDate || null,
    });
    setNewTitle(""); setNewDesc(""); setNewDueDate(""); setNewCategory(""); setNewPriority("medium");
    setShowAddForm(false);
    setAddingTask(false);
  };

  const handleUpdateTask = (id, updates, localOnly = false) => {
    if (localOnly) {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    } else {
      updateTask(id, updates);
    }
  };

  const handleAddCategory = async () => {
    if (!catName.trim()) return;
    await addCategory({ name: catName.trim(), color: catColor, icon: catIcon });
    setCatName(""); setCatColor("#ff6b9d"); setCatIcon("📁");
    setShowCatModal(false);
  };

  const dueDateCounts = useMemo(() => {
    const t = today(), we = weekEnd();
    return {
      today: tasks.filter((x) => x.dueDate === t).length,
      overdue: tasks.filter((x) => x.dueDate && x.dueDate < t && !x.completed).length,
      week: tasks.filter((x) => x.dueDate && x.dueDate >= t && x.dueDate <= we).length,
    };
  }, [tasks]);

  const FilterBtn = ({ active, color = "#ff6b9d", onClick, children }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: "20px",
        border: `1px solid ${active ? color : border}`,
        background: active ? `${color}18` : "transparent",
        color: active ? color : mutedColor,
        cursor: "pointer", fontSize: "12px", fontWeight: active ? 600 : 400,
        fontFamily: "inherit", transition: "all 0.15s",
      }}
    >{children}</motion.button>
  );

  return (
    <div style={{
      maxWidth: "900px", margin: "0 auto", padding: "24px 20px",
      fontFamily: "'DM Sans', sans-serif", color: textColor,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.04em" }}>
            My <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tasks</span>
          </h1>
          <p style={{ fontSize: "13px", color: mutedColor, margin: "4px 0 0" }}>
            {stats.completed}/{stats.total} completed · {stats.overdue > 0 ? `⚠️ ${stats.overdue} overdue` : "All on track ✓"}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: "10px 20px", borderRadius: "12px",
            background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
            border: "none", color: "white", cursor: "pointer",
            fontSize: "13px", fontWeight: 700,
            boxShadow: "0 4px 16px rgba(255,107,157,0.35)",
            fontFamily: "inherit",
          }}
        >+ New Task</motion.button>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px",
      }}>
        {[
          { label: "Total", value: stats.total, color: "#ff6b9d", icon: "▣" },
          { label: "Done", value: stats.completed, color: "#10b981", icon: "✓" },
          { label: "Pending", value: stats.pending, color: "#f59e0b", icon: "⏳" },
          { label: "High", value: stats.highPriority, color: "#f43f5e", icon: "🔥" },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "14px 16px", borderRadius: "14px",
            background: cardBg, backdropFilter: "blur(10px)",
            border: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: mutedColor, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", marginBottom: "20px" }}
          >
            <div style={{
              padding: "20px", borderRadius: "16px",
              background: cardBg, backdropFilter: "blur(12px)",
              border: `1px solid ${border}`,
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700 }}>New Task</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  placeholder="Task title *"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  autoFocus
                  style={{ ...inputStyle, fontSize: "15px", fontWeight: 500 }}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={inputStyle}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={inputStyle}>
                    <option value="">No category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                  <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowAddForm(false)} style={{ ...inputStyle, cursor: "pointer", padding: "8px 16px" }}>Cancel</button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddTask}
                    disabled={addingTask}
                    style={{
                      padding: "8px 20px", borderRadius: "10px",
                      background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                      border: "none", color: "white", cursor: "pointer",
                      fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
                    }}
                  >{addingTask ? "Adding…" : "Add Task"}</motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: mutedColor }}>🔍</span>
        <input
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: "100%", paddingLeft: "40px", boxSizing: "border-box", fontSize: "14px" }}
        />
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: mutedColor, fontSize: "16px" }}>✕</button>}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
        <FilterBtn active={fDue === "all"} onClick={() => setFDue("all")}>All ({tasks.length})</FilterBtn>
        <FilterBtn active={fDue === "today"} onClick={() => setFDue("today")}>📅 Today ({dueDateCounts.today})</FilterBtn>
        <FilterBtn active={fDue === "overdue"} color="#f43f5e" onClick={() => setFDue("overdue")}>⚠️ Overdue ({dueDateCounts.overdue})</FilterBtn>
        <FilterBtn active={fDue === "thisWeek"} color="#10b981" onClick={() => setFDue("thisWeek")}>📆 This Week ({dueDateCounts.week})</FilterBtn>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
        {["all", "high", "medium", "low"].map((p) => (
          <FilterBtn key={p} active={fPriority === p} color={p === "all" ? "#ff6b9d" : PRIORITY_META[p]?.color} onClick={() => setFPriority(p)}>
            {p === "all" ? "All Priority" : `${PRIORITY_META[p]?.dot} ${p.charAt(0).toUpperCase() + p.slice(1)}`}
          </FilterBtn>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
        <FilterBtn active={fCompleted === "all"} onClick={() => setFCompleted("all")}>All</FilterBtn>
        <FilterBtn active={fCompleted === "pending"} color="#f59e0b" onClick={() => setFCompleted("pending")}>⏳ Pending</FilterBtn>
        <FilterBtn active={fCompleted === "completed"} color="#10b981" onClick={() => setFCompleted("completed")}>✅ Completed</FilterBtn>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px", paddingBottom: "16px", borderBottom: `1px solid ${border}` }}>
        <FilterBtn active={fCategory === "all"} onClick={() => setFCategory("all")}>All Categories</FilterBtn>
        {categories.map((c) => (
          <FilterBtn key={c.id} active={fCategory === c.id} color={c.color} onClick={() => setFCategory(c.id)}>
            {c.icon} {c.name} ({tasks.filter((t) => t.categoryId === c.id).length})
          </FilterBtn>
        ))}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCatModal(true)} style={{
          padding: "5px 12px", borderRadius: "20px",
          border: "1px dashed rgba(255,107,157,0.4)",
          background: "transparent", color: "#ff6b9d",
          cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
        }}>+ New Category</motion.button>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: mutedColor }}>
          <div style={{ fontSize: "32px", marginBottom: "12px", animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
          <p>Loading tasks…</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "60px 0" }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
          <p style={{ color: mutedColor, fontSize: "15px" }}>
            {search ? `No results for "${search}"` : "No tasks here. Add one above!"}
          </p>
        </motion.div>
      ) : (
        <motion.div layout style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                categories={categories}
                onUpdate={handleUpdateTask}
                onDelete={deleteTask}
                isDark={isDark}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Category Modal */}
      <AnimatePresence>
        {showCatModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCatModal(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000 }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: "90%", maxWidth: "380px",
                background: isDark ? "#0f172a" : "#fff",
                borderRadius: "20px", padding: "24px",
                border: `1px solid ${border}`, zIndex: 1001,
                boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
              }}
            >
              <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>New Category</h3>
              <input placeholder="Category name" value={catName} onChange={(e) => setCatName(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box", marginBottom: "12px" }} />
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "4px" }}>Icon</label>
                  <input value={catIcon} onChange={(e) => setCatIcon(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "4px" }}>Color</label>
                  <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} style={{ width: "56px", height: "42px", borderRadius: "10px", border: "none", cursor: "pointer" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShowCatModal(false)} style={{ flex: 1, ...inputStyle, cursor: "pointer", textAlign: "center" }}>Cancel</button>
                <button onClick={handleAddCategory} style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                  border: "none", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
                }}>Create</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}