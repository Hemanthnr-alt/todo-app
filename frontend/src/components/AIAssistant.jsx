import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Portal from "./Portal";

const QUICK_PROMPTS = [
  { label: "📋 Plan my day",          text: "Help me plan my day effectively. What should I focus on?" },
  { label: "🎯 Break down a goal",    text: "Help me break down a big goal into smaller actionable tasks." },
  { label: "⏰ Time tips",            text: "Give me 3 practical time management techniques I can start today." },
  { label: "🔥 Beat procrastination", text: "I keep procrastinating. What should I do?" },
  { label: "🧘 Habit advice",         text: "How do I build habits that actually stick?" },
  { label: "📊 Review tasks",         text: "Review my current tasks and tell me what to prioritise." },
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
          style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff6b9d" }}
        />
      ))}
    </div>
  );
}

function Message({ msg, isDark }) {
  const isUser     = msg.role === "user";
  const textColor  = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";

  const renderContent = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const rendered = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");
      return (
        <div key={i} style={{
          marginBottom: i < lines.length - 1 ? "4px" : 0,
          paddingLeft: isBullet ? "4px" : 0,
          display: "flex", gap: isBullet ? "6px" : 0,
        }}>
          {isBullet && <span style={{ color: "#ff6b9d", flexShrink: 0, marginTop: "1px" }}>•</span>}
          <span dangerouslySetInnerHTML={{ __html: isBullet ? rendered.replace(/^[-•]\s+/, "") : rendered }} />
        </div>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: "10px", alignItems: "flex-end", marginBottom: "16px",
      }}
    >
      <div style={{
        width: "30px", height: "30px", borderRadius: "10px", flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg,#ff6b9d,#ff99cc)"
          : (isDark ? "rgba(255,107,157,0.15)" : "rgba(255,107,157,0.1)"),
        border: isUser ? "none" : "1px solid rgba(255,107,157,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: isUser ? "12px" : "14px", fontWeight: 900,
        color: isUser ? "white" : "#ff6b9d",
      }}>
        {isUser ? "U" : "✦"}
      </div>

      <div style={{ maxWidth: "80%", minWidth: "60px" }}>
        <div style={{
          fontSize: "10px", fontWeight: 600, color: mutedColor,
          marginBottom: "4px", textAlign: isUser ? "right" : "left",
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {isUser ? "You" : "30 AI"}
        </div>
        <div style={{
          padding: "11px 14px",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          background: isUser
            ? "linear-gradient(135deg,#ff6b9d,#ff99cc)"
            : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
          border: isUser ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          fontSize: "13px", lineHeight: "1.6",
          color: isUser ? "white" : textColor,
          boxShadow: isUser ? "0 4px 14px rgba(255,107,157,0.25)" : "none",
        }}>
          {msg.typing ? <TypingDots /> : renderContent(msg.content)}
        </div>
        {msg.time && (
          <div style={{ fontSize: "10px", color: mutedColor, marginTop: "3px", textAlign: isUser ? "right" : "left" }}>
            {msg.time}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AIAssistant({ tasks = [], categories = [] }) {
  const { isDark }          = useTheme();
  const { isAuthenticated } = useAuth();
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const messagesEndRef           = useRef(null);
  const inputRef                 = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const bg         = isDark ? "rgba(8,11,20,0.98)"     : "rgba(248,250,252,0.98)";
  const border     = isDark ? "rgba(255,107,157,0.12)" : "rgba(255,107,157,0.18)";
  const inputBg    = isDark ? "rgba(255,255,255,0.06)" : "#ffffff";

  const MOBILE_NAV_HEIGHT = 72;
  const FAB_BOTTOM   = isMobile ? MOBILE_NAV_HEIGHT + 12 : 24;
  const PANEL_BOTTOM = isMobile ? MOBILE_NAV_HEIGHT + 12 : 92;

  const timestamp = () =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hey! I'm **30 AI**, your productivity assistant ✦\n\nI can help you plan your day, break down goals, manage your tasks, and give actionable advice. What would you like to work on?`,
        time: timestamp(),
      }]);
    }
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const buildTaskContext = () => {
    if (!tasks.length) return "";
    const today    = new Date().toISOString().split("T")[0];
    const pending  = tasks.filter(t => !t.completed);
    const overdue  = pending.filter(t => t.dueDate && t.dueDate < today);
    const dueToday = pending.filter(t => t.dueDate === today);
    const high     = pending.filter(t => t.priority === "high");
    return (
      `User tasks: ${tasks.length} total (${tasks.filter(t => t.completed).length} done, ${pending.length} pending). ` +
      `Overdue: ${overdue.length}. Due today: ${dueToday.length}. High priority: ${high.length}. ` +
      `Categories: ${categories.map(c => c.name).join(", ") || "none"}. ` +
      `Recent pending: ${pending.slice(0, 6).map(t =>
        `"${t.title}" [${t.priority}]${t.dueDate ? ` due ${t.dueDate}` : ""}`
      ).join(", ")}`
    );
  };

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    setError(null);

    const userMsg   = { role: "user", content: userText, time: timestamp() };
    const typingMsg = { role: "assistant", content: "", typing: true };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setLoading(true);

    const history = messages
      .filter(m => !m.typing)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      // ✅ Groq API key stays on the server — never exposed in the browser
      const res = await api.post("/ai/chat", {
        messages:    [...history, { role: "user", content: userText }],
        taskContext: buildTaskContext(),
      });

      const aiText = res.data?.content || "I couldn't generate a response.";
      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        { role: "assistant", content: aiText, time: timestamp() },
      ]);
    } catch (err) {
      console.error("AI error:", err);
      const status = err.response?.status;
      const errMsg =
        status === 401 ? "Please sign in to use the AI assistant." :
        status === 429 ? "Too many requests. Please wait a moment." :
        status === 503 ? "AI service is busy. Try again shortly." :
        "Couldn't reach the AI. Check your connection.";
      setError(errMsg);
      setMessages(prev => prev.filter(m => !m.typing));
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, tasks, categories]);

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setTimeout(() => {
      setMessages([{ role: "assistant", content: "Chat cleared! How can I help? ✦", time: timestamp() }]);
    }, 100);
  };

  const panelWidth  = isMobile ? "calc(100vw - 16px)" : "min(400px, calc(100vw - 32px))";
  const panelHeight = isMobile
    ? `min(520px, calc(100dvh - ${MOBILE_NAV_HEIGHT + 80}px))`
    : "min(580px, calc(100dvh - 120px))";

  return (
    <>
      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(!open)}
        title="30 AI Assistant"
        style={{
          position: "fixed",
          bottom: `${FAB_BOTTOM}px`,
          right: isMobile ? "12px" : "24px",
          width: isMobile ? "50px" : "56px",
          height: isMobile ? "50px" : "56px",
          borderRadius: "18px",
          background: open
            ? (isDark ? "rgba(255,107,157,0.2)" : "rgba(255,107,157,0.15)")
            : "linear-gradient(135deg,#ff6b9d,#ff99cc)",
          border: open ? "2px solid #ff6b9d" : "none",
          cursor: "pointer", zIndex: 8000,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: open ? "none" : "0 8px 28px rgba(255,107,157,0.45)",
          fontSize: isMobile ? "20px" : "22px",
          transition: "all 0.2s",
          color: open ? "#ff6b9d" : "white",
        }}
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {open ? "✕" : "✦"}
        </motion.span>
      </motion.button>

      {/* Chat panel */}
      <Portal>
        <AnimatePresence>
          {open && (
            <>
              {/* Mobile backdrop */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                  style={{
                    position: "fixed", inset: 0, zIndex: 8001,
                    background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
                  }}
                />
              )}

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
                style={{
                  position: "fixed",
                  bottom: `${PANEL_BOTTOM}px`,
                  right: isMobile ? "8px" : "24px",
                  width: panelWidth, height: panelHeight,
                  background: bg, backdropFilter: "blur(24px)",
                  borderRadius: "24px", border: `1px solid ${border}`,
                  boxShadow: "0 24px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,107,157,0.06)",
                  display: "flex", flexDirection: "column",
                  overflow: "hidden", zIndex: 8002,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {/* ── Header ── */}
                <div style={{
                  padding: "14px 16px", borderBottom: `1px solid ${border}`,
                  display: "flex", alignItems: "center", gap: "12px", flexShrink: 0,
                }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "9px",
                    background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", flexShrink: 0, boxShadow: "0 4px 12px rgba(255,107,157,0.35)",
                  }}>✦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: textColor, letterSpacing: "-0.02em" }}>
                      30 AI
                    </div>
                    <div style={{ fontSize: "11px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                      Online · Powered by Groq
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={clearChat} title="Clear chat" style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: mutedColor, fontSize: "14px", padding: "4px", borderRadius: "6px",
                      transition: "color 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ff6b9d"}
                      onMouseLeave={e => e.currentTarget.style.color = mutedColor}
                    >🗑</button>
                    <button onClick={() => setOpen(false)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: mutedColor, fontSize: "14px", padding: "4px", borderRadius: "6px",
                      transition: "color 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = textColor}
                      onMouseLeave={e => e.currentTarget.style.color = mutedColor}
                    >✕</button>
                  </div>
                </div>

                {/* ── Messages ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column" }}>
                  {messages.map((msg, i) => (
                    <Message key={i} msg={msg} isDark={isDark} />
                  ))}

                  {error && (
                    <div style={{
                      padding: "10px 14px", borderRadius: "10px",
                      background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)",
                      color: "#f43f5e", fontSize: "12px", marginBottom: "12px",
                      display: "flex", gap: "8px", alignItems: "center",
                    }}>
                      <span>⚠️</span>
                      <span style={{ flex: 1 }}>{error}</span>
                      <button onClick={() => setError(null)} style={{
                        background: "none", border: "none", color: "#f43f5e", cursor: "pointer", fontSize: "12px",
                      }}>✕</button>
                    </div>
                  )}

                  {messages.length <= 1 && !loading && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{
                        fontSize: "11px", color: mutedColor, marginBottom: "8px",
                        fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                        Quick prompts
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {QUICK_PROMPTS.map(qp => (
                          <button
                            key={qp.label}
                            onClick={() => sendMessage(qp.text)}
                            style={{
                              padding: "6px 11px", borderRadius: "20px",
                              border: `1px solid ${border}`,
                              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                              color: textColor, cursor: "pointer",
                              fontSize: "11px", fontFamily: "inherit",
                              transition: "all 0.15s", textAlign: "left",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff6b9d"; e.currentTarget.style.color = "#ff6b9d"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textColor; }}
                          >
                            {qp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* ── Input ── */}
                <div style={{ padding: "10px 12px", borderTop: `1px solid ${border}`, flexShrink: 0 }}>
                  {tasks.length > 0 && (
                    <div style={{ fontSize: "10px", color: mutedColor, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "#10b981" }}>●</span>
                      Context: {tasks.length} tasks, {categories.length} categories loaded
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      }}
                      placeholder="Ask anything… (Enter to send)"
                      rows={1}
                      disabled={loading}
                      style={{
                        flex: 1, padding: "9px 12px", borderRadius: "12px",
                        border: `1px solid ${border}`,
                        background: inputBg, color: textColor,
                        fontSize: "13px", fontFamily: "inherit",
                        outline: "none", resize: "none",
                        maxHeight: "80px", overflowY: "auto", lineHeight: "1.5",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => e.target.style.borderColor = "#ff6b9d"}
                      onBlur={e => e.target.style.borderColor = border}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendMessage()}
                      disabled={loading || !input.trim()}
                      style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        background: loading || !input.trim()
                          ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)")
                          : "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                        border: "none",
                        cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                        color: loading || !input.trim() ? mutedColor : "white",
                        fontSize: "16px", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      {loading
                        ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ fontSize: "14px" }}>⟳</motion.span>
                        : "↑"
                      }
                    </motion.button>
                  </div>
                  <div style={{ fontSize: "10px", color: mutedColor, marginTop: "6px", textAlign: "center" }}>
                    Shift+Enter for new line · Powered by Groq
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
