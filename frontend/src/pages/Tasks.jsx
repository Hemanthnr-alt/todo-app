import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useProjects } from "../hooks/useProjects";
import { useTaskTemplates } from "../hooks/useTaskTemplates";
import { useTasks } from "../hooks/useTasks";
import { localTodayYMD } from "../utils/date";
import { computeNextDueDate, lifecycleOf } from "../utils/recurringTask";

const todayStr = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const weekEndStr = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const parseTags = (raw) => String(raw || "")
  .split(/[,\s]+/)
  .map((t) => t.replace(/^#/, "").trim())
  .filter(Boolean);

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

function TaskRow({
  task,
  categories,
  projects,
  lifecycleTab,
  onToggle,
  onDelete,
  onEdit,
  onRestore,
  onArchive,
  onPermanent,
  onSkipRecurring,
}) {
  const category = categories.find((item) => item.id === task.categoryId);
  const project = projects.find((p) => p.id === task.projectId);
  const priority = PRIORITIES[task.priority] || PRIORITIES.medium;
  const lineColor = priority.color.includes("var(") ? "var(--accent)" : priority.color;
  const tags = task.tags || [];

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
      {lifecycleTab === "active" ? (
        <PremiumRoundComplete
          checked={task.completed}
          onClick={() => onToggle(task, !task.completed)}
          color={priority.color.includes("var(") ? "var(--accent)" : priority.color}
          ariaLabel={task.completed ? "Mark incomplete" : "Complete task"}
        />
      ) : (
        <div style={{ width: 40 }} />
      )}

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
          {task.isRecurring && (
            <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>Recurring</span>
          )}
          {category && (
            <span style={{ color: category.color, fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span aria-hidden style={{ opacity: 0.9 }}>
                {category.icon}
              </span>
              {category.name}
            </span>
          )}
          {project && (
            <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>{project.icon} {project.name}</span>
          )}
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)" }}>#{tag}</span>
          ))}
          {task.dueDate && (
            <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 500 }}>
              {task.dueDate === todayStr() ? "Today" : task.dueDate}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "4px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "140px" }}>
        {lifecycleTab === "active" && task.isRecurring && (
          <button type="button" className="btn-reset" onClick={() => onSkipRecurring(task)} style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", padding: "6px 8px" }}>
            Skip
          </button>
        )}
        {lifecycleTab === "active" && (
          <PremiumIconButton label="Archive" onClick={() => onArchive(task.id)}>
            <span style={{ fontSize: "12px", fontWeight: 800 }}>A</span>
          </PremiumIconButton>
        )}
        {lifecycleTab === "active" && (
          <PremiumIconButton label="Edit task" onClick={() => onEdit(task)}>
            <IconPencil size={17} stroke="currentColor" />
          </PremiumIconButton>
        )}
        {lifecycleTab === "active" && (
          <PremiumIconButton label="Move to trash" onClick={() => onDelete(task.id)}>
            <IconTrash size={17} stroke="currentColor" />
          </PremiumIconButton>
        )}
        {lifecycleTab === "trash" && (
          <>
            <button type="button" className="glass-tile" style={{ padding: "6px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }} onClick={() => onRestore(task.id)}>
              Restore
            </button>
            <button type="button" className="btn-reset" style={{ padding: "6px 10px", color: "var(--danger)", fontSize: "11px", fontWeight: 700 }} onClick={() => onPermanent(task.id)}>
              Delete
            </button>
          </>
        )}
        {lifecycleTab === "archive" && (
          <>
            <button type="button" className="glass-tile" style={{ padding: "6px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }} onClick={() => onRestore(task.id)}>
              Unarchive
            </button>
            <PremiumIconButton label="Trash" onClick={() => onDelete(task.id)}>
              <IconTrash size={17} stroke="currentColor" />
            </PremiumIconButton>
          </>
        )}
      </div>
    </div>
  );
}

const blankTask = {
  title: "",
  description: "",
  priority: "medium",
  categoryId: "",
  projectId: "",
  dueDate: "",
  tagsInput: "",
  isRecurring: false,
  recurringFrequency: "daily",
  recurringInterval: 2,
  weeklyDays: "1,3,5",
};

const SAVED_FILTERS_KEY = "thirty_saved_task_filters";

export default function Tasks() {
  const { accent } = useTheme();
  const { isAuthenticated } = useAuth();
  const {
    tasks,
    categories,
    loading,
    addTask,
    updateTask,
    deleteTask,
    restoreTask,
    archiveTask,
    permanentDeleteTask,
    mergeAppliedTasks,
    addCategory,
  } = useTasks();
  const { projects } = useProjects();
  const { templates, applyTemplate, saveTemplate } = useTaskTemplates();

  const [draft, setDraft] = useState(blankTask);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [lifecycleTab, setLifecycleTab] = useState("active");
  const [tagFilter, setTagFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showTplModal, setShowTplModal] = useState(false);
  const [tplName, setTplName] = useState("");
  const [applyTplId, setApplyTplId] = useState("");
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(accent);
  const [catIcon, setCatIcon] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);

  const refreshSavedFilters = () => {
    try {
      setSavedFilters(JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || "[]"));
    } catch {
      setSavedFilters([]);
    }
  };

  useEffect(() => {
    refreshSavedFilters();
  }, []);

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
    const life = lifecycleOf(task);
    if (lifecycleTab === "active" && life !== "active") return false;
    if (lifecycleTab === "archive" && life !== "archived") return false;
    if (lifecycleTab === "trash" && life !== "trashed") return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (tagFilter) {
      const tgs = task.tags || [];
      if (!tgs.map((x) => String(x).toLowerCase()).includes(tagFilter.toLowerCase().replace(/^#/, ""))) return false;
    }
    if (projectFilter && task.projectId !== projectFilter) return false;
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
  }), [activeFilter, search, tasks, today, weekEnd, lifecycleTab, tagFilter, projectFilter]);

  const handleTaskToggle = async (task, completed) => {
    if (completed && task.isRecurring) {
      const ymd = localTodayYMD();
      const dates = [...new Set([...(task.completedDates || []), ymd])];
      const next = computeNextDueDate(task, task.dueDate || ymd);
      await updateTask(task.id, {
        completed: false,
        completedDates: dates,
        dueDate: next,
      });
      toast.success("Recurring logged · next date set");
      return;
    }
    await updateTask(task.id, { completed });
  };

  const handleSkipRecurring = async (task) => {
    const ymd = localTodayYMD();
    const skips = [...new Set([...(task.recurringSkipDates || []), ymd])];
    const next = computeNextDueDate(task, task.dueDate || ymd);
    await updateTask(task.id, { recurringSkipDates: skips, dueDate: next });
    toast.success("Skipped this occurrence");
  };

  const categoryOptions = [{ value: "", label: "No category" }, ...categories.map((category) => ({ value: category.id, label: `${category.icon} ${category.name}` }))];
  const projectOptions = [{ value: "", label: "No project" }, ...projects.map((p) => ({ value: p.id, label: `${p.icon || "◇"} ${p.name}` }))];

  const openCreate = () => {
    setEditingTaskId(null);
    setDraft({ ...blankTask });
    setShowTaskModal(true);
  };

  const openEdit = (task) => {
    setEditingTaskId(task.id);
    setDraft({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      categoryId: task.categoryId || "",
      projectId: task.projectId || "",
      dueDate: task.dueDate || "",
      tagsInput: (task.tags || []).join(", "),
      isRecurring: !!task.isRecurring,
      recurringFrequency: task.recurringFrequency || "daily",
      recurringInterval: task.recurringInterval || 2,
      weeklyDays: (task.recurringDays || []).join(","),
    });
    setShowTaskModal(true);
  };

  const buildPayload = () => {
    const tags = parseTags(draft.tagsInput);
    const recurringDays = draft.recurringFrequency === "weekly"
      ? draft.weeklyDays.split(/[,\s]+/).map((x) => Number.parseInt(x, 10)).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
      : [];
    return {
      title: draft.title.trim(),
      description: draft.description,
      priority: draft.priority,
      categoryId: draft.categoryId || null,
      projectId: draft.projectId || null,
      dueDate: draft.dueDate || null,
      tags,
      isRecurring: !!draft.isRecurring,
      recurringFrequency: draft.isRecurring ? draft.recurringFrequency : null,
      recurringInterval: draft.isRecurring && draft.recurringFrequency === "custom"
        ? Math.max(1, Number(draft.recurringInterval) || 2)
        : null,
      recurringDays: draft.isRecurring && draft.recurringFrequency === "weekly" ? recurringDays : [],
    };
  };

  const handleSaveTask = async () => {
    if (!draft.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setSavingTask(true);
    const payload = buildPayload();

    if (editingTaskId) {
      await updateTask(editingTaskId, payload);
      toast.success("Task updated.");
    } else {
      const created = await addTask(payload);
      if (!created) {
        setSavingTask(false);
        return;
      }
    }

    setSavingTask(false);
    setShowTaskModal(false);
    setEditingTaskId(null);
    setDraft({ ...blankTask });
  };

  const handleApplyTemplate = async () => {
    if (!applyTplId) return;
    const list = await applyTemplate(applyTplId, today);
    if (list.length) mergeAppliedTasks(list);
    setShowTplModal(false);
    setApplyTplId("");
  };

  const handleSaveQuickTemplate = async () => {
    if (!tplName.trim()) {
      toast.error("Template name required");
      return;
    }
    if (!draft.title.trim()) {
      toast.error("Add a task title first");
      return;
    }
    await saveTemplate(tplName.trim(), [{
      title: draft.title.trim(),
      priority: draft.priority,
      tags: parseTags(draft.tagsInput),
      categoryId: draft.categoryId || null,
      projectId: draft.projectId || null,
    }]);
    setTplName("");
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

      <div className="hide-scrollbar" style={{ overflowX: "auto", marginBottom: "10px" }}>
        <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
          {[
            { id: "active", label: "Active" },
            { id: "archive", label: "Archive" },
            { id: "trash", label: "Trash" },
          ].map((t) => (
            <button key={t.id} type="button" onClick={() => setLifecycleTab(t.id)} className={`pill-filter ${lifecycleTab === t.id ? "active" : ""}`}>
              {t.label}
            </button>
          ))}
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
          {isAuthenticated && (
            <button type="button" onClick={() => setShowTplModal(true)} className="glass-tile" style={{ borderRadius: "999px", padding: "0 14px", height: "36px", color: "var(--accent)", fontWeight: 700 }}>
              Templates
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <input
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="Filter #tag"
          style={{ padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "13px" }}
        />
        <CustomSelect
          value={projectFilter}
          onChange={setProjectFilter}
          options={[{ value: "", label: "All projects" }, ...projects.map((p) => ({ value: p.id, label: `${p.icon || "◇"} ${p.name}` }))]}
        />
      </div>
      <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          className="glass-tile"
          style={{ borderRadius: "10px", padding: "6px 12px", fontSize: "12px", fontWeight: 600 }}
          onClick={() => {
            if (!tagFilter.trim() && !projectFilter) return;
            try {
              const cur = JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || "[]");
              const entry = { tag: tagFilter.replace(/^#/, "").trim(), projectId: projectFilter || "" };
              if (!cur.some((c) => c.tag === entry.tag && c.projectId === entry.projectId)) {
                cur.push(entry);
                localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(cur));
                refreshSavedFilters();
                toast.success("Saved filter");
              }
            } catch { /* ignore */ }
          }}
        >
          Save filter
        </button>
        {savedFilters.map((sf, i) => {
          const proj = sf.projectId ? projects.find((p) => p.id === sf.projectId) : null;
          return (
            <button
              key={`${sf.tag}-${sf.projectId}-${i}`}
              type="button"
              className="pill-filter"
              onClick={() => {
                setTagFilter(sf.tag || "");
                setProjectFilter(sf.projectId || "");
              }}
            >
              {sf.tag ? `#${sf.tag}` : "Tag: any"}{proj ? ` · ${proj.name}` : sf.projectId ? " · project" : ""}
            </button>
          );
        })}
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
                projects={projects}
                lifecycleTab={lifecycleTab}
                onToggle={handleTaskToggle}
                onDelete={deleteTask}
                onEdit={openEdit}
                onRestore={restoreTask}
                onArchive={archiveTask}
                onPermanent={permanentDeleteTask}
                onSkipRecurring={handleSkipRecurring}
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
            {isAuthenticated && (
              <div style={{ marginTop: "4px" }}>
                <span className="section-label" style={{ marginBottom: "8px", display: "block" }}>
                  Project
                </span>
                <CustomSelect value={draft.projectId} onChange={(value) => setDraft((current) => ({ ...current, projectId: value }))} options={projectOptions} />
              </div>
            )}
            <div style={{ marginTop: "4px" }}>
              <span className="section-label" style={{ marginBottom: "8px", display: "block" }}>
                Tags
              </span>
              <input
                value={draft.tagsInput}
                onChange={(e) => setDraft((c) => ({ ...c, tagsInput: e.target.value }))}
                placeholder="work, deep-focus (comma-separated)"
                style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "13px" }}
              />
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
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={draft.isRecurring}
                onChange={(e) => setDraft((c) => ({ ...c, isRecurring: e.target.checked }))}
              />
              Recurring task
            </label>
            {draft.isRecurring && (
              <>
                <CustomSelect
                  value={draft.recurringFrequency}
                  onChange={(value) => setDraft((c) => ({ ...c, recurringFrequency: value }))}
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly (pick days)" },
                    { value: "monthly", label: "Monthly" },
                    { value: "custom", label: "Every N days" },
                  ]}
                />
                {draft.recurringFrequency === "weekly" && (
                  <div>
                    <span className="section-label" style={{ marginBottom: "6px", display: "block" }}>Days (0=Sun … 6=Sat)</span>
                    <input
                      value={draft.weeklyDays}
                      onChange={(e) => setDraft((c) => ({ ...c, weeklyDays: e.target.value }))}
                      placeholder="1,3,5"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "13px" }}
                    />
                  </div>
                )}
                {draft.recurringFrequency === "custom" && (
                  <div>
                    <span className="section-label" style={{ marginBottom: "6px", display: "block" }}>Every N days</span>
                    <input
                      type="number"
                      min={1}
                      value={draft.recurringInterval}
                      onChange={(e) => setDraft((c) => ({ ...c, recurringInterval: Number(e.target.value) || 1 }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "13px" }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {isAuthenticated && editingTaskId === null && (
            <div className="glass-tile" style={{ borderRadius: "16px", padding: "12px 14px", border: "1px dashed var(--border)", fontSize: "12px", color: "var(--text-muted)" }}>
              Save the current fields as a reusable template from <strong style={{ color: "var(--text-primary)" }}>Templates</strong> (toolbar).
            </div>
          )}

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

      <CenteredModal isOpen={showTplModal} onClose={() => setShowTplModal(false)} title="Templates" maxWidth="420px">
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", display: "grid", gap: "10px", border: "1px solid var(--border)" }}>
            <span className="section-label">Apply template</span>
            <CustomSelect
              value={applyTplId}
              onChange={setApplyTplId}
              options={[{ value: "", label: "Choose…" }, ...templates.map((t) => ({ value: t.id, label: t.name }))]}
            />
            <button type="button" className="btn-primary" style={{ fontWeight: 700 }} onClick={handleApplyTemplate} disabled={!applyTplId}>
              Add tasks to list
            </button>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>New tasks use today&apos;s date when the template sets a due date.</p>
          </div>
          <div className="glass-tile" style={{ borderRadius: "16px", padding: "14px", display: "grid", gap: "10px", border: "1px solid var(--border)" }}>
            <span className="section-label">Save from task form</span>
            <input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Template name"
              style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
            />
            <button type="button" className="glass-tile" style={{ borderRadius: "12px", padding: "12px", fontWeight: 700 }} onClick={handleSaveQuickTemplate}>
              Save current title, tags, category &amp; project
            </button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}
