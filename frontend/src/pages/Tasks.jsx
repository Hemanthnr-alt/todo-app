import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import CustomSelect from "../components/CustomSelect";
import CenteredModal from "../components/CenteredModal";
import api from "../services/api";
import toast from "react-hot-toast";

// ─── helpers ──────────────────────────────────────────────────────────────────
const todayStr   = () => new Date().toISOString().split("T")[0];
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };
const weekEndStr  = () => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().split("T")[0]; };

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
  if (d===t) return "Today";
  if (d===tm) return "Tomorrow";
  return new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function fileIcon(m){
  if(m?.startsWith("image/")) return "🖼️";
  if(m==="application/pdf") return "📄";
  if(m?.includes("word")) return "📝";
  if(m?.includes("sheet")||m?.includes("excel")) return "📊";
  if(m==="text/plain") return "📃";
  if(m?.includes("zip")) return "📦";
  return "📎";
}
function fmtSize(b){
  if(b<1024) return b+" B";
  if(b<1048576) return (b/1024).toFixed(1)+" KB";
  return (b/1048576).toFixed(1)+" MB";
}

// ─── SubTasks ────────────────────────────────────────────────────────────────
function SubTasks({ task, onUpdate, isDark, textColor, mutedColor, border, inputBg }) {
  const [text, setText] = useState("");
  const sub = task.subtasks || [];
  const add = async () => { if(!text.trim()) return; await onUpdate(task.id,{subtasks:[...sub,{id:Date.now(),title:text.trim(),done:false}]}); setText(""); };
  return (
    <div style={{marginTop:"10px"}}>
      {sub.map(s=>(
        <div key={s.id} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
          <input type="checkbox" checked={s.done} onChange={()=>onUpdate(task.id,{subtasks:sub.map(x=>x.id===s.id?{...x,done:!x.done}:x)})} style={{cursor:"pointer",accentColor:"#ff6b9d"}}/>
          <span style={{fontSize:"12px",textDecoration:s.done?"line-through":"none",opacity:s.done?.5:1,flex:1,color:textColor}}>{s.title}</span>
          <button onClick={()=>onUpdate(task.id,{subtasks:sub.filter(x=>x.id!==s.id)})} style={{background:"none",border:"none",cursor:"pointer",color:"#f43f5e",fontSize:"11px"}}>✕</button>
        </div>
      ))}
      <div style={{display:"flex",gap:"6px",marginTop:"6px"}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Add subtask…"
          style={{flex:1,padding:"5px 10px",borderRadius:"6px",border:`1px solid ${border}`,background:inputBg,color:textColor,fontSize:"12px",fontFamily:"inherit",outline:"none"}}/>
        <button onClick={add} style={{padding:"5px 10px",borderRadius:"6px",background:"rgba(255,107,157,0.12)",border:"1px solid rgba(255,107,157,0.25)",color:"#ff6b9d",cursor:"pointer",fontSize:"12px"}}>+ Add</button>
      </div>
    </div>
  );
}

// ─── TaskCard ────────────────────────────────────────────────────────────────
function TaskCard({ task, categories, onUpdate, onDelete, isDark }) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const border     = isDark ? "rgba(255,107,157,0.1)"  : "rgba(255,107,157,0.15)";
  const inputBg    = isDark ? "rgba(255,255,255,0.07)" : "#ffffff";

  const pm  = PM[task.priority] || PM.medium;
  const cat = categories.find(c=>c.id===task.categoryId);
  const today   = todayStr();
  const overdue = task.dueDate && task.dueDate < today && !task.completed;
  const dueFmt  = formatDue(task.dueDate);
  const subCount = task.subtasks?.length || 0;
  const subDone  = task.subtasks?.filter(s=>s.done).length || 0;

  const cardBg = isDark
    ? (overdue ? "rgba(244,63,94,0.07)" : "rgba(15,23,42,0.65)")
    : (overdue ? "rgba(244,63,94,0.04)" : "rgba(255,255,255,0.88)");

  const dateInputStyle = {
    padding:"5px 8px", borderRadius:"8px",
    border:`1px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"}`,
    background: inputBg, color: textColor,
    fontSize:"12px", fontFamily:"inherit", outline:"none",
  };

  const handleUpload = async e => {
    const file = e.target.files?.[0]; if(!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file",file);
      const res = await api.post(`/tasks/${task.id}/upload`,fd);
      onUpdate(task.id,{attachments:[...(task.attachments||[]),res.data.attachment]},true);
      toast.success("File attached!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); e.target.value=""; }
  };

  const delAttachment = async attId => {
    try {
      await api.delete(`/tasks/${task.id}/attachments/${attId}`);
      onUpdate(task.id,{attachments:(task.attachments||[]).filter(a=>a.id!==attId)},true);
      toast.success("Attachment removed");
    } catch { toast.error("Failed"); }
  };

  return (
    <motion.div layout initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8,scale:0.97}}
      style={{ background:cardBg, backdropFilter:"blur(12px)", borderRadius:"16px", border:`1px solid ${overdue?"rgba(244,63,94,0.28)":border}`, borderLeft:`3px solid ${pm.color}`, overflow:"hidden" }}>

      {/* Main row */}
      <div style={{padding:"14px 16px",display:"flex",alignItems:"flex-start",gap:"12px"}}>
        {/* Checkbox */}
        <div onClick={()=>onUpdate(task.id,{completed:!task.completed})} style={{
          width:"20px",height:"20px",borderRadius:"6px",flexShrink:0,marginTop:"2px",
          border:`2px solid ${task.completed?"#ff6b9d":(isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.18)")}`,
          background:task.completed?"linear-gradient(135deg,#ff6b9d,#ff99cc)":"transparent",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",
        }}>
          {task.completed && <span style={{color:"white",fontSize:"11px",fontWeight:700}}>✓</span>}
        </div>

        {/* Content */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"6px"}}>
            <span style={{fontSize:"14px",fontWeight:600,color:textColor,textDecoration:task.completed?"line-through":"none",opacity:task.completed?.5:1}}>
              {task.title}
            </span>
            <span style={{fontSize:"10px",fontWeight:600,padding:"2px 8px",borderRadius:"20px",background:pm.bg,color:pm.color}}>
              {pm.dot} {pm.label}
            </span>
            {cat && <span style={{fontSize:"10px",fontWeight:600,padding:"2px 8px",borderRadius:"20px",background:`${cat.color}18`,color:cat.color}}>{cat.icon} {cat.name}</span>}
            {dueFmt && <span style={{fontSize:"10px",fontWeight:500,padding:"2px 8px",borderRadius:"20px",background:overdue?"rgba(244,63,94,0.12)":"rgba(255,107,157,0.1)",color:overdue?"#f43f5e":"#ff6b9d"}}>📅 {dueFmt}{overdue?" · Overdue":""}</span>}
            {subCount>0 && <span style={{fontSize:"10px",color:mutedColor}}>{subDone}/{subCount} subtasks</span>}
            {task.attachments?.length>0 && <span style={{fontSize:"10px",color:mutedColor}}>📎 {task.attachments.length}</span>}
          </div>
          {task.description && <p style={{fontSize:"12px",color:mutedColor,margin:"4px 0 0",lineHeight:1.5}}>{task.description}</p>}
          {subCount>0 && (
            <div style={{marginTop:"8px",height:"3px",background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:"2px",width:`${(subDone/subCount)*100}%`,background:"linear-gradient(90deg,#ff6b9d,#ff99cc)",transition:"width 0.3s"}}/>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
          <motion.button whileTap={{scale:.9}} onClick={()=>setExpanded(!expanded)}
            style={{width:"28px",height:"28px",borderRadius:"8px",background:expanded?"rgba(255,107,157,0.14)":(isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)"),border:"none",cursor:"pointer",fontSize:"12px",color:expanded?"#ff6b9d":mutedColor,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {expanded?"▲":"▼"}
          </motion.button>
          <motion.button whileTap={{scale:.9}} onClick={()=>onDelete(task.id)}
            style={{width:"28px",height:"28px",borderRadius:"8px",background:isDark?"rgba(244,63,94,0.1)":"rgba(244,63,94,0.07)",border:"none",cursor:"pointer",fontSize:"13px",color:"#f43f5e",display:"flex",alignItems:"center",justifyContent:"center"}}>
            ✕
          </motion.button>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
            <div style={{padding:"0 16px 14px",borderTop:`1px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}`,paddingTop:"12px"}}>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
                <div style={{display:"flex",flexDirection:"column",gap:"3px",minWidth:"120px"}}>
                  <label style={{fontSize:"10px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Priority</label>
                  {/* CustomSelect fixes the white OS dropdown */}
                  <CustomSelect
                    value={task.priority}
                    onChange={v=>onUpdate(task.id,{priority:v})}
                    options={PRIORITY_OPTS}
                    style={{fontSize:"12px",padding:"5px 8px",borderRadius:"8px"}}
                  />
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
                  <label style={{fontSize:"10px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Due Date</label>
                  <input type="date" value={task.dueDate||""} onChange={e=>onUpdate(task.id,{dueDate:e.target.value||null})} style={dateInputStyle}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
                  <label style={{fontSize:"10px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Start Time</label>
                  <input type="time" value={task.startTime||""} onChange={e=>onUpdate(task.id,{startTime:e.target.value||null})} style={dateInputStyle}/>
                </div>
              </div>

              <div style={{marginBottom:"12px"}}>
                <label style={{fontSize:"10px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Subtasks</label>
                <SubTasks task={task} onUpdate={onUpdate} isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} inputBg={inputBg}/>
              </div>

              <div>
                <label style={{fontSize:"10px",color:mutedColor,fontWeight:600,textTransform:"uppercase"}}>Attachments</label>
                {task.attachments?.length>0 && (
                  <div style={{marginTop:"6px",display:"flex",flexDirection:"column",gap:"4px"}}>
                    {task.attachments.map(att=>(
                      <div key={att.id} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"8px",background:isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"}}>
                        <span>{fileIcon(att.mimeType)}</span>
                        <a href={att.url} target="_blank" rel="noreferrer" style={{flex:1,fontSize:"12px",color:"#ff6b9d",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{att.originalName}</a>
                        <span style={{fontSize:"10px",color:mutedColor}}>{fmtSize(att.size)}</span>
                        <button onClick={()=>delAttachment(att.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#f43f5e",fontSize:"11px"}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileRef} type="file" style={{display:"none"}} onChange={handleUpload}/>
                <button onClick={()=>fileRef.current?.click()} disabled={uploading}
                  style={{marginTop:"8px",padding:"5px 12px",borderRadius:"8px",background:"rgba(255,107,157,0.1)",border:"1px dashed rgba(255,107,157,0.32)",color:"#ff6b9d",cursor:"pointer",fontSize:"12px",fontFamily:"inherit"}}>
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

// ─── Main Tasks page ─────────────────────────────────────────────────────────
export default function Tasks() {
  const { isDark } = useTheme();
  const { tasks, categories, loading, stats, addTask, updateTask, deleteTask, setTasks, addCategory } = useTasks();

  const [newTitle,    setNewTitle]    = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("");
  const [newDueDate,  setNewDueDate]  = useState("");
  const [newDesc,     setNewDesc]     = useState("");
  const [search,      setSearch]      = useState("");
  const [fPriority,   setFPriority]   = useState("all");
  const [fCategory,   setFCategory]   = useState("all");
  const [fDue,        setFDue]        = useState("all");
  const [fCompleted,  setFCompleted]  = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCatModal,setShowCatModal]= useState(false);
  const [catName,     setCatName]     = useState("");
  const [catColor,    setCatColor]    = useState("#ff6b9d");
  const [catIcon,     setCatIcon]     = useState("📁");
  const [addingTask,  setAddingTask]  = useState(false);

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.88)";
  const border     = isDark ? "rgba(255,107,157,0.1)"  : "rgba(255,107,157,0.15)";
  const inputBg    = isDark ? "rgba(255,255,255,0.07)" : "#ffffff";

  const inputStyle = { padding:"10px 14px", borderRadius:"10px", border:`1px solid ${border}`, background:inputBg, color:textColor, fontSize:"13px", fontFamily:"inherit", outline:"none" };

  const today   = todayStr();
  const weekEnd = weekEndStr();

  const filteredTasks = useMemo(() => tasks.filter(t => {
    if(search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if(fPriority!=="all" && t.priority!==fPriority) return false;
    if(fCategory!=="all" && t.categoryId!==fCategory) return false;
    if(fCompleted==="completed" && !t.completed) return false;
    if(fCompleted==="pending"   &&  t.completed) return false;
    if(fDue==="today"    && t.dueDate!==today) return false;
    if(fDue==="overdue"  && !(t.dueDate && t.dueDate<today && !t.completed)) return false;
    if(fDue==="thisWeek" && !(t.dueDate && t.dueDate>=today && t.dueDate<=weekEnd)) return false;
    return true;
  }), [tasks, search, fPriority, fCategory, fDue, fCompleted, today, weekEnd]);

  const handleAddTask = async () => {
    if(!newTitle.trim()) { toast.error("Task title is required"); return; }
    setAddingTask(true);
    await addTask({ title:newTitle.trim(), description:newDesc, priority:newPriority, categoryId:newCategory||null, dueDate:newDueDate||null });
    setNewTitle(""); setNewDesc(""); setNewDueDate(""); setNewCategory(""); setNewPriority("medium");
    setShowAddForm(false); setAddingTask(false);
  };

  const handleUpdate = (id, updates, localOnly=false) => {
    if(localOnly) setTasks(prev=>prev.map(t=>t.id===id?{...t,...updates}:t));
    else updateTask(id, updates);
  };

  const handleAddCat = async () => {
    if(!catName.trim()) return;
    await addCategory({ name:catName.trim(), color:catColor, icon:catIcon });
    setCatName(""); setCatColor("#ff6b9d"); setCatIcon("📁"); setShowCatModal(false);
  };

  const dueCounts = useMemo(() => ({
    today: tasks.filter(x=>x.dueDate===today).length,
    overdue: tasks.filter(x=>x.dueDate && x.dueDate<today && !x.completed).length,
    week: tasks.filter(x=>x.dueDate && x.dueDate>=today && x.dueDate<=weekEnd).length,
  }), [tasks, today, weekEnd]);

  const categoryOpts = [
    { value:"", label:"No category" },
    ...categories.map(c=>({ value:c.id, label:`${c.icon} ${c.name}` })),
  ];

  const FilterBtn = ({ active, color="#ff6b9d", onClick, children }) => (
    <motion.button whileTap={{scale:.95}} onClick={onClick} style={{
      padding:"5px 12px", borderRadius:"20px",
      border:`1px solid ${active?color:border}`,
      background:active?`${color}18`:"transparent",
      color:active?color:mutedColor,
      cursor:"pointer", fontSize:"12px", fontWeight:active?600:400,
      fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap",
    }}>{children}</motion.button>
  );

  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"24px 20px",fontFamily:"'DM Sans', sans-serif",color:textColor}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"28px",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <h1 style={{fontSize:"28px",fontWeight:800,margin:0,letterSpacing:"-0.04em"}}>
            My <span style={{background:"linear-gradient(135deg,#ff6b9d,#ff99cc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Tasks</span>
          </h1>
          <p style={{fontSize:"13px",color:mutedColor,margin:"4px 0 0"}}>
            {stats.completed}/{stats.total} completed{stats.overdue>0?` · ⚠️ ${stats.overdue} overdue`:" · All on track ✓"}
          </p>
        </div>
        <motion.button whileHover={{scale:1.04}} whileTap={{scale:.97}} onClick={()=>setShowAddForm(!showAddForm)}
          style={{padding:"10px 20px",borderRadius:"12px",background:"linear-gradient(135deg,#ff6b9d,#ff99cc)",border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,boxShadow:"0 4px 16px rgba(255,107,157,0.35)",fontFamily:"inherit"}}>
          + New Task
        </motion.button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"24px"}}>
        {[
          {label:"Total",  value:stats.total,        color:"#ff6b9d"},
          {label:"Done",   value:stats.completed,    color:"#10b981"},
          {label:"Pending",value:stats.pending,      color:"#f59e0b"},
          {label:"High 🔥",value:stats.highPriority, color:"#f43f5e"},
        ].map(s=>(
          <div key={s.label} style={{padding:"14px 16px",borderRadius:"14px",background:cardBg,backdropFilter:"blur(10px)",border:`1px solid ${border}`}}>
            <div style={{fontSize:"20px",fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:"11px",color:mutedColor,marginTop:"2px"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden",marginBottom:"20px"}}>
            <div style={{padding:"20px",borderRadius:"16px",background:cardBg,backdropFilter:"blur(12px)",border:`1px solid ${border}`}}>
              <h3 style={{margin:"0 0 16px",fontSize:"15px",fontWeight:700,color:textColor}}>New Task</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <input placeholder="Task title *" value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddTask()} autoFocus style={{...inputStyle,fontSize:"15px",fontWeight:500}}/>
                <textarea placeholder="Description (optional)" value={newDesc} onChange={e=>setNewDesc(e.target.value)} rows={2} style={{...inputStyle,resize:"vertical"}}/>
                <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"flex-start"}}>
                  {/* CustomSelect replaces native <select> — no more white dropdown */}
                  <CustomSelect value={newPriority} onChange={setNewPriority} options={PRIORITY_OPTS} style={{minWidth:"140px"}}/>
                  <CustomSelect value={newCategory} onChange={setNewCategory} options={categoryOpts} style={{minWidth:"160px"}}/>
                  <input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} style={inputStyle}/>
                </div>
                <div style={{display:"flex",gap:"8px",justifyContent:"flex-end"}}>
                  <button onClick={()=>setShowAddForm(false)} style={{...inputStyle,cursor:"pointer",padding:"8px 16px"}}>Cancel</button>
                  <motion.button whileTap={{scale:.97}} onClick={handleAddTask} disabled={addingTask}
                    style={{padding:"8px 20px",borderRadius:"10px",background:"linear-gradient(135deg,#ff6b9d,#ff99cc)",border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit"}}>
                    {addingTask?"Adding…":"Add Task"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div style={{position:"relative",marginBottom:"16px"}}>
        <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"14px",color:mutedColor}}>🔍</span>
        <input placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{...inputStyle,width:"100%",paddingLeft:"40px",boxSizing:"border-box",fontSize:"14px"}}/>
        {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:mutedColor,fontSize:"16px"}}>✕</button>}
      </div>

      {/* Filters */}
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"8px"}}>
        <FilterBtn active={fDue==="all"}      onClick={()=>setFDue("all")}>All ({tasks.length})</FilterBtn>
        <FilterBtn active={fDue==="today"}    onClick={()=>setFDue("today")}>📅 Today ({dueCounts.today})</FilterBtn>
        <FilterBtn active={fDue==="overdue"}  color="#f43f5e" onClick={()=>setFDue("overdue")}>⚠️ Overdue ({dueCounts.overdue})</FilterBtn>
        <FilterBtn active={fDue==="thisWeek"} color="#10b981" onClick={()=>setFDue("thisWeek")}>📆 Week ({dueCounts.week})</FilterBtn>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"8px"}}>
        {["all","high","medium","low"].map(p=>(
          <FilterBtn key={p} active={fPriority===p} color={p==="all"?"#ff6b9d":PM[p]?.color} onClick={()=>setFPriority(p)}>
            {p==="all"?"All Priority":`${PM[p]?.dot} ${p.charAt(0).toUpperCase()+p.slice(1)}`}
          </FilterBtn>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"8px"}}>
        <FilterBtn active={fCompleted==="all"}       onClick={()=>setFCompleted("all")}>All</FilterBtn>
        <FilterBtn active={fCompleted==="pending"}   color="#f59e0b" onClick={()=>setFCompleted("pending")}>⏳ Pending</FilterBtn>
        <FilterBtn active={fCompleted==="completed"} color="#10b981" onClick={()=>setFCompleted("completed")}>✅ Completed</FilterBtn>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"20px",paddingBottom:"16px",borderBottom:`1px solid ${border}`}}>
        <FilterBtn active={fCategory==="all"} onClick={()=>setFCategory("all")}>All Categories</FilterBtn>
        {categories.map(c=>(
          <FilterBtn key={c.id} active={fCategory===c.id} color={c.color} onClick={()=>setFCategory(c.id)}>
            {c.icon} {c.name} ({tasks.filter(t=>t.categoryId===c.id).length})
          </FilterBtn>
        ))}
        <motion.button whileTap={{scale:.95}} onClick={()=>setShowCatModal(true)} style={{padding:"5px 12px",borderRadius:"20px",border:"1px dashed rgba(255,107,157,0.4)",background:"transparent",color:"#ff6b9d",cursor:"pointer",fontSize:"12px",fontFamily:"inherit"}}>
          + Category
        </motion.button>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{textAlign:"center",padding:"60px 0",color:mutedColor}}>
          <div style={{fontSize:"32px",marginBottom:"12px",animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</div>
          <p>Loading tasks…</p>
        </div>
      ) : filteredTasks.length===0 ? (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>📭</div>
          <p style={{color:mutedColor,fontSize:"15px"}}>{search?`No results for "${search}"`:"No tasks here. Add one above!"}</p>
        </motion.div>
      ) : (
        <motion.div layout style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <AnimatePresence>
            {filteredTasks.map(task=>(
              <TaskCard key={task.id} task={task} categories={categories} onUpdate={handleUpdate} onDelete={deleteTask} isDark={isDark}/>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Category quick-add modal */}
      <CenteredModal isOpen={showCatModal} onClose={()=>setShowCatModal(false)} title="New Category" maxWidth="360px">
        <div style={{fontFamily:"'DM Sans', sans-serif"}}>
          <input placeholder="Category name" value={catName} onChange={e=>setCatName(e.target.value)}
            style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:"12px"}}/>
          <div style={{display:"flex",gap:"12px",marginBottom:"16px"}}>
            <div style={{flex:1}}>
              <label style={{fontSize:"11px",color:mutedColor,display:"block",marginBottom:"4px",fontWeight:600}}>Icon</label>
              <input value={catIcon} onChange={e=>setCatIcon(e.target.value)} style={{...inputStyle,width:"100%",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:"11px",color:mutedColor,display:"block",marginBottom:"4px",fontWeight:600}}>Colour</label>
              <input type="color" value={catColor} onChange={e=>setCatColor(e.target.value)}
                style={{width:"56px",height:"42px",borderRadius:"10px",border:"none",cursor:"pointer"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>setShowCatModal(false)} style={{flex:1,...inputStyle,cursor:"pointer",textAlign:"center",padding:"10px"}}>Cancel</button>
            <button onClick={handleAddCat} style={{flex:1,padding:"10px",borderRadius:"10px",background:"linear-gradient(135deg,#ff6b9d,#ff99cc)",border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit"}}>
              Create
            </button>
          </div>
        </div>
      </CenteredModal>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
