import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import api from "../services/api";

const todayStr = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const weekEndStr = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const PRIORITIES = {
  high: { color: "var(--danger)", bg: "var(--danger-subtle)", label: "High" },
  medium: { color: "var(--warning)", bg: "var(--warning-subtle)", label: "Medium" },
  low: { color: "var(--success)", bg: "var(--success-subtle)", label: "Low" },
};

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function formatDue(dateValue) {
  if (!dateValue) return null;
  if (dateValue === todayStr()) return "Today";
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fileIcon(mimeType) {
  if (mimeType?.startsWith("image/")) return "🖼";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType?.includes("word")) return "📝";
  if (mimeType?.includes("sheet") || mimeType?.includes("excel")) return "📊";
  if (mimeType === "text/plain") return "📃";
  if (mimeType?.includes("zip")) return "📦";
  return "📎";
}

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function SubTasks({ task, onUpdate }) {
  const [text, setText] = useState("");
  const subtasks = task.subtasks || [];

  const add = async () => {
    if (!text.trim()) return;
    await onUpdate(task.id, {
      subtasks: [...subtasks, { id: Date.now(), title: text.trim(), done: false }],
    });
    setText("");
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="glass-tile" style={{ borderRadius: "14px", padding: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="checkbox" checked={subtask.done} onChange={() => onUpdate(task.id, { subtasks: subtasks.map((item) => item.id === subtask.id ? { ...item, done: !item.done } : item) })} style={{ accentColor: "var(--accent)" }} />
            <span style={{ flex: 1, fontSize: "13px", color: "var(--text-primary)", textDecoration: subtask.done ? "line-through" : "none", opacity: subtask.done ? 0.56 : 1 }}>
              {subtask.title}
            </span>
            <button onClick={() => onUpdate(task.id, { subtasks: subtasks.filter((item) => item.id !== subtask.id) })} className="btn-reset" style={{ color: "var(--danger)" }}>
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && add()}
          placeholder="Add subtask"
          style={{ flex: 1, padding: "10px 12px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
        />
        <button onClick={add} className="glass-tile" style={{ borderRadius: "14px", padding: "0 14px", color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>
          +
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, categories, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const priority = PRIORITIES[task.priority] || PRIORITIES.medium;
  const category = categories.find((item) => item.id === task.categoryId);
  const dueLabel = formatDue(task.dueDate);
  const overdue = task.dueDate && task.dueDate < todayStr() && !task.completed;

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post(`/tasks/${task.id}/upload`, formData);
      onUpdate(task.id, { attachments: [...(task.attachments || []), response.data.attachment] }, true);
      toast.success("File attached");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeAttachment = async (attachmentId) => {
    try {
      await api.delete(`/tasks/${task.id}/attachments/${attachmentId}`);
      onUpdate(task.id, { attachments: (task.attachments || []).filter((item) => item.id !== attachmentId) }, true);
    } catch {
      toast.error("Failed to remove file");
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
      <div
        className="glass-panel"
        style={{
          borderRadius: "24px",
          padding: "16px",
          borderLeft: `4px solid ${task.completed ? "var(--accent)" : priority.color}`,
          opacity: task.completed ? 0.7 : 1,
          boxShadow: overdue ? "0 18px 44px rgba(255,111,125,0.16)" : "var(--shadow-soft)",
        }}
      >
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <button
            onClick={() => onUpdate(task.id, { completed: !task.completed })}
            className="btn-reset"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "8px",
              marginTop: "2px",
              border: `1px solid ${task.completed ? "var(--success)" : "var(--border-strong)"}`,
              background: task.completed ? "var(--success)" : "transparent",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            {task.completed ? "✓" : ""}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "16px", textDecoration: task.completed ? "line-through" : "none" }}>{task.title}</span>
              <span style={{ padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: priority.bg, color: priority.color }}>{priority.label}</span>
              {category && <span style={{ padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: `${category.color}18`, color: category.color }}>{category.icon} {category.name}</span>}
              {dueLabel && <span style={{ padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: overdue ? "var(--danger-subtle)" : "var(--accent-subtle)", color: overdue ? "var(--danger)" : "var(--accent)" }}>{dueLabel}{overdue ? " · Overdue" : ""}</span>}
            </div>
            {task.description && <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>{task.description}</p>}

            {!!task.subtasks?.length && (
              <div style={{ marginTop: "10px", height: "6px", borderRadius: "999px", background: "var(--surface-elevated)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(task.subtasks.filter((item) => item.done).length / task.subtasks.length) * 100}%`,
                    borderRadius: "inherit",
                    background: "var(--success)",
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setExpanded((value) => !value)} className="glass-tile" style={{ width: "34px", height: "34px", borderRadius: "12px", color: expanded ? "var(--accent)" : "var(--text-muted)", cursor: "pointer" }}>
              {expanded ? "−" : "+"}
            </button>
            <button onClick={() => onDelete(task.id)} className="btn-reset" style={{ width: "34px", height: "34px", borderRadius: "12px", background: "var(--danger-subtle)", color: "var(--danger)" }}>
              ×
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "14px" }} className="task-card-grid">
                  <div>
                    <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Priority</label>
                    <CustomSelect value={task.priority} onChange={(value) => onUpdate(task.id, { priority: value })} options={PRIORITY_OPTIONS} />
                  </div>
                  <div>
                    <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Due Date</label>
                    <input type="date" value={task.dueDate || ""} onChange={(event) => onUpdate(task.id, { dueDate: event.target.value || null })} style={{ width: "100%", padding: "10px 12px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
                  </div>
                  <div>
                    <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Start Time</label>
                    <input type="time" value={task.startTime || ""} onChange={(event) => onUpdate(task.id, { startTime: event.target.value || null })} style={{ width: "100%", padding: "10px 12px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
                  </div>
                  <div>
                    <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Category</label>
                    <select value={task.categoryId || ""} onChange={(event) => onUpdate(task.id, { categoryId: event.target.value || null })} style={{ width: "100%", padding: "10px 12px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                      <option value="">No category</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>{item.icon} {item.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Subtasks</label>
                  <SubTasks task={task} onUpdate={onUpdate} />
                </div>

                <div>
                  <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Attachments</label>
                  {!!task.attachments?.length && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                      {task.attachments.map((attachment) => (
                        <div key={attachment.id} className="glass-tile" style={{ borderRadius: "14px", padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
                          <span>{fileIcon(attachment.mimeType)}</span>
                          <a href={attachment.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px" }}>
                            {attachment.originalName}
                          </a>
                          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{fmtSize(attachment.size)}</span>
                          <button onClick={() => removeAttachment(attachment.id)} className="btn-reset" style={{ color: "var(--danger)" }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
                  <button onClick={() => fileRef.current?.click()} className="glass-tile" style={{ borderRadius: "14px", padding: "10px 14px", color: "var(--accent)", cursor: "pointer", fontWeight: 700 }}>
                    {uploading ? "Uploading..." : "Attach file"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Tasks() {
  const { accent } = useTheme();
  const { tasks, categories, loading, stats, addTask, updateTask, deleteTask, setTasks, addCategory } = useTasks();
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(accent);
  const [catIcon, setCatIcon] = useState("📁");
  const [addingTask, setAddingTask] = useState(false);

  const today = todayStr();
  const weekEnd = weekEndStr();

  const dueCounts = useMemo(() => ({
    today: tasks.filter((item) => item.dueDate === today).length,
    overdue: tasks.filter((item) => item.dueDate && item.dueDate < today && !item.completed).length,
    week: tasks.filter((item) => item.dueDate && item.dueDate >= today && item.dueDate <= weekEnd).length,
  }), [tasks, today, weekEnd]);

  const filters = [
    { id: "all", label: `All (${tasks.length})` },
    { id: "today", label: `Today (${dueCounts.today})` },
    { id: "overdue", label: `Overdue (${dueCounts.overdue})` },
    { id: "week", label: `This Week (${dueCounts.week})` },
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
    { id: "pending", label: "Pending" },
    { id: "done", label: "Done" },
    ...categories.slice(0, 4).map((category) => ({ id: `cat_${category.id}`, label: `${category.icon} ${category.name}` })),
  ];

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    switch (activeFilter) {
      case "today":
        return task.dueDate === today;
      case "overdue":
        return task.dueDate && task.dueDate < today && !task.completed;
      case "week":
        return task.dueDate && task.dueDate >= today && task.dueDate <= weekEnd;
      case "high":
      case "medium":
      case "low":
        return task.priority === activeFilter;
      case "pending":
        return !task.completed;
      case "done":
        return task.completed;
      default:
        if (activeFilter.startsWith("cat_")) return task.categoryId === activeFilter.replace("cat_", "");
        return true;
    }
  }), [activeFilter, search, tasks, today, weekEnd]);

  const handleAddTask = async () => {
    if (!newTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    setAddingTask(true);
    await addTask({
      title: newTitle.trim(),
      description: newDesc,
      priority: newPriority,
      categoryId: newCategory || null,
      dueDate: newDueDate || null,
    });
    setNewTitle("");
    setNewDesc("");
    setNewDueDate("");
    setNewCategory("");
    setNewPriority("medium");
    setShowAddForm(false);
    setAddingTask(false);
  };

  const handleUpdate = (id, updates, localOnly = false) => {
    if (localOnly) {
      setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...updates } : task)));
      return;
    }
    updateTask(id, updates);
  };

  const handleAddCategory = async () => {
    if (!catName.trim()) return;
    await addCategory({ name: catName.trim(), color: catColor, icon: catIcon });
    setCatName("");
    setCatColor(accent);
    setCatIcon("📁");
    setShowCatModal(false);
  };

  const categoryOptions = [{ value: "", label: "No category" }, ...categories.map((category) => ({ value: category.id, label: `${category.icon} ${category.name}` }))];

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "28px 16px 32px", color: "var(--text-body)" }}>
      <div className="tasks-header" style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "stretch", marginBottom: "18px" }}>
        <div className="glass-panel" style={{ borderRadius: "32px", padding: "22px 24px", flex: 1 }}>
          <p style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "10px" }}>Task cockpit</p>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 44px)", letterSpacing: "-0.06em", marginBottom: "10px" }}>Everything you need to move forward</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7 }}>
            Sort by urgency, create better categories, and keep work visible without the screen feeling crowded.
          </p>
        </div>
        <button onClick={() => setShowAddForm((value) => !value)} className="btn-primary" style={{ alignSelf: "center", padding: "0 22px", whiteSpace: "nowrap" }}>
          + New Task
        </button>
      </div>

      <div className="tasks-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "18px" }}>
        {[
          { label: "Total", value: stats.total, color: "var(--accent)" },
          { label: "Done", value: stats.completed, color: "var(--success)" },
          { label: "Pending", value: stats.pending, color: "var(--warning)" },
          { label: "High Priority", value: stats.highPriority, color: "var(--danger)" },
        ].map((item) => (
          <div key={item.label} className="glass-panel" style={{ borderRadius: "24px", padding: "18px" }}>
            <div style={{ color: item.color, fontFamily: "var(--font-heading)", fontSize: "34px", letterSpacing: "-0.06em" }}>{item.value}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.14em" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: "18px" }}>
            <div className="glass-panel" style={{ borderRadius: "28px", padding: "20px" }}>
              <h3 style={{ marginBottom: "14px" }}>New Task</h3>
              <div style={{ display: "grid", gap: "10px" }}>
                <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Task title" style={{ padding: "12px 14px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "15px" }} />
                <textarea value={newDesc} onChange={(event) => setNewDesc(event.target.value)} rows={3} placeholder="Description" style={{ padding: "12px 14px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)", resize: "vertical" }} />
                <div className="tasks-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                  <CustomSelect value={newPriority} onChange={setNewPriority} options={PRIORITY_OPTIONS} />
                  <CustomSelect value={newCategory} onChange={setNewCategory} options={categoryOptions} />
                  <input type="date" value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} style={{ padding: "10px 12px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button onClick={() => setShowAddForm(false)} className="glass-tile" style={{ borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handleAddTask} className="btn-primary" style={{ padding: "0 18px" }} disabled={addingTask}>
                    {addingTask ? "Adding..." : "Add Task"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel" style={{ borderRadius: "28px", padding: "16px", marginBottom: "18px" }}>
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
        </div>
        <div className="hide-scrollbar" style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
            {filters.map((filter) => (
              <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`pill-filter ${activeFilter === filter.id ? "active" : ""}`}>
                {filter.label}
              </button>
            ))}
            <button onClick={() => setShowCatModal(true)} className="glass-tile" style={{ borderRadius: "999px", padding: "0 14px", height: "36px", color: "var(--accent)", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>
              + Category
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ borderRadius: "28px", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", animation: "spin 1s linear infinite", display: "inline-block", marginBottom: "10px" }}>⟳</div>
          <p style={{ color: "var(--text-muted)" }}>Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: "28px", padding: "52px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "38px", marginBottom: "10px" }}>✦</div>
          <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "6px" }}>{search ? `No results for "${search}"` : "No tasks in this view"}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>{search ? "Try a different search term." : "Add a task or switch filters to explore more."}</div>
        </div>
      ) : (
        <motion.div layout style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} categories={categories} onUpdate={handleUpdate} onDelete={deleteTask} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <CenteredModal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="New Category" maxWidth="380px">
        <div style={{ display: "grid", gap: "12px" }}>
          <input value={catName} onChange={(event) => setCatName(event.target.value)} placeholder="Category name" style={{ width: "100%", padding: "12px 14px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
            <input value={catIcon} onChange={(event) => setCatIcon(event.target.value)} placeholder="Icon" style={{ width: "100%", padding: "12px 14px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
            <input type="color" value={catColor} onChange={(event) => setCatColor(event.target.value)} style={{ width: "56px", height: "48px", borderRadius: "14px", border: "none", background: "transparent" }} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowCatModal(false)} className="glass-tile" style={{ flex: 1, borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleAddCategory} className="btn-primary" style={{ flex: 1 }}>
              Create
            </button>
          </div>
        </div>
      </CenteredModal>

      <style>{`
        @media (max-width: 900px) {
          .tasks-header {
            display: grid !important;
          }

          .tasks-stats,
          .tasks-form-grid,
          .task-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
