/**
 * Tasks.jsx — HabitsNow-style layout
 * Two tabs: Single Tasks / Recurring Tasks
 * Clean task rows with SVG icon tiles
 * Full editor: title, notes, icon, category, date, priority, frequency
 * Task action sheet (Calendar / Edit / Archive / Delete)
 */
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
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

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY = {
  high:   { color:"#FF5A5F", bg:"rgba(255,90,95,0.12)",  label:"High" },
  medium: { color:"#F5A623", bg:"rgba(245,166,35,0.12)", label:"Medium" },
  low:    { color:"#3DD68C", bg:"rgba(61,214,140,0.12)", label:"Low" },
};
const P_OPTIONS = [
  { value:"high",   label:"High" },
  { value:"medium", label:"Medium" },
  { value:"low",    label:"Low" },
];
const FREQ_OPTIONS = [
  { value:"daily",   label:"Daily" },
  { value:"weekly",  label:"Weekly — pick days" },
  { value:"monthly", label:"Monthly" },
  { value:"custom",  label:"Every N days" },
];
const CAT_COLORS = ["#FF7A59","#FF5A5F","#F5A623","#3DD68C","#49B9FF","#8B5CF6","#EC4899","#14B8A6"];

const today = () => localTodayYMD();
const weekEnd = () => {
  const d = new Date(); d.setDate(d.getDate()+7);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const blankTask = {
  title:"", description:"", priority:"medium", categoryId:"",
  dueDate:"", icon:"check", color:"#FF7A59",
  isRecurring:false, recurringFrequency:"daily",
  recurringInterval:2, weeklyDays:"1,3,5",
};

// ─── Icon picker ───────────────────────────────────────────────────────────────
function IconPicker({ value, onChange, color }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
      {TASK_ICON_LIST.map(key => (
        <button key={key} type="button" onClick={() => onChange(key)} className="btn-reset"
          style={{ width:"36px", height:"36px", borderRadius:"9px", padding:"7px",
            background:key===value?`${color}20`:"var(--surface-elevated)",
            border:`1.5px solid ${key===value?color:"var(--border)"}` }}>
          <div style={{ width:"100%", height:"100%", color }}>
            {TASK_ICONS[key]?.(color)}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Task action sheet ─────────────────────────────────────────────────────────
function TaskActionSheet({ task, categories, onClose, onEdit, onDelete, onArchive }) {
  if (!task) return null;
  const cat = categories.find(c => c.id === task.categoryId);
  const p   = PRIORITY[task.priority] || PRIORITY.medium;
  const actions = [
    { icon:"📅", label:"Calendar",  fn:()=>{ toast("Task calendar coming soon"); onClose(); } },
    { icon:"✏️", label:"Edit",      fn:()=>{ onEdit(task); onClose(); } },
    { icon:"🗃️",label:"Archive",   fn:()=>{ onArchive(task.id); toast("Archived"); onClose(); } },
    { icon:"🗑️",label:"Delete",    fn:()=>{ onDelete(task.id); onClose(); }, danger:true },
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <motion.div onClick={e=>e.stopPropagation()} initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}} transition={{type:"spring",stiffness:340,damping:30}}
        style={{width:"100%",maxWidth:"440px",background:"var(--surface-raised)",borderRadius:"20px 20px 0 0",padding:"12px 0 44px",border:"1px solid var(--border-strong)",borderBottom:"none"}}>
        <div style={{width:"36px",height:"3px",borderRadius:"999px",background:"var(--border-strong)",margin:"0 auto 10px"}}/>
        {/* header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 16px 10px"}}>
          <div>
            <div style={{fontSize:"15px",fontWeight:700,color:"var(--text-primary)",marginBottom:"3px"}}>{task.title}</div>
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              <span style={{fontSize:"10px",fontWeight:700,color:p.color,background:p.bg,padding:"1px 6px",borderRadius:"999px"}}>{p.label}</span>
              {task.isRecurring&&<span style={{fontSize:"10px",color:"var(--text-muted)",display:"inline-flex",alignItems:"center",gap:"2px"}}><IconRepeat size={10} stroke="var(--text-muted)"/>Recurring</span>}
              {cat&&<span style={{fontSize:"10px",color:cat.color,fontWeight:600}}>{cat.icon} {cat.name}</span>}
            </div>
          </div>
          <TaskIconTile iconKey={task.icon||"check"} color={task.color||p.color} size={36}/>
        </div>
        <div style={{height:"1px",background:"var(--border)",marginBottom:"2px"}}/>
        {actions.map(a=>(
          <button key={a.label} type="button" onClick={a.fn} className="btn-reset"
            style={{width:"100%",padding:"13px 18px",display:"flex",alignItems:"center",gap:"14px",color:a.danger?"var(--danger)":"var(--text-primary)",fontSize:"14px",fontWeight:500,background:"transparent"}}>
            <span style={{fontSize:"18px",width:"22px",textAlign:"center"}}>{a.icon}</span>
            {a.label}
            <span style={{marginLeft:"auto",color:"var(--text-muted)",fontSize:"16px"}}>›</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Task Row ──────────────────────────────────────────────────────────────────
function TaskRow({ task, categories, tab, onToggle, onDelete, onEdit, onRestore, onArchive, onPermanent, onSkipRecurring, onOpenAction }) {
  const cat = categories.find(c=>c.id===task.categoryId);
  const p   = PRIORITY[task.priority] || PRIORITY.medium;
  const due = task.dueDate;
  const now = today();
  const overdue = due && due < now && !task.completed;
  const isActive = tab==="active";

  return (
    <motion.div initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} exit={{opacity:0,x:4}} transition={{duration:0.16}}
      style={{
        display:"flex",alignItems:"center",gap:"11px",padding:"12px 8px",
        borderBottom:"1px solid var(--border)",
        borderLeft:task.completed?`3px solid ${p.color}`:"3px solid transparent",
        borderRadius:"0 12px 12px 0",
        background:task.completed?`linear-gradient(90deg,${p.color}10,transparent 50%)`:undefined,
      }}>

      {/* check circle */}
      {isActive?(
        <PremiumRoundComplete checked={task.completed} onClick={()=>onToggle(task,!task.completed)}
          color={p.color} ariaLabel={task.completed?"Mark incomplete":"Complete"}/>
      ):<div style={{width:32}}/>}

      {/* icon tile */}
      <TaskIconTile iconKey={task.icon||"check"} color={task.color||p.color} size={34}/>

      {/* text */}
      <div style={{flex:1,minWidth:0}}>
        <PremiumCompleteTitle complete={task.completed} lineColor="var(--text-secondary)">
          {task.title}
        </PremiumCompleteTitle>
        <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginTop:"3px",alignItems:"center"}}>
          <span style={{fontSize:"10px",fontWeight:700,color:p.color,background:p.bg,padding:"1px 6px",borderRadius:"999px",border:`1px solid ${p.color}28`}}>{p.label}</span>
          {task.isRecurring&&(
            <span style={{fontSize:"10px",color:"var(--text-muted)",display:"inline-flex",alignItems:"center",gap:"2px",fontWeight:600}}>
              <IconRepeat size={9} stroke="var(--text-muted)"/> Every {task.recurringFrequency||"day"}
            </span>
          )}
          {cat&&(
            <span style={{fontSize:"10px",color:cat.color,fontWeight:600}}>
              {cat.icon} {cat.name}
            </span>
          )}
          {due&&(
            <span style={{fontSize:"10px",fontWeight:600,color:overdue?"var(--danger)":due===now?"var(--accent)":"var(--text-muted)"}}>
              {due===now?"Today":overdue?`Overdue ${due}`:due}
            </span>
          )}
        </div>
      </div>

      {/* actions */}
      <div style={{display:"flex",gap:"4px",flexShrink:0,alignItems:"center"}}>
        {isActive&&task.isRecurring&&(
          <button type="button" onClick={()=>onSkipRecurring(task)} className="btn-reset"
            style={{fontSize:"10px",fontWeight:600,color:"var(--text-muted)",padding:"5px 7px",borderRadius:"7px",border:"1px solid var(--border)",background:"var(--surface)"}}>Skip</button>
        )}
        {isActive&&(
          <motion.button whileTap={{scale:0.88}} type="button" onClick={()=>onOpenAction(task)} className="btn-reset"
            style={{width:"28px",height:"28px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700}}>⋮</motion.button>
        )}
        {tab==="trash"&&(
          <>
            <button type="button" onClick={()=>onRestore(task.id)} className="btn-reset"
              style={{fontSize:"11px",fontWeight:700,color:"var(--accent)",padding:"5px 8px",borderRadius:"8px",border:"1px solid var(--accent)28",background:"var(--accent-soft)"}}>Restore</button>
            <button type="button" onClick={()=>onPermanent(task.id)} className="btn-reset"
              style={{fontSize:"11px",fontWeight:700,color:"var(--danger)",padding:"5px 8px"}}>Delete</button>
          </>
        )}
        {tab==="archive"&&(
          <>
            <button type="button" onClick={()=>onRestore(task.id)} className="btn-reset"
              style={{fontSize:"11px",fontWeight:700,color:"var(--accent)",padding:"5px 8px",borderRadius:"8px",border:"1px solid var(--border)",background:"var(--surface)"}}>Restore</button>
            <motion.button whileTap={{scale:0.88}} type="button" onClick={()=>onDelete(task.id)} className="btn-reset"
              style={{width:"28px",height:"28px",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--danger)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <IconTrash size={13} stroke="currentColor"/>
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Tasks() {
  const { accent } = useTheme();
  const {
    tasks, categories, loading,
    addTask, updateTask, deleteTask,
    restoreTask, archiveTask, permanentDeleteTask, addCategory,
  } = useTasks();

  // Main tab: "single" | "recurring"
  const [mainTab,     setMainTab]     = useState("single");
  // Lifecycle sub-tab: "active" | "archive" | "trash"
  const [lifetab,     setLifetab]     = useState("active");
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [draft,       setDraft]       = useState({...blankTask});
  const [saving,      setSaving]      = useState(false);
  const [actionTask,  setActionTask]  = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName,     setCatName]     = useState("");
  const [catColor,    setCatColor]    = useState(accent);
  const [catIcon,     setCatIcon]     = useState("default");
  const [showIcons,   setShowIcons]   = useState(false);
  const [showCatIcons,setShowCatIcons]= useState(false);

  const now     = today();
  const wEnd    = weekEnd();

  // Build filtered list
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const life = lifecycleOf(t);
      if (lifetab==="active"  && life!=="active")   return false;
      if (lifetab==="archive" && life!=="archived")  return false;
      if (lifetab==="trash"   && life!=="trashed")   return false;
      // main tab filter
      if (mainTab==="single"    &&  t.isRecurring) return false;
      if (mainTab==="recurring" && !t.isRecurring) return false;
      // search
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      // filter
      if (filter==="today")   return t.dueDate===now;
      if (filter==="overdue") return t.dueDate && t.dueDate<now && !t.completed;
      if (filter==="week")    return t.dueDate && t.dueDate>=now && t.dueDate<=wEnd;
      if (filter==="pending") return !t.completed;
      if (filter==="done")    return t.completed;
      return true;
    });
  }, [tasks, mainTab, lifetab, search, filter, now, wEnd]);

  const catOptions = [{value:"",label:"No category"}, ...categories.map(c=>({value:c.id,label:`${c.icon||""} ${c.name}`}))];

  // Toggle
  const handleToggle = async (task, completed) => {
    if (completed && task.isRecurring) {
      const ymd = now;
      const dates = [...new Set([...(task.completedDates||[]),ymd])];
      const next  = computeNextDueDate(task, task.dueDate||ymd);
      await updateTask(task.id,{completed:false,completedDates:dates,dueDate:next});
      toast.success("Logged · next date updated");
      return;
    }
    await updateTask(task.id,{completed});
  };

  const handleSkip = async (task) => {
    const ymd   = now;
    const skips = [...new Set([...(task.recurringSkipDates||[]),ymd])];
    const next  = computeNextDueDate(task, task.dueDate||ymd);
    await updateTask(task.id,{recurringSkipDates:skips,dueDate:next});
    toast.success("Skipped · next date set");
  };

  // Open create
  const openCreate = (isRecurring=false) => {
    setEditingId(null);
    setDraft({...blankTask, isRecurring, recurringFrequency:isRecurring?"daily":"daily"});
    setShowIcons(false); setShowForm(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setDraft({
      title:task.title||"", description:task.description||"",
      priority:task.priority||"medium", categoryId:task.categoryId||"",
      dueDate:task.dueDate||"", icon:task.icon||"check", color:task.color||"#FF7A59",
      isRecurring:!!task.isRecurring, recurringFrequency:task.recurringFrequency||"daily",
      recurringInterval:task.recurringInterval||2,
      weeklyDays:(task.recurringDays||[]).join(","),
    });
    setShowIcons(false); setShowForm(true);
  };

  const buildPayload = () => {
    const rd = draft.recurringFrequency==="weekly"
      ? draft.weeklyDays.split(/[,\s]+/).map(x=>parseInt(x,10)).filter(n=>!isNaN(n)&&n>=0&&n<=6)
      : [];
    const due = draft.dueDate.trim() || (draft.isRecurring?now:"");
    return {
      title:draft.title.trim(), description:draft.description,
      priority:draft.priority, categoryId:draft.categoryId||null,
      dueDate:due||null, icon:draft.icon, color:draft.color,
      isRecurring:!!draft.isRecurring,
      recurringFrequency:draft.isRecurring?draft.recurringFrequency:null,
      recurringInterval:draft.isRecurring&&draft.recurringFrequency==="custom"?Math.max(1,Number(draft.recurringInterval)||2):null,
      recurringDays:draft.isRecurring&&draft.recurringFrequency==="weekly"?rd:[],
    };
  };

  const handleSave = async () => {
    if (!draft.title.trim()){toast.error("Task name required");return;}
    setSaving(true);
    const p = buildPayload();
    if (editingId){await updateTask(editingId,p);toast.success("Task updated");}
    else{const c=await addTask(p);if(!c){setSaving(false);return;}toast.success("Task created");}
    setSaving(false); setShowForm(false); setEditingId(null); setDraft({...blankTask});
  };

  const handleAddCat = async () => {
    if (!catName.trim()) return;
    await addCategory({name:catName.trim(),color:catColor,icon:catIcon});
    setCatName(""); setCatColor(accent); setCatIcon("default"); setShowCatForm(false);
  };

  const IS = {width:"100%",padding:"10px 12px",borderRadius:"12px",border:"1px solid var(--border)",background:"var(--surface-raised)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"13px",outline:"none",boxSizing:"border-box"};
  const SL = {fontSize:"10px",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"6px"};

  const FILTERS = [
    {id:"all",label:"All"},{id:"today",label:"Today"},{id:"overdue",label:"Overdue"},
    {id:"week",label:"This week"},{id:"pending",label:"Pending"},{id:"done",label:"Done"},
  ];

  return (
    <div style={{maxWidth:"680px",margin:"0 auto",padding:"16px 14px 100px",color:"var(--text-body)"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <div>
          <h1 style={{fontSize:"24px",fontFamily:"var(--font-heading)",letterSpacing:"-0.03em",marginBottom:"2px"}}>Tasks</h1>
          <div style={{color:"var(--text-muted)",fontSize:"12px"}}>{filtered.length} items</div>
        </div>
        <motion.button whileTap={{scale:0.9}} onClick={()=>setShowCatForm(true)} className="btn-reset"
          style={{padding:"7px 12px",borderRadius:"10px",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-secondary)",fontSize:"12px",fontWeight:600,display:"flex",alignItems:"center",gap:"5px"}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Category
        </motion.button>
      </div>

      {/* ── Main tabs: Single / Recurring ── */}
      <div style={{display:"flex",background:"var(--surface)",borderRadius:"12px",padding:"3px",marginBottom:"12px",border:"1px solid var(--border)"}}>
        {[{id:"single",label:"Single tasks"},{id:"recurring",label:"Recurring tasks"}].map(t=>(
          <button key={t.id} type="button" onClick={()=>setMainTab(t.id)} className="btn-reset"
            style={{flex:1,padding:"9px",borderRadius:"9px",background:mainTab===t.id?"var(--surface-elevated)":"transparent",color:mainTab===t.id?"var(--text-primary)":"var(--text-muted)",fontWeight:mainTab===t.id?700:500,fontSize:"13px",transition:"all 160ms",border:mainTab===t.id?"1px solid var(--border)":"1px solid transparent"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Lifecycle sub-tabs ── */}
      <div style={{display:"flex",gap:"6px",marginBottom:"10px",overflowX:"auto"}} className="hide-scrollbar">
        {[{id:"active",label:"All"},{id:"archive",label:"Archive"},{id:"trash",label:"Trash"}].map(t=>(
          <button key={t.id} type="button" onClick={()=>setLifetab(t.id)} className="btn-reset"
            style={{padding:"5px 12px",borderRadius:"999px",background:lifetab===t.id?"var(--accent-subtle)":"var(--surface)",border:`1px solid ${lifetab===t.id?"var(--accent)":"var(--border)"}`,color:lifetab===t.id?"var(--accent)":"var(--text-muted)",fontSize:"11px",fontWeight:lifetab===t.id?700:500,whiteSpace:"nowrap",flexShrink:0}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{position:"relative",marginBottom:"10px"}}>
        <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",display:"flex",pointerEvents:"none"}}>
          <IconSearch size={15} stroke="currentColor"/>
        </span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks"
          style={{...IS,padding:"9px 14px 9px 36px"}}/>
      </div>

      {/* ── Filters ── */}
      <div style={{display:"flex",gap:"5px",marginBottom:"12px",overflowX:"auto"}} className="hide-scrollbar">
        {FILTERS.map(f=>(
          <button key={f.id} type="button" onClick={()=>setFilter(f.id)} className="btn-reset"
            style={{padding:"4px 11px",borderRadius:"999px",background:filter===f.id?"var(--accent-subtle)":"var(--surface)",border:`1px solid ${filter===f.id?"var(--accent)":"var(--border)"}`,color:filter===f.id?"var(--accent)":"var(--text-muted)",fontSize:"11px",fontWeight:filter===f.id?700:500,whiteSpace:"nowrap",flexShrink:0}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Task list ── */}
      <div className="glass-panel" style={{borderRadius:"14px",padding:"0 10px"}}>
        {loading?(
          <div style={{padding:"28px 8px",textAlign:"center",color:"var(--text-muted)",fontSize:"13px"}}>Loading…</div>
        ):filtered.length===0?(
          <div style={{padding:"32px 8px",textAlign:"center"}}>
            <div style={{fontSize:"28px",marginBottom:"8px"}}>📋</div>
            <div style={{color:"var(--text-muted)",fontSize:"13px",marginBottom:"14px"}}>No {mainTab==="recurring"?"recurring ":""}tasks here.</div>
            <motion.button whileTap={{scale:0.96}} onClick={()=>openCreate(mainTab==="recurring")} className="btn-primary" style={{padding:"0 16px",height:"40px",fontSize:"13px"}}>
              {mainTab==="recurring"?"Add recurring task":"Add task"}
            </motion.button>
          </div>
        ):(
          <AnimatePresence initial={false}>
            {filtered.map(t=>(
              <TaskRow key={t.id} task={t} categories={categories} tab={lifetab}
                onToggle={handleToggle} onDelete={deleteTask} onEdit={openEdit}
                onRestore={restoreTask} onArchive={archiveTask}
                onPermanent={permanentDeleteTask} onSkipRecurring={handleSkip}
                onOpenAction={setActionTask}/>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* ── FAB ── */}
      <motion.button type="button" whileTap={{scale:0.9}} onClick={()=>openCreate(mainTab==="recurring")} className="btn-reset" aria-label="New task"
        style={{position:"fixed",right:"16px",bottom:"calc(var(--mobile-nav-height) + 24px)",width:"54px",height:"54px",borderRadius:"16px",background:`linear-gradient(145deg,var(--accent-hover),var(--accent))`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${accent}55`,border:"1px solid rgba(255,255,255,0.2)"}}>
        <IconPlus size={22} stroke="#fff"/>
      </motion.button>

      {/* ── Action sheet ── */}
      <AnimatePresence>
        {actionTask&&(
          <TaskActionSheet task={actionTask} categories={categories} onClose={()=>setActionTask(null)}
            onEdit={openEdit} onDelete={deleteTask} onArchive={archiveTask}/>
        )}
      </AnimatePresence>

      {/* ── Create / Edit modal ── */}
      <CenteredModal isOpen={showForm} onClose={()=>{setShowForm(false);setEditingId(null);setDraft({...blankTask});}} title={editingId?"Edit task":draft.isRecurring?"New recurring task":"New task"} maxWidth="440px">
        <div style={{display:"grid",gap:"12px"}}>

          {/* title */}
          <div>
            <div style={SL}>Task name</div>
            <input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} placeholder="What needs to be done?" style={IS} autoFocus/>
          </div>

          {/* notes */}
          <div>
            <div style={SL}>Notes</div>
            <textarea value={draft.description} onChange={e=>setDraft(d=>({...d,description:e.target.value}))} rows={2} placeholder="Optional notes"
              style={{...IS,resize:"vertical",minHeight:"64px"}}/>
          </div>

          {/* icon + color */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <div>
              <div style={SL}>Icon</div>
              <button type="button" onClick={()=>setShowIcons(v=>!v)} className="glass-tile"
                style={{width:"100%",padding:"8px 11px",borderRadius:"11px",display:"flex",alignItems:"center",gap:"8px",color:"var(--text-primary)",fontWeight:600,fontSize:"12px"}}>
                <div style={{width:"18px",height:"18px",color:draft.color}}>{TASK_ICONS[draft.icon]?.(draft.color)}</div>
                {showIcons?"Collapse":"Pick"}
              </button>
            </div>
            <div>
              <div style={SL}>Color</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"5px",paddingTop:"3px"}}>
                {CAT_COLORS.map(c=>(
                  <button key={c} type="button" onClick={()=>setDraft(d=>({...d,color:c}))} className="btn-reset"
                    style={{width:"22px",height:"22px",borderRadius:"50%",background:c,boxShadow:draft.color===c?`0 0 0 2px var(--bg),0 0 0 3.5px ${c}`:"none"}}/>
                ))}
              </div>
            </div>
          </div>

          {showIcons&&<IconPicker value={draft.icon} onChange={v=>{setDraft(d=>({...d,icon:v}));setShowIcons(false);}} color={draft.color}/>}

          {/* priority */}
          <div>
            <div style={SL}>Priority</div>
            <div style={{display:"flex",gap:"6px"}}>
              {["high","medium","low"].map(k=>{
                const p=PRIORITY[k], active=draft.priority===k;
                return (
                  <button key={k} type="button" onClick={()=>setDraft(d=>({...d,priority:k}))} className="btn-reset"
                    style={{flex:1,padding:"8px",borderRadius:"10px",border:active?`1.5px solid ${p.color}`:"1px solid var(--border)",background:active?p.bg:"var(--surface)",color:p.color,fontWeight:700,fontSize:"11px",letterSpacing:"0.04em",textTransform:"uppercase"}}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* category */}
          <div>
            <div style={SL}>Category</div>
            <CustomSelect value={draft.categoryId} onChange={v=>setDraft(d=>({...d,categoryId:v}))} options={catOptions}/>
          </div>

          {/* due date */}
          <div>
            <div style={SL}>Due date</div>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:"11px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",display:"flex",pointerEvents:"none"}}>
                <IconCalendar size={14} stroke="currentColor"/>
              </span>
              <input type="date" value={draft.dueDate} onChange={e=>setDraft(d=>({...d,dueDate:e.target.value}))} style={{...IS,paddingLeft:"34px"}}/>
            </div>
          </div>

          {/* recurring */}
          <div className="glass-tile" style={{borderRadius:"12px",padding:"11px",border:"1px solid var(--border)",display:"grid",gap:"10px"}}>
            <label style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}}>
              <input type="checkbox" checked={draft.isRecurring} onChange={e=>setDraft(d=>({...d,isRecurring:e.target.checked}))}/>
              <span style={{fontSize:"13px",fontWeight:600,display:"flex",alignItems:"center",gap:"5px"}}>
                <IconRepeat size={13} stroke="currentColor"/> Recurring task
              </span>
            </label>
            {draft.isRecurring&&(
              <>
                <CustomSelect value={draft.recurringFrequency} onChange={v=>setDraft(d=>({...d,recurringFrequency:v}))} options={FREQ_OPTIONS}/>
                {draft.recurringFrequency==="weekly"&&(
                  <div>
                    <div style={{...SL,marginBottom:"4px"}}>Days (0=Sun…6=Sat)</div>
                    <input value={draft.weeklyDays} onChange={e=>setDraft(d=>({...d,weeklyDays:e.target.value}))} placeholder="1,3,5" style={{...IS,fontSize:"12px"}}/>
                  </div>
                )}
                {draft.recurringFrequency==="custom"&&(
                  <div>
                    <div style={{...SL,marginBottom:"4px"}}>Every N days</div>
                    <input type="number" min={1} value={draft.recurringInterval} onChange={e=>setDraft(d=>({...d,recurringInterval:Number(e.target.value)||1}))} style={{...IS,fontSize:"12px"}}/>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{display:"flex",gap:"8px"}}>
            <button type="button" onClick={()=>{setShowForm(false);setEditingId(null);setDraft({...blankTask});}} className="glass-tile"
              style={{flex:1,borderRadius:"12px",padding:"10px",color:"var(--text-primary)",fontWeight:600,fontSize:"13px"}}>Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary" style={{flex:2,height:"42px",fontSize:"13px"}}>
              {saving?"Saving…":editingId?"Save changes":"Create task"}
            </button>
          </div>
        </div>
      </CenteredModal>

      {/* ── New category modal ── */}
      <CenteredModal isOpen={showCatForm} onClose={()=>setShowCatForm(false)} title="New category" maxWidth="380px">
        <div style={{display:"grid",gap:"12px"}}>
          <div>
            <div style={SL}>Category name</div>
            <input value={catName} onChange={e=>setCatName(e.target.value)} placeholder="e.g. Work, Health" style={IS} autoFocus/>
          </div>
          <div>
            <div style={SL}>Icon</div>
            <button type="button" onClick={()=>setShowCatIcons(v=>!v)} className="glass-tile"
              style={{width:"100%",padding:"8px 11px",borderRadius:"11px",display:"flex",alignItems:"center",gap:"8px",color:"var(--text-primary)",fontWeight:600,fontSize:"12px"}}>
              <div style={{width:"18px",height:"18px",color:catColor}}>{TASK_ICONS[catIcon]?.(catColor)}</div>
              {showCatIcons?"Collapse":"Pick icon"}
            </button>
            {showCatIcons&&<div style={{marginTop:"8px"}}><IconPicker value={catIcon} onChange={v=>{setCatIcon(v);setShowCatIcons(false);}} color={catColor}/></div>}
          </div>
          <div>
            <div style={SL}>Color</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
              {CAT_COLORS.map(c=>(
                <button key={c} type="button" onClick={()=>setCatColor(c)} className="btn-reset"
                  style={{width:"26px",height:"26px",borderRadius:"50%",background:c,boxShadow:catColor===c?`0 0 0 2px var(--bg),0 0 0 3.5px ${c}`:"none"}}/>
              ))}
            </div>
          </div>
          {/* preview */}
          <div style={{background:"var(--surface)",borderRadius:"10px",padding:"10px 12px",border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"32px",height:"32px",borderRadius:"9px",background:`${catColor}20`,border:`1px solid ${catColor}44`,display:"flex",alignItems:"center",justifyContent:"center",padding:"6px"}}>
              <div style={{width:"100%",height:"100%",color:catColor}}>{TASK_ICONS[catIcon]?.(catColor)}</div>
            </div>
            <div>
              <div style={{fontSize:"13px",fontWeight:700,color:"var(--text-primary)"}}>{catName||"Category name"}</div>
              <div style={{fontSize:"10px",color:catColor,fontWeight:600,marginTop:"1px"}}>0 tasks</div>
            </div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button type="button" onClick={()=>setShowCatForm(false)} className="glass-tile" style={{flex:1,borderRadius:"12px",padding:"10px",color:"var(--text-primary)",fontWeight:600,fontSize:"13px"}}>Cancel</button>
            <button type="button" onClick={handleAddCat} className="btn-primary" style={{flex:2,height:"42px",fontSize:"13px"}}>Create category</button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}