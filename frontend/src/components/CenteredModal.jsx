import { motion, AnimatePresence } from "framer-motion";
import Portal from "./Portal";
import { useTheme } from "../context/ThemeContext";

/**
 * Centered modal using React Portal so it's always centered on the viewport
 * regardless of any transformed parent elements.
 */
export default function CenteredModal({ isOpen, onClose, title, children, maxWidth = "440px" }) {
  const { isDark } = useTheme();

  const bg     = isDark ? "#0d1526" : "#ffffff";
  const border = isDark ? "rgba(255,107,157,0.14)" : "rgba(255,107,157,0.2)";
  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";

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
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.68)",
                backdropFilter: "blur(7px)",
                WebkitBackdropFilter: "blur(7px)",
                zIndex: 9998,
              }}
            />

            {/* Modal box — centered via flexbox on a full-screen container */}
            <div
              key="modal-wrapper"
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "16px",
                pointerEvents: "none",
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
                  width: "100%",
                  maxWidth,
                  maxHeight: "calc(100dvh - 48px)",
                  overflowY: "auto",
                  background: bg,
                  borderRadius: "24px",
                  padding: "26px",
                  border: `1px solid ${border}`,
                  boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,107,157,0.06)",
                }}
              >
                {/* Header */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}>
                  <h2 style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    margin: 0,
                    color: textColor,
                    letterSpacing: "-0.03em",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                      width: "32px", height: "32px", borderRadius: "9px",
                      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                      border: `1px solid ${border}`,
                      color: mutedColor, cursor: "pointer",
                      fontSize: "14px", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#ff6b9d"}
                    onMouseLeave={e => e.currentTarget.style.color = mutedColor}
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
