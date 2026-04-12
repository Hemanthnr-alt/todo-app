import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import Habits from "./pages/Habits";
import Rewards from "./pages/Rewards";
import Tasks from "./pages/Tasks";
import Timer from "./pages/Timer";
import Today from "./pages/Today";
import WeeklySummary from "./pages/WeeklySummary";
import { isNativeApp } from "./services/storage";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const getNetworkEnabled = () => {
  try { return JSON.parse(localStorage.getItem("thirty_network") ?? "true"); }
  catch { return true; }
};

function LoadingScreen() {
  const { accent } = useTheme();
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", background:"var(--bg)" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{
          width:"64px", height:"64px", borderRadius:"18px", margin:"0 auto 20px",
          background:`linear-gradient(135deg,${accent},var(--accent-pressed))`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#fff", fontFamily:"var(--font-heading)", fontWeight:800, fontSize:"22px", letterSpacing:"-0.06em",
          boxShadow:`0 8px 28px ${accent}44`,
        }}>30</div>
        <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"8px" }}>Thirty</div>
        <div style={{ width:"160px", height:"2px", borderRadius:"999px", background:"var(--surface-elevated)", overflow:"hidden", margin:"0 auto" }}>
          <div style={{ height:"100%", borderRadius:"inherit", background:`linear-gradient(90deg,transparent,${accent},transparent)`, backgroundSize:"200% 100%", animation:"shimmerX 1.2s linear infinite" }}/>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [page, setPage]             = useState("today");
  const [todayKey, setTodayKey]       = useState(0);
  const [taskInitialTab, setTaskInitialTab] = useState(null);
  const { loading } = useAuth();
  const [isWaking, setIsWaking] = useState(false);
  const { accent } = useTheme();
  const NATIVE = isNativeApp();

  useEffect(() => {
    const setVh = () => document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener("resize", setVh, { passive:true });
    return () => window.removeEventListener("resize", setVh);
  }, []);

  useEffect(() => {
    if (NATIVE && !getNetworkEnabled()) return;
    if (!navigator.onLine) return;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 60000);
    setIsWaking(true);
    fetch("https://todo-app-91pe.onrender.com/api/health", { signal:ctl.signal })
      .catch(()=>{})
      .finally(() => { clearTimeout(t); setIsWaking(false); });
    return () => { clearTimeout(t); ctl.abort(); };
  }, [NATIVE]);

  const handlePageChange = (p, tab = null) => {
    if (p === "today") setTodayKey(k => k+1);
    if (p === "tasks") setTaskInitialTab(tab);
    setPage(p);
  };

  if (loading) return <LoadingScreen/>;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      {isWaking && (
        <div style={{ position:"fixed",top:0,left:0,right:0,height:"2px",zIndex:9999,
          background:`linear-gradient(90deg,transparent,${accent},transparent)`,
          backgroundSize:"200% 100%", animation:"shimmerX 1.4s linear infinite", boxShadow:`0 0 12px ${accent}55` }}/>
      )}

      <Navbar activePage={page} onPageChange={handlePageChange}/>

      <div className="mobile-page-content">
        {page==="today" && (
          <Today key={todayKey}
            onGoToTasks={(tab) => handlePageChange("tasks", tab)}
            onGoToHabits={()=>handlePageChange("habits")}
            onGoToCalendar={()=>handlePageChange("calendar")}
            onGoToTimer={()=>handlePageChange("timer")}
            onGoToRewards={()=>handlePageChange("rewards")}/>
        )}
        {page==="habits"     && <Habits/>}
        {page==="tasks"      && <Tasks initialTab={taskInitialTab}/>}
        {page==="calendar"   && <Calendar/>}
        {page==="categories" && <Categories/>}
        {page==="timer"      && <Timer/>}
        {page==="rewards"    && <Rewards/>}
        {page==="summary"    && <WeeklySummary/>}
      </div>
    </div>
  );
}

function AppFrame() {
  const { accent } = useTheme();
  return (
    <>
      <AppContent/>
      <Toaster position="top-center" containerStyle={{ top:"70px" }}
        toastOptions={{
          duration:3200,
          style:{
            background:"var(--surface-raised)", color:"var(--text-body)",
            border:"1px solid var(--border)", borderRadius:"14px",
            fontSize:"13px", fontFamily:"var(--font-body)",
            maxWidth:"300px", padding:"12px 16px",
          },
          success:{ iconTheme:{ primary:accent, secondary:"#fff" } },
          error:{ style:{ border:"1px solid var(--border-danger)" } },
        }}/>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppFrame/>
      </AuthProvider>
    </ThemeProvider>
  );
}