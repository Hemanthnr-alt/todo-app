import { motion } from "framer-motion";
import { borderRadius, shadows } from "../config/theme";

const Button = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  onClick, 
  disabled = false,
  icon,
  fullWidth = false,
  className = ""
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
          color: "white",
          border: "none",
          boxShadow: shadows.glow,
        };
      case "secondary":
        return {
          background: "transparent",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
        };
      case "outline":
        return {
          background: "transparent",
          color: "#ff6b9d",
          border: "1px solid #ff6b9d",
        };
      case "danger":
        return {
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "white",
          border: "none",
        };
      case "success":
        return {
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "white",
          border: "none",
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return { padding: "8px 16px", fontSize: "13px" };
      case "md":
        return { padding: "10px 20px", fontSize: "14px" };
      case "lg":
        return { padding: "12px 24px", fontSize: "16px" };
      default:
        return {};
    }
  };

  const styles = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    borderRadius: borderRadius.md,
    fontWeight: "500",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: fullWidth ? "100%" : "auto",
    fontFamily: "inherit",
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={styles}
      className={className}
    >
      {icon && <span style={{ fontSize: "1.1em" }}>{icon}</span>}
      {children}
    </motion.button>
  );
};

export default Button;