/**
 * Categories.jsx
 * Synced with Tasks.jsx — uses same TASK_ICONS (SVG), same CAT_COLORS,
 * same useTasks() hook. Categories created here appear identically in Tasks.
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import CenteredModal from "../components/CenteredModal";
import { TASK_ICONS, TASK_ICON_LIST, TaskIconTile } from "../components/PremiumChrome";
import toast from "react-hot-toast";

// Same colors as Tasks.jsx
const CAT_COLORS = [
  "#FF7A59","#FF5A5F","#F5A623","#3DD68C",
  "#49B9FF","#8B5CF6","#EC4899","#14B8A6",
  "#6366F1","#EAB308","#F43F5E","#06B6D4",
];

export default function Categories() {
  const { isDark, accent } = useTheme();
  const { tasks, categories, loading, addCategory, deleteCategory } = useTasks();

  const [showModal,  setShowModal]  = useState(false);
  const [name,       setName]       = useState("");
  const [color,      setColor]      = useState(accent || CAT_COLORS[0]);
  const [icon,       setIcon]       = useState("default");
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy,     setSortBy]     = useState("name");
  const [showIcons,  setShowIcons]  = useState(false);

  const ac = accent || CAT_COLORS[0];

  // Theme-aware colors
  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.9)";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const inputBg    = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";

  const IS = {
    width:"100%", padding:"11px 14px",
    borderRadius:"var(--radius-btn)",
    border:`1px solid ${border}`,
    background:inputBg, color:textColor,
    fontSize:"13px", fontFamily:"inherit",
    outline:"none", boxSizing:"border-box",
  };
  const SL = {
    fontSize:"10px", color:mutedColor, display:"block",
    marginBottom:"6px", fontWeight:700,
    textTransform:"uppercase", letterSpacing:"0.07em",
  };

  const getCatTasks = useCallback((id) => tasks.filter(t => t.categoryId === id), [tasks]);
  const getCatDone  = useCallback((id) => tasks.filter(t => t.categoryId === id && (t.completed || (t.completedDates||[]).includes(new Date().toISOString().split("T")[0]))), [tasks]);
  const getOverdue  = useCallback((id) => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter(t => t.categoryId === id && !t.completed && t.dueDate && t.dueDate < today);
  }, [tasks]);

  const uncategorized = useMemo(() => tasks.filter(t => !t.categoryId), [tasks]);
  const totalDone     = tasks.filter(t => t.completed).length;
  const globalPct     = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  const sortedCategories = useMemo(() => {
    const cats = [...categories];
    if (sortBy === "tasks")    return cats.sort((a,b) => getCatTasks(b.id).length - getCatTasks(a.id).length);
    if (sortBy === "progress") return cats.sort((a,b) => {
      const pa = getCatTasks(a.id).length > 0 ? getCatDone(a.id).length / getCatTasks(a.id).length : 0;
      const pb = getCatTasks(b.id).length > 0 ? getCatDone(b.id).length / getCatTasks(b.id).length : 0;
      return pb - pa;
    });
    return cats.sort((a,b) => (a.name||"").localeCompare(b.name||""));
  }, [categories, sortBy, getCatTasks, getCatDone]);

  const openModal = () => {
    setName(""); setColor(ac); setIcon("default"); setShowIcons(false);
    setShowModal(true);
  };

  const handleAdd = useCallback(async () => {
    if (!name.trim()) { toast.error("Category name is required"); return; }
    const result = await addCategory({ name: name.trim(), color, icon });
    if (result) { setShowModal(false); setName(""); setColor(ac); setIcon("default"); setShowIcons(false); }
  }, [name, color, icon, addCategory, ac]);

  return (
    <div style={{ maxWidth:"960px",margin:"0 auto",padding:"24px 16px",color:textColor }}>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px",flexWrap:"wrap",gap:"12px" }}>
        <div>
          <h1 style={{ fontSize:"clamp(22px,5vw,28px)",fontWeight:800,margin:"0 0 4px",letterSpacing:"-0.04em",fontFamily:"var(--font-heading)",color:"var(--accent)" }}>
            Categories
          </h1>
          <p style={{ fontSize:"12px",color:mutedColor,margin:0 }}>
            {categories.length} categories · {tasks.length} total tasks · {globalPct}% complete
          </p>
        </div>
        <motion.button whileTap={{scale:0.97}} onClick={openModal}
          style={{ padding:"10px 18px",borderRadius:"var(--radius-btn)",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit",boxShadow:`0 4px 16px ${ac}44`,display:"flex",alignItems:"center",gap:"6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Category
        </motion.button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"10px",marginBottom:"20px" }}>
        {[
          { label:"Total Tasks",   value:tasks.length,         color:ac,        icon:"📋" },
          { label:"Completed",     value:totalDone,            color:"#10b981",  icon:"✓"  },
          { label:"Categories",    value:categories.length,    color:"#8b5cf6",  icon:"◈"  },
          { label:"Uncategorized", value:uncategorized.length, color:"#f59e0b",  icon:"?"  },
        ].map(s => (
          <div key={s.label} style={{ padding:"14px 16px",borderRadius:"16px",background:cardBg,border:`1px solid ${border}`,display:"flex",alignItems:"center",gap:"10px" }}>
            <div style={{ width:"36px",height:"36px",borderRadius:"10px",background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:"20px",fontWeight:800,color:s.color,lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"10px",color:mutedColor,marginTop:"2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sort bar */}
      <div style={{ display:"flex",gap:"6px",marginBottom:"16px",alignItems:"center" }}>
        <span style={{ fontSize:"11px",color:mutedColor,fontWeight:600 }}>Sort:</span>
        {[["name","A–Z"],["tasks","Most tasks"],["progress","Progress"]].map(([v,l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            style={{ padding:"5px 12px",borderRadius:"99px",border:`1.5px solid ${sortBy===v?ac:border}`,background:sortBy===v?`${ac}15`:"transparent",color:sortBy===v?ac:mutedColor,cursor:"pointer",fontSize:"11px",fontWeight:sortBy===v?700:400,fontFamily:"inherit",transition:"all 0.13s" }}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"12px" }}>
          {[0,1,2].map(i => <div key={i} style={{ height:"180px",borderRadius:"18px",background:cardBg,opacity:0.5 }}/>)}
        </div>
      ) : categories.length === 0 ? (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          style={{ textAlign:"center",padding:"64px 20px",background:cardBg,borderRadius:"22px",border:`1px solid ${border}` }}>
          <div style={{ fontSize:"52px",marginBottom:"14px" }}>📂</div>
          <h3 style={{ fontSize:"17px",fontWeight:700,margin:"0 0 6px",color:textColor }}>No categories yet</h3>
          <p style={{ fontSize:"13px",color:mutedColor,marginBottom:"20px" }}>Group your tasks into categories to stay organised</p>
          <motion.button whileTap={{scale:0.97}} onClick={openModal}
            style={{ padding:"11px 24px",borderRadius:"var(--radius-btn)",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"inherit" }}>
            Create your first category
          </motion.button>
        </motion.div>
      ) : (
        <motion.div layout style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"12px" }}>
          <AnimatePresence>
            {sortedCategories.map((cat, i) => {
              const catTasks = getCatTasks(cat.id);
              const catDone  = getCatDone(cat.id);
              const overdue  = getOverdue(cat.id);
              const total = catTasks.length, done = catDone.length;
              const pct = total > 0 ? Math.round((done/total)*100) : 0;
              const isExpanded = expandedId === cat.id;

              return (
                <motion.div key={cat.id} layout
                  initial={{opacity:0,scale:0.95,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9}}
                  transition={{delay:i*0.04}} whileHover={{y:-2}}
                  style={{ background:cardBg,borderRadius:"20px",border:`1px solid ${border}`,borderTop:`3px solid ${cat.color||ac}`,overflow:"hidden" }}>

                  <div style={{ padding:"18px 18px 14px" }}>
                    {/* Card header */}
                    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px" }}>
                      {/* Icon tile — same as Tasks.jsx */}
                      <div style={{ flexShrink:0 }}>
                        <TaskIconTile iconKey={cat.icon||"default"} color={cat.color||ac} size={44}/>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <h3 style={{ fontSize:"15px",fontWeight:700,margin:"0 0 3px",color:textColor,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{cat.name}</h3>
                        <div style={{ display:"flex",gap:"8px",alignItems:"center" }}>
                          <span style={{ fontSize:"11px",color:mutedColor }}>{total} task{total!==1?"s":""}</span>
                          {overdue.length > 0 && <span style={{ fontSize:"10px",color:"#f43f5e",fontWeight:600 }}>⚠ {overdue.length} overdue</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right",flexShrink:0 }}>
                        <div style={{ fontSize:"18px",fontWeight:800,color:cat.color||ac }}>{pct}%</div>
                        <div style={{ fontSize:"9px",color:mutedColor }}>done</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height:"5px",background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",borderRadius:"3px",overflow:"hidden",marginBottom:"12px" }}>
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.7,delay:i*0.05}}
                        style={{ height:"100%",background:`linear-gradient(90deg,${cat.color||ac},${cat.color||ac}99)`,borderRadius:"3px" }}/>
                    </div>

                    {/* Stats row */}
                    <div style={{ display:"flex",gap:"8px",marginBottom:"14px" }}>
                      {[
                        { label:"Done",    value:done,          color:"#10b981" },
                        { label:"Left",    value:total-done,    color:ac        },
                        { label:"Overdue", value:overdue.length,color:"#f43f5e" },
                      ].map(s => (
                        <div key={s.label} style={{ flex:1,padding:"8px",borderRadius:"10px",background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",textAlign:"center",border:`1px solid ${s.value>0&&s.label==="Overdue"?"rgba(244,63,94,0.2)":border}` }}>
                          <div style={{ fontSize:"15px",fontWeight:800,color:s.value>0?s.color:mutedColor }}>{s.value}</div>
                          <div style={{ fontSize:"9px",color:mutedColor }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Expand */}
                    {total > 0 && (
                      <button onClick={() => setExpandedId(isExpanded?null:cat.id)}
                        style={{ width:"100%",padding:"7px",borderRadius:"var(--radius-btn)",background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",border:`1px solid ${border}`,color:mutedColor,cursor:"pointer",fontSize:"11px",fontFamily:"inherit",marginBottom:"8px" }}>
                        {isExpanded ? "▲ Hide tasks" : `▼ Show ${total} tasks`}
                      </button>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
                          <div style={{ maxHeight:"200px",overflowY:"auto",marginBottom:"8px" }}>
                            {catTasks.map(t => (
                              <div key={t.id} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"7px 8px",borderRadius:"8px",marginBottom:"4px",background:isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)" }}>
                                <div style={{ width:"14px",height:"14px",borderRadius:"4px",border:`2px solid ${t.completed?"#10b981":isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.2)"}`,background:t.completed?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                  {t.completed && <span style={{ color:"white",fontSize:"8px" }}>✓</span>}
                                </div>
                                <span style={{ fontSize:"12px",color:textColor,textDecoration:t.completed?"line-through":"none",opacity:t.completed?0.5:1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</span>
                                {t.dueDate && <span style={{ fontSize:"10px",color:mutedColor }}>{t.dueDate}</span>}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Delete */}
                    <motion.button whileTap={{scale:0.96}} onClick={() => deleteCategory(cat.id)}
                      style={{ width:"100%",padding:"8px",borderRadius:"var(--radius-btn)",background:"rgba(244,63,94,0.06)",border:"1px solid rgba(244,63,94,0.14)",color:"#f43f5e",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"inherit" }}>
                      Delete category
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <div style={{ marginTop:"20px" }}>
          <div style={{ fontSize:"11px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px" }}>
            Uncategorized · {uncategorized.length}
          </div>
          <div style={{ background:cardBg,borderRadius:"16px",border:`1px solid ${border}`,overflow:"hidden" }}>
            {uncategorized.slice(0,5).map((t,i) => (
              <div key={t.id} style={{ display:"flex",alignItems:"center",gap:"10px",padding:"12px 16px",borderBottom:i<Math.min(uncategorized.length,5)-1?`1px solid ${border}`:"none" }}>
                <div style={{ width:"16px",height:"16px",borderRadius:"5px",border:`2px solid ${t.completed?"#10b981":isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.18)"}`,background:t.completed?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  {t.completed && <span style={{ color:"white",fontSize:"9px" }}>✓</span>}
                </div>
                <span style={{ fontSize:"13px",color:textColor,opacity:t.completed?0.5:1,textDecoration:t.completed?"line-through":"none",flex:1 }}>{t.title}</span>
                <span style={{ fontSize:"10px",padding:"2px 7px",borderRadius:"4px",background:`${t.priority==="high"?"rgba(244,63,94,0.12)":t.priority==="medium"?"rgba(245,158,11,0.12)":"rgba(16,185,129,0.12)"}`,color:t.priority==="high"?"#f43f5e":t.priority==="medium"?"#f59e0b":"#10b981" }}>
                  {t.priority}
                </span>
              </div>
            ))}
            {uncategorized.length > 5 && (
              <div style={{ padding:"10px 16px",fontSize:"12px",color:mutedColor,textAlign:"center" }}>+{uncategorized.length-5} more</div>
            )}
          </div>
        </div>
      )}

      {/* New category modal — IDENTICAL form to Tasks.jsx */}
      <CenteredModal isOpen={showModal} onClose={() => { setShowModal(false); setShowIcons(false); }} title="New Category" maxWidth="440px">
        <div style={{ display:"grid",gap:"14px" }}>

          {/* Name */}
          <div>
            <label style={SL}>Category name</label>
            <input
              autoFocus
              placeholder="e.g. Work, Health, Personal"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              style={IS}
            />
          </div>

          {/* Icon picker — same SVG icons as Tasks.jsx */}
          <div>
            <label style={SL}>Icon</label>
            <button type="button" onClick={() => setShowIcons(v => !v)}
              style={{ width:"100%",padding:"8px 11px",borderRadius:"var(--radius-btn)",display:"flex",alignItems:"center",gap:"8px",color:"var(--text-primary)",fontWeight:600,fontSize:"12px",background:"var(--glass-highlight),var(--surface-raised)",border:"1px solid var(--border)",cursor:"pointer" }}>
              <div style={{ width:"18px",height:"18px",color }}>{TASK_ICONS[icon]?.(color)}</div>
              {showIcons ? "Collapse" : "Pick icon"}
            </button>
            {showIcons && (
              <div style={{ display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"8px" }}>
                {TASK_ICON_LIST.map(key => (
                  <button key={key} type="button" onClick={() => { setIcon(key); setShowIcons(false); }}
                    style={{ width:"36px",height:"36px",borderRadius:"var(--radius-btn)",padding:"7px",background:key===icon?`${color}20`:"var(--surface-elevated)",border:`1.5px solid ${key===icon?color:"var(--border)"}`,cursor:"pointer" }}>
                    <div style={{ width:"100%",height:"100%",color }}>{TASK_ICONS[key]?.(color)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color swatches — same as Tasks.jsx */}
          <div>
            <label style={SL}>Color</label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center" }}>
              {CAT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width:"28px",height:"28px",borderRadius:"50%",background:c,cursor:"pointer",border:"none",boxShadow:color===c?`0 0 0 2px var(--bg),0 0 0 4px ${c}`:"none",transition:"box-shadow 130ms" }}/>
              ))}
              <label style={{ width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",overflow:"hidden",background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",position:"relative" }}>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ position:"absolute",opacity:0,width:"100%",height:"100%",cursor:"pointer" }}/>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div style={{ background:"var(--surface)",borderRadius:"var(--radius-btn)",padding:"12px 14px",border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"12px" }}>
            <TaskIconTile iconKey={icon} color={color} size={40}/>
            <div>
              <div style={{ fontSize:"14px",fontWeight:700,color:"var(--text-primary)" }}>{name||"Category name"}</div>
              <div style={{ fontSize:"11px",color,fontWeight:600,marginTop:"1px" }}>0 tasks</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display:"flex",gap:"8px" }}>
            <button type="button" onClick={() => { setShowModal(false); setShowIcons(false); }} className="btn-secondary"
              style={{ flex:1,fontSize:"13px" }}>Cancel</button>
            <motion.button whileTap={{scale:0.97}} type="button" onClick={handleAdd} className="btn-primary"
              style={{ flex:2,height:"44px",fontSize:"13px" }}>
              Create category
            </motion.button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}