import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

const SAMPLE_NOTIFS = [
  { id: "s1", type: "reminder", title: "Welcome to TodoPro!", message: "Start by adding your first task 🚀", time: "Just now", read: false },
];

export default function NotificationBell() {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tp_notifs") || "null") || SAMPLE_NOTIFS; } catch { return SAMPLE_NOTIFS; }
  });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifs.filter((n) => !n.read).length;

  const save = (list) => {
    setNotifs(list);
    localStorage.setItem("tp_notifs", JSON.stringify(list));
  };

  const check = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/tasks");
      const tasks = res.data;
      const t = new Date().toISOString().split("T")[0];
      const dueToday = tasks.filter((x) => x.dueDate === t && !x.completed);
      const overdue = tasks.filter((x) => x.dueDate && x.dueDate < t && !x.completed);
      const existing = JSON.parse(localStorage.getItem("tp_notifs") || "[]");
      let next = [...existing];
      let changed = false;

      if (dueToday.length > 0 && !next.some((n) => n.type === "due_today" && n.date === t)) {
        next.unshift({ id: Date.now(), type: "due_today", title: `${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today`, message: dueToday.map((x) => x.title).join(", "), time: "Just now", date: t, read: false });
        changed = true;
      }
      if (overdue.length > 0 && !next.some((n) => n.type === "overdue" && n.date === t)) {
        next.unshift({ id: Date.now() + 1, type: "overdue", title: `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`, message: overdue.map((x) => x.title).join(", "), time: "Just now", date: t, read: false });
        changed = true;
      }
      if (changed) save(next);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    check();
    const iv = setInterval(check, 120000);
    return () => clearInterval(iv);
  }, [check]);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const markRead = (id) => save(notifs.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAll = () => save(notifs.map((n) => ({ ...n, read: true })));
  const clear = () => save([]);

  const typeIcon = (t) => ({ due_today: "📅", overdue: "⚠️", task_completed: "✅", reminder: "🔔" }[t] || "📋");

  const bg = isDark ? "rgba(8,11,20,0.97)" : "rgba(255,255,255,0.97)";
  const border = isDark ? "rgba(255,107,157,0.12)" : "rgba(255,107,157,0.15)";
  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        style={{
          position: "relative", width: "36px", height: "36px", borderRadius: "10px",
          border: `1px solid ${border}`,
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          cursor: "pointer", fontSize: "16px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        🔔
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: "absolute", top: "-4px", right: "-4px",
              background: "#f43f5e", color: "white",
              fontSize: "9px", fontWeight: 700,
              minWidth: "16px", height: "16px", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
            }}
          >{unread > 9 ? "9+" : unread}</motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "44px", right: 0,
              width: "340px", maxHeight: "440px",
              background: bg, backdropFilter: "blur(16px)",
              borderRadius: "16px", border: `1px solid ${border}`,
              boxShadow: "0 16px 50px rgba(0,0,0,0.25)",
              overflow: "hidden", zIndex: 1000,
            }}
          >
            <div style={{
              padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `1px solid ${border}`,
            }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: textColor }}>Notifications</span>
              <div style={{ display: "flex", gap: "10px" }}>
                {notifs.length > 0 && <>
                  <button onClick={markAll} style={{ background: "none", border: "none", fontSize: "11px", color: "#ff6b9d", cursor: "pointer", fontFamily: "inherit" }}>Mark all read</button>
                  <button onClick={clear} style={{ background: "none", border: "none", fontSize: "11px", color: mutedColor, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
                </>}
              </div>
            </div>

            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {notifs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: mutedColor }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>🔕</div>
                  <p style={{ fontSize: "13px" }}>All caught up!</p>
                </div>
              ) : notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    display: "flex", gap: "12px", padding: "12px 16px",
                    cursor: "pointer", transition: "background 0.15s",
                    background: n.read ? "transparent" : (isDark ? "rgba(255,107,157,0.06)" : "rgba(255,107,157,0.04)"),
                    borderBottom: `1px solid ${border}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? "transparent" : (isDark ? "rgba(255,107,157,0.06)" : "rgba(255,107,157,0.04)"); }}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: textColor, marginBottom: "2px" }}>{n.title}</div>
                    <div style={{ fontSize: "11px", color: mutedColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                    <div style={{ fontSize: "10px", color: mutedColor, marginTop: "3px" }}>{n.time}</div>
                  </div>
                  {!n.read && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ff6b9d", flexShrink: 0, marginTop: "6px" }} />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}