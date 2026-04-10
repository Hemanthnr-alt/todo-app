import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AppSettings from "./AppSettings";
import AuthModal from "./AuthModal";
import Portal from "./Portal";

const Icons = {
  Today: ({ size = 22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Habits: ({ size = 22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      <circle cx="19" cy="5" r="2.5" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Tasks: ({ size = 22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Timer: ({ size = 22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 3" />
      <path d="M9 3h6" />
      <path d="M12 3v2" />
    </svg>
  ),
  Trophy: ({ size = 22, active }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M6 5h12v7a6 6 0 0 1-12 0V5z" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  ),
  Bell: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Settings: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Sun: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Logout: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: "today", label: "Today", Icon: Icons.Today },
  { id: "habits", label: "Habits", Icon: Icons.Habits },
  { id: "tasks", label: "Tasks", Icon: Icons.Tasks },
  { id: "timer", label: "Timer", Icon: Icons.Timer },
  { id: "rewards", label: "Rewards", Icon: Icons.Trophy },
];

function Sheet({ children, onClose }) {
  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 8500, background: "rgba(5, 10, 16, 0.56)", backdropFilter: "blur(8px)" }}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="glass-panel"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 8501,
          borderRadius: "28px 28px 0 0",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div style={{ width: "46px", height: "4px", borderRadius: "999px", background: "var(--border-strong)" }} />
        </div>
        {children}
      </motion.div>
    </Portal>
  );
}

function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("notifs") || "[]");
    } catch {
      return [];
    }
  });
  const unread = notifs.filter((item) => !item.read).length;
  const clearAll = () => {
    setNotifs([]);
    localStorage.setItem("notifs", "[]");
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: "4px 20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "20px", fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Notifications</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              {unread > 0 ? `${unread} unread updates` : "Everything is quiet right now"}
            </div>
          </div>
          <button onClick={clearAll} className="btn-reset" style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 700 }}>
            Clear all
          </button>
        </div>
        {notifs.length === 0 ? (
          <div className="glass-tile" style={{ borderRadius: "22px", padding: "28px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "34px", marginBottom: "8px" }}>•</div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "4px" }}>All caught up</div>
            <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>New reminders and streak updates will show up here.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {notifs.map((item, index) => (
              <div
                key={index}
                className="glass-tile"
                style={{
                  borderRadius: "18px",
                  padding: "14px",
                  borderColor: item.read ? "var(--border)" : "var(--accent)",
                  boxShadow: item.read ? "var(--shadow-soft)" : "var(--shadow-glow)",
                }}
              >
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "14px" }}>{item.title}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px", lineHeight: 1.5 }}>{item.body}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "6px" }}>{item.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function MobileMenuSheet({ onClose, user, logout, toggleTheme, isDark, onOpenSettings, accent }) {
  const items = [
    { Icon: isDark ? Icons.Sun : Icons.Moon, label: isDark ? "Switch to light mode" : "Switch to dark mode", action: () => { toggleTheme(); onClose(); } },
    { Icon: Icons.Settings, label: "Open settings", action: () => { onOpenSettings(); onClose(); } },
    { Icon: Icons.Logout, label: "Log out", danger: true, action: () => { logout(); toast("See you soon."); onClose(); } },
  ];

  return (
    <Sheet onClose={onClose}>
      {user && (
        <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "8px 20px 16px" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "18px",
              background: `linear-gradient(135deg, ${accent}, var(--accent-hover))`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              boxShadow: "var(--shadow-glow)",
            }}
          >
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{user.name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{user.email}</div>
          </div>
        </div>
      )}
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="glass-tile"
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: "18px",
              color: item.danger ? "var(--danger)" : "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
            }}
          >
            <item.Icon size={18} />
            {item.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export default function Navbar({ activePage, onPageChange }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme, accent } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showMenu) return undefined;
    const closeOnOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [showMenu]);

  useEffect(() => {
    const updateUnread = () => {
      try {
        const total = JSON.parse(localStorage.getItem("notifs") || "[]").filter((item) => !item.read).length;
        setUnread(total);
      } catch {
        setUnread(0);
      }
    };
    updateUnread();
    const interval = setInterval(updateUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  const toolBtn = {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    background: "var(--surface-raised)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-primary)",
    position: "relative",
    backdropFilter: "blur(14px)",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  };

  return (
    <>
      <motion.nav
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 24, stiffness: 240, delay: 0.05 }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 300,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "12px 16px 0" }}>
          <div
            className="glass-panel"
            style={{
              borderRadius: "24px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: scrolled ? "var(--shadow-card)" : "var(--shadow-soft)",
            }}
          >
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => onPageChange("today")}
              style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${accent}, var(--accent-hover))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 800,
                  letterSpacing: "-0.06em",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                30
              </div>
              <div className="desktop-only">
                <div style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", fontSize: "17px" }}>Thirty</div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Focus beautifully</div>
              </div>
            </motion.div>

            <div className="desktop-nav" style={{ display: "flex", gap: "6px", flex: 1, justifyContent: "center" }}>
              {NAV_ITEMS.map((item) => {
                const active = activePage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onPageChange(item.id)}
                    className="btn-reset"
                    style={{
                      position: "relative",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      color: active ? "var(--text-primary)" : "var(--text-muted)",
                      background: active ? "var(--accent-soft)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                      fontWeight: active ? 700 : 600,
                    }}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "inherit",
                          background: "linear-gradient(135deg, var(--accent-subtle), transparent)",
                          border: "1px solid var(--border-active)",
                        }}
                      />
                    )}
                    <span style={{ position: "relative" }}>
                      <item.Icon size={16} active={active} />
                    </span>
                    <span style={{ position: "relative" }}>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={toggleTheme} className="desktop-only" style={toolBtn}>
                {isDark ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />}
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowNotifs(true)} style={toolBtn}>
                <Icons.Bell size={16} />
                {unread > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "7px",
                      right: "7px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                      boxShadow: "0 0 0 4px rgba(255,255,255,0.06)",
                    }}
                  />
                )}
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSettings(true)} className="desktop-only" style={toolBtn}>
                <Icons.Settings size={16} />
              </motion.button>

              {isAuthenticated ? (
                <div ref={menuRef} style={{ position: "relative" }}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowMenu((value) => !value)}
                    className="glass-tile desktop-only"
                    style={{
                      padding: "4px 6px 4px 4px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${accent}, var(--accent-hover))`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        boxShadow: "var(--shadow-glow)",
                      }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 700, paddingRight: "8px" }}>
                      {user?.name?.split(" ")[0]}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        className="glass-panel"
                        style={{
                          position: "absolute",
                          top: "52px",
                          right: 0,
                          width: "240px",
                          borderRadius: "22px",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{user?.name}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>{user?.email}</div>
                        </div>
                        {[
                          { Icon: isDark ? Icons.Sun : Icons.Moon, label: isDark ? "Light mode" : "Dark mode", action: () => { setShowMenu(false); toggleTheme(); } },
                          { Icon: Icons.Settings, label: "Settings", action: () => { setShowMenu(false); setShowSettings(true); } },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={item.action}
                            className="btn-reset"
                            style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}
                          >
                            <item.Icon size={16} />
                            {item.label}
                          </button>
                        ))}
                        <div style={{ borderTop: "1px solid var(--border)" }}>
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              logout();
                              toast("See you soon.");
                            }}
                            className="btn-reset"
                            style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px", color: "var(--danger)", fontSize: "13px", fontWeight: 700 }}
                          >
                            <Icons.Logout size={16} />
                            Log out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAuth(true)}
                  className="btn-primary desktop-only"
                  style={{ height: "42px", padding: "0 18px" }}
                >
                  Sign in
                </motion.button>
              )}

              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowMobile(true)} className="mobile-only" style={toolBtn}>
                <span style={{ fontSize: "18px", lineHeight: 1 }}>⋯</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div
        className="mobile-bottom-nav glass-panel"
        style={{
          position: "fixed",
          left: "10px",
          right: "10px",
          bottom: "10px",
          zIndex: 300,
          borderRadius: "24px",
          display: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: "62px", padding: "0 4px" }}>
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => onPageChange(item.id)}
                className="btn-reset"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  padding: "8px 2px",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  position: "relative",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-pill"
                    style={{
                      position: "absolute",
                      inset: "4px 8px",
                      borderRadius: "16px",
                      background: "var(--accent-soft)",
                      border: "1px solid var(--accent-subtle)",
                    }}
                  />
                )}
                <span style={{ position: "relative" }}>
                  <item.Icon size={20} active={active} />
                </span>
                <span style={{ position: "relative", fontSize: "10px", fontWeight: 700 }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>{showNotifs && <NotifPanel onClose={() => setShowNotifs(false)} />}</AnimatePresence>
      <AnimatePresence>
        {showMobile && (
          <MobileMenuSheet
            onClose={() => setShowMobile(false)}
            user={user}
            logout={logout}
            toggleTheme={toggleTheme}
            isDark={isDark}
            onOpenSettings={() => setShowSettings(true)}
            accent={accent}
          />
        )}
      </AnimatePresence>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <AppSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <style>{`
        .mobile-bottom-nav,
        .mobile-only {
          display: none !important;
        }

        @media (max-width: 768px) {
          .desktop-nav,
          .desktop-only {
            display: none !important;
          }

          .mobile-bottom-nav {
            display: block !important;
          }

          .mobile-only {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
