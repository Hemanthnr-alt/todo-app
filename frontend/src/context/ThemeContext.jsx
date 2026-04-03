/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export const ACCENT_PRESETS = [
  { name:"Purple", value:"#a855f7" },
  { name:"Pink",   value:"#ff6b9d" },
  { name:"Blue",   value:"#3b82f6" },
  { name:"Teal",   value:"#14b8a6" },
  { name:"Orange", value:"#f97316" },
  { name:"Green",  value:"#10b981" },
];

export const ThemeProvider = ({ children }) => {
  const [theme,  setTheme]  = useState(() => localStorage.getItem("theme")  || "dark");
  // ── Default is now purple ──
  const [accent, setAccent] = useState(() => localStorage.getItem("accent") || "#a855f7");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.setProperty("--accent",      accent);
    root.style.setProperty("--accent-glow", accent + "55");

    const a = accent;

    if (theme === "dark") {
      document.body.style.background = "#080610";
      document.body.style.backgroundImage = [
        `radial-gradient(ellipse 70% 50% at 15% 10%, ${a}18 0%, transparent 55%)`,
        `radial-gradient(ellipse 50% 40% at 85% 5%,  ${a}10 0%, transparent 50%)`,
        "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(80,20,140,0.12) 0%, transparent 60%)",
        "radial-gradient(ellipse 40% 30% at 90% 80%,  rgba(100,20,160,0.08) 0%, transparent 50%)",
      ].join(",");
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.color = "#f1f5f9";
    } else {
      document.body.style.background = "#f5f0ff";
      document.body.style.backgroundImage = [
        `radial-gradient(ellipse 70% 50% at 10% 10%, ${a}20 0%, transparent 60%)`,
        `radial-gradient(ellipse 50% 40% at 90% 10%, ${a}15 0%, transparent 55%)`,
        "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(180,100,240,0.12) 0%, transparent 60%)",
      ].join(",");
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.color = "#0f172a";
    }
  }, [theme, accent]);

  const toggleTheme  = () => setTheme(p => p === "dark" ? "light" : "dark");
  const changeAccent = (color) => {
    setAccent(color);
    localStorage.setItem("accent", color);
  };

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme,
      isDark: theme === "dark",
      accent, changeAccent,
      ACCENT_PRESETS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;