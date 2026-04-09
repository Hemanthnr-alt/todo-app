import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import CustomSelect  from "../components/CustomSelect";
import CenteredModal from "../components/CenteredModal";
import api   from "../services/api";
import toast from "react-hot-toast";

const todayStr    = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const tomorrowStr = () => { const d=new Date(); d.setDate(d.getDate()+1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const weekEndStr  = () => { const d=new Date(); d.setDate(d.getDate()+7); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

const PM = {
  high:   { color:"var(--danger)", bg:"var(--danger-subtle)",  label:"High",   dot:"🔴" },
  medium: { color:"var(--warning)", bg:"var(--warning-subtle)", label:"Medium", dot:"🟡" },
  low:    { color:"var(--success)", bg:"var(--success-subtle)", label:"Low",    dot:"🟢" },
};
const PRIORITY_OPTS = [
  { value:"high", label:"🔴 High" },{ value:"medium", label:"🟡 Medium" },{ value:"low", label:"🟢 Low" },
];

function formatDue(d) {
  if (!d) return null;
  if (d===todayStr()) return "Today";
  if (d===tomorrowStr()) return "Tomorrow";
  const [y,mo,day]=d.split("-").map(Number);
  return new Date(y,mo-1,day).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function fileIcon(m){if(m?.startsWith("image/"))return"🖼️";if(m==="application/pdf")return"📄";if(m?.includes("word"))return"📝";if(m?.includes("sheet")||m?.includes("excel"))return"📊";if(m==="text/plain")return"📃";if(m?.includes("zip"))return"📦";return"📎";}
function fmtSize(b){if(b<1024)return b+" B";if(b<1048576)return(b/1024).toFixed(1)+" KB";return(b/1048576).toFixed(1)+" MB";}

function EmptyIllustration({ color="#55546B" }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect x="10" y="6" width="52" height="60" rx="8" fill={color} fillOpacity="0.07" stroke={color} strokeOpacity="0.25" strokeWidth="1.5"/>
      <path d="M20 24h32M20 36h24M20 48h16" stroke={color} strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="54" cy="52" r="13" fill="#09090F" stroke={color} strokeOpacity="0.2" strokeWidth="1.5"/>
      <path d="M49 52l3 3 6-6" stroke={color} strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SubTasks({ task, onUpdate, isDark, textColor, mutedColor, border, inputBg }) {
  const [text, setText] = useState("");
  const sub = task.subtasks || [];
  const add = async () => { if(!text.trim()) return; await onUpdate(task.id,{subtasks:[...sub,{id:Date.now(),title:text.trim(),done:false}]}); setText(""); };
  return (
    <div style={{marginTop:"8px"}}>
      {sub.map(s=>(
        <div key={s.id} style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"3px"}}>
          <input type="checkbox" checked={s.done} onChange={()=>onUpdate(task.id,{subtasks:sub.map(x=>x.id===s.id?{...x,done:!x.done}:x)})} style={{cursor:"pointer",accentColor:"var(--accent)"}}/>
          <span style={{fontSize:"12px",textDecoration:s.done?"line-through":"none",opacity:s.done?.5:1,flex:1,color:textColor}}>{s.title}</span>
          <button onClick={()=>onUpdate(task.id,{subtasks:sub.filter(x=>x.id!==s.id)})} style={{background:"none",border:"none",cursor:"pointer",color:"var(--danger)",fontSize:"11px"}}>✕</button>
        </div>
      ))}
      <div style={{display:"flex",gap:"5px",marginTop:"5px"}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Add subtask…"
          style={{flex:1,padding:"4px 9px",borderRadius:"6px",border:`1px solid ${border}`,background:inputBg,color:textColor,fontSize:"12px",fontFamily:"inherit",outline:"none"}}/>
        <button onClick={add} style={{padding:"4px 9px",borderRadius:"6px",background:"var(--accent-subtle)",border:"1px solid var(--accent)",color:"var(--accent)",cursor:"pointer",fontSize:"12px"}}>+</button>
      </div>
    </div>
  );
}

function TaskCard({ task, categories, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const fileRef = useRef();

  const textColor  = "var(--text-primary)";
  const mutedColor = "var(--text-muted)";
  const border     = "var(--border)";
  const inputBg    = "var(--bg)";
  const dateInput  = { padding:"5px 8px",borderRadius:"8px",border:`1px solid var(--border)`,background:inputBg,color:textColor,fontSize:"12px",fontFamily:"inherit",outline:"none" };
  const pm = PM[task.priority]||PM.medium;
  const cat = categories.find(c=>c.id===task.categoryId);
  const today = todayStr();
  const overdue = task.dueDate && task.dueDate < today && !task.completed;
  const dueFmt = formatDue(task.dueDate);
  const subCount = task.subtasks?.length||0;
  const subDone  = task.subtasks?.filter(s=>s.done).length||0;
  const cardBg = overdue ? "var(--danger-subtle)" : "var(--surface)";
  const barColor = task.completed ? "var(--accent-subtle)" : pm.color;

  const handleComplete = () => {
    if (!task.completed) { setBouncing(true); setTimeout(()=>setBouncing(false),500); }
    onUpdate(task.id,{completed:!task.completed});
  };
  const handleUpload = async e => {
    const file=e.target.files?.[0]; if(!file)return;
    setUploading(true);
    try { const fd=new FormData(); fd.append("file",file); const res=await api.post(`/tasks/${task.id}/upload`,fd); onUpdate(task.id,{attachments:[...(task.attachments||[]),res.data.attachment]},true); toast.success("File attached!"); }
    catch { toast.error("Upload failed"); } finally { setUploading(false); e.target.value=""; }
  };
  const delAtt = async attId => {
    try { await api.delete(`/tasks/${task.id}/attachments/${attId}`); onUpdate(task.id,{attachments:(task.attachments||[]).filter(a=>a.id!==attId)},true); }
    catch { toast.error("Failed"); }
  };

  return (
    <motion.div layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6,scale:.97}}
      style={{background:cardBg,borderRadius:"14px",
        border:overdue?`1px solid var(--border-danger)`:"none",
        borderLeft:`3px solid ${barColor}`,
        overflow:"hidden",transition:"border-left-color 0.4s ease"}}>
      <div style={{padding:"16px",display:"flex",alignItems:"flex-start",gap:"12px"}}>
        <motion.div onClick={handleComplete}
          animate={bouncing?{scale:[1,1.3,0.92,1]}:{scale:1}}
          transition={{type:"spring",stiffness:400,damping:15}}
          style={{width:"20px",height:"20px",borderRadius:"6px",flexShrink:0,marginTop:"2px",border:`2px solid ${task.completed?"var(--success)":"var(--border-strong)"}`,background:task.completed?"var(--success)":"transparent",boxShadow:task.completed?"0 0 8px var(--success-glow)":"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
          {task.completed && <span style={{color:"white",fontSize:"10px",fontWeight:700}}>✓</span>}
        </motion.div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap",marginBottom:"4px"}}>
            <span style={{fontSize:"15px",fontWeight:600,fontFamily:"var(--font-heading)",color:task.completed?"var(--text-muted)":"var(--text-primary)",textDecoration:task.completed?"line-through":"none"}}>{task.title}</span>
            <span style={{fontSize:"11px",fontWeight:600,padding:"2px 8px",borderRadius:"20px",background:pm.bg,color:pm.color,flexShrink:0}}>{pm.dot} {pm.label}</span>
            {cat&&<span style={{fontSize:"11px",fontWeight:600,padding:"2px 8px",borderRadius:"20px",background:`${cat.color}18`,color:cat.color,flexShrink:0}}>{cat.icon} {cat.name}</span>}
            {dueFmt&&<span style={{fontSize:"11px",fontWeight:500,padding:"2px 8px",borderRadius:"20px",background:overdue?"var(--danger-subtle)":"var(--accent-subtle)",color:overdue?"var(--danger)":"var(--accent)",flexShrink:0}}>📅 {dueFmt}{overdue?" · Overdue":""}</span>}
            {subCount>0&&<span style={{fontSize:"11px",color:mutedColor}}>{subDone}/{subCount}</span>}
            {task.attachments?.length>0&&<span style={{fontSize:"11px",color:mutedColor}}>📎{task.attachments.length}</span>}
          </div>
          {task.description&&<p style={{fontSize:"14px",color:mutedColor,margin:"3px 0 0",lineHeight:1.6}}>{task.description}</p>}
          {subCount>0&&(
            <div style={{marginTop:"7px",height:"3px",background:"var(--surface-raised)",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:"2px",width:`${(subDone/subCount)*100}%`,background:"var(--success)",transition:"width 0.3s"}}/>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:"5px",flexShrink:0}}>
          <motion.button whileTap={{scale:.9}} onClick={()=>setExpanded(!expanded)}
            style={{width:"28px",height:"28px",borderRadius:"8px",background:expanded?"var(--accent-subtle)":"var(--surface-raised)",border:"none",cursor:"pointer",fontSize:"11px",color:expanded?"var(--accent)":mutedColor,display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            {expanded?"▲":"▼"}
          </motion.button>
          <motion.button whileTap={{scale:.9}} onClick={()=>onDelete(task.id)}
            style={{width:"28px",height:"28px",borderRadius:"8px",background:"rgba(255,69,58,0.1)",border:"none",cursor:"pointer",fontSize:"12px",color:"var(--danger)",display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            ✕
          </motion.button>
        </div>
      </div>
      <AnimatePresence>
        {expanded&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
            <div style={{padding:"0 16px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:"12px"}}>
              <div style={{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:"10px"}}>
                <div style={{display:"flex",flexDirection:"column",gap:"2px"}}><label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Priority</label><CustomSelect value={task.priority} onChange={v=>onUpdate(task.id,{priority:v})} options={PRIORITY_OPTS} style={{fontSize:"12px",padding:"4px 8px",borderRadius:"7px"}}/></div>
                <div style={{display:"flex",flexDirection:"column",gap:"2px"}}><label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Due Date</label><input type="date" value={task.dueDate||""} onChange={e=>onUpdate(task.id,{dueDate:e.target.value||null})} style={dateInput}/></div>
                <div style={{display:"flex",flexDirection:"column",gap:"2px"}}><label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Start Time</label><input type="time" value={task.startTime||""} onChange={e=>onUpdate(task.id,{startTime:e.target.value||null})} style={dateInput}/></div>
                <div style={{display:"flex",flexDirection:"column",gap:"2px"}}><label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Category</label>
                  <select value={task.categoryId||""} onChange={e=>onUpdate(task.id,{categoryId:e.target.value||null})} style={{...dateInput,minWidth:"120px",cursor:"pointer"}}>
                    <option value="">No category</option>{categories.map(c=>(<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:"10px"}}><label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Subtasks</label><SubTasks task={task} onUpdate={onUpdate} isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} inputBg={inputBg}/></div>
              <div><label style={{fontSize:"9px",color:mutedColor,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Attachments</label>
                {task.attachments?.length>0&&(<div style={{marginTop:"5px",display:"flex",flexDirection:"column",gap:"3px"}}>{task.attachments.map(att=>(<div key={att.id} style={{display:"flex",alignItems:"center",gap:"7px",padding:"5px 9px",borderRadius:"7px",background:"rgba(255,255,255,0.04)"}}><span>{fileIcon(att.mimeType)}</span><a href={att.url} target="_blank" rel="noreferrer" style={{flex:1,fontSize:"11px",color:"#7C5CFC",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{att.originalName}</a><span style={{fontSize:"10px",color:mutedColor}}>{fmtSize(att.size)}</span><button onClick={()=>delAtt(att.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#F05050",fontSize:"10px"}}>✕</button></div>))}</div>)}
                <input ref={fileRef} type="file" style={{display:"none"}} onChange={handleUpload}/>
                <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{marginTop:"6px",padding:"4px 10px",borderRadius:"7px",background:"rgba(124,92,252,0.08)",border:"1px dashed rgba(124,92,252,0.4)",color:"#7C5CFC",cursor:"pointer",fontSize:"11px",fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>{uploading?"Uploading…":"📎 Attach file"}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Tasks() {
  const { tasks, categories, loading, stats, addTask, updateTask, deleteTask, setTasks, addCategory } = useTasks();
  const [newTitle,setNewTitle]=useState(""); const [newPriority,setNewPriority]=useState("medium"); const [newCategory,setNewCategory]=useState(""); const [newDueDate,setNewDueDate]=useState(""); const [newDesc,setNewDesc]=useState("");
  const [search,setSearch]=useState(""); const [activeFilter,setActiveFilter]=useState("all");
  const [showAddForm,setShowAddForm]=useState(false); const [showCatModal,setShowCatModal]=useState(false);
  const [catName,setCatName]=useState(""); const [catColor,setCatColor]=useState("#6B46FF"); const [catIcon,setCatIcon]=useState("📁"); const [addingTask,setAddingTask]=useState(false);

  const textColor  = "var(--text-primary)";
  const mutedColor = "var(--text-muted)";
  const cardBg     = "var(--surface)";
  const inputBg    = "var(--bg)";
  const inputStyle = { padding:"10px 13px",borderRadius:"10px",border:"1px solid var(--border)",background:inputBg,color:textColor,fontSize:"13px",fontFamily:"inherit",outline:"none" };

  const today=todayStr(), weekEnd=weekEndStr();
  const dueCounts=useMemo(()=>({today:tasks.filter(x=>x.dueDate===today).length,overdue:tasks.filter(x=>x.dueDate&&x.dueDate<today&&!x.completed).length,week:tasks.filter(x=>x.dueDate&&x.dueDate>=today&&x.dueDate<=weekEnd).length}),[tasks,today,weekEnd]);

  const PILLS=[
    {id:"all",label:`All (${tasks.length})`,color:"var(--accent)"},
    {id:"today",label:`Today (${dueCounts.today})`,color:"var(--accent)"},
    {id:"overdue",label:`⚠ ${dueCounts.overdue} Overdue`,color:"var(--danger)"},
    {id:"week",label:"This Week",color:"var(--success)"},
    {id:"high",label:"High",color:"var(--danger)"},{id:"medium",label:"Medium",color:"var(--warning)"},{id:"low",label:"Low",color:"var(--success)"},
    {id:"pending",label:"Pending",color:"var(--warning)"},{id:"done",label:"Done",color:"var(--success)"},
    ...categories.slice(0,4).map(c=>({id:`cat_${c.id}`,label:`${c.icon} ${c.name}`,color:c.color})),
  ];

  const filteredTasks=useMemo(()=>tasks.filter(t=>{
    if(search&&!t.title.toLowerCase().includes(search.toLowerCase()))return false;
    switch(activeFilter){
      case"today":return t.dueDate===today;
      case"overdue":return t.dueDate&&t.dueDate<today&&!t.completed;
      case"week":return t.dueDate&&t.dueDate>=today&&t.dueDate<=weekEnd;
      case"high":return t.priority==="high";
      case"medium":return t.priority==="medium";
      case"low":return t.priority==="low";
      case"pending":return!t.completed;
      case"done":return t.completed;
      default:if(activeFilter.startsWith("cat_"))return t.categoryId===activeFilter.replace("cat_","");return true;
    }
  }),[tasks,search,activeFilter,today,weekEnd]);

  const handleAddTask=async()=>{if(!newTitle.trim()){toast.error("Task title is required");return;}setAddingTask(true);await addTask({title:newTitle.trim(),description:newDesc,priority:newPriority,categoryId:newCategory||null,dueDate:newDueDate||null});setNewTitle("");setNewDesc("");setNewDueDate("");setNewCategory("");setNewPriority("medium");setShowAddForm(false);setAddingTask(false);};
  const handleUpdate=(id,updates,localOnly=false)=>{if(localOnly)setTasks(prev=>prev.map(t=>t.id===id?{...t,...updates}:t));else updateTask(id,updates);};
  const handleAddCat=async()=>{if(!catName.trim())return;await addCategory({name:catName.trim(),color:catColor,icon:catIcon});setCatName("");setCatColor(ac);setCatIcon("📁");setShowCatModal(false);};
  const categoryOpts=[{value:"",label:"No category"},...categories.map(c=>({value:c.id,label:`${c.icon} ${c.name}`}))];

  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"24px 16px",fontFamily:"var(--font-body)",color:textColor}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px",flexWrap:"wrap",gap:"10px"}}>
        <div>
          <h1 style={{fontSize:"28px",fontWeight:700,margin:0,letterSpacing:"-0.03em",fontFamily:"var(--font-heading)",color:"var(--text-primary)"}}>Tasks</h1>
          <p style={{fontSize:"13px",color:mutedColor,margin:"3px 0 0"}}>{stats.completed}/{stats.total} completed{stats.overdue>0?` · ⚠ ${stats.overdue} overdue`:" · All on track ✓"}</p>
        </div>
        <motion.button whileTap={{scale:.97}} onClick={()=>setShowAddForm(!showAddForm)}
          style={{height:"48px",padding:"0 22px",borderRadius:"14px",background:"var(--accent)",border:"none",color:"white",cursor:"pointer",fontSize:"15px",fontWeight:600,boxShadow:"0 4px 18px var(--accent-glow)",fontFamily:"inherit",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
          + New Task
        </motion.button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"20px"}}>
        {[{label:"Total",value:stats.total,color:"var(--accent)",icon:"📋"},{label:"Done",value:stats.completed,color:"var(--success)",icon:"✅"},{label:"Pending",value:stats.pending,color:"var(--warning)",icon:"⏳"},{label:"High 🔥",value:stats.highPriority,color:"var(--danger)",icon:"🔥"}].map(s=>(
          <div key={s.label} style={{padding:"14px",borderRadius:"12px",background:"var(--surface)",border:"none",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:"12px",left:"12px",fontSize:"20px",opacity:0.55}}>{s.icon}</div>
            <div style={{fontSize:"24px",fontWeight:700,color:s.color,marginTop:"28px",fontFamily:"var(--font-heading)"}}>{s.value}</div>
            <div style={{fontSize:"11px",color:mutedColor,marginTop:"4px",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add task form */}
      <AnimatePresence>
        {showAddForm&&(<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden",marginBottom:"18px"}}><div style={{padding:"18px",borderRadius:"12px",background:cardBg,border:"1px solid var(--border)"}}><h3 style={{margin:"0 0 14px",fontSize:"15px",fontWeight:600,fontFamily:"var(--font-heading)",color:textColor}}>New Task</h3><div style={{display:"flex",flexDirection:"column",gap:"9px"}}><input placeholder="Task title *" value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddTask()} autoFocus style={{...inputStyle,fontSize:"15px",fontWeight:500}}/><textarea placeholder="Description (optional)" value={newDesc} onChange={e=>setNewDesc(e.target.value)} rows={2} style={{...inputStyle,resize:"vertical"}}/><div style={{display:"flex",gap:"9px",flexWrap:"wrap",alignItems:"flex-start"}}><CustomSelect value={newPriority} onChange={setNewPriority} options={PRIORITY_OPTS} style={{minWidth:"130px"}}/><CustomSelect value={newCategory} onChange={setNewCategory} options={categoryOpts} style={{minWidth:"150px"}}/><input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} style={inputStyle}/></div><div style={{display:"flex",gap:"7px",justifyContent:"flex-end"}}><button onClick={()=>setShowAddForm(false)} style={{...inputStyle,cursor:"pointer",padding:"8px 14px"}}>Cancel</button><motion.button className="btn-primary" whileTap={{scale:.97}} onClick={handleAddTask} disabled={addingTask} style={{padding:"8px 20px",borderRadius:"10px",height:"auto",boxShadow:"none",fontSize:"13px"}}>{addingTask?"Adding…":"Add Task"}</motion.button></div></div></div></motion.div>)}
      </AnimatePresence>

      {/* Search */}
      <div style={{position:"relative",marginBottom:"12px"}}>
        <span style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",fontSize:"13px",color:mutedColor}}>🔍</span>
        <input placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inputStyle,width:"100%",paddingLeft:"38px",boxSizing:"border-box",fontSize:"14px"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:"11px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:mutedColor,fontSize:"15px"}}>✕</button>}
      </div>

      {/* Unified scrollable pill filters */}
      <div style={{overflowX:"auto",marginBottom:"16px"}} className="hide-scrollbar">
        <div style={{display:"flex",gap:"6px",width:"max-content",paddingBottom:"2px"}}>
          {PILLS.map(f=>{
            const on=activeFilter===f.id;
            return(<button key={f.id} onClick={()=>setActiveFilter(f.id)} className={`pill-filter ${on ? "active" : ""}`}>{f.label}</button>);
          })}
          <button onClick={()=>setShowCatModal(true)} style={{padding:"5px 13px",borderRadius:"8px",border:"1px dashed var(--accent-glow)",background:"transparent",color:"var(--accent)",cursor:"pointer",fontSize:"13px",fontFamily:"inherit",whiteSpace:"nowrap"}}>+ Category</button>
        </div>
      </div>

      {/* Task list */}
      {loading?(<div style={{textAlign:"center",padding:"60px 0",color:mutedColor}}><div style={{fontSize:"28px",marginBottom:"10px",animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</div><p style={{fontSize:"14px"}}>Loading tasks…</p></div>)
      :filteredTasks.length===0?(<motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign:"center",padding:"60px 0"}}><div style={{display:"flex",justifyContent:"center",marginBottom:"16px"}}><EmptyIllustration color={mutedColor}/></div><p style={{color:mutedColor,fontSize:"15px",fontWeight:500,margin:"0 0 6px"}}>{search?`No results for "${search}"`:"No tasks here yet"}</p><p style={{color:mutedColor,fontSize:"13px",opacity:0.6,margin:0}}>{search?"Try a different search":"Tap + New Task to add one"}</p></motion.div>)
      :(<motion.div layout style={{display:"flex",flexDirection:"column",gap:"8px"}}><AnimatePresence>{filteredTasks.map(task=>(<TaskCard key={task.id} task={task} categories={categories} onUpdate={handleUpdate} onDelete={deleteTask} />))}</AnimatePresence></motion.div>)}

      {/* Category modal */}
      <CenteredModal isOpen={showCatModal} onClose={()=>setShowCatModal(false)} title="New Category" maxWidth="360px">
        <div style={{fontFamily:"'Inter',sans-serif"}}>
          <input placeholder="Category name" value={catName} onChange={e=>setCatName(e.target.value)} style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:"11px"}}/>
          <div style={{display:"flex",gap:"10px",marginBottom:"14px"}}>
            <div style={{flex:1}}><label style={{fontSize:"11px",color:mutedColor,display:"block",marginBottom:"4px",fontWeight:600}}>Icon</label><input value={catIcon} onChange={e=>setCatIcon(e.target.value)} style={{...inputStyle,width:"100%",boxSizing:"border-box"}}/></div>
            <div><label style={{fontSize:"11px",color:mutedColor,display:"block",marginBottom:"4px",fontWeight:600}}>Colour</label><input type="color" value={catColor} onChange={e=>setCatColor(e.target.value)} style={{width:"54px",height:"42px",borderRadius:"10px",border:"none",cursor:"pointer"}}/></div>
          </div>
          <div style={{display:"flex",gap:"7px"}}>
            <button onClick={()=>setShowCatModal(false)} style={{flex:1,...inputStyle,cursor:"pointer",textAlign:"center",padding:"10px"}}>Cancel</button>
            <button onClick={handleAddCat} style={{flex:1,padding:"10px",borderRadius:"10px",background:"var(--accent)",border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"inherit",boxShadow:"0 4px 14px var(--accent-glow)"}}>Create</button>
          </div>
        </div>
      </CenteredModal>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}