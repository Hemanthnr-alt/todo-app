import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const Card = ({ children, hover = true, className = "", style = {} }) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      whileHover={hover ? { y: -3, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" } : {}}
      style={{
        background: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        padding: "20px",
        border: `1px solid ${isDark ? "rgba(71,85,105,0.5)" : "rgba(226,232,240,0.8)"}`,
        transition: "all 0.25s",
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Card;
