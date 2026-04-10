import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";

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

function TaskRow({ task, categories, onToggle, onDelete, onEdit }) {
  const category = categories.find((item) => item.id === task.categoryId);
  const priority = PRIORITIES[task.priority] || PRIORITIES.medium;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 4px", borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className="btn-reset"
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: task.completed ? priority.color : "var(--surface-raised)",
          border: `2px solid ${task.completed ? priority.color : "var(--border-strong)"}`,
          color: task.completed ? "#fff" : "transparent",
          flexShrink: 0,
          boxShadow: task.completed ? `0 0 0 4px ${priority.color}1f` : "none",
          fontWeight: 700,
        }}
      >
        ✓
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600, textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.56 : 1 }}>
          {task.title}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
          <span style={{ color: priority.color, fontSize: "12px" }}>{priority.label}</span>
          {category && <span style={{ color: category.color, fontSize: "12px" }}>{category.icon} {category.name}</span>}
          {task.dueDate && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{task.dueDate === todayStr() ? "Today" : task.dueDate}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <button onClick={() => onEdit(task)} className="btn-reset" style={{ color: "var(--text-muted)", fontSize: "16px" }} aria-label="Edit task">
          ✎
        </button>
        <button onClick={() => onDelete(task.id)} className="btn-reset" style={{ color: "var(--text-muted)", fontSize: "18px" }} aria-label="Delete task">
          ⋮
        </button>
      </div>
    </div>
  );
}

const blankTask = {
  title: "",
  description: "",
  priority: "medium",
  categoryId: "",
  dueDate: "",
};

export default function Tasks() {
  const { accent } = useTheme();
  const { tasks, categories, loading, addTask, updateTask, deleteTask, addCategory } = useTasks();
  const [draft, setDraft] = useState(blankTask);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(accent);
  const [catIcon, setCatIcon] = useState("📁");
  const [savingTask, setSavingTask] = useState(false);

  const today = todayStr();
  const weekEnd = weekEndStr();

  const filters = [
    { id: "all", label: "All" },
    { id: "today", label: "Today" },
    { id: "overdue", label: "Overdue" },
    { id: "week", label: "This Week" },
    { id: "pending", label: "Pending" },
    { id: "done", label: "Done" },
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
      case "pending":
        return !task.completed;
      case "done":
        return task.completed;
      default:
        return true;
    }
  }), [activeFilter, search, tasks, today, weekEnd]);

  const categoryOptions = [{ value: "", label: "No category" }, ...categories.map((category) => ({ value: category.id, label: `${category.icon} ${category.name}` }))];

  const openCreate = () => {
    setEditingTaskId(null);
    setDraft(blankTask);
    setShowTaskModal(true);
  };

  const openEdit = (task) => {
    setEditingTaskId(task.id);
    setDraft({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      categoryId: task.categoryId || "",
      dueDate: task.dueDate || "",
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (!draft.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setSavingTask(true);

    if (editingTaskId) {
      await updateTask(editingTaskId, {
        title: draft.title.trim(),
        description: draft.description,
        priority: draft.priority,
        categoryId: draft.categoryId || null,
        dueDate: draft.dueDate || null,
      });
      toast.success("Task updated.");
    } else {
      const created = await addTask({
        title: draft.title.trim(),
        description: draft.description,
        priority: draft.priority,
        categoryId: draft.categoryId || null,
        dueDate: draft.dueDate || null,
      });
      if (!created) {
        setSavingTask(false);
        return;
      }
    }

    setSavingTask(false);
    setShowTaskModal(false);
    setEditingTaskId(null);
    setDraft(blankTask);
  };

  const handleAddCategory = async () => {
    if (!catName.trim()) return;
    await addCategory({ name: catName.trim(), color: catColor, icon: catIcon });
    setCatName("");
    setCatColor(accent);
    setCatIcon("📁");
    setShowCatModal(false);
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px 32px", color: "var(--text-body)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "4px" }}>Tasks</h1>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{filteredTasks.length} items</div>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: "12px" }}>
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>⌕</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks"
          style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
        />
      </div>

      <div className="hide-scrollbar" style={{ overflowX: "auto", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
          {filters.map((filter) => (
            <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`pill-filter ${activeFilter === filter.id ? "active" : ""}`}>
              {filter.label}
            </button>
          ))}
          <button onClick={() => setShowCatModal(true)} className="glass-tile" style={{ borderRadius: "999px", padding: "0 14px", height: "36px", color: "var(--accent)", fontWeight: 700 }}>
            + Category
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ borderRadius: "18px", padding: "0 14px" }}>
        {loading ? (
          <div style={{ padding: "28px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Loading...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: "28px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>No tasks here.</div>
        ) : (
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                categories={categories}
                onToggle={(id, completed) => updateTask(id, { completed })}
                onDelete={deleteTask}
                onEdit={openEdit}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <button
        onClick={openCreate}
        className="btn-reset"
        style={{
          position: "fixed",
          right: "18px",
          bottom: "calc(var(--mobile-nav-height) + 28px)",
          width: "58px",
          height: "58px",
          borderRadius: "18px",
          background: "linear-gradient(135deg, var(--accent-hover), var(--accent))",
          color: "#fff",
          fontSize: "30px",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        +
      </button>

      <CenteredModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title={editingTaskId ? "Edit Task" : "New Task"} maxWidth="420px">
        <div style={{ display: "grid", gap: "12px" }}>
          <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Task title" style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
          <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Description" style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)", resize: "vertical" }} />
          <CustomSelect value={draft.priority} onChange={(value) => setDraft((current) => ({ ...current, priority: value }))} options={PRIORITY_OPTIONS} />
          <CustomSelect value={draft.categoryId} onChange={(value) => setDraft((current) => ({ ...current, categoryId: value }))} options={categoryOptions} />
          <input type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowTaskModal(false)} className="glass-tile" style={{ flex: 1, borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)" }}>
              Cancel
            </button>
            <button onClick={handleSaveTask} className="btn-primary" style={{ flex: 1 }} disabled={savingTask}>
              {savingTask ? "Saving..." : editingTaskId ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </CenteredModal>

      <CenteredModal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="New Category" maxWidth="380px">
        <div style={{ display: "grid", gap: "12px" }}>
          <input value={catName} onChange={(event) => setCatName(event.target.value)} placeholder="Category name" style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
            <input value={catIcon} onChange={(event) => setCatIcon(event.target.value)} placeholder="Icon" style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
            <input type="color" value={catColor} onChange={(event) => setCatColor(event.target.value)} style={{ width: "56px", height: "48px", borderRadius: "14px", border: "none", background: "transparent" }} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowCatModal(false)} className="glass-tile" style={{ flex: 1, borderRadius: "14px", padding: "10px 14px", color: "var(--text-primary)" }}>
              Cancel
            </button>
            <button onClick={handleAddCategory} className="btn-primary" style={{ flex: 1 }}>
              Create
            </button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}
