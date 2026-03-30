import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const HABITS_KEY  = "30_habits";
const HQUEUE_KEY  = "30_habits_queue";

const save  = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load  = (k)    => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const today = ()     => new Date().toISOString().split("T")[0];

export const useHabits = () => {
  const { isAuthenticated } = useAuth();
  const [habits,  setHabits]  = useState(() => load(HABITS_KEY) || []);
  const [loading, setLoading] = useState(true);
  const syncing = useRef(false);

  // Always persist locally
  useEffect(() => { save(HABITS_KEY, habits); }, [habits]);

  // Load from server if online
  const loadHabits = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }

    // Show local immediately
    const cached = load(HABITS_KEY);
    if (cached?.length) setHabits(cached);

    if (!navigator.onLine) { setLoading(false); return; }

    try {
      const res = await api.get("/habits");
      setHabits(res.data);
      save(HABITS_KEY, res.data);
    } catch {
      // Keep local data — no error shown
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadHabits(); }, [loadHabits]);

  // Sync queue for offline changes
  const addToQueue = (action) => {
    const q = load(HQUEUE_KEY) || [];
    q.push({ ...action, at: Date.now() });
    save(HQUEUE_KEY, q);
  };

  const syncQueue = useCallback(async () => {
    if (syncing.current || !isAuthenticated || !navigator.onLine) return;
    const q = load(HQUEUE_KEY) || [];
    if (!q.length) return;
    syncing.current = true;
    const failed = [];
    for (const action of q) {
      try {
        if (action.type === "ADD") {
          const res = await api.post("/habits", action.data);
          // Replace offline ID with real ID
          setHabits(prev => prev.map(h =>
            h.id === action.data._localId ? { ...res.data } : h
          ));
        } else if (action.type === "UPDATE") {
          await api.put(`/habits/${action.id}`, action.data);
        } else if (action.type === "DELETE") {
          await api.delete(`/habits/${action.id}`);
        }
      } catch { failed.push(action); }
    }
    save(HQUEUE_KEY, failed);
    syncing.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    const go = () => setTimeout(syncQueue, 1500);
    window.addEventListener("online", go);
    return () => window.removeEventListener("online", go);
  }, [syncQueue]);

  useEffect(() => {
    if (isAuthenticated && navigator.onLine) setTimeout(syncQueue, 2000);
  }, [isAuthenticated, syncQueue]);

  // ── CRUD ──
  const addHabit = useCallback(async (data) => {
    const localId = `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newHabit = {
      id: localId, ...data,
      completedDates: [], streak: 0,
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => [newHabit, ...prev]);

    if (navigator.onLine && isAuthenticated) {
      try {
        const res = await api.post("/habits", data);
        setHabits(prev => prev.map(h => h.id === localId ? res.data : h));
        return res.data;
      } catch {}
    } else {
      addToQueue({ type: "ADD", data: { ...data, _localId: localId } });
    }
    return newHabit;
  }, [isAuthenticated]);

  const toggleHabit = useCallback(async (id, date = today()) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const dates  = h.completedDates || [];
      const done   = dates.includes(date);
      const newDates = done ? dates.filter(d => d !== date) : [...dates, date];

      // Calculate streak properly
      let streak = 0;
      const sorted = [...newDates].sort().reverse();
      let check = today();
      for (const d of sorted) {
        if (d === check) {
          streak++;
          const prev = new Date(check);
          prev.setDate(prev.getDate() - 1);
          check = prev.toISOString().split("T")[0];
        } else break;
      }

      const updated = { ...h, completedDates: newDates, streak };
      // Sync to server
      if (navigator.onLine && isAuthenticated && !id.startsWith("offline_")) {
        api.put(`/habits/${id}`, { completedDates: newDates, streak }).catch(() => {});
      } else if (!id.startsWith("offline_")) {
        addToQueue({ type: "UPDATE", id, data: { completedDates: newDates, streak } });
      }
      return updated;
    }));
  }, [isAuthenticated]);

  const deleteHabit = useCallback(async (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    if (navigator.onLine && isAuthenticated && !id.startsWith("offline_")) {
      api.delete(`/habits/${id}`).catch(() => {});
    } else if (!id.startsWith("offline_")) {
      addToQueue({ type: "DELETE", id });
    }
  }, [isAuthenticated]);

  const updateHabit = useCallback(async (id, data) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
    if (navigator.onLine && isAuthenticated && !id.startsWith("offline_")) {
      api.put(`/habits/${id}`, data).catch(() => {});
    } else {
      addToQueue({ type: "UPDATE", id, data });
    }
  }, [isAuthenticated]);

  return { habits, loading, addHabit, toggleHabit, deleteHabit, updateHabit, today };
};