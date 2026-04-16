import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { TimerProvider } from "./context/TimerContext";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import Habits from "./pages/Habits";
import Rewards from "./pages/Rewards";
import Tasks from "./pages/Tasks";
import Timer from "./pages/Timer";
import Today from "./pages/Today";
import WeeklySummary from "./pages/WeeklySummary";
import { isNativeApp } from "./services/storage";
import {
  requestNotificationPermission,
  scheduleTaskReminders,
  setupNotificationListeners,
  needsPermissionPrompt
} from "./services/notifications";
import { useTasks } from "./hooks/useTasks";

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

// ── Notification bootstrap — runs once after auth loads ───────────────────────
function NotificationBootstrap() {
  const { tasks } = useTasks();
  const [showPrompt, setShowPrompt] = useState(false);
  const { accent } = useTheme();

  // 1. Check permissions and set up listeners on first launch
  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      try {
        await setupNotificationListeners();
        
        // Don't repeatedly prompt if they dismissed it locally
        if (localStorage.getItem("thirty_notif_dismissed")) return;

        // Check if we need to request permission via user gesture
        if (mounted) {
           const needs = await needsPermissionPrompt();
           if (needs) setShowPrompt(true);
        }
      } catch {}
    };
    boot();
    return () => { mounted = false; };
  }, []);

  // 2. Schedule task due/overdue reminders whenever task list changes
  useEffect(() => {
    if (!tasks?.length) return;
    // Debounce so we don't hammer on every keystroke
    const t = setTimeout(() => {
      scheduleTaskReminders(tasks).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [tasks]);

  // 3. Handle notification tap → navigate to relevant page
  useEffect(() => {
    const handler = (e) => {
      const { type, habitId } = e.detail || {};
      if (type === "habit_reminder") {
        window.dispatchEvent(new CustomEvent("thirty-navigate", { detail: { page: "habits" } }));
      } else if (type === "task_due" || type === "task_overdue") {
        window.dispatchEvent(new CustomEvent("thirty-navigate", { detail: { page: "tasks" } }));
      }
    };
    window.addEventListener("thirty-notification-tap", handler);
    return () => window.removeEventListener("thirty-notification-tap", handler);
  }, []);

  if (!showPrompt) return null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <motion.div initial={{ scale:0.9, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }}
        style={{ background:"var(--surface-raised)", border:"1px solid var(--border)", borderRadius:"24px", padding:"32px", maxWidth:"360px", textAlign:"center", boxShadow:"var(--shadow-xl)" }}>
        <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:`${accent}22`, color:accent, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <h2 style={{ fontSize:"22px", fontWeight:800, color:"var(--text-primary)", marginBottom:"10px", fontFamily:"var(--font-heading)" }}>Push Notifications</h2>
        <p style={{ fontSize:"14px", color:"var(--text-muted)", marginBottom:"28px", lineHeight:1.5 }}>
          Enable notifications so Thirty can ping you when your timers finish and remind you of daily tasks and habits.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          <motion.button whileTap={{ scale:0.96 }}
            onClick={async () => {
              await requestNotificationPermission();
              setShowPrompt(false);
            }}
            className="btn-primary" style={{ padding:"14px", width:"100%", background:accent, boxShadow:`0 4px 16px ${accent}44` }}>
            Enable Push
          </motion.button>
          <button onClick={() => { localStorage.setItem("thirty_notif_dismissed", "1"); setShowPrompt(false); }}
             style={{ padding:"14px", width:"100%", background:"transparent", border:"none", color:"var(--text-secondary)", fontWeight:600, fontSize:"14px", cursor:"pointer" }}>
            Not Now
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [page, setPage]                   = useState("today");
  const [todayKey, setTodayKey]           = useState(0);
  const [taskInitialTab, setTaskInitialTab] = useState(null);
  const { loading } = useAuth();
  const [isWaking, setIsWaking]           = useState(false);
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
      .catch(() => {})
      .finally(() => { clearTimeout(t); setIsWaking(false); });
    return () => { clearTimeout(t); ctl.abort(); };
  }, [NATIVE]);

  // Handle navigation from internal triggers
  useEffect(() => {
    const handler = (e) => {
      const { page: p } = e.detail || {};
      if (p) setPage(p);
    };
    window.addEventListener("thirty-navigate", handler);
    return () => window.removeEventListener("thirty-navigate", handler);
  }, []);

  // Handle navigation from native/push notification taps
  useEffect(() => {
    const handler = (e) => {
      const { type } = e.detail || {};
      if (type === "timer_done") setPage("timer");
      else if (type === "habit_reminder") setPage("habits");
      else setPage("today"); // default fallback
    };
    window.addEventListener("thirty-notification-tap", handler);
    return () => window.removeEventListener("thirty-notification-tap", handler);
  }, []);

  const handlePageChange = (p, tab = null) => {
    if (p === "today") setTodayKey(k => k + 1);
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

      <NotificationBootstrap/>
      <Navbar activePage={page} onPageChange={handlePageChange}/>

      <div className="mobile-page-content">
        {page==="today" && (
          <Today key={todayKey}
            onGoToTasks={(tab) => handlePageChange("tasks", tab)}
            onGoToHabits={() => handlePageChange("habits")}
            onGoToCalendar={() => handlePageChange("calendar")}
            onGoToTimer={() => handlePageChange("timer")}
            onGoToRewards={() => handlePageChange("rewards")}/>
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
          duration: 3200,
          style: {
            background:"var(--surface-raised)", color:"var(--text-body)",
            border:"1px solid var(--border)", borderRadius:"14px",
            fontSize:"13px", fontFamily:"var(--font-body)",
            maxWidth:"300px", padding:"12px 16px",
          },
          success:{ iconTheme:{ primary:accent, secondary:"#fff" } },
          error:  { style:{ border:"1px solid var(--border-danger)" } },
        }}/>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TimerProvider>
          <AppFrame/>
        </TimerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}