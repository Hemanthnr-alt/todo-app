import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar from "./components/Navbar";
import Tasks from "./pages/Tasks";
import Today from "./pages/Today";
import Calendar from "./pages/Calendar";
import Habits from "./pages/Habits";
import Categories from "./pages/Categories";
import Timer from "./pages/Timer";
import { isNativeApp } from "./services/storage";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// APK internet access setting
const getNetworkEnabled = () => {
  try { return JSON.parse(localStorage.getItem("thirty_network") ?? "true"); } catch { return true; }
};

function AppContent() {
  const [page, setPage]       = useState("today");
  const { loading }           = useAuth();
  const [isWaking, setIsWaking] = useState(false);
  const NATIVE = isNativeApp();

  useEffect(() => {
    // Only wake Render if: website (not APK) OR APK with network enabled
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
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", background:"linear-gradient(135deg,#0e0618,#1a0a2e)", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:"64px", height:"64px", background:"linear-gradient(135deg,var(--accent,#ff6b9d),var(--accent,#ff6b9d)cc)", borderRadius:"20px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", fontWeight:900, color:"white", margin:"0 auto 20px", boxShadow:"0 8px 32px var(--accent-glow,rgba(255,107,157,0.35))", letterSpacing:"-0.05em" }}>
            Thirty
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"13px", margin:0, letterSpacing:"0.08em", textTransform:"uppercase" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"relative", minHeight:"100vh" }}>
      <AnimatedBackground />
      {isWaking && (
        <div style={{ position:"fixed", top:0, left:0, right:0, height:"2px", zIndex:9999, background:"linear-gradient(90deg,transparent,var(--accent,#ff6b9d),transparent)", animation:"shimmer 1.5s linear infinite", backgroundSize:"200% 100%" }} />
      )}
      <div style={{ position:"relative", zIndex:1 }}>
        <Navbar activePage={page} onPageChange={setPage} />
        <div className="mobile-page-content">
          {page === "today"      && <Today      onGoToTasks={() => setPage("tasks")} onGoToHabits={() => setPage("habits")} onGoToCalendar={() => setPage("calendar")} />}
          {page === "tasks"      && <Tasks />}
          {page === "calendar"   && <Calendar />}
          {page === "habits"     && <Habits />}
          {page === "categories" && <Categories />}
          {page === "timer"      && <Timer />}
        </div>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background:"#0f172a", color:"#f1f5f9",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:"14px", fontSize:"13px",
              fontFamily:"'DM Sans',sans-serif",
              marginBottom:"88px",
              boxShadow:"0 8px 32px rgba(0,0,0,0.3)",
            },
            success: { iconTheme: { primary:"var(--accent,#ff6b9d)", secondary:"#0f172a" } },
            error:   { style: { background:"#1a0808", border:"1px solid rgba(244,63,94,0.2)" } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}