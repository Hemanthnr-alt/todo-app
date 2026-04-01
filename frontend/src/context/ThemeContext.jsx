/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

const ACCENT_PRESETS = [
  { name: "Pink",   value: "#ff6b9d" },
  { name: "Purple", value: "#a855f7" },
  { name: "Blue",   value: "#3b82f6" },
  { name: "Teal",   value: "#14b8a6" },
  { name: "Orange", value: "#f97316" },
  { name: "Green",  value: "#10b981" },
];

export { ACCENT_PRESETS };

export const ThemeProvider = ({ children }) => {
  const [theme,  setTheme]  = useState(() => localStorage.getItem("theme")  || "dark");
  const [accent, setAccent] = useState(() => localStorage.getItem("accent") || "#ff6b9d");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-glow", accent + "55");

    const a = accent;
    if (theme === "dark") {
      document.body.style.background = "#0e0618";
      document.body.style.backgroundImage = [
        `radial-gradient(ellipse 80% 60% at 15% 10%, ${a}22 0%, transparent 60%)`,
        `radial-gradient(ellipse 60% 50% at 85% 5%,  ${a}18 0%, transparent 55%)`,
        "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(120,30,160,0.15) 0%, transparent 60%)",
        `radial-gradient(ellipse 40% 40% at 90% 80%, ${a}12 0%, transparent 50%)`,
        "radial-gradient(ellipse 50% 50% at 5% 80%, rgba(180,50,200,0.10) 0%, transparent 55%)",
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
  const changeAccent = (color) => { setAccent(color); localStorage.setItem("accent", color); };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark", accent, changeAccent, ACCENT_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;