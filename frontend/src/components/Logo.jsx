import { motion } from "framer-motion";

const Logo = ({ size = "md" }) => {
  const sizes = {
    sm: { box: 32, font: 13 },
    md: { box: 38, font: 16 },
    lg: { box: 48, font: 20 },
  };
  const s = sizes[size];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ display: "flex", alignItems: "center", cursor: "default", userSelect: "none" }}
    >
      <div style={{
        width: s.box, height: s.box,
        background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
        borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 18px rgba(255,107,157,0.3)",
        fontSize: s.font, fontWeight: 900, color: "#fff",
        letterSpacing: "-0.04em",
      }}>30</div>
    </motion.div>
  );
};

export default Logo;
