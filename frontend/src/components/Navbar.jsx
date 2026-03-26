import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthModal from "./AuthModal";
import AppSettings from "./AppSettings";
import NotificationBell from "./NotificationBell";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { id: "today", label: "Today", icon: "✦" },
  { id: "tasks", label: "Tasks", icon: "▣" },
  { id: "calendar", label: "Calendar", icon: "◫" },
  { id: "habits", label: "Habits", icon: "⟳" },
  { id: "categories", label: "Categories", icon: "◈" },
];

export default function Navbar({ activePage, onPageChange }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMenu]);

  const bg = isDark
    ? "rgba(8, 11, 20, 0.85)"
    : "rgba(248, 250, 252, 0.85)";
  const border = isDark ? "rgba(255,107,157,0.12)" : "rgba(255,107,157,0.2)";
  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.5)" : "rgba(15,23,42,0.45)";

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        style={{
          position: "sticky", top: 0, zIndex: 200,
          background: bg,
          backdropFilter: "blur(20px) saturate(1.6)",
          borderBottom: `1px solid ${border}`,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Top gradient line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #ff6b9d, #ff99cc, transparent)",
        }} />

        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 24px",
          height: "64px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "16px",
        }}>
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "default", flexShrink: 0 }}
          >
            <div style={{
              width: "36px", height: "36px",
              background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(255,107,157,0.4)",
              fontSize: "15px", fontWeight: 800, color: "white", letterSpacing: "-0.04em",
            }}>30</div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: textColor, letterSpacing: "-0.03em" }}>
              todo<span style={{ color: "#ff6b9d" }}>pro</span>
            </span>
          </motion.div>

          {/* Nav pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, justifyContent: "center" }}>
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onPageChange(item.id)}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "10px",
                    border: "none",
                    background: active
                      ? (isDark ? "rgba(255,107,157,0.15)" : "rgba(255,107,157,0.1)")
                      : "transparent",
                    color: active ? "#ff6b9d" : mutedColor,
                    cursor: "pointer",
                    fontSize: "13px", fontWeight: active ? 600 : 500,
                    transition: "all 0.18s ease",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = textColor;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = mutedColor;
                  }}
                >
                  <span style={{ fontSize: "11px" }}>{item.icon}</span>
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      style={{
                        position: "absolute", bottom: "-1px", left: "50%",
                        transform: "translateX(-50%)",
                        width: "20px", height: "2px",
                        background: "linear-gradient(90deg, #ff6b9d, #ff99cc)",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* Theme toggle */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: "36px", height: "36px",
                borderRadius: "10px", border: `1px solid ${border}`,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                cursor: "pointer", fontSize: "16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {isDark ? "☀️" : "🌙"}
            </motion.button>

            <NotificationBell />

            {/* Settings */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowSettings(true)}
              style={{
                width: "36px", height: "36px",
                borderRadius: "10px", border: `1px solid ${border}`,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                cursor: "pointer", fontSize: "15px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >⚙️</motion.button>

            {/* User / Login */}
            {isAuthenticated ? (
              <div ref={menuRef} style={{ position: "relative" }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "4px 10px 4px 4px",
                    borderRadius: "99px",
                    border: `1px solid ${border}`,
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    cursor: "pointer", color: textColor,
                    fontSize: "13px", fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 700, color: "white",
                  }}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.name?.split(" ")[0]}
                  </span>
                  <span style={{ fontSize: "8px", opacity: 0.6 }}>▼</span>
                </motion.button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: "absolute", top: "44px", right: 0,
                        width: "220px",
                        background: isDark ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.97)",
                        backdropFilter: "blur(16px)",
                        borderRadius: "14px",
                        border: `1px solid ${border}`,
                        overflow: "hidden",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
                        zIndex: 300,
                      }}
                    >
                      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}` }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: textColor }}>{user?.name}</div>
                        <div style={{ fontSize: "11px", color: mutedColor, marginTop: "2px" }}>{user?.email}</div>
                      </div>
                      <button
                        onClick={() => { setShowMenu(false); logout(); toast("Logged out 👋"); }}
                        style={{
                          width: "100%", padding: "12px 16px",
                          background: "none", border: "none",
                          color: "#f87171", cursor: "pointer",
                          fontSize: "13px", textAlign: "left", fontWeight: 500,
                          fontFamily: "inherit",
                        }}
                      >
                        🚪 Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAuth(true)}
                style={{
                  padding: "8px 18px",
                  background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
                  border: "none", borderRadius: "99px",
                  color: "white", cursor: "pointer",
                  fontSize: "13px", fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(255,107,157,0.35)",
                  fontFamily: "inherit",
                }}
              >
                Sign in
              </motion.button>
            )}
          </div>
        </div>
      </motion.nav>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <AppSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}