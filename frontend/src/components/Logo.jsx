import { motion } from "framer-motion";

const Logo = ({ size = "md" }) => {
  const sizes = {
    sm: { box: 36, fontSize: 17 },
    md: { box: 42, fontSize: 20 },
    lg: { box: 50, fontSize: 24 },
  };

  const s = sizes[size];

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        display: "flex",
        alignItems: "center",
        cursor: "default",
        userSelect: "none",
      }}
      aria-label="30"
    >
      <div
        style={{
          minWidth: s.box,
          height: s.box,
          padding: "0 12px",
          background: "linear-gradient(135deg, #ff6b9d, #ff99cc)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(255, 107, 157, 0.3)",
        }}
      >
        <span style={{
          fontSize: s.fontSize,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}>
          30
        </span>
      </div>
    </motion.div>
  );
};

export default Logo;
