import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import toast from "react-hot-toast";

const ICON_OPTIONS = ["📁","💼","🏠","💪","📚","🎨","🎵","🏃","🍔","🎮","✈️","💡","❤️","⭐","🔥","🧠","🌱","🎯","💻","🛒"];

export default function Categories() {
  const { isDark } = useTheme();
  const { tasks, categories, loading, addCategory, deleteCategory, updateTask } = useTasks();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ff6b9d");
  const [icon, setIcon] = useState("📁");

  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg = isDark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)";
  const border = isDark ? "rgba(255,107,157,0.1)" : "rgba(255,107,157,0.15)";

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    borderRadius: "10px", border: `1px solid ${border}`,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
    color: textColor, fontSize: "13px",
    fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
  };

  const handleAdd = useCallback(async () => {
    if (!name.trim()) { toast.error("Category name is required"); return; }
    const result = await addCategory({ name: name.trim(), color, icon });
    if (result) {
      setName(""); setColor("#ff6b9d"); setIcon("📁");
      setShowModal(false);
    }
  }, [name, color, icon, addCategory]);

  const handleDelete = useCallback(async (id) => {
    await deleteCategory(id);
  }, [deleteCategory]);

  const getCategoryTaskCount = (catId) => tasks.filter((t) => t.categoryId === catId).length;
  const getCategoryCompleted = (catId) => tasks.filter((t) => t.categoryId === catId && t.completed).length;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px", fontFamily: "'DM Sans', sans-serif", color: textColor }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.04em" }}>
          <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Categories</span>
        </h1>
        <p style={{ fontSize: "14px", color: mutedColor, margin: 0 }}>
          {categories.length} {categories.length === 1 ? "category" : "categories"} · {tasks.length} total tasks
        </p>
      </motion.div>

      {/* Add button */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => setShowModal(true)}
        style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
          border: "none", borderRadius: "14px",
          color: "white", fontSize: "14px", fontWeight: 700,
          cursor: "pointer", marginBottom: "24px",
          boxShadow: "0 4px 16px rgba(255,107,157,0.3)",
          fontFamily: "inherit",
        }}
      >+ New Category</motion.button>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: "160px", borderRadius: "18px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
        </div>
      ) : categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "60px 0", background: cardBg, backdropFilter: "blur(10px)", borderRadius: "20px", border: `1px solid ${border}` }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📂</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: textColor }}>No categories yet</h3>
          <p style={{ fontSize: "13px", color: mutedColor }}>Create categories to organize your tasks</p>
        </motion.div>
      ) : (
        <motion.div
          layout
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}
        >
          <AnimatePresence>
            {categories.map((cat, i) => {
              const total = getCategoryTaskCount(cat.id);
              const done = getCategoryCompleted(cat.id);
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <motion.div
                  key={cat.id}
                  layout
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
                    boxShadow: isDark ? "none" : "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Icon + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "14px",
                      background: `${cat.color}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "24px", flexShrink: 0,
                    }}>
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

                  {/* Progress */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10px", color: mutedColor }}>Progress</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: cat.color }}>{pct}%</span>
                    </div>
                    <div style={{ height: "4px", background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{ height: "100%", background: `linear-gradient(90deg,${cat.color},${cat.color}88)`, borderRadius: "2px" }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleDelete(cat.id)}
                    style={{
                      width: "100%", padding: "8px",
                      borderRadius: "10px",
                      background: "rgba(244,63,94,0.07)",
                      border: "1px solid rgba(244,63,94,0.15)",
                      color: "#f43f5e", cursor: "pointer",
                      fontSize: "12px", fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                  >
                    🗑 Delete Category
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 1000 }} />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: "90%", maxWidth: "400px",
                background: isDark ? "#0f172a" : "#ffffff",
                borderRadius: "24px", padding: "28px",
                border: `1px solid ${border}`,
                boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
                zIndex: 1001, fontFamily: "inherit",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 20px", color: textColor }}>New Category</h2>

              <input autoFocus placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                style={{ ...inputStyle, marginBottom: "12px" }} />

              {/* Icon picker */}
              <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>Icon</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                {ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    style={{
                      width: "36px", height: "36px", borderRadius: "10px", fontSize: "18px",
                      border: ic === icon ? `2px solid #ff6b9d` : `1px solid ${border}`,
                      background: ic === icon ? "rgba(255,107,157,0.12)" : "transparent",
                      cursor: "pointer",
                    }}
                  >{ic}</button>
                ))}
              </div>

              {/* Color picker */}
              <label style={{ fontSize: "11px", color: mutedColor, display: "block", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>Color</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px" }}>
                {["#ff6b9d","#f43f5e","#f59e0b","#10b981","#3b82f6","#8b5cf6","#06b6d4","#ec4899"].map((c) => (
                  <div
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: "28px", height: "28px", borderRadius: "50%", background: c, cursor: "pointer",
                      border: color === c ? `3px solid white` : "2px solid transparent",
                      boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                      transition: "all 0.15s",
                    }}
                  />
                ))}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", cursor: "pointer", padding: 0 }} />
              </div>

              {/* Preview */}
              <div style={{
                padding: "12px 14px", borderRadius: "12px",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${border}`,
                display: "flex", alignItems: "center", gap: "10px",
                marginBottom: "16px",
              }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{icon}</div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: textColor }}>{name || "Category name"}</span>
                <span style={{ marginLeft: "auto", fontSize: "10px", color: color, fontWeight: 700, background: `${color}18`, padding: "2px 8px", borderRadius: "10px" }}>Preview</span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, ...inputStyle, cursor: "pointer", textAlign: "center", padding: "10px" }}>Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd}
                  style={{ flex: 2, padding: "10px", borderRadius: "10px", background: `linear-gradient(135deg,${color},${color}cc)`, border: "none", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "inherit" }}>
                  Create Category
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}