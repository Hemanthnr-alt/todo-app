import { motion } from "framer-motion";

const AnimatedProgressBar = ({ value, max = 100, color = "#ff6b9d" }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div style={{
      width: "100%",
      height: "8px",
      background: "rgba(128,128,128,0.2)",
      borderRadius: "4px",
      overflow: "hidden",
    }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: "4px",
        }}
      />
    </div>
  );
};

export default AnimatedProgressBar;