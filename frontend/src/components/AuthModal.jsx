import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, login } = useAuth();

  const reset = () => { setName(""); setEmail(""); setPassword(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && name.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const result = isLogin ? await login(email, password) : await register(name, email, password);
    setLoading(false);
    if (result.success) {
      toast.success(result.message || (isLogin ? "Welcome back! 👋" : "Account created! 🎉"));
      reset();
      onClose();
    } else {
      toast.error(result.error || "Something went wrong");
    }
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px", color: "white",
    fontSize: "14px", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 2000 }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: "90%", maxWidth: "420px",
              background: "linear-gradient(145deg, #0f172a, #1e293b)",
              borderRadius: "28px", padding: "32px",
              border: "1px solid rgba(255,107,157,0.2)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
              zIndex: 2001,
            }}
          >
            {/* Close */}
            <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "20px" }}>✕</button>

            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 16px",
                background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(255,107,157,0.4)",
                fontSize: "24px",
              }}>
                {isLogin ? "👋" : "🚀"}
              </div>
              <h2 style={{
                fontSize: "24px", fontWeight: 800, margin: "0 0 6px",
                background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                {isLogin ? "Sign in to continue" : "Start your productivity journey"}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {!isLogin && (
                <input
                  type="text" placeholder="Full name"
                  value={name} onChange={(e) => setName(e.target.value)}
                  style={inputStyle} required
                  onFocus={(e) => e.target.style.borderColor = "#ff6b9d"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
              )}
              <input
                type="email" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={inputStyle} required
                onFocus={(e) => e.target.style.borderColor = "#ff6b9d"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
              />
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"} placeholder="Password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: "48px" }} required
                  onFocus={(e) => e.target.style.borderColor = "#ff6b9d"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "rgba(255,255,255,0.4)" }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: "linear-gradient(135deg,#ff6b9d,#ff99cc)",
                  border: "none", borderRadius: "14px",
                  color: "white", cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "15px", fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(255,107,157,0.35)",
                  opacity: loading ? 0.7 : 1, fontFamily: "inherit",
                  marginTop: "4px",
                }}
              >
                {loading ? "Please wait…" : (isLogin ? "Sign in" : "Create account")}
              </motion.button>
            </form>

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => { setIsLogin(!isLogin); reset(); }}
                style={{ background: "none", border: "none", color: "#ff6b9d", cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "inherit" }}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}