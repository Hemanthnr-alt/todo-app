import { motion } from "framer-motion";

const PremiumButton = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  onClick, 
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button"
}) => {
  const variants = {
    primary: {
      background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
      color: "white",
    },
    glass: {
      background: "rgba(255,255,255,0.15)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.2)",
      color: "white",
    },
    danger: {
      background: "linear-gradient(135deg, #ef4444, #f87171)",
      color: "white",
    },
    success: {
      background: "linear-gradient(135deg, #10b981, #34d399)",
      color: "white",
    },
  };

  const sizes = {
    sm: { padding: "8px 16px", fontSize: "13px" },
    md: { padding: "12px 24px", fontSize: "14px" },
    lg: { padding: "16px 32px", fontSize: "16px" },
  };

  const buttonStyle = {
    ...variants[variant],
    ...sizes[size],
    borderRadius: "50px",
    fontWeight: "600",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "all 0.3s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: fullWidth ? "100%" : "auto",
    border: "none",
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      style={buttonStyle}
    >
      {loading ? (
        <div style={{
          width: "16px",
          height: "16px",
          border: "2px solid rgba(255,255,255,0.3)",
          borderTopColor: "white",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      ) : icon ? (
        <span style={{ fontSize: "1.2em" }}>{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

export default PremiumButton;