import { motion } from "framer-motion";

/**
 * MonthSelect component for the Calendar page.
 * Allows switching between months and years.
 * 
 * Props:
 * @param {Date} curr - Current selected date
 * @param {Function} setCurr - Function to update the current date
 * @param {boolean} isDark - Dark mode flag
 * @param {string} accent - Accent color hex code
 */
export default function MonthSelect({ curr, setCurr, isDark, accent }) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = curr.getFullYear();
  const monthIdx = curr.getMonth();

  const changeMonth = (delta) => {
    const next = new Date(year, monthIdx + delta, 1);
    setCurr(next);
  };

  const changeYear = (delta) => {
    const next = new Date(year + delta, monthIdx, 1);
    setCurr(next);
  };

  const textColor = "var(--text-primary)";
  const mutedColor = "var(--text-muted)";
  const btnBg = "var(--surface-raised)";
  const btnHover = "var(--surface-elevated)";

  const btnStyle = {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    background: btnBg,
    color: textColor,
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
    userSelect: "none"
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px",
      gap: "12px",
      fontFamily: "var(--font-body)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <h2 style={{
          fontSize: "18px",
          fontWeight: 700,
          margin: 0,
          color: textColor,
          letterSpacing: "-0.01em"
        }}>
          {months[monthIdx]} <span style={{ color: mutedColor, fontWeight: 500 }}>{year}</span>
        </h2>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ display: "flex", gap: "4px", background: btnBg, padding: "4px", borderRadius: "10px" }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => changeMonth(-1)}
            style={{ ...btnStyle, background: "transparent" }}
            title="Previous Month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurr(new Date())}
            style={{
              ...btnStyle,
              background: "var(--surface-elevated)",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "0 10px",
              letterSpacing: "0.02em"
            }}
          >
            Today
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => changeMonth(1)}
            style={{ ...btnStyle, background: "transparent" }}
            title="Next Month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </motion.button>
        </div>

        <div style={{ display: "flex", gap: "4px", background: btnBg, padding: "4px", borderRadius: "10px" }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => changeYear(-1)}
            style={{ ...btnStyle, background: "transparent" }}
            title="Previous Year"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => changeYear(1)}
            style={{ ...btnStyle, background: "transparent" }}
            title="Next Year"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
