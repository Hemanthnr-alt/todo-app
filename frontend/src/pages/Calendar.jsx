import { useState, useEffect, useMemo } from "react";
import { useTasks } from "../hooks/useTasks";
import { useHabits } from "../hooks/useHabits";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import MonthSelect from "../components/MonthSelect";

// Helpers
function getMonthData(year, month) {
  const f=new Date(year,month,1), l=new Date(year,month+1,0);
  const startDay=(f.getDay()+6)%7; // Mon=0
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
  const ac = accent || "#7C5CFC";
  
  const textColor  = isDark ? "#F0EFF8" : "#0f172a";
  const mutedColor = isDark ? "#8B8AA3" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "#121220" : "rgba(255,255,255,0.92)";
  const border     = "rgba(255,255,255,0.07)";

  const y=curr.getFullYear(), m=curr.getMonth();
  const days = getMonthData(y,m);
  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}`;

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

  const pmOptions = { high:"#F05050", medium:"#F5A623", low:"#22C97E" };

  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"24px 16px 40px",fontFamily:"'Inter',sans-serif",color:textColor}}>
      
      <div style={{marginBottom:"24px"}}>
        <h1 style={{fontSize:"26px",fontWeight:600,margin:"0 0 4px",letterSpacing:"-0.02em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          <span style={{background:`linear-gradient(135deg,${ac},#a78bfa)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Calendar</span>
        </h1>
        <p style={{fontSize:"13px",color:mutedColor,margin:0}}>View your schedule and habit history</p>
      </div>

      <div style={{background:cardBg,borderRadius:"16px",border:`1px solid ${border}`,padding:"20px",marginBottom:"24px"}}>
        <MonthSelect curr={curr} setCurr={setCurr} isDark={isDark} accent={ac}/>

        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"6px",marginBottom:"8px"}}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
            <div key={d} style={{textAlign:"center",fontSize:"10px",fontWeight:700,color:mutedColor,textTransform:"uppercase",letterSpacing:"0.04em",padding:"8px 0"}}>{d}</div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"6px"}}>
          {days.map((dObj,i)=>{
            const dStr = toDateStr(y,m,dObj.dateNum,dObj.offset);
            const isToday = dStr===todayStr;
            const isSel = dStr===selDate;
            const tList = tasksByDate[dStr]||[];
            const hList = habitsByDate[dStr]||[];
            /* Past days lower opacity if current month */
            const isPast = dStr < todayStr && dObj.isCurrentMo;

            const bg = isSel ? `${ac}22` : "transparent";
            const bw = isSel ? `1.5px solid ${ac}` : `1px solid transparent`;

            return (
              <motion.button key={`${dStr}-${i}`}
                whileTap={{scale:0.92}} onClick={()=>{setSelDate(dStr);if(!dObj.isCurrentMo){setCurr(new Date(y,m+dObj.offset,1));}}}
                style={{
                  aspectRatio:"1",borderRadius:"10px",border:bw,background:bg,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",
                  padding:"4px",cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit",
                  opacity:!dObj.isCurrentMo?0.3:isPast?0.4:1,
                  WebkitTapHighlightColor:"transparent",touchAction:"manipulation",
                }}>
                <div style={{
                  width:"22px",height:"22px",borderRadius:isToday?"50%":"6px", /* Filled circle for today */
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"12px",fontWeight:isToday||isSel?800:500,
                  color:isToday?"white":isSel?ac:textColor,
                  background:isToday?Math.abs(dObj.offset)===0?ac:mutedColor:"transparent",
                  marginBottom:"2px"
                }}>
                  {dObj.dateNum}
                </div>
                <div style={{display:"flex",gap:"2px",flexWrap:"wrap",justifyContent:"center",maxWidth:"80%"}}>
                  {tList.slice(0,3).map((t,idx)=>(
                    <div key={`t-${idx}`} style={{width:"4px",height:"4px",borderRadius:"50%",background:t.completed?"#22C97E":pmOptions[t.priority]||pmOptions.medium}}/>
                  ))}
                  {hList.length>0&&tList.length===0&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:"#7C5CFC"}}/>}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div style={{marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <h3 style={{fontSize:"17px",fontWeight:700,color:textColor,margin:0}}>
          {new Date(selDate).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
        </h3>
        <span style={{fontSize:"12px",color:mutedColor}}>{selTasks.length} tasks · {selHabits.length} habits</span>
      </div>

      <AnimatePresence mode="popLayout">
        {selTasks.length===0&&selHabits.length===0?(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{textAlign:"center",padding:"40px 16px",background:cardBg,borderRadius:"12px",border:`1px solid ${border}`}}>
            <div style={{fontSize:"32px",marginBottom:"8px"}}>✨</div>
            <div style={{fontSize:"14px",color:mutedColor}}>Nothing scheduled</div>
          </motion.div>
        ):(
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {selHabits.length>0&&(
              <div style={{padding:"14px 16px",background:cardBg,borderRadius:"12px",border:`1px solid ${border}`}}>
                <div style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#7C5CFC",marginBottom:"10px"}}>Completed Habits</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {selHabits.map(h=>(
                    <div key={h.id} style={{padding:"6px 10px",borderRadius:"8px",background:`${h.color||ac}18`,color:h.color||ac,fontSize:"12px",fontWeight:600,display:"flex",alignItems:"center",gap:"6px"}}>
                      <span style={{fontSize:"14px"}}>{h.icon}</span>{h.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selTasks.map(t=>(
              <div key={t.id} style={{padding:"14px 16px",background:cardBg,borderRadius:"12px",border:`1px solid ${border}`,borderLeft:`3px solid ${t.completed?"#22C97E":pmOptions[t.priority]||pmOptions.medium}`,display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"16px",height:"16px",borderRadius:"5px",border:`1.5px solid ${t.completed?"#22C97E":mutedColor}`,background:t.completed?"#22C97E":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {t.completed&&<span style={{color:"white",fontSize:"10px",fontWeight:800}}>✓</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"14px",fontWeight:500,color:textColor,textDecoration:t.completed?"line-through":"none",opacity:t.completed?0.6:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                  {t.startTime&&<div style={{fontSize:"11px",color:mutedColor,marginTop:"2px"}}>🕒 {t.startTime}</div>}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
