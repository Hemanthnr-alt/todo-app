import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthModal from "./AuthModal";
import AppSettings from "./AppSettings";
import NotificationBell from "./NotificationBell";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { id: "today",      label: "Today",      icon: "✦"  },
  { id: "tasks",      label: "Tasks",      icon: "▣"  },
  { id: "calendar",   label: "Calendar",   icon: "◫"  },
  { id: "habits",     label: "Habits",     icon: "⟳"  },
  { id: "categories", label: "Categories", icon: "◈"  },
];

export default function Navbar({ activePage, onPageChange }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showAuth,     setShowAuth]     = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
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

  const handlePageChange = (id) => {
    onPageChange(id);
  };

  const navBg  = isDark
    ? scrolled ? "rgba(8,11,20,0.97)" : "rgba(8,11,20,0.88)"
    : scrolled ? "rgba(248,250,252,0.97)" : "rgba(248,250,252,0.88)";
  const border     = isDark ? "rgba(255,107,157,0.1)"  : "rgba(255,107,157,0.18)";
  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.48)" : "rgba(15,23,42,0.45)";

  const toolBtn = {
    width: "36px", height: "36px", borderRadius: "10px",
    border: `1px solid ${border}`,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    cursor: "pointer", fontSize: "15px",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s", flexShrink: 0, color: textColor,
  };

  return (
    <>
      {/* ── TOP NAV (desktop + mobile header) ── */}
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 220, delay: 0.05 }}
        style={{
          position: "sticky", top: 0, zIndex: 300,
          background: navBg,
          backdropFilter: "blur(24px) saturate(1.8)",
          borderBottom: `1px solid ${border}`,
          fontFamily: "'DM Sans', sans-serif",
          transition: "background 0.3s",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.08)" : "none",
        }}
      >
        {/* gradient top line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg,transparent 0%,#ff6b9d 30%,#ff99cc 60%,transparent 100%)",
          opacity: 0.8,
        }} />

        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          padding: "0 16px", height: "60px",
          display: "flex", alignItems: "center", gap: "0",
        }}>
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => handlePageChange("today")}
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flexShrink: 0, marginRight: "16px" }}
          >
            <div style={{
              width: "32px", height: "32px",
              background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
              borderRadius: "9px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(255,107,157,0.35)",
              fontSize: "14px", fontWeight: 900, color: "white", flexShrink: 0,
            }}>30</div>
            <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "-0.04em", color: "#ff6b9d", userSelect: "none" }}>
              30
            </span>
          </motion.div>

          {/* Desktop nav pills */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1, justifyContent: "center" }}>
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handlePageChange(item.id)}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "7px 11px", borderRadius: "10px", border: "none",
                    background: active
                      ? (isDark ? "rgba(255,107,157,0.14)" : "rgba(255,107,157,0.1)")
                      : "transparent",
                    color: active ? "#ff6b9d" : mutedColor,
                    cursor: "pointer", fontSize: "12px", fontWeight: active ? 700 : 500,
                    transition: "all 0.16s", fontFamily: "inherit", whiteSpace: "nowrap", outline: "none",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = textColor; e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = mutedColor; e.currentTarget.style.background = "transparent"; }}}
                >
                  <span style={{ fontSize: "10px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {active && (
                    <motion.div layoutId="nav-underline" style={{
                      position: "absolute", bottom: "-1px", left: "50%",
                      transform: "translateX(-50%)",
                      width: "18px", height: "2px",
                      background: "linear-gradient(90deg,#ff6b9d,#ff99cc)",
                      borderRadius: "2px",
                    }} />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "auto" }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
              title={isDark ? "Light mode" : "Dark mode"}
              className="hide-mobile"
              style={toolBtn}>
              {isDark ? "☀️" : "🌙"}
            </motion.button>

            <NotificationBell />

            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowSettings(true)}
              title="Settings" className="hide-mobile" style={toolBtn}>⚙️</motion.button>

            <div className="hide-mobile" style={{ width: "1px", height: "20px", background: border, margin: "0 2px" }} />

            {isAuthenticated ? (
              <div ref={menuRef} style={{ position: "relative" }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 8px 4px 4px", borderRadius: "99px",
                    border: `1px solid ${showMenu ? "rgba(255,107,157,0.4)" : border}`,
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    cursor: "pointer", color: textColor,
                    fontSize: "12px", fontWeight: 600, fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 800, color: "white", flexShrink: 0,
                  }}>
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="hide-mobile" style={{ maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.name?.split(" ")[0]}
                  </span>
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
                        borderRadius: "16px", border: `1px solid ${border}`,
                        overflow: "hidden",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
                        zIndex: 400,
                      }}
                    >
                      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "12px",
                          background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
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

                      {[
                        { icon: isDark ? "☀️" : "🌙", label: isDark ? "Light Mode" : "Dark Mode", action: () => { setShowMenu(false); toggleTheme(); } },
                        { icon: "⚙️", label: "Settings", action: () => { setShowMenu(false); setShowSettings(true); } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} style={{
                          width: "100%", padding: "11px 16px", background: "none", border: "none",
                          color: textColor, cursor: "pointer", fontSize: "13px", textAlign: "left",
                          fontFamily: "inherit", fontWeight: 500,
                          display: "flex", alignItems: "center", gap: "10px", transition: "background 0.12s",
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
                            width: "100%", padding: "11px 16px", background: "none", border: "none",
                            color: "#f87171", cursor: "pointer", fontSize: "13px", textAlign: "left",
                            fontWeight: 500, fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: "10px", transition: "background 0.12s",
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
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setShowAuth(true)}
                style={{
                  padding: "7px 14px",
                  background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                  border: "none", borderRadius: "99px", color: "white",
                  cursor: "pointer", fontSize: "12px", fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(255,107,157,0.35)",
                  fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >Sign in</motion.button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300,
        background: navBg,
        backdropFilter: "blur(24px) saturate(1.8)",
        borderTop: `1px solid ${border}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          height: "64px", padding: "0 4px",
        }}>
          {NAV_ITEMS.map(item => {
            const active = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.88 }}
                onClick={() => handlePageChange(item.id)}
                style={{
                  flex: 1,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "4px", padding: "6px 2px",
                  background: "none", border: "none", cursor: "pointer",
                  color: active ? "#ff6b9d" : mutedColor,
                  fontFamily: "inherit", transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    style={{
                      position: "absolute", top: 0, left: "15%", right: "15%",
                      height: "2px", borderRadius: "0 0 3px 3px",
                      background: "linear-gradient(90deg,#ff6b9d,#ff99cc)",
                    }}
                  />
                )}
                <span style={{
                  fontSize: "20px", lineHeight: 1,
                  filter: active ? "drop-shadow(0 0 6px rgba(255,107,157,0.6))" : "none",
                  transition: "filter 0.2s",
                }}>{item.icon}</span>
                <span style={{
                  fontSize: "10px", fontWeight: active ? 700 : 500,
                  letterSpacing: "0.01em",
                }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <AppSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <style>{`
        .mobile-bottom-nav { display: none; }

        @media (max-width: 768px) {
          .desktop-nav  { display: none !important; }
          .hide-mobile  { display: none !important; }
          .mobile-bottom-nav { display: block !important; }
        }
      `}</style>
    </>
  );
}