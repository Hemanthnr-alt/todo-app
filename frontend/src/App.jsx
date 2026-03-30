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

function AppContent() {
  const [page, setPage] = useState("today");
  const { loading } = useAuth();
  const { tasks, categories } = useTasks();

  // ✅ OFFLINE DETECTION
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const go  = () => setIsOffline(false);
    const off = () => setIsOffline(true);

    window.addEventListener("online", go);
    window.addEventListener("offline", off);

    return () => {
      window.removeEventListener("online", go);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #080b14 0%, #0f172a 100%)",
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

      {/* ✅ NEW OFFLINE BANNER */}
      {isOffline && (
        <div style={{
          position: "fixed",
          top: 60,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "rgba(245,158,11,0.95)",
          backdropFilter: "blur(8px)",
          padding: "10px 16px",
          textAlign: "center",
          fontSize: "13px",
          fontWeight: 600,
          color: "white",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          ⚠️ You're offline — showing cached data
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

      {/* AI Assistant */}
      <AIAssistant tasks={tasks} categories={categories} />

      <style>{`
        @media (max-width: 768px) {
          .ai-fab-wrapper {
            bottom: calc(72px + 16px) !important;
          }
          .ai-panel-wrapper {
            bottom: calc(72px + 16px) !important;
            height: min(500px, calc(100dvh - 200px)) !important;
          }
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
          position="bottom-right"
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
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}