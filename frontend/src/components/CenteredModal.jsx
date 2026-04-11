import { motion, AnimatePresence } from "framer-motion";
import Portal from "./Portal";
import { useTheme } from "../context/ThemeContext";

export default function CenteredModal({ isOpen, onClose, title, children, maxWidth = "440px" }) {
  const { isDark, accent } = useTheme();
  const ac = accent || "#6B46FF";

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                zIndex: 9998,
              }}
            />

            {/* Modal wrapper */}
            <div
              key="modal-wrapper"
              style={{
                position: "fixed", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 9999, padding: "16px", pointerEvents: "none",
              }}
            >
              <motion.div
                key="modal"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 12 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  pointerEvents: "auto",
                  width: "100%", maxWidth,
                  maxHeight: "calc(100dvh - 48px)",
                  overflowY: "auto",
                  overflowX: "hidden",
                  WebkitOverflowScrolling: "touch",
                  background: "var(--surface)",
                  borderRadius: "20px",
                  padding: "22px 18px 24px",
                  border: isDark ? "none" : "1px solid var(--border)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                  boxSizing: "border-box",
                }}
              >
                {/* Header */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: "20px",
                }}>
                  <h2 style={{
                    fontSize: "20px", fontWeight: 700, margin: 0,
                    color: "var(--text-primary)", letterSpacing: "-0.03em",
                    fontFamily: "var(--font-heading)",
                  }}>
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                      width: "32px", height: "32px", borderRadius: "9px",
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)", cursor: "pointer",
                      fontSize: "14px", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all 0.15s",
                      WebkitTapHighlightColor: "transparent",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = ac; e.currentTarget.style.borderColor = ac; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                  >✕</button>
                </div>

                {children}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
