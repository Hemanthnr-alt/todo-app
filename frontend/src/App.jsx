import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar    from "./components/Navbar";
import Tasks     from "./pages/Tasks";
import Today     from "./pages/Today";
import Calendar  from "./pages/Calendar";
import Habits    from "./pages/Habits";
import Categories from "./pages/Categories";
import Timer     from "./pages/Timer";
import Rewards   from "./pages/Rewards";
import { isNativeApp } from "./services/storage";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const getNetworkEnabled = () => {
  try { return JSON.parse(localStorage.getItem("thirty_network") ?? "true"); } catch { return true; }
};

function AppContent() {
  const [page,     setPage]     = useState("today");
  const { loading }             = useAuth();
  const [isWaking, setIsWaking] = useState(false);
  const NATIVE = isNativeApp();

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

  if (loading) {
    return (
      <div style={{
        display:"flex", justifyContent:"center", alignItems:"center",
        minHeight:"100vh",
        background:"linear-gradient(135deg,#080610,#0d0a1e)",
        fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{ textAlign:"center" }}>
          <motion_div
            style={{
              width:"64px", height:"64px",
              background:"linear-gradient(135deg,var(--accent,#ff6b9d),var(--accent,#ff6b9d)cc)",
              borderRadius:"20px",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"18px", fontWeight:900, color:"white",
              margin:"0 auto 20px",
              boxShadow:"0 8px 32px var(--accent-glow,rgba(255,107,157,0.35))",
              letterSpacing:"-0.05em",
            }}
          >30</motion_div>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"12px", margin:0, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"relative", minHeight:"100vh" }}>
      <AnimatedBackground />

      {isWaking && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, height:"2px", zIndex:9999,
          background:"linear-gradient(90deg,transparent,var(--accent,#ff6b9d),transparent)",
          animation:"shimmer 1.5s linear infinite",
          backgroundSize:"200% 100%",
        }}/>
      )}

      <div style={{ position:"relative", zIndex:1 }}>
        <Navbar activePage={page} onPageChange={setPage} />
        <div className="mobile-page-content">
          {page === "today"      && <Today      onGoToTasks={()=>setPage("tasks")} onGoToHabits={()=>setPage("habits")} onGoToCalendar={()=>setPage("calendar")}/>}
          {page === "tasks"      && <Tasks />}
          {page === "calendar"   && <Calendar />}
          {page === "habits"     && <Habits />}
          {page === "categories" && <Categories />}
          {page === "timer"      && <Timer />}
          {page === "rewards"    && <Rewards />}
        </div>
      </div>

      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}

// tiny inline motion div for loading screen (avoids framer import at top level)
function motion_div({ children, style }) {
  return <div style={style}>{children}</div>;
}

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
              background:"#0d0b1a",
              color:"#f1f5f9",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:"14px",
              fontSize:"13px",
              fontFamily:"'DM Sans',sans-serif",
              maxWidth:"300px",
              boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
              padding:"12px 16px",
            },
            success: { iconTheme:{ primary:"var(--accent,#ff6b9d)", secondary:"#0d0b1a" } },
            error:   { style:{ background:"#180a0a", border:"1px solid rgba(244,63,94,0.22)" } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}