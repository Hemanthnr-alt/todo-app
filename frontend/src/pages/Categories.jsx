import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import CenteredModal from "../components/CenteredModal";
import toast from "react-hot-toast";

const ICON_OPTIONS = [
  "📁","💼","🏠","💪","📚","🎨","🎵","🏃","🍔","🎮",
  "✈️","💡","❤️","⭐","🔥","🧠","🌱","🎯","💻","🛒",
  "📷","🎬","🏋️","🧘","🌍","💰","🎁","🔬","🏆","📝",
];

const COLOR_OPTIONS = [
  "#ff6b9d","#f43f5e","#f59e0b","#10b981",
  "#3b82f6","#8b5cf6","#06b6d4","#ec4899",
  "#84cc16","#f97316",
];

export default function Categories() {
  const { isDark } = useTheme();
  const { tasks, categories, loading, addCategory, deleteCategory } = useTasks();
  const [showModal, setShowModal] = useState(false);
  const [name, setName]   = useState("");
  const [color, setColor] = useState("#ff6b9d");
  const [icon, setIcon]   = useState("📁");

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.88)";
  const border     = isDark ? "rgba(255,107,157,0.1)"  : "rgba(255,107,157,0.18)";
  const inputBg    = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const iconBtnBg  = isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9";

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    borderRadius: "10px", border: `1px solid ${border}`,
    background: inputBg, color: textColor,
    fontSize: "13px", fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const openModal  = () => { setName(""); setColor("#ff6b9d"); setIcon("📁"); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleAdd = useCallback(async () => {
    if (!name.trim()) { toast.error("Category name is required"); return; }
    const result = await addCategory({ name: name.trim(), color, icon });
    if (result) { closeModal(); }
  }, [name, color, icon, addCategory]);

  const getCatCount   = id => tasks.filter(t => t.categoryId === id).length;
  const getCatDone    = id => tasks.filter(t => t.categoryId === id && t.completed).length;

  return (
    <div style={{ maxWidth: "920px", margin: "0 auto", padding: "32px 20px", fontFamily: "'DM Sans', sans-serif", color: textColor }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 5px", letterSpacing: "-0.04em" }}>
          <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Categories
          </span>
        </h1>
        <p style={{ fontSize: "13px", color: mutedColor, margin: 0 }}>
          {categories.length} {categories.length === 1 ? "category" : "categories"} · {tasks.length} total tasks
        </p>
      </motion.div>

      {/* Add button */}
      <motion.button
        whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}
        onClick={openModal}
        style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
          border: "none", borderRadius: "14px",
          color: "white", fontSize: "14px", fontWeight: 700,
          cursor: "pointer", marginBottom: "24px",
          boxShadow: "0 4px 20px rgba(255,107,157,0.3)",
          fontFamily: "inherit", letterSpacing: "0.01em",
        }}
      >+ New Category</motion.button>

      {/* Loading */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: "160px", borderRadius: "18px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
        </div>
      ) : categories.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "64px 20px", background: cardBg, backdropFilter: "blur(10px)", borderRadius: "20px", border: `1px solid ${border}` }}>
          <div style={{ fontSize: "52px", marginBottom: "14px" }}>📂</div>
          <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px", color: textColor }}>No categories yet</h3>
          <p style={{ fontSize: "13px", color: mutedColor }}>Create categories to organise your tasks</p>
        </motion.div>
      ) : (
        <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}>
          <AnimatePresence>
            {categories.map((cat, i) => {
              const total = getCatCount(cat.id);
              const done  = getCatDone(cat.id);
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <motion.div key={cat.id} layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  style={{
                    background: cardBg, backdropFilter: "blur(12px)",
                    borderRadius: "18px", padding: "20px",
                    border: `1px solid ${border}`,
                    borderTop: `3px solid ${cat.color}`,
                    boxShadow: isDark ? "none" : "0 4px 18px rgba(0,0,0,0.07)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
                      {cat.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 2px", color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cat.name}
                      </h3>
                      <p style={{ fontSize: "11px", color: mutedColor, margin: 0 }}>
                        {total} task{total !== 1 ? "s" : ""} · {done} done
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "10px", color: mutedColor }}>Progress</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: cat.color }}>{pct}%</span>
                    </div>
                    <div style={{ height: "4px", background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                        style={{ height: "100%", background: `linear-gradient(90deg,${cat.color},${cat.color}88)`, borderRadius: "2px" }}
                      />
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => deleteCategory(cat.id)} style={{
                    width: "100%", padding: "8px", borderRadius: "10px",
                    background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)",
                    color: "#f43f5e", cursor: "pointer", fontSize: "12px", fontWeight: 600, fontFamily: "inherit",
                  }}>
                    🗑 Delete
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* MODAL — rendered via Portal, always centered on viewport */}
      <CenteredModal isOpen={showModal} onClose={closeModal} title="New Category" maxWidth="440px">
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <input
            autoFocus
            placeholder="Category name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={{ ...inputStyle, marginBottom: "20px" }}
            onFocus={e => e.target.style.borderColor = "#ff6b9d"}
            onBlur={e => e.target.style.borderColor = border}
          />

          <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Icon</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: "40px", height: "40px", borderRadius: "10px", fontSize: "20px",
                border: ic === icon ? `2px solid #ff6b9d` : `1px solid ${border}`,
                background: ic === icon ? "rgba(255,107,157,0.14)" : iconBtnBg,
                cursor: "pointer", transition: "all 0.14s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{ic}</button>
            ))}
          </div>

          <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Colour</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
            {COLOR_OPTIONS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: "28px", height: "28px", borderRadius: "50%", background: c,
                cursor: "pointer", flexShrink: 0, transition: "all 0.14s",
                border: color === c ? "3px solid white" : "2px solid transparent",
                boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
              }} />
            ))}
            <input type="color" value={color} onChange={e => setColor(e.target.value)} title="Custom colour"
              style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: "transparent" }} />
          </div>

          {/* Preview */}
          <div style={{ padding: "12px 14px", borderRadius: "12px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{icon}</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#0f172a" }}>{name || "Category name"}</div>
              <div style={{ fontSize: "11px", color: color, marginTop: "1px" }}>Preview</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: mutedColor, cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
              Cancel
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd} style={{
              flex: 2, padding: "11px", borderRadius: "10px",
              background: `linear-gradient(135deg,${color},${color}cc)`,
              border: "none", color: "white", cursor: "pointer",
              fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
              boxShadow: `0 4px 14px ${color}44`,
            }}>Create Category</motion.button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}
