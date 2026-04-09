import { useState, useMemo } from "react";
import { useTasks } from "../hooks/useTasks";
import { useHabits } from "../hooks/useHabits";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import MonthSelect from "../components/MonthSelect";

function getMonthData(year, month) {
  const f=new Date(year,month,1), l=new Date(year,month+1,0);
  const startDay=(f.getDay()+6)%7;
  const daysInMo=l.getDate();
  const prevL=new Date(year,month,0).getDate();
  const res=[];
  for(let i=startDay-1;i>=0;i--) res.push({dateNum:prevL-i,isCurrentMo:false,offset:-1});
  for(let i=1;i<=daysInMo;i++) res.push({dateNum:i,isCurrentMo:true,offset:0});
  const total=res.length;
  for(let i=1;i<=(total%7===0?0:7-(total%7));i++) res.push({dateNum:i,isCurrentMo:false,offset:1});
  return res;
}
function toDateStr(y,m,d,off){
  let ny=y,nm=m;
  if(off===-1){ nm=m-1; if(nm<0){nm=11;ny=y-1;} }
  if(off===1) { nm=m+1; if(nm>11){nm=0;ny=y+1;} }
  return `${ny}-${String(nm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

export default function Calendar() {
  const { isDark, accent } = useTheme();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const [curr, setCurr]=useState(new Date());
  const ac = accent || "#6B46FF";

  const y=curr.getFullYear(), m=curr.getMonth();
  const days = getMonthData(y,m);
  const todayStr = new Date().toISOString().split("T")[0];

  const tasksByDate = useMemo(()=>{
    const map={};
    tasks.forEach(t=>{ if(t.dueDate){ if(!map[t.dueDate])map[t.dueDate]=[]; map[t.dueDate].push(t); } });
    return map;
  },[tasks]);

  const habitsByDate = useMemo(()=>{
    const map={};
    habits.forEach(h=>{ (h.completedDates||[]).forEach(d=>{ if(!map[d])map[d]=[]; map[d].push(h); }); });
    return map;
  },[habits]);

  const [selDate, setSelDate] = useState(todayStr);
  const selTasks  = tasksByDate[selDate]||[];
  const selHabits = habitsByDate[selDate]||[];

  const pmColors = { high:"var(--danger)", medium:"var(--warning)", low:"var(--success)" };

  return (
    <div style={{ maxWidth:"900px", margin:"0 auto", padding:"24px 16px 40px",
      fontFamily:"var(--font-body)", color:"var(--text-primary)" }}>

      {/* Header */}
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontSize:"28px", fontWeight:700, margin:"0 0 4px",
          letterSpacing:"-0.03em", fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>
          Calendar
        </h1>
        <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:0 }}>
          View your schedule and habit history
        </p>
      </div>

      {/* Month grid */}
      <div style={{ background:"var(--surface)", borderRadius:"16px",
        border: isDark ? "none" : "1px solid var(--border)",
        padding:"20px", marginBottom:"24px" }}>
        <MonthSelect curr={curr} setCurr={setCurr} isDark={isDark} accent={ac}/>

        {/* Day headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"8px" }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
            <div key={d} style={{ textAlign:"center", fontSize:"12px", fontWeight:600,
              color:"var(--text-muted)", textTransform:"uppercase",
              letterSpacing:"0.06em", padding:"8px 0" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px" }}>
          {days.map((dObj,i)=>{
            const dStr   = toDateStr(y,m,dObj.dateNum,dObj.offset);
            const isToday= dStr===todayStr;
            const isSel  = dStr===selDate;
            const tList  = tasksByDate[dStr]||[];
            const hList  = habitsByDate[dStr]||[];
            const isPast = dStr < todayStr && dObj.isCurrentMo;

            return (
              <motion.button key={`${dStr}-${i}`}
                whileTap={{scale:0.92}}
                onClick={()=>{ setSelDate(dStr); if(!dObj.isCurrentMo) setCurr(new Date(y,m+dObj.offset,1)); }}
                style={{
                  aspectRatio:"1", borderRadius:"10px",
                  border: isSel ? `1.5px solid var(--accent)` : "1.5px solid transparent",
                  background: isSel ? "var(--accent-subtle)" : "transparent",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start",
                  padding:"4px", cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit",
                  opacity: !dObj.isCurrentMo ? 0.25 : isPast ? 0.5 : 1,
                  WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
                }}>
                <div style={{
                  width:"24px", height:"24px", borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"13px", fontWeight: isToday||isSel ? 700 : 500,
                  color: isToday ? "white" : isSel ? "var(--accent)" : "var(--text-primary)",
                  background: isToday ? "var(--accent)" : "transparent",
                  marginBottom:"2px",
                }}>
                  {dObj.dateNum}
                </div>
                <div style={{ display:"flex", gap:"2px", flexWrap:"wrap", justifyContent:"center" }}>
                  {tList.slice(0,3).map((t,idx)=>(
                    <div key={`t-${idx}`} style={{ width:"4px", height:"4px", borderRadius:"50%",
                      background: t.completed ? "var(--success)" : pmColors[t.priority]||pmColors.medium }}/>
                  ))}
                  {hList.length>0&&tList.length===0&&(
                    <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:"var(--accent)" }}/>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected day */}
      <div style={{ marginBottom:"16px", display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <h3 style={{ fontSize:"17px", fontWeight:700, color:"var(--text-primary)", margin:0,
          fontFamily:"var(--font-heading)" }}>
          {new Date(selDate+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
        </h3>
        <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>
          {selTasks.length} tasks · {selHabits.length} habits
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {selTasks.length===0 && selHabits.length===0 ? (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ textAlign:"center", padding:"40px 16px", background:"var(--surface)",
              borderRadius:"14px", border: isDark ? "none" : "1px solid var(--border)" }}>
            <div style={{ fontSize:"32px", marginBottom:"8px" }}>✨</div>
            <div style={{ fontSize:"14px", color:"var(--text-muted)" }}>Nothing scheduled</div>
          </motion.div>
        ):(
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {selHabits.length>0&&(
              <div style={{ padding:"14px 16px", background:"var(--surface)", borderRadius:"14px",
                border: isDark ? "none" : "1px solid var(--border)" }}>
                <div style={{ fontSize:"12px", fontWeight:600, textTransform:"uppercase",
                  letterSpacing:"0.06em", color:"var(--accent)", marginBottom:"10px" }}>
                  Completed Habits
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                  {selHabits.map(h=>(
                    <div key={h.id} style={{ padding:"6px 10px", borderRadius:"8px",
                      background:`${h.color}20`, color:h.color, fontSize:"12px", fontWeight:600,
                      display:"flex", alignItems:"center", gap:"6px" }}>
                      <span style={{ fontSize:"14px" }}>{h.icon}</span>{h.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selTasks.map(t=>(
              <div key={t.id} style={{ padding:"14px 16px", background:"var(--surface)", borderRadius:"14px",
                border: isDark ? "none" : "1px solid var(--border)",
                borderLeft:`3px solid ${t.completed?"var(--success)":pmColors[t.priority]||pmColors.medium}`,
                display:"flex", alignItems:"center", gap:"12px", opacity: t.completed ? 0.55 : 1 }}>
                <div style={{ width:"16px", height:"16px", borderRadius:"5px",
                  border:`1.5px solid ${t.completed?"var(--success)":"var(--border-strong)"}`,
                  background: t.completed ? "var(--success)" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {t.completed&&<span style={{ color:"white", fontSize:"10px", fontWeight:800 }}>✓</span>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"14px", fontWeight:500, color:"var(--text-primary)",
                    textDecoration:t.completed?"line-through":"none",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {t.title}
                  </div>
                  {t.startTime&&<div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"2px" }}>
                    🕒 {t.startTime}
                  </div>}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
