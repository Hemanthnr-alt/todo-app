import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

const SAMPLE_NOTIFS = [
  { id: "welcome", type: "reminder", title: "Welcome to TodoPro! 🚀", message: "Start by adding your first task", time: "Just now", read: false },
];

const TYPE_ICON = { due_today: "📅", overdue: "⚠️", task_completed: "✅", reminder: "🔔", info: "💡" };

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { token, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [notifs, setNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tp_notifs") || "null") || SAMPLE_NOTIFS;
    } catch {
      return SAMPLE_NOTIFS;
    }
  });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifs.filter((n) => !n.read).length;

  const saveNotifs = (list) => {
    const trimmed = list.slice(0, 50); // cap at 50
    setNotifs(trimmed);
    localStorage.setItem("tp_notifs", JSON.stringify(trimmed));
  };

  const check = useCallback(async () => {
    if (!isAuthenticated) { setNotifs(SAMPLE_NOTIFS); return; }
    try {
      const res = await api.get("/tasks");
      const tasks = res.data;
      const today = new Date().toISOString().split("T")[0];
      const dueToday = tasks.filter((x) => x.dueDate === today && !x.completed);
      const overdue = tasks.filter((x) => x.dueDate && x.dueDate < today && !x.completed);

      const existing = JSON.parse(localStorage.getItem("tp_notifs") || "[]");
      let next = [...existing];
      let changed = false;
      const now = new Date().toISOString();

      if (dueToday.length > 0 && !next.some((n) => n.type === "due_today" && n.date === today)) {
        next.unshift({
          id: `due_${Date.now()}`,
          type: "due_today",
          title: `${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today`,
          message: dueToday.slice(0, 3).map((x) => x.title).join(", ") + (dueToday.length > 3 ? "…" : ""),
          time: now, date: today, read: false,
        });
        changed = true;
      }

      if (overdue.length > 0 && !next.some((n) => n.type === "overdue" && n.date === today)) {
        next.unshift({
          id: `overdue_${Date.now()}`,
          type: "overdue",
          title: `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`,
          message: overdue.slice(0, 3).map((x) => x.title).join(", ") + (overdue.length > 3 ? "…" : ""),
          time: now, date: today, read: false,
        });
        changed = true;
      }

      if (changed) saveNotifs(next);
    } catch {
      // silent - don't spam errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    check();
    const iv = setInterval(check, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(iv);
  }, [check]);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const markRead = (id) => saveNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAll = () => saveNotifs(notifs.map((n) => ({ ...n, read: true })));
  const clearAll = () => saveNotifs([]);
  const dismiss = (id) => saveNotifs(notifs.filter(n => n.id !== id));

  const bg = isDark ? "rgba(8,11,20,0.97)" : "rgba(255,255,255,0.97)";
  const border = isDark ? "rgba(255,107,157,0.12)" : "rgba(255,107,157,0.15)";
  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => { setOpen(!open); if (!open) markAll(); }}
        style={{
          position: "relative", width: "36px", height: "36px", borderRadius: "10px",
          border: `1px solid ${open ? "rgba(255,107,157,0.35)" : border}`,
          background: open ? "rgba(255,107,157,0.1)" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
          cursor: "pointer", fontSize: "16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        🔔
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{
                position: "absolute", top: "-4px", right: "-4px",
                background: "#f43f5e", color: "white",
                fontSize: "9px", fontWeight: 800,
                minWidth: "16px", height: "16px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", border: `2px solid ${isDark ? "#080b14" : "#f8fafc"}`,
              }}
            >{unread > 9 ? "9+" : unread}</motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            style={{
              position: "absolute", top: "44px", right: 0,
              width: "340px", maxHeight: "440px",
              background: bg, backdropFilter: "blur(20px)",
              borderRadius: "16px", border: `1px solid ${border}`,
              boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
              overflow: "hidden", zIndex: 1000,
            }}
          >
            {/* Header */}
            <div style={{
              padding: "12px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `1px solid ${border}`,
            }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: textColor }}>
                Notifications {unread > 0 && <span style={{ color: "#ff6b9d" }}>({unread})</span>}
              </span>
              {notifs.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={clearAll} style={{ background: "none", border: "none", fontSize: "11px", color: mutedColor, cursor: "pointer", fontFamily: "inherit" }}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: "370px", overflowY: "auto" }}>
              {notifs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔕</div>
                  <p style={{ fontSize: "13px", color: mutedColor, margin: 0 }}>All caught up!</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      display: "flex", gap: "10px", padding: "11px 14px",
                      cursor: "pointer",
                      background: n.read ? "transparent" : (isDark ? "rgba(255,107,157,0.05)" : "rgba(255,107,157,0.03)"),
                      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                      transition: "background 0.12s",
                      position: "relative",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : (isDark ? "rgba(255,107,157,0.05)" : "rgba(255,107,157,0.03)")}
                  >
                    <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>
                      {TYPE_ICON[n.type] || "📋"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: textColor, marginBottom: "2px" }}>{n.title}</div>
                      <div style={{ fontSize: "11px", color: mutedColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                      <div style={{ fontSize: "10px", color: mutedColor, marginTop: "3px" }}>{typeof n.time === "string" && n.time.includes("T") ? timeAgo(n.time) : n.time}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                      {!n.read && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ff6b9d" }} />}
                      <button
                        onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                        style={{ background: "none", border: "none", color: mutedColor, cursor: "pointer", fontSize: "11px", padding: "2px", lineHeight: 1 }}
                      >✕</button>
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
