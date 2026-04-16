import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { playTimerSound, sendNotification, startBackgroundTimer, stopBackgroundTimer, pauseBackgroundTimer } from "../services/notifications";

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  // ── STOPWATCH ─────────────────────────────────────────────────────────────
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0);
  const [swLaps, setSwLaps] = useState([]);
  const swStartRef = useRef(null);
  const swStored = useRef(0);
  const swRaf = useRef(null);

  const swTick = useCallback(() => {
    setSwElapsed(swStored.current + Date.now() - swStartRef.current);
    swRaf.current = requestAnimationFrame(swTick);
  }, []);

  const swToggle = useCallback(() => {
    if (swRunning) {
      cancelAnimationFrame(swRaf.current);
      swStored.current += Date.now() - swStartRef.current;
    } else {
      swStartRef.current = Date.now();
      swRaf.current = requestAnimationFrame(swTick);
    }
    setSwRunning(r => !r);
  }, [swRunning, swTick]);

  const swReset = useCallback(() => {
    cancelAnimationFrame(swRaf.current);
    setSwRunning(false);
    setSwElapsed(0);
    setSwLaps([]);
    swStored.current = 0;
  }, []);

  const swLap = useCallback(() => {
    if (!swRunning) return;
    const prev = swLaps[0]?.total || 0;
    setSwLaps(l => [{ n: l.length + 1, split: swElapsed - prev, total: swElapsed }, ...l]);
    playTimerSound("beep");
  }, [swRunning, swElapsed, swLaps]);

  // Handle visibility & unmounting for stopwatch
  useEffect(() => {
    if (swRunning) swRaf.current = requestAnimationFrame(swTick);
    return () => cancelAnimationFrame(swRaf.current);
  }, [swRunning, swTick]);


  // ── COUNTDOWN ─────────────────────────────────────────────────────────────
  const [cdStarted, setCdStarted] = useState(false);
  const [cdRunning, setCdRunning] = useState(false);
  const [cdTotalMs, setCdTotalMs] = useState(0);
  const [cdRemaining, setCdRemaining] = useState(0);
  const [cdCompleted, setCdCompleted] = useState(false);
  const cdTarget = useRef(null);
  const cdInterval = useRef(null);

  const syncCountdown = useCallback(() => {
    if (!cdRunning) return;
    const now = Date.now();
    const rem = Math.max(0, cdTarget.current - now);
    setCdRemaining(rem);

    if (rem <= 100) {
      clearInterval(cdInterval.current);
      setCdRunning(false);
      setCdCompleted(true);
      playTimerSound("complete");
      sendNotification({ title: "⏰ Timer done!", body: "Your countdown has finished.", sound: true });
    } else if (rem <= 10000 && rem > 9900) {
      playTimerSound("warning");
    }
  }, [cdRunning]);

  const cdStart = useCallback((totalMs) => {
    if (totalMs <= 0) return;
    setCdTotalMs(totalMs);
    setCdRemaining(totalMs);
    setCdStarted(true);
    setCdRunning(true);
    setCdCompleted(false);
    cdTarget.current = Date.now() + totalMs;
    playTimerSound("start");
    startBackgroundTimer({ label: "Countdown", totalMs });
  }, []);

  const cdToggle = useCallback(() => {
    if (cdRunning) {
      clearInterval(cdInterval.current);
      setCdRunning(false);
      pauseBackgroundTimer();
    } else {
      cdTarget.current = Date.now() + cdRemaining;
      setCdRunning(true);
      startBackgroundTimer({ label: "Countdown", totalMs: cdRemaining });
    }
  }, [cdRunning, cdRemaining]);

  const cdReset = useCallback(() => {
    clearInterval(cdInterval.current);
    setCdStarted(false);
    setCdRunning(false);
    setCdRemaining(0);
    setCdCompleted(false);
    stopBackgroundTimer();
  }, []);

  useEffect(() => {
    if (!cdRunning) { clearInterval(cdInterval.current); return; }
    cdInterval.current = setInterval(syncCountdown, 100);
    return () => clearInterval(cdInterval.current);
  }, [cdRunning, syncCountdown]);


  // ── INTERVALS ─────────────────────────────────────────────────────────────
  // Intervals is tricky because it has phases. Using Date.now() prevents drifting.
  const [intStarted, setIntStarted] = useState(false);
  const [intRunning, setIntRunning] = useState(false);
  const [intPhase, setIntPhase] = useState("work");
  const [intElapsed, setIntElapsed] = useState(0);
  const [intRound, setIntRound] = useState(1);
  const [intTotalRounds, setIntTotalRounds] = useState(0);
  const [intWorkMs, setIntWorkMs] = useState(0);
  const [intRestMs, setIntRestMs] = useState(0);
  const intTarget = useRef(null);
  const intInterval = useRef(null);

  const currentPhaseMs = intPhase === "work" ? intWorkMs : intRestMs;

  const syncInterval = useCallback(() => {
    if (!intRunning) return;
    const now = Date.now();
    const remain = Math.max(0, intTarget.current - now);
    const elapsed = currentPhaseMs - remain;
    setIntElapsed(elapsed);

    if (remain <= 100) {
      // Phase swap
      if (intPhase === "work") {
        playTimerSound("interval");
        setIntPhase("rest");
        setIntElapsed(0);
        intTarget.current = Date.now() + intRestMs;
      } else {
        if (intRound >= intTotalRounds) {
          playTimerSound("complete");
          sendNotification({ title: "🏋️ Workout done!", body: `Finished ${intTotalRounds} rounds!`, sound: true });
          clearInterval(intInterval.current);
          setIntRunning(false);
          setIntStarted(false);
          setIntRound(1);
          setIntPhase("work");
        } else {
          playTimerSound("interval");
          setIntRound(r => r + 1);
          setIntPhase("work");
          setIntElapsed(0);
          intTarget.current = Date.now() + intWorkMs;
        }
      }
    } else if (remain <= 3000 && remain > 2900) {
      playTimerSound("warning");
    }
  }, [intRunning, intPhase, intRound, intTotalRounds, intWorkMs, intRestMs, currentPhaseMs]);

  const intBegin = useCallback((workMs, restMs, rounds) => {
    if (workMs <= 0) return;
    setIntWorkMs(workMs);
    setIntRestMs(restMs);
    setIntTotalRounds(rounds);
    setIntStarted(true);
    setIntRunning(true);
    setIntElapsed(0);
    setIntRound(1);
    setIntPhase("work");
    intTarget.current = Date.now() + workMs;
    startBackgroundTimer({ label: "Interval Workout", totalMs: workMs });
  }, []);

  const intToggle = useCallback(() => {
    if (intRunning) {
      clearInterval(intInterval.current);
      setIntRunning(false);
      pauseBackgroundTimer();
    } else {
      intTarget.current = Date.now() + (currentPhaseMs - intElapsed);
      setIntRunning(true);
      startBackgroundTimer({ label: `Interval ${intPhase}`, totalMs: currentPhaseMs - intElapsed });
    }
  }, [intRunning, currentPhaseMs, intElapsed, intPhase]);

  const intReset = useCallback(() => {
    clearInterval(intInterval.current);
    setIntStarted(false);
    setIntRunning(false);
    setIntElapsed(0);
    setIntRound(1);
    setIntPhase("work");
    stopBackgroundTimer();
  }, []);

  useEffect(() => {
    if (!intRunning) { clearInterval(intInterval.current); return; }
    intInterval.current = setInterval(syncInterval, 100);
    return () => clearInterval(intInterval.current);
  }, [intRunning, syncInterval]);


  // ── POMODORO ──────────────────────────────────────────────────────────────
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoPhaseIdx, setPomoPhaseIdx] = useState(0);
  const [pomoRemaining, setPomoRemaining] = useState(25 * 60 * 1000);
  const [pomoSessions, setPomoSessions] = useState(0);
  const [pomoTotalMs, setPomoTotalMs] = useState(25 * 60 * 1000);
  const [pomoPhases, setPomoPhases] = useState([]);
  const pomoTarget = useRef(null);
  const pomoInterval = useRef(null);

  const syncPomo = useCallback(() => {
    if (!pomoRunning) return;
    const now = Date.now();
    const rem = Math.max(0, pomoTarget.current - now);
    setPomoRemaining(rem);

    if (rem <= 100) {
      clearInterval(pomoInterval.current);
      setPomoRunning(false);
      playTimerSound("complete");

      if (pomoPhaseIdx === 0) {
        sendNotification({ title: "🍅 Focus session done!", body: "Time for a break!", sound: true });
      }

      setPomoSessions(s => {
        const nextS = pomoPhaseIdx === 0 ? s + 1 : s;
        const nextIdx = pomoPhaseIdx === 0 ? (nextS % 4 === 0 ? 2 : 1) : 0;
        const nextMins = pomoPhases[nextIdx]?.mins || 25;
        
        setPomoPhaseIdx(nextIdx);
        setPomoRemaining(nextMins * 60 * 1000);
        setPomoTotalMs(nextMins * 60 * 1000);
        return nextS;
      });
    } else if (rem <= 60000 && rem > 59900) {
      playTimerSound("warning");
    }
  }, [pomoRunning, pomoPhaseIdx, pomoPhases]);

  useEffect(() => {
    if (!pomoRunning) { clearInterval(pomoInterval.current); return; }
    pomoInterval.current = setInterval(syncPomo, 100);
    return () => clearInterval(pomoInterval.current);
  }, [pomoRunning, syncPomo]);

  const pomoToggle = useCallback((phasesRef) => {
    if (!pomoPhases.length && phasesRef) setPomoPhases(phasesRef);
    if (pomoRunning) {
      clearInterval(pomoInterval.current);
      setPomoRunning(false);
      pauseBackgroundTimer();
    } else {
      pomoTarget.current = Date.now() + pomoRemaining;
      setPomoRunning(true);
      startBackgroundTimer({ label: "Focus Session", totalMs: pomoRemaining });
    }
  }, [pomoRunning, pomoRemaining, pomoPhases]);

  const pomoSwitchPhase = useCallback((idx, phasesRef) => {
    setPomoPhases(phasesRef);
    setPomoPhaseIdx(idx);
    setPomoRunning(false);
    const ms = phasesRef[idx].mins * 60 * 1000;
    setPomoRemaining(ms);
    setPomoTotalMs(ms);
    clearInterval(pomoInterval.current);
    stopBackgroundTimer();
  }, []);
  
  const pomoReset = useCallback((ms) => {
    setPomoRunning(false);
    setPomoRemaining(ms);
    setPomoTotalMs(ms);
    clearInterval(pomoInterval.current);
    stopBackgroundTimer();
  }, []);

  const value = {
    // Stopwatch
    swRunning, swElapsed, swLaps, swToggle, swReset, swLap,
    // Countdown
    cdStarted, cdRunning, cdTotalMs, cdRemaining, cdCompleted, cdStart, cdToggle, cdReset,
    // Intervals
    intStarted, intRunning, intPhase, intElapsed, intRound, intTotalRounds, currentPhaseMs, intBegin, intToggle, intReset,
    // Pomodoro
    pomoRunning, pomoPhaseIdx, pomoRemaining, pomoSessions, pomoTotalMs, pomoToggle, pomoSwitchPhase, pomoReset,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimerContext must be used within a TimerProvider");
  return context;
}
