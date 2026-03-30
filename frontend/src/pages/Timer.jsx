import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

function pad(n) { return String(Math.floor(n)).padStart(2, "0"); }

function formatTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

// ── Stopwatch ─────────────────────────────────────────────────────────────────
function Stopwatch({ isDark, textColor, mutedColor, border, cardBg }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps,    setLaps]    = useState([]);
  const start  = useRef(null);
  const stored = useRef(0);
  const raf    = useRef(null);

  const tick = () => {
    setElapsed(stored.current + Date.now() - start.current);
    raf.current = requestAnimationFrame(tick);
  };

  const toggle = () => {
    if (running) {
      cancelAnimationFrame(raf.current);
      stored.current += Date.now() - start.current;
    } else {
      start.current = Date.now();
      raf.current = requestAnimationFrame(tick);
    }
    setRunning(!running);
  };

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setRunning(false); setElapsed(0); setLaps([]);
    stored.current = 0;
  };

  const lap = () => {
    if (!running) return;
    setLaps(prev => [{ n: prev.length + 1, time: elapsed }, ...prev]);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "clamp(56px,15vw,80px)", fontWeight: 800, letterSpacing: "-0.04em", color: textColor, fontVariantNumeric: "tabular-nums", marginBottom: "32px" }}>
        {formatTime(elapsed)}
        <span style={{ fontSize: "0.35em", color: mutedColor }}>
          .{String(Math.floor((elapsed % 1000) / 10)).padStart(2,"0")}
        </span>
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "28px" }}>
        <motion.button whileTap={{ scale: 0.95 }} onClick={lap} disabled={!running}
          style={{ padding: "12px 24px", borderRadius: "99px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: running ? textColor : mutedColor, cursor: running ? "pointer" : "not-allowed", fontSize: "14px", fontWeight: 600, fontFamily: "inherit" }}>
          Lap
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={toggle}
          style={{ padding: "12px 36px", borderRadius: "99px", border: "none", background: running ? "linear-gradient(135deg,#f43f5e,#f97316)" : "linear-gradient(135deg,#ff6b9d,#ff99cc)", color: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700, fontFamily: "inherit", boxShadow: running ? "0 4px 16px rgba(244,63,94,0.35)" : "0 4px 16px rgba(255,107,157,0.35)" }}>
          {running ? "Stop" : elapsed > 0 ? "Resume" : "Start"}
        </motion.button>
        {elapsed > 0 && !running && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
            style={{ padding: "12px 24px", borderRadius: "99px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textColor, cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: "inherit" }}>
            Reset
          </motion.button>
        )}
      </div>

      {laps.length > 0 && (
        <div style={{ background: cardBg, borderRadius: "16px", border: `1px solid ${border}`, overflow: "hidden" }}>
          {laps.map(l => (
            <div key={l.n} style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
              <span style={{ fontSize: "13px", color: mutedColor }}>Lap {l.n}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: textColor, fontVariantNumeric: "tabular-nums" }}>{formatTime(l.time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function Countdown({ isDark, textColor, mutedColor, border, cardBg }) {
  const [running,   setRunning]   = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total,     setTotal]     = useState(0);
  const [hh, setHh] = useState("0");
  const [mm, setMm] = useState("5");
  const [ss, setSs] = useState("0");
  const interval = useRef(null);

  const start = () => {
    const t = (parseInt(hh)||0)*3600 + (parseInt(mm)||0)*60 + (parseInt(ss)||0);
    if (t <= 0) return;
    setTotal(t * 1000);
    setRemaining(t * 1000);
    setRunning(true);
  };

  const toggle = () => {
    if (!running && remaining > 0) { setRunning(true); return; }
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(0); setTotal(0);
  };

  useEffect(() => {
    if (!running) { clearInterval(interval.current); return; }
    interval.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 100) {
          clearInterval(interval.current);
          setRunning(false);
          return 0;
        }
        return r - 100;
      });
    }, 100);
    return () => clearInterval(interval.current);
  }, [running]);

  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <div style={{ textAlign: "center" }}>
      {total === 0 ? (
        // Setup
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", marginBottom: "24px" }}>
            {[
              { label: "h",  val: hh, set: setHh },
              { label: "m",  val: mm, set: setMm },
              { label: "s",  val: ss, set: setSs },
            ].map(({ label, val, set }, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {i > 0 && <span style={{ fontSize: "28px", fontWeight: 800, color: mutedColor }}>:</span>}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <input
                    value={val}
                    onChange={e => set(e.target.value.replace(/\D/g, "").slice(0,2))}
                    style={{
                      width: "72px", padding: "12px 8px", textAlign: "center",
                      fontSize: "32px", fontWeight: 800,
                      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                      border: `1px solid ${border}`, borderRadius: "12px",
                      color: textColor, outline: "none", fontFamily: "inherit",
                    }}
                  />
                  <span style={{ fontSize: "10px", color: mutedColor, fontWeight: 600, textTransform: "uppercase" }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={start}
            style={{ padding: "14px 48px", borderRadius: "99px", border: "none", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", color: "white", cursor: "pointer", fontSize: "16px", fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,157,0.35)" }}>
            Start
          </motion.button>
        </div>
      ) : (
        <>
          {/* Circular progress */}
          <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto 28px" }}>
            <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="100" cy="100" r="88" fill="none" stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth="8" />
              <circle cx="100" cy="100" r="88" fill="none" stroke="#ff6b9d" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                {formatTime(remaining)}
              </div>
              <div style={{ fontSize: "11px", color: mutedColor }}>remaining</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={toggle}
              style={{ padding: "12px 36px", borderRadius: "99px", border: "none", background: running ? "linear-gradient(135deg,#f43f5e,#f97316)" : "linear-gradient(135deg,#ff6b9d,#ff99cc)", color: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700, fontFamily: "inherit" }}>
              {running ? "Pause" : remaining === 0 ? "Done!" : "Resume"}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
              style={{ padding: "12px 24px", borderRadius: "99px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textColor, cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: "inherit" }}>
              Reset
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Intervals ─────────────────────────────────────────────────────────────────
function Intervals({ isDark, textColor, mutedColor, border, cardBg }) {
  const [running,  setRunning]  = useState(false);
  const [phase,    setPhase]    = useState("work"); // work | rest
  const [elapsed,  setElapsed]  = useState(0);
  const [round,    setRound]    = useState(1);
  const [workMin,  setWorkMin]  = useState("0");
  const [workSec,  setWorkSec]  = useState("30");
  const [restMin,  setRestMin]  = useState("0");
  const [restSec,  setRestSec]  = useState("10");
  const [rounds,   setRounds]   = useState("3");
  const [started,  setStarted]  = useState(false);
  const interval = useRef(null);

  const workMs = ((parseInt(workMin)||0)*60 + (parseInt(workSec)||0)) * 1000;
  const restMs = ((parseInt(restMin)||0)*60 + (parseInt(restSec)||0)) * 1000;
  const totalRounds = parseInt(rounds)||1;
  const current = phase === "work" ? workMs : restMs;
  const remaining = current - elapsed;
  const pct = current > 0 ? (elapsed / current) * 100 : 0;

  useEffect(() => {
    if (!running) { clearInterval(interval.current); return; }
    interval.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 100;
        if (next >= current) {
          if (phase === "work") {
            setPhase("rest"); setElapsed(0);
          } else {
            if (round >= totalRounds) {
              setRunning(false); setStarted(false);
              setRound(1); setPhase("work"); return 0;
            }
            setRound(r => r + 1); setPhase("work"); setElapsed(0);
          }
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval.current);
  }, [running, phase, current, round, totalRounds]);

  const startStop = () => {
    if (!started) { setStarted(true); setRunning(true); setElapsed(0); setRound(1); setPhase("work"); return; }
    setRunning(!running);
  };

  const reset = () => {
    clearInterval(interval.current);
    setRunning(false); setStarted(false);
    setElapsed(0); setRound(1); setPhase("work");
  };

  const phaseColor = phase === "work" ? "#ff6b9d" : "#10b981";

  return (
    <div style={{ textAlign: "center" }}>
      {!started ? (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Work", min: workMin, sec: workSec, setMin: setWorkMin, setSec: setWorkSec, color: "#ff6b9d" },
              { label: "Rest", min: restMin, sec: restSec, setMin: setRestMin, setSec: setRestSec, color: "#10b981" },
            ].map(({ label, min, sec, setMin, setSec, color }) => (
              <div key={label} style={{ padding: "14px", borderRadius: "14px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${border}` }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color, marginBottom: "10px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "center" }}>
                  <input value={min} onChange={e => setMin(e.target.value.replace(/\D/g,"").slice(0,2))}
                    style={{ width: "44px", padding: "8px 4px", textAlign: "center", fontSize: "20px", fontWeight: 700, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${border}`, borderRadius: "8px", color: textColor, outline: "none", fontFamily: "inherit" }} />
                  <span style={{ color: mutedColor, fontSize: "18px", fontWeight: 700 }}>:</span>
                  <input value={sec} onChange={e => setSec(e.target.value.replace(/\D/g,"").slice(0,2))}
                    style={{ width: "44px", padding: "8px 4px", textAlign: "center", fontSize: "20px", fontWeight: 700, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${border}`, borderRadius: "8px", color: textColor, outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={{ fontSize: "10px", color: mutedColor, marginTop: "4px" }}>min : sec</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "13px", color: mutedColor }}>Rounds</span>
            <input value={rounds} onChange={e => setRounds(e.target.value.replace(/\D/g,"").slice(0,2))}
              style={{ width: "56px", padding: "8px", textAlign: "center", fontSize: "16px", fontWeight: 700, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${border}`, borderRadius: "8px", color: textColor, outline: "none", fontFamily: "inherit" }} />
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={startStop}
            style={{ padding: "13px 48px", borderRadius: "99px", border: "none", background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", color: "white", cursor: "pointer", fontSize: "16px", fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,157,0.35)" }}>
            Start
          </motion.button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 14px", borderRadius: "99px", background: `${phaseColor}20`, color: phaseColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {phase} · Round {round}/{totalRounds}
            </span>
          </div>

          <div style={{ position: "relative", width: "180px", height: "180px", margin: "16px auto 24px" }}>
            <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="90" cy="90" r="78" fill="none" stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth="8" />
              <circle cx="90" cy="90" r="78" fill="none" stroke={phaseColor} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 78}`}
                strokeDashoffset={`${2 * Math.PI * 78 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                {formatTime(Math.max(0, remaining))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={startStop}
              style={{ padding: "12px 36px", borderRadius: "99px", border: "none", background: running ? "linear-gradient(135deg,#f43f5e,#f97316)" : `linear-gradient(135deg,${phaseColor},${phaseColor}cc)`, color: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700, fontFamily: "inherit" }}>
              {running ? "Pause" : "Resume"}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
              style={{ padding: "12px 24px", borderRadius: "99px", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textColor, cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: "inherit" }}>
              Reset
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Timer page ───────────────────────────────────────────────────────────
export default function Timer() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState("stopwatch");

  const textColor  = isDark ? "#f1f5f9"                : "#0f172a";
  const mutedColor = isDark ? "rgba(241,245,249,0.45)" : "rgba(15,23,42,0.45)";
  const cardBg     = isDark ? "rgba(15,23,42,0.65)"    : "rgba(255,255,255,0.88)";
  const border     = isDark ? "rgba(255,107,157,0.1)"  : "rgba(255,107,157,0.18)";

  const TABS = [
    { id: "stopwatch",  label: "Stopwatch" },
    { id: "countdown",  label: "Countdown" },
    { id: "intervals",  label: "Intervals" },
  ];

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px 16px", fontFamily: "'DM Sans',sans-serif", color: textColor }}>

      {/* Header */}
      <h1 style={{ fontSize: "clamp(22px,5vw,28px)", fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.03em" }}>
        <span style={{ background: "linear-gradient(135deg,#ff6b9d,#ff99cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Timer</span>
      </h1>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: "12px", padding: "3px", marginBottom: "28px", gap: "2px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "9px 6px", borderRadius: "10px",
            border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: "12px", fontWeight: tab === t.id ? 700 : 500,
            background: tab === t.id
              ? (isDark ? "rgba(255,107,157,0.2)" : "rgba(255,107,157,0.12)")
              : "transparent",
            color: tab === t.id ? "#ff6b9d" : mutedColor,
            transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 16px", background: cardBg, backdropFilter: "blur(12px)", borderRadius: "20px", border: `1px solid ${border}` }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            {tab === "stopwatch" && <Stopwatch isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg} />}
            {tab === "countdown" && <Countdown isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg} />}
            {tab === "intervals" && <Intervals isDark={isDark} textColor={textColor} mutedColor={mutedColor} border={border} cardBg={cardBg} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}