import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const AnimatedModal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const { isDark } = useTheme();
  const widths = { sm: "380px", md: "480px", lg: "600px", xl: "780px" };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 1000,
            }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: isDark ? "rgba(30,41,59,0.96)" : "rgba(255,255,255,0.96)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px", padding: "28px",
              width: "90%", maxWidth: widths[size],
              maxHeight: "85vh", overflowY: "auto",
              zIndex: 1001,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{
                fontSize: "22px", fontWeight: 800,
                background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{title}</h2>
              <button onClick={onClose} style={{
                background: "none", border: "none", fontSize: "18px", cursor: "pointer",
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
              }}>✕</button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;
