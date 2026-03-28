/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);

    if (theme === "dark") {
      // Deep purple-pink — NOT pure black
      document.body.style.background = "#0e0618";
      document.body.style.backgroundImage = [
        "radial-gradient(ellipse 80% 60% at 15% 10%,  rgba(139,47,180,0.18) 0%, transparent 60%)",
        "radial-gradient(ellipse 60% 50% at 85% 5%,   rgba(255,107,157,0.12) 0%, transparent 55%)",
        "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(120,30,160,0.15) 0%, transparent 60%)",
        "radial-gradient(ellipse 40% 40% at 90% 80%,  rgba(255,107,157,0.09) 0%, transparent 50%)",
        "radial-gradient(ellipse 50% 50% at 5%  80%,  rgba(180,50,200,0.10) 0%, transparent 55%)",
      ].join(",");
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.color = "#f1f5f9";
    } else {
      document.body.style.background = "#f5f0ff";
      document.body.style.backgroundImage = [
        "radial-gradient(ellipse 70% 50% at 10% 10%,  rgba(200,140,255,0.15) 0%, transparent 60%)",
        "radial-gradient(ellipse 50% 40% at 90% 10%,  rgba(255,107,157,0.10) 0%, transparent 55%)",
        "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(180,100,240,0.12) 0%, transparent 60%)",
      ].join(",");
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.color = "#0f172a";
    }
  }, [theme]);

  const toggleTheme = () => setTheme(p => p === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
