import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar      from "./components/Navbar";
import Tasks       from "./pages/Tasks";
import Today       from "./pages/Today";
import Calendar    from "./pages/Calendar";
import Habits      from "./pages/Habits";
import Categories  from "./pages/Categories";
import Timer       from "./pages/Timer";
import Rewards     from "./pages/Rewards";
import { isNativeApp } from "./services/storage";

/* ── PWA service worker ── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const getNetworkEnabled = () => {
  try { return JSON.parse(localStorage.getItem("thirty_network") ?? "true"); }
  catch { return true; }
};

/* ── Loading screen ─────────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      display:"flex", justifyContent:"center", alignItems:"center",
      minHeight:"100vh",
      background:"var(--bg)",
      fontFamily:"var(--font-heading)",
    }}>
      <div style={{ textAlign:"center" }}>
        <div style={{
          width:"64px", height:"64px",
          background:"var(--accent)",
          borderRadius:"20px",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"18px", fontWeight:800, color:"white",
          margin:"0 auto 20px",
          boxShadow:"0 8px 32px var(--accent-glow)",
          letterSpacing:"-0.05em",
        }}>30</div>
        <p style={{ color:"var(--text-secondary)", fontSize:"12px", margin:0, letterSpacing:"0.1em", textTransform:"uppercase" }}>
          Loading…
        </p>
      </div>
    </div>
  );
}

/* ── Main app ────────────────────────────────────────────────────────────── */
function AppContent() {
  const [page,     setPage]     = useState("today");
  const [todayKey, setTodayKey] = useState(0);
  const { loading }             = useAuth();
  const [isWaking, setIsWaking] = useState(false);
  const NATIVE = isNativeApp();

  /* ── Fix 100dvh on Android / Samsung ── */
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh, { passive:true });
    return () => window.removeEventListener("resize", setVh);
  }, []);

  /* ── One-time migration: old pink/purple → new purple ── */
  useEffect(() => {
    const saved    = localStorage.getItem("accent");
    const migrated = localStorage.getItem("accent_migrated_v3");
    if (!migrated && (!saved || saved === "#ff6b9d" || saved === "#a855f7")) {
      localStorage.setItem("accent", "#7C5CFC");
      localStorage.setItem("accent_migrated_v3", "true");
      window.location.reload();
    }
  }, []);

  /* ── Wake Render backend ── */
  useEffect(() => {
    if (NATIVE && !getNetworkEnabled()) return;
    if (!navigator.onLine) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    setIsWaking(true);
    fetch("https://todo-app-91pe.onrender.com/api/health", { signal: controller.signal })
      .catch(() => {})
      .finally(() => { clearTimeout(timer); setIsWaking(false); });
    return () => { clearTimeout(timer); controller.abort(); };
  }, [NATIVE]);

  /* ── Page navigation ── */
  const handlePageChange = (newPage) => {
    if (newPage === "today") {
      setTodayKey(k => k + 1);
    }
    setPage(newPage);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ position:"relative", minHeight:"100vh" }}>
      <AnimatedBackground />

      {/* Render waking bar */}
      {isWaking && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, height:"2px", zIndex:9999,
          background:"linear-gradient(90deg,transparent,#7C5CFC,transparent)",
          animation:"shimmer 1.5s linear infinite",
          backgroundSize:"200% 100%",
        }}/>
      )}

      <div style={{ position:"relative", zIndex:1 }}>
        <Navbar activePage={page} onPageChange={handlePageChange} />

        <div className="mobile-page-content">
          {page === "today" && (
            <Today
              key={todayKey}
              onGoToTasks={()    => handlePageChange("tasks")}
              onGoToHabits={()   => handlePageChange("habits")}
              onGoToCalendar={() => handlePageChange("calendar")}
              onGoToTimer={()    => handlePageChange("timer")}
              onGoToRewards={()  => handlePageChange("rewards")}
            />
          )}
          {page === "tasks"      && <Tasks />}
          {page === "calendar"   && <Calendar />}
          {page === "habits"     && <Habits />}
          {page === "categories" && <Categories />}
          {page === "timer"      && <Timer />}
          {page === "rewards"    && <Rewards />}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Root ────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-center"
          containerStyle={{ top:"70px" }}
          toastOptions={{
            duration: 3500,
            style: {
              background:   "#121220",
              color:        "#F0EFF8",
              border:       "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px",
              fontSize:     "13px",
              fontFamily:   "'Inter',sans-serif",
              maxWidth:     "300px",
              boxShadow:    "0 8px 32px rgba(0,0,0,0.5)",
              padding:      "12px 16px",
            },
            success: { iconTheme:{ primary:"#7C5CFC", secondary:"#121220" } },
            error:   { style:{ background:"#1A0A0A", border:"1px solid rgba(240,80,80,0.22)" } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}