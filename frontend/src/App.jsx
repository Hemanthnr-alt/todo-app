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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

function AppContent() {
  const [page, setPage] = useState("today");
  const { loading }     = useAuth();

  const [isWaking, setIsWaking] = useState(false);

  // Wake Render silently — no offline banner shown to user
  useEffect(() => {
    if (!navigator.onLine) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    setIsWaking(true);
    fetch("https://todo-app-91pe.onrender.com/api/health", { signal: controller.signal })
      .catch(() => {})
      .finally(() => { clearTimeout(timer); setIsWaking(false); });
    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "linear-gradient(135deg,#080b14,#0f172a)", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 900, color: "white", margin: "0 auto 20px", boxShadow: "0 8px 28px rgba(255,107,157,0.35)" }}>30</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <AnimatedBackground />

      {/* Subtle waking indicator — only a thin bar, no text */}
      {isWaking && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "2px", zIndex: 9999,
          background: "linear-gradient(90deg,transparent,#ff6b9d,#ff99cc,transparent)",
          animation: "shimmer 1.5s linear infinite",
          backgroundSize: "200% 100%",
        }} />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar activePage={page} onPageChange={setPage} />
        <div className="mobile-page-content">
          {page === "today"      && <Today      onGoToTasks={() => setPage("tasks")} onGoToHabits={() => setPage("habits")} />}
          {page === "tasks"      && <Tasks />}
          {page === "calendar"   && <Calendar />}
          {page === "habits"     && <Habits />}
          {page === "categories" && <Categories />}
          {page === "timer"      && <Timer />}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
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
              background: "#0f172a", color: "#f1f5f9",
              border: "1px solid rgba(255,107,157,0.2)",
              borderRadius: "12px", fontSize: "13px",
              fontFamily: "'DM Sans',sans-serif",
              marginBottom: "80px",
            },
            success: { iconTheme: { primary: "#ff6b9d", secondary: "#0f172a" } },
            error: { style: { background: "#1a0a0a", border: "1px solid rgba(244,63,94,0.25)" } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}