import { useState } from "react";
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
  // Load tasks at app level so AI assistant gets live context
  const { tasks, categories } = useTasks();

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
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <AnimatedBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar activePage={page} onPageChange={setPage} />
        {page === "today"      && <Today onGoToTasks={() => setPage("tasks")} />}
        {page === "tasks"      && <Tasks />}
        {page === "calendar"   && <Calendar />}
        {page === "habits"     && <Habits />}
        {page === "categories" && <Categories />}
      </div>

      {/* AI Assistant FAB — always visible */}
      <AIAssistant tasks={tasks} categories={categories} />
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
              marginBottom: "80px", // above AI FAB
            },
            success: { iconTheme: { primary: "#ff6b9d", secondary: "#0f172a" } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
