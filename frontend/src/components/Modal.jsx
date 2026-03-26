import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { borderRadius, shadows } from "../config/theme";

const Modal = ({ isOpen, onClose, title, children }) => {
  const { isDark } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: borderRadius.xl,
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "85vh",
              overflowY: "auto",
              zIndex: 1001,
              boxShadow: shadows.xl,
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "600",
                color: isDark ? "#f8fafc" : "#1a1a2e",
              }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;