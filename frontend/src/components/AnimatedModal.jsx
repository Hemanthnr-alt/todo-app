import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const AnimatedModal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const { isDark } = useTheme();
  const sizes = {
    sm: { width: "400px" },
    md: { width: "500px" },
    lg: { width: "600px" },
    xl: { width: "800px" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: isDark ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: "28px",
              padding: "28px",
              width: "90%",
              maxWidth: sizes[size].width,
              maxHeight: "85vh",
              overflowY: "auto",
              zIndex: 1001,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}>
              <h2 style={{
                fontSize: "24px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
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
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.target.style.color = "#ff6b9d"}
                onMouseLeave={(e) => e.target.style.color = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"}
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

export default AnimatedModal;