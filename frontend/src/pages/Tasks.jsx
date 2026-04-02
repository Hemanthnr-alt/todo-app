import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import CustomSelect  from "../components/CustomSelect";
import CenteredModal from "../components/CenteredModal";
import api   from "../services/api";
import toast from "react-hot-toast";

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const todayStr    = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const tomorrowStr = () => { const d=new Date(); d.setDate(d.getDate()+1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const weekEndStr  = () => { const d=new Date(); d.setDate(d.getDate()+7); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

const PM = {
  high:   { color:"#f43f5e", bg:"rgba(244,63,94,0.12)",  label:"High",   dot:"🔴" },
  medium: { color:"#f59e0b", bg:"rgba(245,158,11,0.12)", label:"Medium", dot:"🟡" },
  low:    { color:"#10b981", bg:"rgba(16,185,129,0.12)", label:"Low",    dot:"🟢" },
};

const PRIORITY_OPTS = [
  { value:"high",   label:"🔴 High"   },
  { value:"medium", label:"🟡 Medium" },
  { value:"low",    label:"🟢 Low"    },
];

function formatDue(d) {
  if (!d) return null;
  const t=todayStr(), tm=tomorrowStr();
  if (d===t)  return "Today";
  if (d===tm) return "Tomorrow";
  const [y,mo,day] = d.split("-").map(Number);
  return new Date(y,mo-1,day).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

function fileIcon(m) {
  if(m?.startsWith("image/"))return"🖼️";
  if(m==="application/pdf")return"📄";
  if(m?.includes("word"))return"📝";
  if(m?.includes("sheet")||m?.includes("excel"))return"📊";
  if(m==="text/plain")return"📃";
  if(m?.includes("zip"))return"📦";
  return"📎";
}
function fmtSize(b) {
  if(b<1024)return b+" B";
  if(b<1048576)return(b/1024).toFixed(1)+" KB";
  return(b/1048576).toFixed(1)+" MB";
}

/* ── SubTasks ────────────────────────────────────────────────────────────────── */
function SubTasks({ task, onUpdate, isDark, textColor, mutedColor, border, inputBg }) {
  const [text, setText] = useState("");
  const sub = task.subtasks || [];
  const add = async () => {
    if(!text.trim()) return;
    await onUpdate(task.id,{subtasks:[...sub,{id:Date.now(),title:text.trim(),done:false}]});
    setText("");
  };
  return (
    <div style={{marginTop:"8px"}}>
      {sub.map(s => (
        <div key={s.id} style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"3px"}}>
          <input type="checkbox" checked={s.done}
            onChange={()=>onUpdate(task.id,{subtasks:sub.map(x=>x.id===s.id?{...x,done:!x.done}:x)})}
            style={{cursor:"pointer",accentColor:"var(--accent,#ff6b9d)"}}/>
          <span style={{fontSize:"12px",textDecoration:s.done?"line-through":"none",opacity:s.done?.5:1,flex:1,color:textColor}}>{s.title}</span>
          <button onClick={()=>onUpdate(task.id,{subtasks:sub.filter(x=>x.id!==s.id)})}
            style={{background:"none",border:"none",cursor:"pointer",color:"#f43f5e",fontSize:"11px"}}>✕</button>
        </div>
      ))}
      <div style={{display:"flex",gap:"5px",marginTop:"5px"}}>
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Add subtask…"
          style={{flex:1,padding:"4px 9px",borderRadius:"6px",border:`1px solid ${border}`,background:inputBg,color:textColor,fontSize:"12px",fontFamily:"inherit",outline:"none"}}/>
        <button onClick={add}
          style={{padding:"4px 9px",borderRadius:"6px",background:"rgba(var(--accent-rgb,255,107,157),0.12)",border:"1px solid var(--accent,#ff6b9d)44",color:"var(--accent,#ff6b9d)",cursor:"pointer",fontSize:"12px"}}>
          +
        </button>
      </div>
    </div>
  );
}

/* ── TaskCard ────────────────────────────────────────────────────────────────── */
function TaskCard({ task, categories, onUpdate, onDelete, isDark, accent }) {
  const [expanded,  setExpanded]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const ac = accent || "#ff6b9d";

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const inputBg    = isDark ? "rgba(255,255,255,0.07)" : "#ffffff";

  const dateInput = {
    padding:"5px 8px",borderRadius:"8px",
    border:`1px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"}`,
    background:inputBg,color:textColor,
    fontSize:"12px",fontFamily:"inherit",outline:"none",
  };

  const pm      = PM[task.priority] || PM.medium;
  const cat     = categories.find(c=>c.id===task.categoryId);
  const today   = todayStr();
  const overdue = task.dueDate && task.dueDate < today && !task.completed;
  const dueFmt  = formatDue(task.dueDate);
  const subCount = task.subtasks?.length||0;
  const subDone  = task.subtasks?.filter(s=>s.done).length||0;

  const cardBg = isDark
    ? (overdue?"rgba(244,63,94,0.07)":"rgba(12,8,24,0.65)")
    : (overdue?"rgba(244,63,94,0.04)":"rgba(255,255,255,0.88)");

  const handleUpload = async e => {
    const file=e.target.files?.[0]; if(!file)return;
    setUploading(true);
    try {
      const fd=new FormData(); fd.append("file",file);
      const res=await api.post(`/tasks/${task.id}/upload`,fd);
      onUpdate(task.id,{attachments:[...(task.attachments||[]),res.data.attachment]},true);
      toast.success("File attached!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); e.target.value=""; }
  };

  const delAtt = async attId => {
    try {
      await api.delete(`/tasks/${task.id}/attachments/${attId}`);
      onUpdate(task.id,{attachments:(task.attachments||[]).filter(a=>a.id!==attId)},true);
    } catch { toast.error("Failed"); }
  };

  return (
    <motion.div layout
      initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6,scale:.97}}
      style={{ background:cardBg,backdropFilter:"blur(14px)",borderRadius:"14px",border:`1px solid ${overdue?"rgba(244,63,94,0.25)":border}`,borderLeft:`3px solid ${pm.color}`,overflow:"hidden" }}>

      {/* Main row */}
      <div style={{padding:"13px 14px",display:"flex",alignItems:"flex-start",gap:"10px"}}>
        <div onClick={()=>onUpdate(task.id,{completed:!task.completed})}
          style={{ width:"19px",height:"19px",borderRadius:"5px",flexShrink:0,marginTop:"2px",border:`2px solid ${task.completed?ac:isDark?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.18)"}`,background:task.completed?`linear-gradient(135deg,${ac},${ac}cc)`:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.14s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
          {task.completed && <span style={{color:"white",fontSize:"10px",fontWeight:700}}>✓</span>}
        </div>

        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap",marginBottom:"5px"}}>
            <span style={{fontSize:"14px",fontWeight:600,color:textColor,textDecoration:task.completed?"line-through":"none",opacity:task.completed?.5:1}}>
              {task.title}
            </span>
            <span style={{fontSize:"10px",fontWeight:600,padding:"2px 7px",borderRadius:"20px",background:pm.bg,color:pm.color,flexShrink:0}}>
              {pm.dot} {pm.label}
            </span>
            {cat && <span style={{fontSize:"10px",fontWeight:600,padding:"2px 7px",borderRadius:"20px",background:`${cat.color}18`,color:cat.color,flexShrink:0}}>{cat.icon} {cat.name}</span>}
            {dueFmt && <span style={{fontSize:"10px",fontWeight:500,padding:"2px 7px",borderRadius:"20px",background:overdue?"rgba(244,63,94,0.12)":"rgba(var(--accent-rgb,255,107,157),0.1)",color:overdue?"#f43f5e":"var(--accent,#ff6b9d)",flexShrink:0}}>📅 {dueFmt}{overdue?" · Overdue":""}</span>}
            {subCount>0 && <span style={{fontSize:"10px",color:mutedColor}}>{subDone}/{subCount}</span>}
            {task.attachments?.length>0 && <span style={{fontSize:"10px",color:mutedColor}}>📎{task.attachments.length}</span>}
          </div>
          {task.description && <p style={{fontSize:"12px",color:mutedColor,margin:"3px 0 0",lineHeight:1.5}}>{task.description}</p>}
          {subCount>0 && (
            <div style={{marginTop:"7px",height:"3px",background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:"2px",width:`${(subDone/subCount)*100}%`,background:`linear-gradient(90deg,${ac},${ac}aa)`,transition:"width 0.3s"}}/>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:"5px",flexShrink:0}}>
          <motion.button whileTap={{scale:.9}} onClick={()=>setExpanded(!expanded)}
            style={{width:"26px",height:"26px",borderRadius:"7px",background:expanded?`${ac}18`:(isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"),border:"none",cursor:"pointer",fontSize:"11px",color:expanded?ac:mutedColor,display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            {expanded?"▲":"▼"}
          </motion.button>
          <motion.button whileTap={{scale:.9}} onClick={()=>onDelete(task.id)}
            style={{width:"26px",height:"26px",borderRadius:"7px",background:"rgba(244,63,94,0.09)",border:"none",cursor:"pointer",fontSize:"12px",color:"#f43f5e",display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            ✕
          </motion.button>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
            <div style={{padding:"0 14px 12px",borderTop:`1px solid ${isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"}`,paddingTop:"10px"}}>
              <div style={{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:"10px"}}>
                {/* Priority */}
                <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                  <label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Priority</label>
                  <CustomSelect value={task.priority} onChange={v=>onUpdate(task.id,{priority:v})} options={PRIORITY_OPTS} style={{fontSize:"12px",padding:"4px 8px",borderRadius:"7px"}}/>
                </div>
                {/* Due Date */}
                <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                  <label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Due Date</label>
                  <input type="date" value={task.dueDate||""} onChange={e=>onUpdate(task.id,{dueDate:e.target.value||null})} style={dateInput}/>
                </div>
                {/* Start Time */}
                <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                  <label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Start Time</label>
                  <input type="time" value={task.startTime||""} onChange={e=>onUpdate(task.id,{startTime:e.target.value||null})} style={dateInput}/>
                </div>
                {/* Category — FIX: now editable */}
                <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                  <label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Category</label>
                  <select
                    value={task.categoryId||""}
                    onChange={e=>onUpdate(task.id,{categoryId:e.target.value||null})}
                    style={{...dateInput,minWidth:"120px",cursor:"pointer"}}
                  >
                    <option value="">No category</option>
                    {categories.map(c=>(
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Subtasks */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Subtasks</label>
                <SubTasks task={task} onUpdate={onUpdate} isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} inputBg={inputBg}/>
              </div>
              {/* Attachments */}
              <div>
                <label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Attachments</label>
                {task.attachments?.length>0 && (
                  <div style={{marginTop:"5px",display:"flex",flexDirection:"column",gap:"3px"}}>
                    {task.attachments.map(att=>(
                      <div key={att.id} style={{display:"flex",alignItems:"center",gap:"7px",padding:"5px 9px",borderRadius:"7px",background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}}>
                        <span>{fileIcon(att.mimeType)}</span>
                        <a href={att.url} target="_blank" rel="noreferrer" style={{flex:1,fontSize:"11px",color:ac,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{att.originalName}</a>
                        <span style={{fontSize:"10px",color:mutedColor}}>{fmtSize(att.size)}</span>
                        <button onClick={()=>delAtt(att.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#f43f5e",fontSize:"10px"}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileRef} type="file" style={{display:"none"}} onChange={handleUpload}/>
                <button onClick={()=>fileRef.current?.click()} disabled={uploading}
                  style={{marginTop:"6px",padding:"4px 10px",borderRadius:"7px",background:`${ac}10`,border:`1px dashed ${ac}55`,color:ac,cursor:"pointer",fontSize:"11px",fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
                  {uploading?"Uploading…":"📎 Attach file"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main Tasks page ─────────────────────────────────────────────────────────── */
export default function Tasks() {
  const { isDark, accent } = useTheme();
  const { tasks, categories, loading, stats, addTask, updateTask, deleteTask, setTasks, addCategory } = useTasks();
  const ac = accent || "#ff6b9d";

  const [newTitle,     setNewTitle]     = useState("");
  const [newPriority,  setNewPriority]  = useState("medium");
  const [newCategory,  setNewCategory]  = useState("");
  const [newDueDate,   setNewDueDate]   = useState("");
  const [newDesc,      setNewDesc]      = useState("");
  const [search,       setSearch]       = useState("");
  const [fPriority,    setFPriority]    = useState("all");
  const [fCategory,    setFCategory]    = useState("all");
  const [fDue,         setFDue]         = useState("all");
  const [fCompleted,   setFCompleted]   = useState("all");
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName,      setCatName]      = useState("");
  const [catColor,     setCatColor]     = useState(ac);
  const [catIcon,      setCatIcon]      = useState("📁");
  const [addingTask,   setAddingTask]   = useState(false);

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(12,8,24,0.65)"     : "rgba(255,255,255,0.88)";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const inputBg    = isDark ? "rgba(255,255,255,0.07)" : "#ffffff";

  const inputStyle = {
    padding:"10px 13px",borderRadius:"10px",
    border:`1px solid ${border}`,
    background:inputBg,color:textColor,
    fontSize:"13px",fontFamily:"inherit",outline:"none",
  };

  const today   = todayStr();
  const weekEnd = weekEndStr();

  const filteredTasks = useMemo(() => tasks.filter(t => {
    if(search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if(fPriority!=="all" && t.priority!==fPriority) return false;
    if(fCategory!=="all" && t.categoryId!==fCategory) return false;
    if(fCompleted==="completed" && !t.completed) return false;
    if(fCompleted==="pending"   && t.completed)  return false;
    if(fDue==="today"    && t.dueDate!==today) return false;
    if(fDue==="overdue"  && !(t.dueDate&&t.dueDate<today&&!t.completed)) return false;
    if(fDue==="thisWeek" && !(t.dueDate&&t.dueDate>=today&&t.dueDate<=weekEnd)) return false;
    return true;
  }), [tasks,search,fPriority,fCategory,fDue,fCompleted,today,weekEnd]);

  const handleAddTask = async () => {
    if(!newTitle.trim()){ toast.error("Task title is required"); return; }
    setAddingTask(true);
    await addTask({ title:newTitle.trim(),description:newDesc,priority:newPriority,categoryId:newCategory||null,dueDate:newDueDate||null });
    setNewTitle(""); setNewDesc(""); setNewDueDate(""); setNewCategory(""); setNewPriority("medium");
    setShowAddForm(false); setAddingTask(false);
  };

  const handleUpdate = (id, updates, localOnly=false) => {
    if(localOnly) setTasks(prev=>prev.map(t=>t.id===id?{...t,...updates}:t));
    else updateTask(id,updates);
  };

  const handleAddCat = async () => {
    if(!catName.trim()) return;
    await addCategory({ name:catName.trim(),color:catColor,icon:catIcon });
    setCatName(""); setCatColor(ac); setCatIcon("📁"); setShowCatModal(false);
  };

  const dueCounts = useMemo(() => ({
    today:   tasks.filter(x=>x.dueDate===today).length,
    overdue: tasks.filter(x=>x.dueDate&&x.dueDate<today&&!x.completed).length,
    week:    tasks.filter(x=>x.dueDate&&x.dueDate>=today&&x.dueDate<=weekEnd).length,
  }), [tasks,today,weekEnd]);

  const categoryOpts = [
    { value:"", label:"No category" },
    ...categories.map(c=>({ value:c.id, label:`${c.icon} ${c.name}` })),
  ];

  return (
    <div style={{ maxWidth:"900px",margin:"0 auto",padding:"24px 16px",fontFamily:"'DM Sans',sans-serif",color:textColor }}>

      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px",flexWrap:"wrap",gap:"10px" }}>
        <div>
          <h1 style={{ fontSize:"28px",fontWeight:800,margin:0,letterSpacing:"-0.04em" }}>
            My{" "}
            <span style={{ background:`linear-gradient(135deg,${ac},${ac}aa)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
              Tasks
            </span>
          </h1>
          <p style={{ fontSize:"13px",color:mutedColor,margin:"3px 0 0" }}>
            {stats.completed}/{stats.total} completed{stats.overdue>0?` · ⚠️ ${stats.overdue} overdue`:" · All on track ✓"}
          </p>
        </div>
        <motion.button whileHover={{scale:1.04}} whileTap={{scale:.97}}
          onClick={()=>setShowAddForm(!showAddForm)}
          style={{ padding:"9px 18px",borderRadius:"12px",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,boxShadow:`0 4px 16px ${ac}44`,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
          + New Task
        </motion.button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"20px" }}>
        {[
          { label:"Total",   value:stats.total,        color:ac        },
          { label:"Done",    value:stats.completed,    color:"#10b981" },
          { label:"Pending", value:stats.pending,      color:"#f59e0b" },
          { label:"High 🔥", value:stats.highPriority, color:"#f43f5e" },
        ].map(s=>(
          <div key={s.label} style={{ padding:"13px 14px",borderRadius:"14px",background:cardBg,backdropFilter:"blur(12px)",border:`1px solid ${border}` }}>
            <div style={{ fontSize:"20px",fontWeight:800,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:"11px",color:mutedColor,marginTop:"2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden",marginBottom:"18px"}}>
            <div style={{ padding:"18px",borderRadius:"16px",background:cardBg,backdropFilter:"blur(12px)",border:`1px solid ${border}` }}>
              <h3 style={{ margin:"0 0 14px",fontSize:"15px",fontWeight:700,color:textColor }}>New Task</h3>
              <div style={{ display:"flex",flexDirection:"column",gap:"9px" }}>
                <input placeholder="Task title *" value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddTask()} autoFocus style={{ ...inputStyle,fontSize:"15px",fontWeight:500 }}/>
                <textarea placeholder="Description (optional)" value={newDesc} onChange={e=>setNewDesc(e.target.value)} rows={2} style={{ ...inputStyle,resize:"vertical" }}/>
                <div style={{ display:"flex",gap:"9px",flexWrap:"wrap",alignItems:"flex-start" }}>
                  <CustomSelect value={newPriority} onChange={setNewPriority} options={PRIORITY_OPTS} style={{minWidth:"130px"}}/>
                  <CustomSelect value={newCategory} onChange={setNewCategory} options={categoryOpts} style={{minWidth:"150px"}}/>
                  <input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} style={inputStyle}/>
                </div>
                <div style={{ display:"flex",gap:"7px",justifyContent:"flex-end" }}>
                  <button onClick={()=>setShowAddForm(false)} style={{ ...inputStyle,cursor:"pointer",padding:"8px 14px" }}>Cancel</button>
                  <motion.button whileTap={{scale:.97}} onClick={handleAddTask} disabled={addingTask}
                    style={{ padding:"8px 18px",borderRadius:"10px",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                    {addingTask?"Adding…":"Add Task"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div style={{ position:"relative",marginBottom:"12px" }}>
        <span style={{ position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",fontSize:"13px",color:mutedColor }}>🔍</span>
        <input placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ ...inputStyle,width:"100%",paddingLeft:"38px",boxSizing:"border-box",fontSize:"14px" }}/>
        {search && (
          <button onClick={()=>setSearch("")}
            style={{ position:"absolute",right:"11px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:mutedColor,fontSize:"15px" }}>✕</button>
        )}
      </div>

      {/* ── COMPACT FILTER BAR ── */}
      <div style={{ background:cardBg,backdropFilter:"blur(12px)",border:`1px solid ${border}`,borderRadius:"14px",padding:"10px 12px",marginBottom:"16px" }}>

        {/* Row 1: When */}
        <div style={{ overflowX:"auto",marginBottom:"8px" }} className="hide-scrollbar">
          <div style={{ display:"flex",gap:"5px",width:"max-content" }}>
            {[
              { l:`All (${tasks.length})`,        v:"all",     c:ac        },
              { l:`Today (${dueCounts.today})`,   v:"today",   c:"#3b82f6" },
              { l:`⚠ ${dueCounts.overdue} Overdue`,v:"overdue",c:"#f43f5e" },
              { l:`Week (${dueCounts.week})`,     v:"thisWeek",c:"#10b981" },
            ].map(f=>(
              <button key={f.v} onClick={()=>setFDue(f.v)}
                style={{ padding:"4px 11px",borderRadius:"99px",whiteSpace:"nowrap",border:`1.5px solid ${fDue===f.v?f.c:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,background:fDue===f.v?`${f.c}15`:"transparent",color:fDue===f.v?f.c:mutedColor,cursor:"pointer",fontSize:"11px",fontWeight:fDue===f.v?700:400,fontFamily:"inherit",transition:"all 0.12s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Priority + Status + Categories */}
        <div style={{ display:"flex",gap:"5px",flexWrap:"wrap",alignItems:"center" }}>
          {/* Priority */}
          {[["all","•",ac],["high","H","#f43f5e"],["medium","M","#f59e0b"],["low","L","#10b981"]].map(([v,l,c])=>(
            <button key={`p_${v}`} onClick={()=>setFPriority(v)}
              style={{ padding:"3px 9px",borderRadius:"99px",border:`1.5px solid ${fPriority===v?c:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,background:fPriority===v?`${c}15`:"transparent",color:fPriority===v?c:mutedColor,cursor:"pointer",fontSize:"11px",fontWeight:fPriority===v?700:400,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
              {l}
            </button>
          ))}

          <div style={{ width:"1px",height:"14px",background:border,margin:"0 2px" }}/>

          {/* Status */}
          {[["all","All",ac],["pending","Pending","#f59e0b"],["completed","Done","#10b981"]].map(([v,l,c])=>(
            <button key={`s_${v}`} onClick={()=>setFCompleted(v)}
              style={{ padding:"3px 9px",borderRadius:"99px",border:`1.5px solid ${fCompleted===v?c:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,background:fCompleted===v?`${c}15`:"transparent",color:fCompleted===v?c:mutedColor,cursor:"pointer",fontSize:"11px",fontWeight:fCompleted===v?700:400,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
              {l}
            </button>
          ))}

          {/* Categories */}
          {categories.length > 0 && (
            <>
              <div style={{ width:"1px",height:"14px",background:border,margin:"0 2px" }}/>
              {categories.slice(0,4).map(c=>(
                <button key={c.id} onClick={()=>setFCategory(fCategory===c.id?"all":c.id)}
                  style={{ padding:"3px 9px",borderRadius:"99px",border:`1.5px solid ${fCategory===c.id?c.color:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,background:fCategory===c.id?`${c.color}15`:"transparent",color:fCategory===c.id?c.color:mutedColor,cursor:"pointer",fontSize:"11px",fontWeight:fCategory===c.id?700:400,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}
                  title={c.name}>
                  {c.icon}
                </button>
              ))}
            </>
          )}

          <button onClick={()=>setShowCatModal(true)}
            style={{ padding:"3px 9px",borderRadius:"99px",border:"1.5px dashed rgba(192,132,252,0.4)",background:"transparent",color:"#c084fc",cursor:"pointer",fontSize:"11px",fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
            + Cat
          </button>
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:mutedColor }}>
          <div style={{ fontSize:"28px",marginBottom:"10px",animation:"spin 1s linear infinite",display:"inline-block" }}>⟳</div>
          <p style={{ fontSize:"14px" }}>Loading tasks…</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ textAlign:"center",padding:"60px 0" }}>
          <div style={{ fontSize:"44px",marginBottom:"10px" }}>📭</div>
          <p style={{ color:mutedColor,fontSize:"15px" }}>
            {search ? `No results for "${search}"` : "No tasks here. Add one above!"}
          </p>
        </motion.div>
      ) : (
        <motion.div layout style={{ display:"flex",flexDirection:"column",gap:"9px" }}>
          <AnimatePresence>
            {filteredTasks.map(task=>(
              <TaskCard key={task.id} task={task} categories={categories} onUpdate={handleUpdate} onDelete={deleteTask} isDark={isDark} accent={ac}/>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Category quick-add modal */}
      <CenteredModal isOpen={showCatModal} onClose={()=>setShowCatModal(false)} title="New Category" maxWidth="360px">
        <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
          <input placeholder="Category name" value={catName} onChange={e=>setCatName(e.target.value)}
            style={{ ...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:"11px" }}/>
          <div style={{ display:"flex",gap:"10px",marginBottom:"14px" }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:"11px",color:mutedColor,display:"block",marginBottom:"4px",fontWeight:600 }}>Icon</label>
              <input value={catIcon} onChange={e=>setCatIcon(e.target.value)} style={{ ...inputStyle,width:"100%",boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:"11px",color:mutedColor,display:"block",marginBottom:"4px",fontWeight:600 }}>Colour</label>
              <input type="color" value={catColor} onChange={e=>setCatColor(e.target.value)}
                style={{ width:"54px",height:"42px",borderRadius:"10px",border:"none",cursor:"pointer" }}/>
            </div>
          </div>
          <div style={{ display:"flex",gap:"7px" }}>
            <button onClick={()=>setShowCatModal(false)} style={{ flex:1,...inputStyle,cursor:"pointer",textAlign:"center",padding:"10px" }}>Cancel</button>
            <button onClick={handleAddCat}
              style={{ flex:1,padding:"10px",borderRadius:"10px",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }}>
              Create
            </button>
          </div>
        </div>
      </CenteredModal>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}