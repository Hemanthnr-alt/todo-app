import { motion } from "framer-motion";
import { borderRadius, shadows } from "../config/theme";
import { useTheme } from "../context/ThemeContext";

const Card = ({ children, hover = true, className = "" }) => {
  const { isDark } = useTheme();

  const styles = {
    background: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: borderRadius.xl,
    padding: "20px",
    border: `1px solid ${isDark ? "rgba(71, 85, 105, 0.5)" : "rgba(226, 232, 240, 0.8)"}`,
    transition: "all 0.3s ease",
    ...(hover && {
      cursor: "pointer",
      transition: "all 0.3s ease",
    }),
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: shadows.xl } : {}}
      style={styles}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Card;