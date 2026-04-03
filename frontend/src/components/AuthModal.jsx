import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth }  from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Portal from "./Portal";
import toast  from "react-hot-toast";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin,  setIsLogin]  = useState(true);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, login } = useAuth();
  const { accent }          = useTheme();
  const ac = accent || "#a855f7";

  const reset = () => { setName(""); setEmail(""); setPassword(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && name.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const result = isLogin
      ? await login(email, password)
      : await register(name, email, password);
    setLoading(false);
    if (result.success) {
      toast.success(result.message || (isLogin ? "Welcome back! 👋" : "Account created! 🎉"));
      reset(); onClose();
    } else {
      toast.error(result.error || "Something went wrong");
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width:"100%", padding:"13px 16px",
    background:"rgba(255,255,255,0.07)",
    border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:"12px", color:"white",
    fontSize:"14px", outline:"none",
    boxSizing:"border-box", fontFamily:"inherit",
    transition:"border-color 0.15s",
    WebkitAppearance:"none",
  };

  return (
    <Portal>
      <div style={{
        position:"fixed", inset:0, zIndex:9998,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"16px",
      }}>
        {/* Backdrop */}
        <motion.div
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          onClick={onClose}
          style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)" }}
        />

        {/* Modal */}
        <motion.div
          initial={{scale:0.9,opacity:0,y:20}}
          animate={{scale:1,opacity:1,y:0}}
          exit={{scale:0.9,opacity:0,y:20}}
          transition={{ type:"spring", damping:26, stiffness:300 }}
          onClick={e => e.stopPropagation()}
          style={{
            position:"relative", zIndex:1,
            width:"100%", maxWidth:"420px",
            background:"linear-gradient(145deg, #0a0618, #130a24)",
            borderRadius:"28px", padding:"32px",
            border:`1px solid ${ac}33`,
            boxShadow:`0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${ac}10`,
          }}
        >
          {/* Close */}
          <button onClick={onClose}
            style={{ position:"absolute", top:"18px", right:"18px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:"14px", width:"32px", height:"32px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", WebkitTapHighlightColor:"transparent" }}
            onMouseEnter={e => { e.currentTarget.style.background=`${ac}22`; e.currentTarget.style.color=ac; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.color="rgba(255,255,255,0.5)"; }}>
            ✕
          </button>

          {/* Icon + title */}
          <div style={{ textAlign:"center", marginBottom:"28px" }}>
            <div style={{ width:"64px", height:"64px", borderRadius:"20px", margin:"0 auto 16px", background:`linear-gradient(135deg,${ac},${ac}cc)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 28px ${ac}55`, fontSize:"22px", fontWeight:900, color:"white", letterSpacing:"-0.04em" }}>
              30
            </div>
            <h2 style={{ fontSize:"24px", fontWeight:800, margin:"0 0 6px", background:`linear-gradient(135deg,${ac},${ac}aa)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.03em" }}>
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", margin:0 }}>
              {isLogin ? "Sign in to your Thirty workspace" : "Start your productivity journey"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {!isLogin && (
              <input type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} style={inputStyle} required
                onFocus={e=>e.target.style.borderColor=ac} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
            )}
            <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} required
              onFocus={e=>e.target.style.borderColor=ac} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{...inputStyle,paddingRight:"48px"}} required
                onFocus={e=>e.target.style.borderColor=ac} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"16px", color:"rgba(255,255,255,0.35)", lineHeight:1, padding:0 }}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>

            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={loading}
              style={{ width:"100%", padding:"14px", background:`linear-gradient(135deg,${ac},${ac}cc)`, border:"none", borderRadius:"14px", color:"white", cursor:loading?"not-allowed":"pointer", fontSize:"15px", fontWeight:700, boxShadow:`0 4px 18px ${ac}44`, opacity:loading?0.7:1, fontFamily:"inherit", marginTop:"4px", letterSpacing:"0.01em", WebkitTapHighlightColor:"transparent", touchAction:"manipulation" }}>
              {loading ? "Please wait…" : (isLogin ? "Sign in" : "Create account")}
            </motion.button>
          </form>

          <p style={{ textAlign:"center", marginTop:"20px", fontSize:"13px", color:"rgba(255,255,255,0.38)" }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => { setIsLogin(!isLogin); reset(); }}
              style={{ background:"none", border:"none", color:ac, cursor:"pointer", fontWeight:700, fontSize:"13px", fontFamily:"inherit", WebkitTapHighlightColor:"transparent" }}>
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </Portal>
  );
}