import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { localHabits, isNativeApp } from "../services/storage";
import { addDaysToYMD, localTodayYMD } from "../utils/date";

const HABITS_KEY = "30_habits";
const HQUEUE_KEY = "30_habits_queue";

const save = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k)   => { try { return JSON.parse(localStorage.getItem(k)||"null"); } catch { return null; } };

export const useHabits = () => {
  const { isAuthenticated } = useAuth();
  const NATIVE = isNativeApp();

  const [habits,  setHabitsState] = useState(() => {
    if (NATIVE) return localHabits.getAll();
    const cached = load(HABITS_KEY);
    return Array.isArray(cached) ? cached : [];
  });
  const [loading, setLoading]     = useState(!NATIVE);
  const syncing = useRef(false);
  const habitsRef = useRef(habits);
  habitsRef.current = habits;

  const setHabits = useCallback((fn) => {
    setHabitsState(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (NATIVE) localHabits.save(next);
      else save(HABITS_KEY, next);
      return next;
    });
  }, [NATIVE]);

  const loadHabits = useCallback(async () => {
    if (NATIVE) { setLoading(false); return; }
    if (!isAuthenticated) { setLoading(false); return; }

    const cached = load(HABITS_KEY);
    if (cached?.length) setHabitsState(cached);
    if (!navigator.onLine) { setLoading(false); return; }

    try {
      const res = await api.get("/habits");
      setHabitsState(res.data);
      save(HABITS_KEY, res.data);
    } catch {}
    finally { setLoading(false); }
  }, [isAuthenticated, NATIVE]);

  useEffect(() => { loadHabits(); }, [loadHabits]);

  // Sync queue (web only)
  const addToQueue = (action) => {
    if (NATIVE) return;
    const q = load(HQUEUE_KEY)||[];
    q.push({ ...action, at: Date.now() });
    save(HQUEUE_KEY, q);
  };

  const syncQueue = useCallback(async () => {
    if (NATIVE || syncing.current || !isAuthenticated || !navigator.onLine) return;
    const q = load(HQUEUE_KEY)||[];
    if (!q.length) return;
    syncing.current = true;
    const failed = [];
    for (const a of q) {
      try {
        if (a.type==="ADD")    { const res = await api.post("/habits", a.data); setHabits(prev => prev.map(h => h.id===a.data._localId ? res.data : h)); }
        if (a.type==="UPDATE") { await api.put(`/habits/${a.id}`, a.data); }
        if (a.type==="DELETE") { await api.delete(`/habits/${a.id}`); }
      } catch { failed.push(a); }
    }
    save(HQUEUE_KEY, failed);
    syncing.current = false;
  }, [NATIVE, isAuthenticated]);

  useEffect(() => {
    const go = () => setTimeout(syncQueue, 1500);
    window.addEventListener("online", go);
    return () => window.removeEventListener("online", go);
  }, [syncQueue]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addHabit = useCallback(async (data) => {
    if (NATIVE) {
      const h = localHabits.add(data);
      setHabitsState(localHabits.getAll());
      return h;
    }

    const localId = `offline_${Date.now()}`;
    const newH = { id:localId, ...data, completedDates:[], streak:0, createdAt:new Date().toISOString() };
    setHabits(prev => [newH, ...prev]);

    if (navigator.onLine && isAuthenticated) {
      try {
        const { name: habitName, ...rest } = data;
        const res = await api.post("/habits", { name: habitName?.trim?.() || habitName, ...rest });
        setHabits(prev => prev.map(h => h.id===localId ? res.data : h));
        return res.data;
      } catch {}
    } else {
      addToQueue({ type:"ADD", data:{ ...data, _localId:localId } });
    }
    return newH;
  }, [NATIVE, isAuthenticated]);

  const toggleHabit = useCallback((id, date) => {
    if (NATIVE) {
      localHabits.toggle(id, date);
      setHabitsState(localHabits.getAll());
      return;
    }

    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const dates   = h.completedDates||[];
      const done    = dates.includes(date);
      const newDates = done ? dates.filter(d=>d!==date) : [...dates, date];
      let streak = 0;
      let check = localTodayYMD();
      for (const d of [...newDates].sort().reverse()) {
        if (d === check) {
          streak++;
          check = addDaysToYMD(check, -1);
        } else break;
      }
      const updated = { ...h, completedDates:newDates, streak };
      if (navigator.onLine && isAuthenticated && !id.startsWith("offline_")) {
        api.put(`/habits/${id}`, { completedDates:newDates, streak }).catch(()=>{});
      } else if (!id.startsWith("offline_")) {
        addToQueue({ type:"UPDATE", id, data:{ completedDates:newDates, streak } });
      }
      return updated;
    }));
  }, [NATIVE, isAuthenticated]);

  const deleteHabit = useCallback((id) => {
    if (NATIVE) {
      localHabits.delete(id);
      setHabitsState(localHabits.getAll());
      return;
    }
    setHabits(prev => prev.filter(h => h.id!==id));
    if (navigator.onLine && isAuthenticated && !id.startsWith("offline_")) {
      api.delete(`/habits/${id}`).catch(()=>{});
    } else {
      addToQueue({ type:"DELETE", id });
    }
  }, [NATIVE, isAuthenticated]);

  const updateHabit = useCallback((id, data) => {
    if (NATIVE) {
      localHabits.update(id, data);
      setHabitsState(localHabits.getAll());
      return;
    }
    setHabits(prev => prev.map(h => h.id===id ? { ...h, ...data } : h));
    if (navigator.onLine && isAuthenticated && !id.startsWith("offline_")) {
      api.put(`/habits/${id}`, data).catch(()=>{});
    } else {
      addToQueue({ type:"UPDATE", id, data });
    }
  }, [NATIVE, isAuthenticated]);

  useEffect(() => {
    if (NATIVE || !isAuthenticated) return undefined;
    const tick = () => {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      habitsRef.current.forEach((h) => {
        if (!h.reminderEnabled || !h.reminderTime) return;
        const rt = String(h.reminderTime).slice(0, 5);
        if (rt !== hm) return;
        const today = localTodayYMD();
        if ((h.completedDates || []).includes(today)) return;
        try {
          const notifs = JSON.parse(localStorage.getItem("notifs") || "[]");
          const nid = `habit_${h.id}_${today}_${hm}`;
          if (notifs.some((n) => n.id === nid)) return;
          notifs.unshift({
            id: nid,
            title: "Habit reminder",
            body: `${h.name} — keep your streak going today.`,
            time: hm,
            read: false,
          });
          localStorage.setItem("notifs", JSON.stringify(notifs.slice(0, 40)));
        } catch { /* ignore */ }
      });
    };
    const id = setInterval(tick, 55 * 1000);
    tick();
    return () => clearInterval(id);
  }, [NATIVE, isAuthenticated]);

  return { habits, loading, addHabit, toggleHabit, deleteHabit, updateHabit };
};