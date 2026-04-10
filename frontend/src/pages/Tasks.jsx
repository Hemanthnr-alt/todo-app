import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import {
  IconCalendar,
  IconFolder,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  PremiumCompleteTitle,
  PremiumIconButton,
  PremiumRoundComplete,
} from "../components/PremiumChrome";
import { PremiumTaskMark } from "../components/PremiumMarks";
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
  const lineColor = priority.color.includes("var(") ? "var(--accent)" : priority.color;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 10px",
        borderBottom: "1px solid var(--border)",
        borderLeft: task.completed ? `3px solid ${priority.color}` : "3px solid transparent",
        borderRadius: "0 16px 16px 0",
        background: task.completed ? `linear-gradient(90deg, ${priority.color}18, transparent 62%)` : undefined,
        boxShadow: task.completed ? `inset 0 0 24px ${priority.color}0d` : "none",
      }}
    >
      <PremiumRoundComplete
        checked={task.completed}
        onClick={() => onToggle(task.id, !task.completed)}
        color={priority.color.includes("var(") ? "var(--accent)" : priority.color}
        ariaLabel={task.completed ? "Mark incomplete" : "Complete task"}
      />

      <PremiumTaskMark size={34} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <PremiumCompleteTitle complete={task.completed} lineColor={lineColor}>
          {task.title}
        </PremiumCompleteTitle>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: "999px",
              background: priority.bg,
              color: priority.color,
              border: `1px solid ${priority.color}33`,
            }}
          >
            {priority.label}
          </span>
          {category && (
            <span style={{ color: category.color, fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span aria-hidden style={{ opacity: 0.9 }}>
                {category.icon}
              </span>
              {category.name}
            </span>
          )}
          {task.dueDate && (
            <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 500 }}>
              {task.dueDate === todayStr() ? "Today" : task.dueDate}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <PremiumIconButton label="Edit task" onClick={() => onEdit(task)}>
          <IconPencil size={17} stroke="currentColor" />
        </PremiumIconButton>
        <PremiumIconButton label="Delete task" onClick={() => onDelete(task.id)}>
          <IconTrash size={17} stroke="currentColor" />
        </PremiumIconButton>
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
  const [catIcon, setCatIcon] = useState("");
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
    await addCategory({ name: catName.trim(), color: catColor, icon: catIcon.trim() || "◇" });
    setCatName("");
    setCatColor(accent);
    setCatIcon("");
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
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", pointerEvents: "none" }}>
          <IconSearch size={18} stroke="currentColor" />
        </span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks"
          style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
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
        type="button"
        onClick={openCreate}
        className="btn-reset"
        aria-label="New task"
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

      <CenteredModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title={editingTaskId ? "Edit task" : "New task"} maxWidth="440px">
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", display: "grid", gap: "12px", border: "1px solid var(--border)" }}>
            <span className="section-label">Details</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="What needs to be done?"
              style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontWeight: 600 }}
            />
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              placeholder="Notes (optional)"
              style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", resize: "vertical", minHeight: "88px" }}
            />
          </div>

          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", display: "grid", gap: "12px", border: "1px solid var(--border)" }}>
            <span className="section-label">Priority</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(["high", "medium", "low"]).map((key) => {
                const p = PRIORITIES[key];
                const active = draft.priority === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraft((c) => ({ ...c, priority: key }))}
                    style={{
                      flex: "1 1 90px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: active ? `2px solid ${p.color}` : "1px solid var(--border)",
                      background: active ? p.bg : "var(--surface)",
                      color: p.color,
                      fontWeight: 700,
                      fontSize: "12px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      boxShadow: active ? `0 4px 14px ${p.color}28` : "none",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: "4px" }}>
              <span className="section-label" style={{ marginBottom: "8px", display: "block" }}>
                Category
              </span>
              <CustomSelect value={draft.categoryId} onChange={(value) => setDraft((current) => ({ ...current, categoryId: value }))} options={categoryOptions} />
            </div>
          </div>

          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", display: "grid", gap: "10px", border: "1px solid var(--border)" }}>
            <span className="section-label">Schedule</span>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.65, display: "flex", pointerEvents: "none" }}>
                <IconCalendar size={18} stroke="var(--text-muted)" />
              </span>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => setShowTaskModal(false)} className="glass-tile" style={{ flex: 1, borderRadius: "14px", padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600 }}>
              Cancel
            </button>
            <button type="button" onClick={handleSaveTask} className="btn-primary" style={{ flex: 1, fontWeight: 700 }} disabled={savingTask}>
              {savingTask ? "Saving…" : editingTaskId ? "Save changes" : "Create task"}
            </button>
          </div>
        </div>
      </CenteredModal>

      <CenteredModal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="New category" maxWidth="380px">
        <div style={{ display: "grid", gap: "14px" }}>
          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", border: "1px solid var(--border)", display: "grid", gap: "12px" }}>
            <input value={catName} onChange={(event) => setCatName(event.target.value)} placeholder="Category name" style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", opacity: 0.7, pointerEvents: "none" }}>
                  <IconFolder size={16} stroke="var(--text-muted)" />
                </span>
                <input
                  value={catIcon}
                  onChange={(event) => setCatIcon(event.target.value)}
                  placeholder="Emoji or symbol (optional)"
                  style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
                />
              </div>
              <input type="color" value={catColor} onChange={(event) => setCatColor(event.target.value)} style={{ width: "52px", height: "48px", borderRadius: "12px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }} aria-label="Category color" />
            </div>
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
