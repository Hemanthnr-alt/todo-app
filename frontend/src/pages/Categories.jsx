import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import CenteredModal from "../components/CenteredModal";
import toast from "react-hot-toast";

const ICON_OPTIONS = [
  "📁","💼","🏠","💪","📚","🎨","🎵","🏃","🍔","🎮",
  "✈️","💡","❤️","⭐","🔥","🧠","🌱","🎯","💻","🛒",
  "📷","🎬","🏋️","🧘","🌍","💰","🎁","🔬","🏆","📝",
];

const COLOR_OPTIONS = [
  "#ff6b9d","#f43f5e","#f59e0b","#10b981",
  "#3b82f6","#8b5cf6","#06b6d4","#ec4899",
  "#84cc16","#f97316",
];

export default function Categories() {
  const { isDark, accent } = useTheme();
  const { tasks, categories, loading, addCategory, deleteCategory } = useTasks();
  const [showModal,   setShowModal]   = useState(false);
  const [name,        setName]        = useState("");
  const [color,       setColor]       = useState(accent || "#ff6b9d");
  const [icon,        setIcon]        = useState("📁");
  const [expandedId,  setExpandedId]  = useState(null);
  const [sortBy,      setSortBy]      = useState("name"); // name | tasks | progress

  const ac = accent || "#ff6b9d";

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.9)";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const inputBg    = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const iconBtnBg  = isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9";

  const inputStyle = { width:"100%", padding:"11px 14px", borderRadius:"10px", border:`1px solid ${border}`, background:inputBg, color:textColor, fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

  const getCatTasks   = useCallback((id) => tasks.filter(t => t.categoryId === id), [tasks]);
  const getCatDone    = useCallback((id) => tasks.filter(t => t.categoryId === id && t.completed), [tasks]);
  const getOverdue    = useCallback((id) => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter(t => t.categoryId === id && !t.completed && t.dueDate && t.dueDate < today);
  }, [tasks]);

  const uncategorized = useMemo(() => tasks.filter(t => !t.categoryId), [tasks]);
  const totalDone = tasks.filter(t => t.completed).length;
  const globalPct = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  const sortedCategories = useMemo(() => {
    const cats = [...categories];
    if (sortBy === "tasks")    return cats.sort((a,b) => getCatTasks(b.id).length - getCatTasks(a.id).length);
    if (sortBy === "progress") {
      return cats.sort((a,b) => {
        const pa = getCatTasks(a.id).length > 0 ? getCatDone(a.id).length / getCatTasks(a.id).length : 0;
        const pb = getCatTasks(b.id).length > 0 ? getCatDone(b.id).length / getCatTasks(b.id).length : 0;
        return pb - pa;
      });
    }
    return cats.sort((a,b) => a.name.localeCompare(b.name));
  }, [categories, sortBy, getCatTasks, getCatDone]);

  const handleAdd = useCallback(async () => {
    if (!name.trim()) { toast.error("Category name is required"); return; }
    const result = await addCategory({ name: name.trim(), color, icon });
    if (result) { setShowModal(false); setName(""); setColor(ac); setIcon("📁"); }
  }, [name, color, icon, addCategory, ac]);

  return (
    <div style={{ maxWidth:"960px", margin:"0 auto", padding:"24px 16px", fontFamily:"'DM Sans',sans-serif", color:textColor }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h1 style={{ fontSize:"clamp(22px,5vw,28px)", fontWeight:800, margin:"0 0 4px", letterSpacing:"-0.04em" }}>
            <span style={{ background:`linear-gradient(135deg,${ac},${ac}aa)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Categories</span>
          </h1>
          <p style={{ fontSize:"12px", color:mutedColor, margin:0 }}>
            {categories.length} categories · {tasks.length} total tasks · {globalPct}% complete
          </p>
        </div>
        <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}} onClick={() => { setColor(ac); setShowModal(true); }}
          style={{ padding:"10px 18px", borderRadius:"12px", background:`linear-gradient(135deg,${ac},${ac}cc)`, border:"none", color:"white", cursor:"pointer", fontSize:"13px", fontWeight:700, fontFamily:"inherit", boxShadow:`0 4px 16px ${ac}44`, display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ fontSize:"18px" }}>+</span> New Category
        </motion.button>
      </div>

      {/* Stats overview */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"10px", marginBottom:"20px" }}>
        {[
          { label:"Total Tasks",   value:tasks.length,        color:ac,        icon:"📋" },
          { label:"Completed",     value:totalDone,           color:"#10b981",  icon:"✓"  },
          { label:"Categories",    value:categories.length,   color:"#8b5cf6",  icon:"◈"  },
          { label:"Uncategorized", value:uncategorized.length,color:"#f59e0b",  icon:"?"  },
        ].map(s => (
          <div key={s.label} style={{ padding:"14px 16px", borderRadius:"16px", background:cardBg, backdropFilter:"blur(12px)", border:`1px solid ${border}`, display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:"20px", fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"10px", color:mutedColor, marginTop:"2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sort bar */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"16px", alignItems:"center" }}>
        <span style={{ fontSize:"11px", color:mutedColor, fontWeight:600 }}>Sort:</span>
        {[["name","A–Z"],["tasks","Most tasks"],["progress","Progress"]].map(([v,l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            style={{ padding:"5px 12px", borderRadius:"99px", border:`1.5px solid ${sortBy===v?ac:border}`, background:sortBy===v?`${ac}15`:"transparent", color:sortBy===v?ac:mutedColor, cursor:"pointer", fontSize:"11px", fontWeight:sortBy===v?700:400, fontFamily:"inherit", transition:"all 0.13s" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"12px" }}>
          {[0,1,2].map(i => <div key={i} style={{ height:"180px", borderRadius:"18px", background:cardBg, animation:"pulse 1.4s ease-in-out infinite", animationDelay:`${i*0.1}s` }}/>)}
        </div>
      ) : categories.length === 0 ? (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          style={{ textAlign:"center", padding:"64px 20px", background:cardBg, backdropFilter:"blur(10px)", borderRadius:"22px", border:`1px solid ${border}` }}>
          <div style={{ fontSize:"52px", marginBottom:"14px" }}>📂</div>
          <h3 style={{ fontSize:"17px", fontWeight:700, margin:"0 0 6px", color:textColor }}>No categories yet</h3>
          <p style={{ fontSize:"13px", color:mutedColor, marginBottom:"20px" }}>Group your tasks into categories to stay organised</p>
          <motion.button whileTap={{scale:0.97}} onClick={() => setShowModal(true)}
            style={{ padding:"11px 24px", borderRadius:"12px", background:`linear-gradient(135deg,${ac},${ac}cc)`, border:"none", color:"white", cursor:"pointer", fontSize:"13px", fontWeight:700, fontFamily:"inherit" }}>
            Create your first category
          </motion.button>
        </motion.div>
      ) : (
        <motion.div layout style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"12px" }}>
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
                  transition={{delay:i*0.04}} whileHover={{y:-3}}
                  style={{ background:cardBg, backdropFilter:"blur(14px)", borderRadius:"20px", border:`1px solid ${border}`, borderTop:`3px solid ${cat.color}`, overflow:"hidden", boxShadow:isDark?"0 4px 24px rgba(0,0,0,0.15)":"0 4px 20px rgba(0,0,0,0.08)" }}>

                  {/* Main card */}
                  <div style={{ padding:"18px 18px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px" }}>
                      <div style={{ width:"50px", height:"50px", borderRadius:"14px", background:`${cat.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0 }}>{cat.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <h3 style={{ fontSize:"15px", fontWeight:700, margin:"0 0 3px", color:textColor, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cat.name}</h3>
                        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                          <span style={{ fontSize:"11px", color:mutedColor }}>{total} task{total!==1?"s":""}</span>
                          {overdue.length > 0 && <span style={{ fontSize:"10px", color:"#f43f5e", fontWeight:600 }}>⚠ {overdue.length} overdue</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:"18px", fontWeight:800, color:cat.color }}>{pct}%</div>
                        <div style={{ fontSize:"9px", color:mutedColor }}>done</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height:"5px", background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)", borderRadius:"3px", overflow:"hidden", marginBottom:"12px" }}>
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.7,delay:i*0.05}}
                        style={{ height:"100%", background:`linear-gradient(90deg,${cat.color},${cat.color}99)`, borderRadius:"3px" }}/>
                    </div>

                    {/* Stats row */}
                    <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
                      {[
                        { label:"Done",   value:done,          color:"#10b981" },
                        { label:"Left",   value:total-done,    color:ac        },
                        { label:"Overdue",value:overdue.length,color:"#f43f5e" },
                      ].map(s => (
                        <div key={s.label} style={{ flex:1, padding:"8px", borderRadius:"10px", background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)", textAlign:"center", border:`1px solid ${s.value>0&&s.label==="Overdue"?"rgba(244,63,94,0.2)":border}` }}>
                          <div style={{ fontSize:"15px", fontWeight:800, color:s.value>0?s.color:mutedColor }}>{s.value}</div>
                          <div style={{ fontSize:"9px", color:mutedColor }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Expand button */}
                    {total > 0 && (
                      <button onClick={() => setExpandedId(isExpanded?null:cat.id)}
                        style={{ width:"100%", padding:"7px", borderRadius:"8px", background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)", border:`1px solid ${border}`, color:mutedColor, cursor:"pointer", fontSize:"11px", fontFamily:"inherit", marginBottom:"8px" }}>
                        {isExpanded ? "▲ Hide tasks" : `▼ Show ${total} tasks`}
                      </button>
                    )}

                    {/* Expanded tasks list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
                          <div style={{ maxHeight:"200px", overflowY:"auto", marginBottom:"8px" }}>
                            {catTasks.map(t => (
                              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 8px", borderRadius:"8px", marginBottom:"4px", background:isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)" }}>
                                <div style={{ width:"14px", height:"14px", borderRadius:"4px", border:`2px solid ${t.completed?"#10b981":isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.2)"}`, background:t.completed?"#10b981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                  {t.completed && <span style={{ color:"white", fontSize:"8px" }}>✓</span>}
                                </div>
                                <span style={{ fontSize:"12px", color:textColor, textDecoration:t.completed?"line-through":"none", opacity:t.completed?0.5:1, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</span>
                                {t.dueDate && <span style={{ fontSize:"10px", color:mutedColor }}>{t.dueDate}</span>}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button whileTap={{scale:0.96}} onClick={() => deleteCategory(cat.id)}
                      style={{ width:"100%", padding:"8px", borderRadius:"10px", background:"rgba(244,63,94,0.06)", border:"1px solid rgba(244,63,94,0.14)", color:"#f43f5e", cursor:"pointer", fontSize:"12px", fontWeight:600, fontFamily:"inherit" }}>
                      🗑 Delete
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Uncategorized tasks section */}
      {uncategorized.length > 0 && (
        <div style={{ marginTop:"20px" }}>
          <div style={{ fontSize:"11px", fontWeight:700, color:mutedColor, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"10px" }}>
            Uncategorized · {uncategorized.length}
          </div>
          <div style={{ background:cardBg, borderRadius:"16px", border:`1px solid ${border}`, overflow:"hidden" }}>
            {uncategorized.slice(0,5).map((t,i) => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 16px", borderBottom:i<Math.min(uncategorized.length,5)-1?`1px solid ${border}`:"none" }}>
                <div style={{ width:"16px", height:"16px", borderRadius:"5px", border:`2px solid ${t.completed?"#10b981":isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.18)"}`, background:t.completed?"#10b981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {t.completed && <span style={{ color:"white", fontSize:"9px" }}>✓</span>}
                </div>
                <span style={{ fontSize:"13px", color:textColor, opacity:t.completed?0.5:1, textDecoration:t.completed?"line-through":"none", flex:1 }}>{t.title}</span>
                <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"4px", background:`${t.priority==="high"?"rgba(244,63,94,0.12)":t.priority==="medium"?"rgba(245,158,11,0.12)":"rgba(16,185,129,0.12)"}`, color:t.priority==="high"?"#f43f5e":t.priority==="medium"?"#f59e0b":"#10b981" }}>
                  {t.priority}
                </span>
              </div>
            ))}
            {uncategorized.length > 5 && (
              <div style={{ padding:"10px 16px", fontSize:"12px", color:mutedColor, textAlign:"center" }}>+{uncategorized.length-5} more</div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <CenteredModal isOpen={showModal} onClose={() => setShowModal(false)} title="New Category" maxWidth="440px">
        <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
          <input autoFocus placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()}
            style={{...inputStyle,marginBottom:"18px"}}
            onFocus={e=>e.target.style.borderColor=ac} onBlur={e=>e.target.style.borderColor=border}/>

          <label style={{ fontSize:"10px", color:mutedColor, display:"block", marginBottom:"8px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Icon</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"18px" }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{ width:"40px", height:"40px", borderRadius:"10px", fontSize:"20px", border:ic===icon?`2px solid ${ac}`:`1px solid ${border}`, background:ic===icon?`${ac}14`:iconBtnBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{ic}</button>
            ))}
          </div>

          <label style={{ fontSize:"10px", color:mutedColor, display:"block", marginBottom:"8px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Colour</label>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center", marginBottom:"18px" }}>
            {COLOR_OPTIONS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width:"28px", height:"28px", borderRadius:"50%", background:c, cursor:"pointer", border:color===c?"3px solid white":"2px solid transparent", boxShadow:color===c?`0 0 0 2px ${c}`:"none", transition:"all 0.14s" }}/>
            ))}
            <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{ width:"28px", height:"28px", borderRadius:"50%", border:"none", cursor:"pointer", padding:0, background:"transparent" }}/>
          </div>

          <div style={{ padding:"12px 14px", borderRadius:"12px", background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)", border:`1px solid ${border}`, display:"flex", alignItems:"center", gap:"10px", marginBottom:"18px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>{icon}</div>
            <div>
              <div style={{ fontSize:"14px", fontWeight:600, color:textColor }}>{name||"Category name"}</div>
              <div style={{ fontSize:"11px", color }}>{tasks.length} tasks</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={() => setShowModal(false)} style={{ flex:1, padding:"11px", borderRadius:"10px", border:`1px solid ${border}`, background:"transparent", color:mutedColor, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            <motion.button whileTap={{scale:0.97}} onClick={handleAdd}
              style={{ flex:2, padding:"11px", borderRadius:"10px", background:`linear-gradient(135deg,${color},${color}cc)`, border:"none", color:"white", cursor:"pointer", fontSize:"13px", fontWeight:700, fontFamily:"inherit", boxShadow:`0 4px 14px ${color}44` }}>
              Create
            </motion.button>
          </div>
        </div>
      </CenteredModal>

      <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  );
}