/**
 * Tasks.jsx
 * Recurring tasks now work EXACTLY like habits:
 *  - Completion tracked via completedDates[] per date (not task.completed)
 *  - Ticking adds today to completedDates & advances dueDate
 *  - Un-ticking removes today from completedDates
 *  - Visual state (circle, strikethrough, row bg) derives from completedDates.includes(today)
 *  - No 7-day row — just a clean toggle circle like habits
 * All buttons use var(--radius-btn) so button shape setting applies everywhere.
 */
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CenteredModal from "../components/CenteredModal";
import CustomSelect from "../components/CustomSelect";
import {
  IconCalendar, IconPlus, IconSearch, IconRepeat, IconTrash,
  PremiumCompleteTitle, PremiumRoundComplete,
  TaskIconTile, TASK_ICONS, TASK_ICON_LIST,
} from "../components/PremiumChrome";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import { localTodayYMD } from "../utils/date";
import { computeNextDueDate, lifecycleOf } from "../utils/recurringTask";

// ─── Constants ──────────────────────────────────────────────────────────────────
const PRIORITY = {
  high:   { color:"#FF5A5F", bg:"rgba(255,90,95,0.12)",  label:"High" },
  medium: { color:"#F5A623", bg:"rgba(245,166,35,0.12)", label:"Medium" },
  low:    { color:"#3DD68C", bg:"rgba(61,214,140,0.12)", label:"Low" },
};
const FREQ_OPTIONS = [
  { value:"daily",   label:"Daily" },
  { value:"weekly",  label:"Weekly — pick days" },
  { value:"monthly", label:"Monthly" },
  { value:"custom",  label:"Every N days" },
];
const CAT_COLORS = ["#FF7A59","#FF5A5F","#F5A623","#3DD68C","#49B9FF","#8B5CF6","#EC4899","#14B8A6"];

const todayYMD = () => localTodayYMD();
const weekEnd  = () => {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const blankTask = {
  title:"", description:"", priority:"medium", categoryId:"",
  dueDate:"", icon:"check", color:"#FF7A59",
  isRecurring:false, recurringFrequency:"daily",
  recurringInterval:2, weeklyDays:"1,3,5",
};

// ─── Icon picker ────────────────────────────────────────────────────────────────
function IconPicker({ value, onChange, color }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
      {TASK_ICON_LIST.map(key => (
        <button key={key} type="button" onClick={() => onChange(key)} className="btn-reset"
          style={{ width:"36px", height:"36px", borderRadius:"var(--radius-btn)", padding:"7px",
            background: key===value ? `${color}20` : "var(--surface-elevated)",
            border: `1.5px solid ${key===value ? color : "var(--border)"}` }}>
          <div style={{ width:"100%", height:"100%", color }}>{TASK_ICONS[key]?.(color)}</div>
        </button>
      ))}
    </div>
  );
}

// ─── Task action sheet ───────────────────────────────────────────────────────────
function TaskActionSheet({ task, categories, onClose, onEdit, onDelete, onArchive }) {
  if (!task) return null;
  const cat = categories.find(c => c.id === task.categoryId);
  const p   = PRIORITY[task.priority] || PRIORITY.medium;
  const actions = [
    { label:"Edit",    danger:false, fn:()=>{ onEdit(task); onClose(); },
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
    { label:"Archive", danger:false, fn:()=>{ onArchive(task.id); onClose(); },
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg> },
    { label:"Delete",  danger:true,  fn:()=>{ onDelete(task.id); onClose(); },
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg> },
  ];
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <motion.div onClick={e=>e.stopPropagation()} initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}} transition={{type:"spring",stiffness:340,damping:30}}
        style={{ width:"100%",maxWidth:"440px",background:"var(--surface-raised)",borderRadius:"24px 24px 0 0",padding:"12px 0 44px",border:"1px solid var(--border-strong)",borderBottom:"none" }}>
        <div style={{ width:"36px",height:"4px",borderRadius:"999px",background:"var(--border-strong)",margin:"0 auto 14px" }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 20px 14px" }}>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:"17px",fontWeight:800,color:"var(--text-primary)",marginBottom:"4px",fontFamily:"var(--font-heading)" }}>{task.title}</div>
            <div style={{ display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap" }}>
              <span style={{ fontSize:"10px",fontWeight:700,color:p.color,background:p.bg,padding:"1px 8px",borderRadius:"999px" }}>{p.label}</span>
              {task.isRecurring && <span style={{ fontSize:"10px",color:"var(--text-muted)",fontWeight:600,background:"var(--surface-elevated)",padding:"1px 8px",borderRadius:"999px",display:"inline-flex",alignItems:"center",gap:"3px" }}><IconRepeat size={10} stroke="var(--text-muted)"/>Recurring</span>}
              {cat && <span style={{ fontSize:"10px",color:cat.color,fontWeight:700,background:`${cat.color}15`,padding:"1px 8px",borderRadius:"999px" }}>{cat.icon} {cat.name}</span>}
            </div>
          </div>
          <TaskIconTile iconKey={task.icon||"check"} color={task.color||p.color} size={40}/>
        </div>
        <div style={{ height:"1px",background:"var(--border)",marginBottom:"4px" }}/>
        {actions.map(a => (
          <button key={a.label} type="button" onClick={a.fn} className="btn-reset"
            style={{ width:"100%",padding:"13px 20px",display:"flex",alignItems:"center",gap:"14px",color:a.danger?"var(--danger)":"var(--text-primary)",fontSize:"15px",fontWeight:500,background:"transparent" }}>
            <span style={{ width:"24px",display:"flex",alignItems:"center",justifyContent:"center" }}>{a.icon}</span>
            {a.label}
            <span style={{ marginLeft:"auto",color:"var(--text-muted)",fontSize:"16px" }}>›</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
// Recurring tasks behave like habits: checked = completedDates.includes(today)
function TaskRow({ task, categories, tab, onToggle, onDelete, onEdit, onRestore, onArchive, onPermanent, onSkipRecurring, onOpenAction }) {
  const cat      = categories.find(c => c.id === task.categoryId);
  const p        = PRIORITY[task.priority] || PRIORITY.medium;
  const due      = task.dueDate;
  const now      = todayYMD();
  const isActive = tab === "active";
  const color    = task.color || p.color;

  // Habit-style done check for recurring, simple flag for regular
  const checked = task.isRecurring
    ? (task.completedDates || []).includes(now)
    : !!task.completed;

  const overdue = due && due < now && !checked;

  return (
    <motion.div
      initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.97}}
      transition={{duration:0.2}}
      style={{
        display:"flex", alignItems:"center", gap:"12px",
        padding:"13px 14px 13px 0",
        borderBottom:"1px solid var(--border)",
        position:"relative",
        background: checked ? `linear-gradient(90deg,${color}08,transparent 60%)` : "",
        transition:"background 250ms",
      }}>

      {/* Left accent strip */}
      <div style={{ position:"absolute",left:0,top:"12%",bottom:"12%",width:"3px",borderRadius:"999px",
        background: checked ? color : `${color}44`, transition:"background 250ms" }}/>
      <div style={{ width:"10px",flexShrink:0 }}/>

      {/* Toggle — always shown when active */}
      {isActive ? (
        <PremiumRoundComplete
          checked={checked}
          onClick={() => onToggle(task)}
          color={color}
          ariaLabel={checked ? "Mark incomplete" : "Mark complete"}
        />
      ) : <div style={{ width:32 }}/>}

      {/* Icon tile */}
      <TaskIconTile iconKey={task.icon||"check"} color={color} size={36}/>

      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        <PremiumCompleteTitle complete={checked} lineColor={color}>
          {task.title}
        </PremiumCompleteTitle>
        <div style={{ display:"flex",gap:"5px",flexWrap:"wrap",marginTop:"4px",alignItems:"center" }}>
          <span style={{ fontSize:"10px",fontWeight:700,color,background:`${color}18`,padding:"1px 7px",borderRadius:"999px",border:`1px solid ${color}28`,textTransform:"uppercase",letterSpacing:"0.04em" }}>
            {p.label}
          </span>
          {task.isRecurring && (
            <span style={{ fontSize:"10px",color:"var(--text-muted)",display:"inline-flex",alignItems:"center",gap:"2px",fontWeight:600,padding:"1px 7px",borderRadius:"999px",background:"var(--surface-elevated)" }}>
              <IconRepeat size={9} stroke="var(--text-muted)"/> Recurring
            </span>
          )}
          {cat && (
            <span style={{ fontSize:"10px",color:cat.color,fontWeight:700,background:`${cat.color}15`,padding:"1px 7px",borderRadius:"999px",display:"flex",alignItems:"center",gap:"3px" }}>
              {cat.icon} {cat.name}
            </span>
          )}
          {due && (
            <span style={{ fontSize:"10px",fontWeight:700,color:overdue?"var(--danger)":due===now?"var(--accent)":"var(--text-muted)" }}>
              {due===now ? "Today" : overdue ? `Overdue ${due}` : due}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex",gap:"6px",flexShrink:0,alignItems:"center" }}>
        {isActive && task.isRecurring && (
          <motion.button whileTap={{scale:0.92}} type="button" onClick={() => onSkipRecurring(task)} className="btn-reset"
            style={{ fontSize:"11px",fontWeight:700,color:"var(--text-secondary)",padding:"4px 10px",borderRadius:"var(--radius-btn)",border:"1px solid var(--border)",background:"var(--surface-raised)" }}>
            Skip
          </motion.button>
        )}
        {isActive && (
          <motion.button whileTap={{scale:0.88}} type="button" onClick={() => onOpenAction(task)} className="btn-reset"
            style={{ width:"30px",height:"30px",borderRadius:"var(--radius-btn)",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </motion.button>
        )}
        {tab === "trash" && (
          <>
            <button type="button" onClick={() => onRestore(task.id)} className="btn-reset"
              style={{ fontSize:"11px",fontWeight:700,color:"var(--accent)",padding:"6px 10px",borderRadius:"var(--radius-btn)",background:"var(--accent-subtle)" }}>Restore</button>
            <button type="button" onClick={() => onPermanent(task.id)} className="btn-reset"
              style={{ fontSize:"11px",fontWeight:700,color:"var(--danger)",padding:"6px 10px" }}>Delete</button>
          </>
        )}
        {tab === "archive" && (
          <>
            <button type="button" onClick={() => onRestore(task.id)} className="btn-reset"
              style={{ fontSize:"11px",fontWeight:700,color:"var(--accent)",padding:"6px 10px",borderRadius:"var(--radius-btn)",background:"var(--surface-raised)" }}>Restore</button>
            <motion.button whileTap={{scale:0.88}} type="button" onClick={() => onDelete(task.id)} className="btn-reset"
              style={{ width:"30px",height:"30px",borderRadius:"var(--radius-btn)",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--danger)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <IconTrash size={14} stroke="currentColor"/>
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────────
export default function Tasks({ initialTab = null }) {
  const { accent } = useTheme();
  const {
    tasks, categories, loading,
    addTask, updateTask, toggleComplete, deleteTask,
    restoreTask, archiveTask, permanentDeleteTask, addCategory,
  } = useTasks();

  const [mainTab,      setMainTab]      = useState("single");
  const [lifetab,      setLifetab]      = useState("active");
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("all");
  const [showForm,     setShowForm]     = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [draft,        setDraft]        = useState({...blankTask});
  const [saving,       setSaving]       = useState(false);
  const [actionTask,   setActionTask]   = useState(null);
  const [showCatForm,  setShowCatForm]  = useState(false);
  const [catName,      setCatName]      = useState("");
  const [catColor,     setCatColor]     = useState(accent);
  const [catIcon,      setCatIcon]      = useState("default");
  const [showIcons,    setShowIcons]    = useState(false);
  const [showCatIcons, setShowCatIcons] = useState(false);

  const now  = todayYMD();
  const wEnd = weekEnd();

  useEffect(() => {
    if (initialTab === "recurring" || initialTab === "single") {
      setMainTab(initialTab);
      setTimeout(() => openCreate(initialTab === "recurring"), 100);
    }
  }, [initialTab]);

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const life = lifecycleOf(t);
      if (lifetab === "active"  && life !== "active")   return false;
      if (lifetab === "archive" && life !== "archived")  return false;
      if (lifetab === "trash"   && life !== "trashed")   return false;
      if (mainTab === "single"    &&  t.isRecurring) return false;
      if (mainTab === "recurring" && !t.isRecurring) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      const isDone = t.isRecurring
        ? (t.completedDates||[]).includes(now)
        : !!t.completed;
      if (filter === "today")   return t.dueDate === now;
      if (filter === "overdue") return t.dueDate && t.dueDate < now && !isDone;
      if (filter === "week")    return t.dueDate && t.dueDate >= now && t.dueDate <= wEnd;
      if (filter === "pending") return !isDone;
      if (filter === "done")    return isDone;
      return true;
    });
  }, [tasks, mainTab, lifetab, search, filter, now, wEnd]);

  const catOptions = [{ value:"", label:"No category" }, ...categories.map(c => ({ value:c.id, label:`${c.icon||""} ${c.name}` }))];

  // ── Toggle — habit-style for recurring, simple flip for single ────────────────
  const handleToggle = (task) => toggleComplete(task, now);

  const handleSkip = async (task) => {
    const skips = [...new Set([...(task.recurringSkipDates||[]), now])];
    const next  = computeNextDueDate(task, task.dueDate || now);
    await updateTask(task.id, { recurringSkipDates:skips, dueDate:next });
    toast.success("Skipped · next date set", { id:"task-skip" });
  };

  // ── Form ──────────────────────────────────────────────────────────────────────
  const closeForm = () => {
    setShowForm(false); setEditingId(null);
    setDraft({...blankTask}); setShowIcons(false);
  };

  const openCreate = (isRecurring = false) => {
    setEditingId(null);
    setDraft({ ...blankTask, isRecurring, recurringFrequency:"daily" });
    setShowIcons(false); setShowForm(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setDraft({
      title:              task.title || "",
      description:        task.description || "",
      priority:           task.priority || "medium",
      categoryId:         task.categoryId || "",
      dueDate:            task.dueDate || "",
      icon:               task.icon || "check",
      color:              task.color || "#FF7A59",
      isRecurring:        !!task.isRecurring,
      recurringFrequency: task.recurringFrequency || "daily",
      recurringInterval:  task.recurringInterval || 2,
      weeklyDays:         (task.recurringDays||[]).join(","),
    });
    setShowIcons(false); setShowForm(true);
  };

  const buildPayload = () => {
    const rd = draft.recurringFrequency === "weekly"
      ? draft.weeklyDays.split(/[,\s]+/).map(x => parseInt(x,10)).filter(n => !isNaN(n) && n >= 0 && n <= 6)
      : [];
    const due = draft.dueDate.trim() || (draft.isRecurring ? now : "");
    return {
      title:              draft.title.trim(),
      description:        draft.description,
      priority:           draft.priority,
      categoryId:         draft.categoryId || null,
      dueDate:            due || null,
      icon:               draft.icon,
      color:              draft.color,
      isRecurring:        !!draft.isRecurring,
      recurringFrequency: draft.isRecurring ? draft.recurringFrequency : null,
      recurringInterval:  draft.isRecurring && draft.recurringFrequency === "custom"
        ? Math.max(1, Number(draft.recurringInterval) || 2) : null,
      recurringDays: draft.isRecurring && draft.recurringFrequency === "weekly" ? rd : [],
    };
  };

  // No local toast for create — useTasks.addTask fires it with stable ID
  const handleSave = async () => {
    if (!draft.title.trim()) { toast.error("Task name required"); return; }
    setSaving(true);
    const p = buildPayload();
    if (editingId) {
      await updateTask(editingId, p);
      toast.success("Task updated", { id:"task-updated" });
    } else {
      const created = await addTask(p);
      if (!created) { setSaving(false); return; }
    }
    setSaving(false); closeForm();
  };

  const handleAddCat = async () => {
    if (!catName.trim()) return;
    await addCategory({ name:catName.trim(), color:catColor, icon:catIcon });
    setCatName(""); setCatColor(accent); setCatIcon("default"); setShowCatForm(false);
  };

  const IS = {
    width:"100%", padding:"10px 12px",
    borderRadius:"var(--radius-btn)",
    border:"1px solid var(--border)", background:"var(--surface-raised)",
    color:"var(--text-primary)", fontFamily:"var(--font-body)",
    fontSize:"13px", outline:"none", boxSizing:"border-box",
  };
  const SL = { fontSize:"10px",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"6px" };

  const FILTERS = [
    { id:"all",     label:"All" },
    { id:"today",   label:"Today" },
    { id:"overdue", label:"Overdue" },
    { id:"week",    label:"This week" },
    { id:"pending", label:"Pending" },
    { id:"done",    label:"Done" },
  ];

  return (
    <div style={{ maxWidth:"680px",margin:"0 auto",padding:"16px 14px 100px",color:"var(--text-body)" }}>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px" }}>
        <div>
          <h1 style={{ fontSize:"24px",fontFamily:"var(--font-heading)",letterSpacing:"-0.03em",marginBottom:"2px" }}>Tasks</h1>
          <div style={{ color:"var(--text-muted)",fontSize:"12px" }}>{filtered.length} items</div>
        </div>
        <motion.button whileTap={{scale:0.9}} onClick={() => setShowCatForm(true)} className="btn-reset"
          style={{ padding:"7px 12px",borderRadius:"var(--radius-btn)",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-secondary)",fontSize:"12px",fontWeight:600,display:"flex",alignItems:"center",gap:"5px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Category
        </motion.button>
      </div>

      {/* Main tabs */}
      <div style={{ display:"flex",background:"var(--surface)",borderRadius:"var(--radius-btn)",padding:"3px",marginBottom:"12px",border:"1px solid var(--border)" }}>
        {[{id:"single",label:"Single tasks"},{id:"recurring",label:"Recurring tasks"}].map(t => (
          <button key={t.id} type="button" onClick={() => setMainTab(t.id)} className="btn-reset"
            style={{ flex:1,padding:"9px",borderRadius:"calc(var(--radius-btn) - 2px)",background:mainTab===t.id?"var(--surface-elevated)":"transparent",color:mainTab===t.id?"var(--text-primary)":"var(--text-muted)",fontWeight:mainTab===t.id?700:500,fontSize:"13px",transition:"all 160ms",border:mainTab===t.id?"1px solid var(--border)":"1px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lifecycle sub-tabs */}
      <div style={{ display:"flex",gap:"6px",marginBottom:"10px",overflowX:"auto" }} className="hide-scrollbar">
        {[{id:"active",label:"All"},{id:"archive",label:"Archive"},{id:"trash",label:"Trash"}].map(t => (
          <button key={t.id} type="button" onClick={() => setLifetab(t.id)} className="btn-reset"
            style={{ padding:"5px 12px",borderRadius:"999px",background:lifetab===t.id?"var(--accent-subtle)":"var(--surface)",border:`1px solid ${lifetab===t.id?"var(--accent)":"var(--border)"}`,color:lifetab===t.id?"var(--accent)":"var(--text-muted)",fontSize:"11px",fontWeight:lifetab===t.id?700:500,whiteSpace:"nowrap",flexShrink:0 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:"relative",marginBottom:"10px" }}>
        <span style={{ position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",display:"flex",pointerEvents:"none" }}>
          <IconSearch size={15} stroke="currentColor"/>
        </span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks"
          style={{ ...IS, padding:"9px 14px 9px 36px" }}/>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:"5px",marginBottom:"12px",overflowX:"auto" }} className="hide-scrollbar">
        {FILTERS.map(f => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} className="btn-reset"
            style={{ padding:"4px 11px",borderRadius:"999px",background:filter===f.id?"var(--accent-subtle)":"var(--surface)",border:`1px solid ${filter===f.id?"var(--accent)":"var(--border)"}`,color:filter===f.id?"var(--accent)":"var(--text-muted)",fontSize:"11px",fontWeight:filter===f.id?700:500,whiteSpace:"nowrap",flexShrink:0 }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="glass-panel" style={{ borderRadius:"14px",padding:"0 10px" }}>
        {loading ? (
          <div style={{ padding:"28px 8px",textAlign:"center",color:"var(--text-muted)",fontSize:"13px" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"32px 8px",textAlign:"center" }}>
            <div style={{ fontSize:"28px",marginBottom:"8px" }}>📋</div>
            <div style={{ color:"var(--text-muted)",fontSize:"13px",marginBottom:"14px" }}>
              No {mainTab==="recurring" ? "recurring " : ""}tasks here.
            </div>
            <motion.button whileTap={{scale:0.96}} onClick={() => openCreate(mainTab==="recurring")} className="btn-primary"
              style={{ padding:"0 16px",height:"40px",fontSize:"13px" }}>
              {mainTab==="recurring" ? "Add recurring task" : "Add task"}
            </motion.button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map(t => (
              <TaskRow key={t.id} task={t} categories={categories} tab={lifetab}
                onToggle={handleToggle}
                onDelete={deleteTask} onEdit={openEdit}
                onRestore={restoreTask} onArchive={archiveTask}
                onPermanent={permanentDeleteTask} onSkipRecurring={handleSkip}
                onOpenAction={setActionTask}/>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* FAB */}
      <motion.button type="button" whileTap={{scale:0.9}} onClick={() => openCreate(mainTab==="recurring")}
        className="btn-reset" aria-label="New task"
        style={{ position:"fixed",right:"16px",bottom:"calc(var(--mobile-nav-height) + 24px)",width:"54px",height:"54px",borderRadius:"16px",background:`linear-gradient(145deg,var(--accent-hover),var(--accent))`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${accent}55`,border:"1px solid rgba(255,255,255,0.2)" }}>
        <IconPlus size={22} stroke="#fff"/>
      </motion.button>

      {/* Action sheet */}
      <AnimatePresence>
        {actionTask && (
          <TaskActionSheet task={actionTask} categories={categories} onClose={() => setActionTask(null)}
            onEdit={openEdit} onDelete={deleteTask} onArchive={archiveTask}/>
        )}
      </AnimatePresence>

      {/* Create / Edit modal */}
      <CenteredModal isOpen={showForm} onClose={closeForm}
        title={editingId ? "Edit task" : draft.isRecurring ? "New recurring task" : "New task"}
        maxWidth="440px">
        <div style={{ display:"grid",gap:"12px" }}>

          <div>
            <div style={SL}>Task name</div>
            <input value={draft.title} onChange={e => setDraft(d => ({...d,title:e.target.value}))}
              placeholder="What needs to be done?" style={IS} autoFocus/>
          </div>

          <div>
            <div style={SL}>Notes</div>
            <textarea value={draft.description} onChange={e => setDraft(d => ({...d,description:e.target.value}))}
              rows={2} placeholder="Optional notes" style={{ ...IS,resize:"vertical",minHeight:"64px" }}/>
          </div>

          {/* Icon + Color */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
            <div>
              <div style={SL}>Icon</div>
              <button type="button" onClick={() => setShowIcons(v => !v)} className="glass-tile"
                style={{ width:"100%",padding:"8px 11px",borderRadius:"var(--radius-btn)",display:"flex",alignItems:"center",gap:"8px",color:"var(--text-primary)",fontWeight:600,fontSize:"12px" }}>
                <div style={{ width:"18px",height:"18px",color:draft.color }}>{TASK_ICONS[draft.icon]?.(draft.color)}</div>
                {showIcons ? "Collapse" : "Pick"}
              </button>
            </div>
            <div>
              <div style={SL}>Color</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:"5px",paddingTop:"3px" }}>
                {CAT_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setDraft(d => ({...d,color:c}))} className="btn-reset"
                    style={{ width:"22px",height:"22px",borderRadius:"50%",background:c,boxShadow:draft.color===c?`0 0 0 2px var(--bg),0 0 0 3.5px ${c}`:"none" }}/>
                ))}
              </div>
            </div>
          </div>

          {showIcons && <IconPicker value={draft.icon} onChange={v => { setDraft(d => ({...d,icon:v})); setShowIcons(false); }} color={draft.color}/>}

          {/* Priority */}
          <div>
            <div style={SL}>Priority</div>
            <div style={{ display:"flex",gap:"6px" }}>
              {["high","medium","low"].map(k => {
                const pr = PRIORITY[k], active = draft.priority === k;
                return (
                  <button key={k} type="button" onClick={() => setDraft(d => ({...d,priority:k}))} className="btn-reset"
                    style={{ flex:1,padding:"8px",borderRadius:"var(--radius-btn)",border:active?`1.5px solid ${pr.color}`:"1px solid var(--border)",background:active?pr.bg:"var(--surface)",color:pr.color,fontWeight:700,fontSize:"11px",textTransform:"uppercase" }}>
                    {pr.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <div style={SL}>Category</div>
            <CustomSelect value={draft.categoryId} onChange={v => setDraft(d => ({...d,categoryId:v}))} options={catOptions}/>
          </div>

          {/* Due date — only for single tasks */}
          {!draft.isRecurring && (
            <div>
              <div style={SL}>Due date</div>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute",left:"11px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",display:"flex",pointerEvents:"none" }}>
                  <IconCalendar size={14} stroke="currentColor"/>
                </span>
                <input type="date" value={draft.dueDate} onChange={e => setDraft(d => ({...d,dueDate:e.target.value}))} style={{ ...IS,paddingLeft:"34px" }}/>
              </div>
            </div>
          )}

          {/* Recurring section — shown when isRecurring */}
          {draft.isRecurring && (
            <div className="glass-tile" style={{ borderRadius:"var(--radius-btn)",padding:"11px",border:"1px solid var(--border)",display:"grid",gap:"10px" }}>
              <div style={SL}>Repeat schedule</div>
              <CustomSelect value={draft.recurringFrequency} onChange={v => setDraft(d => ({...d,recurringFrequency:v}))} options={FREQ_OPTIONS}/>
              {draft.recurringFrequency === "weekly" && (
                <div>
                  <div style={{ ...SL,marginBottom:"4px" }}>Days (0=Sun … 6=Sat)</div>
                  <input value={draft.weeklyDays} onChange={e => setDraft(d => ({...d,weeklyDays:e.target.value}))} placeholder="1,3,5" style={{ ...IS,fontSize:"12px" }}/>
                </div>
              )}
              {draft.recurringFrequency === "custom" && (
                <div>
                  <div style={{ ...SL,marginBottom:"4px" }}>Every N days</div>
                  <input type="number" min={1} value={draft.recurringInterval} onChange={e => setDraft(d => ({...d,recurringInterval:Number(e.target.value)||1}))} style={{ ...IS,fontSize:"12px" }}/>
                </div>
              )}
            </div>
          )}

          {/* Recurring toggle for single tasks */}
          {!draft.isRecurring && (
            <div className="glass-tile" style={{ borderRadius:"var(--radius-btn)",padding:"11px",border:"1px solid var(--border)" }}>
              <label style={{ display:"flex",alignItems:"center",gap:"10px",cursor:"pointer" }}>
                <input type="checkbox" checked={false} onChange={() => setDraft(d => ({...d,isRecurring:true,dueDate:""}))}/>
                <span style={{ fontSize:"13px",fontWeight:600,display:"flex",alignItems:"center",gap:"5px" }}>
                  <IconRepeat size={13} stroke="currentColor"/> Make recurring
                </span>
              </label>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display:"flex",gap:"8px" }}>
            <button type="button" onClick={closeForm} className="btn-secondary" style={{ flex:1,fontSize:"13px" }}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex:2,height:"44px",fontSize:"13px" }}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create task"}
            </button>
          </div>
        </div>
      </CenteredModal>

      {/* New category modal */}
      <CenteredModal isOpen={showCatForm} onClose={() => setShowCatForm(false)} title="New category" maxWidth="380px">
        <div style={{ display:"grid",gap:"12px" }}>
          <div>
            <div style={SL}>Category name</div>
            <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Work, Health" style={IS} autoFocus/>
          </div>
          <div>
            <div style={SL}>Icon</div>
            <button type="button" onClick={() => setShowCatIcons(v => !v)} className="glass-tile"
              style={{ width:"100%",padding:"8px 11px",borderRadius:"var(--radius-btn)",display:"flex",alignItems:"center",gap:"8px",color:"var(--text-primary)",fontWeight:600,fontSize:"12px" }}>
              <div style={{ width:"18px",height:"18px",color:catColor }}>{TASK_ICONS[catIcon]?.(catColor)}</div>
              {showCatIcons ? "Collapse" : "Pick icon"}
            </button>
            {showCatIcons && <div style={{ marginTop:"8px" }}><IconPicker value={catIcon} onChange={v => { setCatIcon(v); setShowCatIcons(false); }} color={catColor}/></div>}
          </div>
          <div>
            <div style={SL}>Color</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"7px" }}>
              {CAT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setCatColor(c)} className="btn-reset"
                  style={{ width:"26px",height:"26px",borderRadius:"50%",background:c,boxShadow:catColor===c?`0 0 0 2px var(--bg),0 0 0 3.5px ${c}`:"none" }}/>
              ))}
            </div>
          </div>
          <div style={{ background:"var(--surface)",borderRadius:"var(--radius-btn)",padding:"10px 12px",border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"10px" }}>
            <div style={{ width:"32px",height:"32px",borderRadius:"var(--radius-btn)",background:`${catColor}20`,border:`1px solid ${catColor}44`,display:"flex",alignItems:"center",justifyContent:"center",padding:"6px" }}>
              <div style={{ width:"100%",height:"100%",color:catColor }}>{TASK_ICONS[catIcon]?.(catColor)}</div>
            </div>
            <div>
              <div style={{ fontSize:"13px",fontWeight:700,color:"var(--text-primary)" }}>{catName||"Category name"}</div>
              <div style={{ fontSize:"10px",color:catColor,fontWeight:600,marginTop:"1px" }}>0 tasks</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:"8px" }}>
            <button type="button" onClick={() => setShowCatForm(false)} className="btn-secondary" style={{ flex:1,fontSize:"13px" }}>Cancel</button>
            <button type="button" onClick={handleAddCat} className="btn-primary" style={{ flex:2,height:"44px",fontSize:"13px" }}>Create category</button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}