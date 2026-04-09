/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export const ACCENT_PRESETS = [
  { name:"Purple", value:"#6B46FF" },
  { name:"Blue",   value:"#0A84FF" },
  { name:"Green",  value:"#30D158" },
  { name:"Orange", value:"#FF9F0A" },
  { name:"Red",    value:"#FF453A" },
];

export const ThemeProvider = ({ children }) => {
  const [theme,  setTheme]  = useState(() => localStorage.getItem("theme")  || "dark");
  const [accent, setAccent] = useState(() => localStorage.getItem("accent") || "#6B46FF");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;

    // All colours come from CSS variables in index.css via data-theme
    root.setAttribute("data-theme", theme);

    // Inject only the dynamic accent
    root.style.setProperty("--accent",        accent);
    root.style.setProperty("--accent-glow",   accent + "66");
    root.style.setProperty("--accent-subtle", accent + "26");

    // ── Clear any inline body overrides that bypass CSS vars ──
    document.body.style.background           = "";
    document.body.style.backgroundImage      = "";
    document.body.style.backgroundColor      = "";
    document.body.style.backgroundAttachment = "";
    document.body.style.color                = "";
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
      setAccent: changeAccent,
      ACCENT_PRESETS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;