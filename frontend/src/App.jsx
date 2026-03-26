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

function AppContent() {
  const [page, setPage] = useState("today");
  const { loading } = useAuth();

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
            width: "48px", height: "48px", margin: "0 auto 16px",
            border: "3px solid rgba(255,107,157,0.2)",
            borderTopColor: "#ff6b9d",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>Loading workspace…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <AnimatedBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar activePage={page} onPageChange={setPage} />
        {page === "today" && <Today onGoToTasks={() => setPage("tasks")} />}
        {page === "tasks" && <Tasks />}
        {page === "calendar" && <Calendar />}
        {page === "habits" && <Habits />}
        {page === "categories" && <Categories />}
      </div>
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
            },
            success: { iconTheme: { primary: "#ff6b9d", secondary: "#0f172a" } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}