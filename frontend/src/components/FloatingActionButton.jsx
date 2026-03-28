import { motion } from "framer-motion";

const FloatingActionButton = ({ onClick, icon, color = "#ff6b9d" }) => (
  <motion.button
    whileHover={{ scale: 1.1, rotate: 90 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    style={{
      position: "fixed", bottom: "90px", right: "20px",
      width: "52px", height: "52px", borderRadius: "50%",
      background: `linear-gradient(135deg,${color},${color}dd)`,
      border: "none", color: "white", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 15px rgba(0,0,0,0.3)", zIndex: 100,
    }}
  >
    <span style={{ fontSize: "22px" }}>{icon}</span>
  </motion.button>
);

export default FloatingActionButton;
