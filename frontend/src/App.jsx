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
import AIAssistant from "./components/AIAssistant";
import { useTasks } from "./hooks/useTasks";

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("✅ SW registered"))
      .catch(err => console.warn("SW failed:", err));
  });
}

function AppContent() {
  const [page, setPage]       = useState("today");
  const { loading }           = useAuth();
  const { tasks, categories } = useTasks();
  const [isOffline, setIsOffline] = useState(false);
  const [isWaking,  setIsWaking]  = useState(false);

  useEffect(() => {
    let wakeTimer = null;

    const checkBackend = async () => {
      if (!navigator.onLine) {
        setIsOffline(true);
        setIsWaking(false);
        return;
      }
      try {
        setIsWaking(true);
        setIsOffline(false);
        const controller = new AbortController();
        wakeTimer = setTimeout(() => controller.abort(), 60000);
        await fetch("https://todo-app-91pe.onrender.com/api/health", {
          signal: controller.signal,
        });
        clearTimeout(wakeTimer);
        setIsWaking(false);
        setIsOffline(false);
      } catch {
        clearTimeout(wakeTimer);
        setIsWaking(false);
        setIsOffline(!navigator.onLine);
      }
    };

    checkBackend();

    const goOnline  = () => { setIsOffline(false); checkBackend(); };
    const goOffline = () => { setIsOffline(true); setIsWaking(false); };
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      clearTimeout(wakeTimer);
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg,#080b14 0%,#0f172a 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", fontWeight: 900, color: "white",
            margin: "0 auto 20px",
            boxShadow: "0 8px 28px rgba(255,107,157,0.35)",
          }}>30</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>
            Loading workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <AnimatedBackground />

      {/* ── Clean status bar ── */}
      {(isWaking || isOffline) && (
        <div style={{
          position: "fixed",
          // sits right below the navbar
          top: "56px",
          left: 0, right: 0,
          zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "7px 16px",
          // subtle pill style instead of full-width block
          background: isOffline
            ? "rgba(30,20,10,0.92)"
            : "rgba(10,20,40,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${isOffline ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)"}`,
          fontSize: "12px", fontWeight: 600,
          color: isOffline ? "#f59e0b" : "#60a5fa",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.01em",
        }}>
          {isWaking && !isOffline ? (
            <>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: "13px" }}>⟳</span>
              Waking server up — just a moment
            </>
          ) : (
            <>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#f59e0b",
                display: "inline-block",
                animation: "pulse-dot 1.5s ease-in-out infinite",
              }} />
              Offline — cached data shown
            </>
          )}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar activePage={page} onPageChange={setPage} />

        <div className="mobile-page-content">
          {page === "today"      && <Today onGoToTasks={() => setPage("tasks")} />}
          {page === "tasks"      && <Tasks />}
          {page === "calendar"   && <Calendar />}
          {page === "habits"     && <Habits />}
          {page === "categories" && <Categories />}
        </div>
      </div>

      <AIAssistant tasks={tasks} categories={categories} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }
        @media (max-width: 768px) {
          .ai-fab-wrapper   { bottom: calc(72px + 16px) !important; }
          .ai-panel-wrapper { bottom: calc(72px + 16px) !important; height: min(500px, calc(100dvh - 200px)) !important; }
        }
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
              background: "#0f172a",
              color: "#f1f5f9",
              border: "1px solid rgba(255,107,157,0.2)",
              borderRadius: "12px",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: "80px",
            },
            success: { iconTheme: { primary: "#ff6b9d", secondary: "#0f172a" } },
            error: {
              style: {
                background: "#1a0a0a",
                border: "1px solid rgba(244,63,94,0.25)",
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}