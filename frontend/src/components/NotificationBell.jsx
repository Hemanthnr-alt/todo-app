/**
 * NotificationBell.jsx
 * Fixed:
 *  - Unified localStorage key ("notifs") shared with Navbar NotifPanel & sendNotification()
 *  - Clean dropdown layout with proper type icons, read state, dismiss
 *  - timeAgo helper correctly handles both ISO strings and already-formatted strings
 *  - No more scrambled / stacked notification items
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

// ── Shared storage key (must match Navbar NotifPanel & sendNotification) ───────
export const NOTIFS_KEY = "notifs";

const SAMPLE_NOTIFS = [
  {
    id: "welcome",
    type: "reminder",
    title: "Welcome to TodoPro! 🚀",
    body: "Start by adding your first task",
    time: new Date().toISOString(),
    read: false,
  },
];

const TYPE_ICON = {
  due_today:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info, #3b82f6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  overdue:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger, #ef4444)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  task_completed: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  reminder:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  info:           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

function timeAgo(timeVal) {
  if (!timeVal) return "";
  // Already formatted (e.g. "09:15 AM") — return as-is
  if (typeof timeVal === "string" && !timeVal.includes("T") && !timeVal.match(/^\d{4}-/)) {
    return timeVal;
  }
  const diff = Date.now() - new Date(timeVal).getTime();
  if (isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function loadNotifs() {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    const parsed = JSON.parse(raw || "null");
    return Array.isArray(parsed) ? parsed : SAMPLE_NOTIFS;
  } catch {
    return SAMPLE_NOTIFS;
  }
}

function saveNotifs(list) {
  const trimmed = list.slice(0, 50);
  try { localStorage.setItem(NOTIFS_KEY, JSON.stringify(trimmed)); } catch {}
  return trimmed;
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [notifs, setNotifs] = useState(loadNotifs);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifs.filter(n => !n.read).length;

  const persist = useCallback((list) => {
    setNotifs(saveNotifs(list));
  }, []);

  // Poll for new task due/overdue notifications
  const check = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifs(SAMPLE_NOTIFS);
      return;
    }
    try {
      const res = await api.get("/tasks");
      const tasks = Array.isArray(res.data) ? res.data : [];
      const today = new Date().toISOString().split("T")[0];
      const dueToday = tasks.filter(x => x.dueDate === today && !x.completed);
      const overdue  = tasks.filter(x => x.dueDate && x.dueDate < today && !x.completed);

      setNotifs(prev => {
        let next = [...prev];
        let changed = false;
        const now = new Date().toISOString();

        if (dueToday.length > 0 && !next.some(n => n.type === "due_today" && n.date === today)) {
          next.unshift({
            id: `due_${Date.now()}`,
            type: "due_today",
            title: `${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today`,
            body: dueToday.slice(0, 3).map(x => x.title).join(", ") + (dueToday.length > 3 ? "…" : ""),
            time: now, date: today, read: false,
          });
          changed = true;
        }

        if (overdue.length > 0 && !next.some(n => n.type === "overdue" && n.date === today)) {
          next.unshift({
            id: `overdue_${Date.now()}`,
            type: "overdue",
            title: `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`,
            body: overdue.slice(0, 3).map(x => x.title).join(", ") + (overdue.length > 3 ? "…" : ""),
            time: now, date: today, read: false,
          });
          changed = true;
        }

        if (changed) {
          saveNotifs(next);
          return next;
        }
        return prev;
      });
    } catch {
      // silent
    }
  }, [isAuthenticated]);

  useEffect(() => {
    check();
    const iv = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [check]);

  // Sync if sendNotification() writes to localStorage from elsewhere
  useEffect(() => {
    const sync = () => setNotifs(loadNotifs());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Close on outside click
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const markRead   = id  => persist(notifs.map(n => n.id === id ? { ...n, read: true } : n));
  const markAll    = ()  => persist(notifs.map(n => ({ ...n, read: true })));
  const dismiss    = id  => persist(notifs.filter(n => n.id !== id));
  const clearAll   = ()  => persist([]);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) markAll();
  };

  // Theme colours
  const panelBg     = isDark ? "rgba(20,20,24,0.98)" : "rgba(255,255,255,0.98)";
  const borderColor = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textMuted   = isDark ? "rgba(241,245,249,0.42)" : "rgba(15,23,42,0.42)";
  const rowHover    = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const unreadBg    = isDark ? "rgba(var(--accent-rgb,255,122,89),0.07)" : "rgba(var(--accent-rgb,255,122,89),0.05)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={handleOpen}
        className="btn-reset"
        style={{
          position: "relative", width: "34px", height: "34px", borderRadius: "10px",
          border: `1px solid ${open ? "var(--accent)" : "var(--border)"}`,
          background: open ? "var(--accent-subtle)" : "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: open ? "var(--accent)" : "var(--text-secondary)",
          transition: "all 0.15s",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{
                position: "absolute", top: "-4px", right: "-4px",
                background: "var(--danger)", color: "#fff",
                fontSize: "9px", fontWeight: 800,
                minWidth: "16px", height: "16px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", border: `2px solid var(--bg)`,
              }}>
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            style={{
              position: "absolute", top: "42px", right: 0,
              width: "320px", maxHeight: "420px",
              background: panelBg, backdropFilter: "blur(20px)",
              borderRadius: "16px", border: `1px solid ${borderColor}`,
              boxShadow: "0 16px 48px rgba(0,0,0,0.20)",
              overflow: "hidden", zIndex: 2000,
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "12px 14px 10px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `1px solid ${borderColor}`,
              flexShrink: 0,
            }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 700, color: textPrimary }}>
                  Notifications
                </span>
                {unread > 0 && (
                  <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: 700, color: "var(--accent)" }}>
                    {unread} new
                  </span>
                )}
              </div>
              {notifs.length > 0 && (
                <button onClick={clearAll} className="btn-reset"
                  style={{ fontSize: "11px", fontWeight: 600, color: textMuted, cursor: "pointer" }}>
                  Clear all
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 20px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔕</div>
                  <p style={{ fontSize: "12px", color: textMuted, margin: 0 }}>All caught up!</p>
                </div>
              ) : (
                notifs.map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)}
                    style={{
                      display: "flex", gap: "10px", padding: "10px 14px",
                      cursor: "pointer", alignItems: "flex-start",
                      background: n.read ? "transparent" : unreadBg,
                      borderBottom: `1px solid ${borderColor}`,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : unreadBg}
                  >
                    {/* Icon */}
                    <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px", lineHeight: 1 }}>
                      {TYPE_ICON[n.type] || "📋"}
                    </span>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: textPrimary, marginBottom: "2px", lineHeight: 1.3 }}>
                        {n.title}
                      </div>
                      {(n.body || n.message) && (
                        <div style={{ fontSize: "11px", color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>
                          {n.body || n.message}
                        </div>
                      )}
                      <div style={{ fontSize: "10px", color: textMuted }}>
                        {timeAgo(n.time)}
                      </div>
                    </div>

                    {/* Right: unread dot + dismiss */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                      {!n.read && (
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)" }} />
                      )}
                      <button onClick={e => { e.stopPropagation(); dismiss(n.id); }} className="btn-reset"
                        style={{ fontSize: "13px", color: textMuted, lineHeight: 1, padding: "1px" }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}