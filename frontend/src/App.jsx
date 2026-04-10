import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import AnimatedBackground from "./components/AnimatedBackground";
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
import { isNativeApp } from "./services/storage";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const getNetworkEnabled = () => {
  try {
    return JSON.parse(localStorage.getItem("thirty_network") ?? "true");
  } catch {
    return true;
  }
};

function LoadingScreen() {
  const { accent } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "min(420px, 100%)",
          borderRadius: "32px",
          padding: "36px 28px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 auto auto 0",
            width: "180px",
            height: "180px",
            background: `radial-gradient(circle, ${accent}35, transparent 70%)`,
            filter: "blur(10px)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "76px",
            height: "76px",
            margin: "0 auto 22px",
            borderRadius: "24px",
            background: `linear-gradient(135deg, ${accent}, var(--accent-hover))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow)",
            color: "#fff",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            letterSpacing: "-0.06em",
            fontSize: "24px",
          }}
        >
          30
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "11px",
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Launching your workspace
        </p>
        <h1
          style={{
            fontSize: "clamp(24px, 5vw, 34px)",
            marginBottom: "8px",
            letterSpacing: "-0.05em",
          }}
        >
          Thirty
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
          Preparing your dashboard, habits, and daily flow.
        </p>
        <div
          style={{
            marginTop: "24px",
            height: "6px",
            borderRadius: "999px",
            background: "var(--surface-elevated)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              borderRadius: "inherit",
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              backgroundSize: "200% 100%",
              animation: "shimmerX 1.4s linear infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [page, setPage] = useState("today");
  const [todayKey, setTodayKey] = useState(0);
  const { loading } = useAuth();
  const [isWaking, setIsWaking] = useState(false);
  const { accent } = useTheme();
  const NATIVE = isNativeApp();

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh, { passive: true });
    return () => window.removeEventListener("resize", setVh);
  }, []);

  useEffect(() => {
    if (NATIVE && !getNetworkEnabled()) return;
    if (!navigator.onLine) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    setIsWaking(true);
    fetch("https://todo-app-91pe.onrender.com/api/health", { signal: controller.signal })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        setIsWaking(false);
      });
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [NATIVE]);

  const handlePageChange = (newPage) => {
    if (newPage === "today") {
      setTodayKey((current) => current + 1);
    }
    setPage(newPage);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <AnimatedBackground />

      {isWaking && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            zIndex: 9999,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            animation: "shimmerX 1.4s linear infinite",
            backgroundSize: "200% 100%",
            boxShadow: `0 0 18px ${accent}55`,
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar activePage={page} onPageChange={handlePageChange} />
        <div className="mobile-page-content">
          {page === "today" && (
            <Today
              key={todayKey}
              onGoToTasks={() => handlePageChange("tasks")}
              onGoToHabits={() => handlePageChange("habits")}
              onGoToCalendar={() => handlePageChange("calendar")}
              onGoToTimer={() => handlePageChange("timer")}
              onGoToRewards={() => handlePageChange("rewards")}
            />
          )}
          {page === "tasks" && <Tasks />}
          {page === "calendar" && <Calendar />}
          {page === "habits" && <Habits />}
          {page === "categories" && <Categories />}
          {page === "timer" && <Timer />}
          {page === "rewards" && <Rewards />}
        </div>
      </div>
    </div>
  );
}

function AppFrame() {
  const { accent } = useTheme();

  return (
    <>
      <AppContent />
      <Toaster
        position="top-center"
        containerStyle={{ top: "76px" }}
        toastOptions={{
          duration: 3500,
          style: {
            background: "var(--surface-raised)",
            color: "var(--text-body)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            fontSize: "13px",
            fontFamily: "var(--font-body)",
            maxWidth: "320px",
            boxShadow: "var(--shadow-soft)",
            padding: "14px 16px",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          },
          success: { iconTheme: { primary: accent, secondary: "#fff" } },
          error: {
            style: {
              background: "color-mix(in srgb, var(--surface-raised) 90%, rgba(255,111,125,0.18))",
              border: "1px solid var(--border-danger)",
            },
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppFrame />
      </AuthProvider>
    </ThemeProvider>
  );
}
