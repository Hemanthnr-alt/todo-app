import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthModal from "./AuthModal";
import AppSettings from "./AppSettings";
import NotificationBell from "./NotificationBell";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { id: "today",      label: "Today",      icon: "✦",  desc: "Daily view" },
  { id: "tasks",      label: "Tasks",      icon: "▣",  desc: "All tasks" },
  { id: "calendar",   label: "Calendar",   icon: "◫",  desc: "Schedule" },
  { id: "habits",     label: "Habits",     icon: "⟳",  desc: "Daily habits" },
  { id: "categories", label: "Categories", icon: "◈",  desc: "Organize" },
];

export default function Navbar({ activePage, onPageChange }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMenu]);

  const bg = isDark
    ? scrolled ? "rgba(8,11,20,0.96)" : "rgba(8,11,20,0.85)"
    : scrolled ? "rgba(248,250,252,0.96)" : "rgba(248,250,252,0.85)";
  const border = isDark ? "rgba(255,107,157,0.1)" : "rgba(255,107,157,0.18)";
  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.48)" : "rgba(15,23,42,0.45)";

  const toolBtnStyle = {
    width: "36px", height: "36px", borderRadius: "10px",
    border: `1px solid ${border}`,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    cursor: "pointer", fontSize: "15px",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  };

  return (
    <>
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 220, delay: 0.05 }}
        style={{
          position: "sticky", top: 0, zIndex: 200,
          background: bg,
          backdropFilter: "blur(24px) saturate(1.8)",
          borderBottom: `1px solid ${border}`,
          fontFamily: "'DM Sans', sans-serif",
          transition: "background 0.3s",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.08)" : "none",
        }}
      >
        {/* Gradient top line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent 0%, #ff6b9d 30%, #ff99cc 60%, transparent 100%)",
          opacity: 0.8,
        }} />

        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          padding: "0 20px",
          height: "62px",
          display: "flex", alignItems: "center", gap: "0",
        }}>

          {/* ── Logo ── */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPageChange("today")}
            style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer", flexShrink: 0, marginRight: "24px" }}
          >
            <div style={{
              width: "34px", height: "34px",
              background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 18px rgba(255,107,157,0.35)",
              fontSize: "16px", fontWeight: 900, color: "white", letterSpacing: "-0.04em",
              flexShrink: 0,
            }}>30</div>
            <span style={{ fontSize: "17px", fontWeight: 900, letterSpacing: "-0.04em", color: textColor, userSelect: "none" }}>
              <span style={{ color: "#ff6b9d" }}>30</span>
            </span>
          </motion.div>

          {/* ── Nav Pills ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1, justifyContent: "center" }}>
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onPageChange(item.id)}
                  title={item.desc}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "7px 13px",
                    borderRadius: "10px",
                    border: "none",
                    background: active
                      ? (isDark ? "rgba(255,107,157,0.14)" : "rgba(255,107,157,0.1)")
                      : "transparent",
                    color: active ? "#ff6b9d" : mutedColor,
                    cursor: "pointer",
                    fontSize: "13px", fontWeight: active ? 700 : 500,
                    transition: "all 0.16s",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    outline: "none",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = textColor; e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = mutedColor; e.currentTarget.style.background = "transparent"; }}}
                >
                  <span style={{ fontSize: "10px", lineHeight: 1 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-underline"
                      style={{
                        position: "absolute", bottom: "-1px", left: "50%",
                        transform: "translateX(-50%)",
                        width: "18px", height: "2px",
                        background: "linear-gradient(90deg, #ff6b9d, #ff99cc)",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* ── Right tools ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "24px" }}>

            {/* Theme toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              style={toolBtnStyle}
            >
              {isDark ? "☀️" : "🌙"}
            </motion.button>

            <NotificationBell />

            {/* Settings */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(true)}
              title="Settings"
              style={{
                ...toolBtnStyle,
                background: showSettings ? "rgba(255,107,157,0.12)" : toolBtnStyle.background,
                borderColor: showSettings ? "rgba(255,107,157,0.4)" : border,
                color: showSettings ? "#ff6b9d" : textColor,
              }}
            >⚙️</motion.button>

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", background: border, margin: "0 4px" }} />

            {/* User / Login */}
            {isAuthenticated ? (
              <div ref={menuRef} style={{ position: "relative" }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    display: "flex", alignItems: "center", gap: "7px",
                    padding: "4px 10px 4px 4px",
                    borderRadius: "99px",
                    border: `1px solid ${showMenu ? "rgba(255,107,157,0.4)" : border}`,
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    cursor: "pointer", color: textColor,
                    fontSize: "13px", fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 800, color: "white", flexShrink: 0,
                  }}>
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span style={{ maxWidth: "72px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.name?.split(" ")[0]}
                  </span>
                  <span style={{ fontSize: "8px", opacity: 0.5, transition: "transform 0.2s", transform: showMenu ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>▼</span>
                </motion.button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        position: "absolute", top: "46px", right: 0,
                        width: "230px",
                        background: isDark ? "rgba(10,16,30,0.98)" : "rgba(255,255,255,0.98)",
                        backdropFilter: "blur(20px)",
                        borderRadius: "16px",
                        border: `1px solid ${border}`,
                        overflow: "hidden",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
                        zIndex: 300,
                      }}
                    >
                      {/* User info */}
                      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "12px",
                          background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "15px", fontWeight: 800, color: "white", flexShrink: 0,
                        }}>
                          {user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
                          <div style={{ fontSize: "11px", color: mutedColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                        </div>
                      </div>

                      {/* Menu items */}
                      {[
                        { icon: "⚙️", label: "Settings", action: () => { setShowMenu(false); setShowSettings(true); } },
                        { icon: "📊", label: "Statistics", action: () => { setShowMenu(false); onPageChange("tasks"); } },
                      ].map((item) => (
                        <button key={item.label} onClick={item.action} style={{
                          width: "100%", padding: "11px 16px",
                          background: "none", border: "none",
                          color: textColor, cursor: "pointer",
                          fontSize: "13px", textAlign: "left",
                          fontFamily: "inherit", fontWeight: 500,
                          display: "flex", alignItems: "center", gap: "10px",
                          transition: "background 0.12s",
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <span style={{ fontSize: "14px" }}>{item.icon}</span> {item.label}
                        </button>
                      ))}

                      <div style={{ borderTop: `1px solid ${border}` }}>
                        <button
                          onClick={() => { setShowMenu(false); logout(); toast("See you soon 👋"); }}
                          style={{
                            width: "100%", padding: "11px 16px",
                            background: "none", border: "none",
                            color: "#f87171", cursor: "pointer",
                            fontSize: "13px", textAlign: "left", fontWeight: 500,
                            fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: "10px",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.07)"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <span>🚪</span> Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowAuth(true)}
                style={{
                  padding: "8px 18px",
                  background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
                  border: "none", borderRadius: "99px",
                  color: "white", cursor: "pointer",
                  fontSize: "13px", fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(255,107,157,0.35)",
                  fontFamily: "inherit",
                  letterSpacing: "0.01em",
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
