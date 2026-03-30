import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthModal from "./AuthModal";
import AppSettings from "./AppSettings";
import Portal from "./Portal";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { id: "today",      label: "Today",      icon: "✦" },
  { id: "tasks",      label: "Tasks",      icon: "▣" },
  { id: "calendar",   label: "Calendar",   icon: "◫" },
  { id: "habits",     label: "Habits",     icon: "⟳" },
  { id: "categories", label: "Categories", icon: "◈" },
];

// ── Notification Bell ─────────────────────────────────────────────────────────
function MobileNotifPanel({ onClose, isDark, border, textColor, mutedColor }) {
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notifs") || "[]"); } catch { return []; }
  });
  const unread = notifs.filter(n => !n.read).length;

  const markAll = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    setNotifs(updated);
    localStorage.setItem("notifs", JSON.stringify(updated));
  };
  const clearAll = () => { setNotifs([]); localStorage.setItem("notifs", "[]"); };

  const bg = isDark ? "rgba(8,11,20,0.99)" : "rgba(248,250,252,0.99)";

  return (
    <Portal>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 8500, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
      />
      {/* Panel — bottom sheet on mobile */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 8501,
          background: bg,
          borderRadius: "20px 20px 0 0",
          border: `1px solid ${border}`,
          maxHeight: "70vh", overflowY: "auto",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px 14px" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: textColor }}>
            Notifications {unread > 0 && <span style={{ fontSize: "12px", color: "#ff6b9d", fontWeight: 600 }}>({unread} new)</span>}
          </div>
          <button onClick={clearAll} style={{ background: "none", border: "none", color: "#ff6b9d", cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "inherit" }}>
            Clear all
          </button>
        </div>

        <div style={{ padding: "0 12px 12px" }}>
          {notifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔔</div>
              <p style={{ fontSize: "14px", color: mutedColor }}>No notifications yet</p>
            </div>
          ) : notifs.map((n, i) => (
            <div key={i} style={{
              padding: "12px 14px", borderRadius: "12px", marginBottom: "8px",
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${n.read ? border : "rgba(255,107,157,0.3)"}`,
              opacity: n.read ? 0.65 : 1,
            }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: textColor }}>{n.title}</div>
              <div style={{ fontSize: "12px", color: mutedColor, marginTop: "3px" }}>{n.body}</div>
              <div style={{ fontSize: "10px", color: mutedColor, marginTop: "4px" }}>{n.time}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </Portal>
  );
}

// ── Settings / Theme bottom sheet ─────────────────────────────────────────────
function MobileSettingsSheet({ onClose, isDark, toggleTheme, border, textColor, mutedColor, user, logout, onOpenSettings }) {
  const bg = isDark ? "rgba(8,11,20,0.99)" : "rgba(248,250,252,0.99)";

  const items = [
    { icon: isDark ? "☀️" : "🌙", label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode", action: () => { toggleTheme(); onClose(); } },
    { icon: "⚙️", label: "Settings",  action: () => { onOpenSettings(); onClose(); } },
    { icon: "🚪", label: "Log out",   action: () => { logout(); toast("See you soon 👋"); onClose(); }, danger: true },
  ];

  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 8500, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 8501,
          background: bg, borderRadius: "20px 20px 0 0",
          border: `1px solid ${border}`,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
        </div>

        {/* User info */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px 16px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "14px", flexShrink: 0,
              background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: 800, color: "white",
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: textColor }}>{user?.name}</div>
              <div style={{ fontSize: "12px", color: mutedColor }}>{user?.email}</div>
            </div>
          </div>
        )}

        <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map(item => (
            <button key={item.label} onClick={item.action} style={{
              width: "100%", padding: "14px 16px",
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${border}`,
              borderRadius: "14px", color: item.danger ? "#f43f5e" : textColor,
              cursor: "pointer", fontSize: "15px", fontWeight: 600,
              fontFamily: "inherit", textAlign: "left",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </motion.div>
    </Portal>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar({ activePage, onPageChange }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme }           = useTheme();
  const [showAuth,       setShowAuth]       = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);
  const [showMenu,       setShowMenu]       = useState(false);
  const [showNotifs,     setShowNotifs]     = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [unreadCount,    setUnreadCount]    = useState(0);
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

  // Check unread notifications
  useEffect(() => {
    const check = () => {
      try {
        const notifs = JSON.parse(localStorage.getItem("notifs") || "[]");
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch { setUnreadCount(0); }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, []);

  const navBg      = isDark
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
    position: "relative",
  };

  return (
    <>
      {/* ── TOP BAR ── */}
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
        {/* Gradient top line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg,transparent,#ff6b9d 30%,#ff99cc 60%,transparent)",
          opacity: 0.8,
        }} />

        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          padding: "0 16px", height: "60px",
          display: "flex", alignItems: "center",
        }}>
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => onPageChange("today")}
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flexShrink: 0, marginRight: "16px" }}
          >
            <div style={{
              width: "32px", height: "32px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
              borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(255,107,157,0.35)",
              fontSize: "14px", fontWeight: 900, color: "white", flexShrink: 0,
            }}>30</div>
            <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "-0.04em", color: "#ff6b9d", userSelect: "none" }}>30</span>
          </motion.div>

          {/* Desktop nav pills */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1, justifyContent: "center" }}>
            {NAV_ITEMS.map(item => {
              const active = activePage === item.id;
              return (
                <motion.button key={item.id} whileTap={{ scale: 0.94 }} onClick={() => onPageChange(item.id)}
                  style={{
                    position: "relative", display: "flex", alignItems: "center", gap: "5px",
                    padding: "7px 11px", borderRadius: "10px", border: "none",
                    background: active ? (isDark ? "rgba(255,107,157,0.14)" : "rgba(255,107,157,0.1)") : "transparent",
                    color: active ? "#ff6b9d" : mutedColor,
                    cursor: "pointer", fontSize: "12px", fontWeight: active ? 700 : 500,
                    transition: "all 0.16s", fontFamily: "inherit", whiteSpace: "nowrap", outline: "none",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = textColor; e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = mutedColor; e.currentTarget.style.background = "transparent"; }}}
                >
                  <span style={{ fontSize: "10px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {active && <motion.div layoutId="nav-underline" style={{ position: "absolute", bottom: "-1px", left: "50%", transform: "translateX(-50%)", width: "18px", height: "2px", background: "linear-gradient(90deg,#ff6b9d,#ff99cc)", borderRadius: "2px" }} />}
                </motion.button>
              );
            })}
          </div>

          {/* Right tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "auto" }}>

            {/* Theme — desktop only */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
              className="desktop-only"
              style={toolBtn}>
              {isDark ? "☀️" : "🌙"}
            </motion.button>

            {/* Notification bell — all screens */}
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setShowNotifs(true)}
              style={{ ...toolBtn }}>
              🔔
              {unreadCount > 0 && (
                <div style={{
                  position: "absolute", top: "4px", right: "4px",
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "#f43f5e",
                }} />
              )}
            </motion.button>

            {/* Settings — desktop only */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowSettings(true)}
              className="desktop-only" style={toolBtn}>⚙️</motion.button>

            <div className="desktop-only" style={{ width: "1px", height: "20px", background: border, margin: "0 2px" }} />

            {/* User button / Sign in */}
            {isAuthenticated ? (
              <div ref={menuRef} style={{ position: "relative" }}>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowMenu(!showMenu)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 8px 4px 4px", borderRadius: "99px",
                    border: `1px solid ${showMenu ? "rgba(255,107,157,0.4)" : border}`,
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    cursor: "pointer", color: textColor,
                    fontSize: "12px", fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
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
                  {/* Name hidden on mobile */}
                  <span className="desktop-only" style={{ maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.name?.split(" ")[0]}
                  </span>
                </motion.button>

                {/* Desktop dropdown */}
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        position: "absolute", top: "46px", right: 0, width: "230px",
                        background: isDark ? "rgba(10,16,30,0.98)" : "rgba(255,255,255,0.98)",
                        backdropFilter: "blur(20px)", borderRadius: "16px",
                        border: `1px solid ${border}`, overflow: "hidden",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.2)", zIndex: 400,
                      }}
                    >
                      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 800, color: "white", flexShrink: 0 }}>
                          {user?.name?.charAt(0)?.toUpperCase()}
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
                          fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", gap: "10px", transition: "background 0.12s",
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <span>{item.icon}</span>{item.label}
                        </button>
                      ))}
                      <div style={{ borderTop: `1px solid ${border}` }}>
                        <button onClick={() => { setShowMenu(false); logout(); toast("See you soon 👋"); }}
                          style={{ width: "100%", padding: "11px 16px", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "13px", textAlign: "left", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "10px" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.07)"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <span>🚪</span>Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setShowAuth(true)}
                style={{
                  padding: "7px 14px", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                  border: "none", borderRadius: "99px", color: "white",
                  cursor: "pointer", fontSize: "12px", fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(255,107,157,0.35)", fontFamily: "inherit", whiteSpace: "nowrap",
                }}>Sign in</motion.button>
            )}

            {/* Mobile: 3-dot menu button (only on mobile, only when logged in) */}
            {isAuthenticated && (
              <motion.button whileTap={{ scale: 0.9 }}
                className="mobile-only"
                onClick={() => setShowMobileMenu(true)}
                style={{ ...toolBtn, fontSize: "18px" }}>
                ···
              </motion.button>
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
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: "64px", padding: "0 4px" }}>
          {NAV_ITEMS.map(item => {
            const active = activePage === item.id;
            return (
              <motion.button key={item.id} whileTap={{ scale: 0.88 }}
                onClick={() => onPageChange(item.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "4px", padding: "6px 2px",
                  background: "none", border: "none", cursor: "pointer",
                  color: active ? "#ff6b9d" : mutedColor,
                  fontFamily: "inherit", transition: "all 0.15s", position: "relative",
                }}
              >
                {active && (
                  <motion.div layoutId="mobile-nav-indicator" style={{
                    position: "absolute", top: 0, left: "15%", right: "15%",
                    height: "2px", borderRadius: "0 0 3px 3px",
                    background: "linear-gradient(90deg,#ff6b9d,#ff99cc)",
                  }} />
                )}
                <span style={{
                  fontSize: "20px", lineHeight: 1,
                  filter: active ? "drop-shadow(0 0 6px rgba(255,107,157,0.6))" : "none",
                }}>{item.icon}</span>
                <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── MODALS / SHEETS ── */}
      <AnimatePresence>
        {showNotifs && (
          <MobileNotifPanel
            key="notifs"
            onClose={() => setShowNotifs(false)}
            isDark={isDark} border={border}
            textColor={textColor} mutedColor={mutedColor}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMobileMenu && (
          <MobileSettingsSheet
            key="mobile-menu"
            onClose={() => setShowMobileMenu(false)}
            isDark={isDark} toggleTheme={toggleTheme}
            border={border} textColor={textColor} mutedColor={mutedColor}
            user={user} logout={logout}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </AnimatePresence>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <AppSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <style>{`
        .mobile-bottom-nav { display: none; }
        .mobile-only       { display: none !important; }

        @media (max-width: 768px) {
          .desktop-nav    { display: none !important; }
          .desktop-only   { display: none !important; }
          .mobile-bottom-nav { display: block !important; }
          .mobile-only    { display: flex !important; }
        }
      `}</style>
    </>
  );
}