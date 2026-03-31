import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { localTasks, localCategories, isNativeApp } from "../services/storage";
import toast from "react-hot-toast";

const TASKS_KEY = "30_offline_tasks";
const CATS_KEY  = "30_offline_cats";
const QUEUE_KEY = "30_sync_queue";

const saveLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const loadLocal = (k)    => { try { return JSON.parse(localStorage.getItem(k)||"null"); } catch { return null; } };

const isOfflineErr = (e) => !e.response && (
  e.code === "ERR_NETWORK" || e.code === "ECONNABORTED" ||
  e.message?.includes("Network Error") || !navigator.onLine
);

export const useTasks = () => {
  const { isAuthenticated } = useAuth();
  const NATIVE = isNativeApp();

  const [tasks,      setTasksState] = useState(() => NATIVE ? localTasks.getAll() : (loadLocal(TASKS_KEY)||[]));
  const [categories, setCatsState]  = useState(() => NATIVE ? localCategories.getAll() : (loadLocal(CATS_KEY)||[]));
  const [loading,    setLoading]    = useState(!NATIVE);
  const syncingRef = useRef(false);

  // Wrap setters to always persist locally
  const setTasks = useCallback((fn) => {
    setTasksState(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (NATIVE) localTasks.save(next);
      else saveLocal(TASKS_KEY, next);
      return next;
    });
  }, [NATIVE]);

  const setCategories = useCallback((fn) => {
    setCatsState(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (NATIVE) localCategories.save(next);
      else saveLocal(CATS_KEY, next);
      return next;
    });
  }, [NATIVE]);

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    if (NATIVE) { setLoading(false); return; } // APK: already loaded from storage
    if (!isAuthenticated) { setTasksState([]); setLoading(false); return; }

    const cached = loadLocal(TASKS_KEY);
    if (cached?.length) setTasksState(cached);

    if (!navigator.onLine) { setLoading(false); return; }

    try {
      const res = await api.get("/tasks");
      setTasksState(res.data);
      saveLocal(TASKS_KEY, res.data);
    } catch { /* keep cached */ }
    finally { setLoading(false); }
  }, [isAuthenticated, NATIVE]);

  const loadCategories = useCallback(async () => {
    if (NATIVE) return;
    if (!isAuthenticated) { setCatsState([]); return; }

    const cached = loadLocal(CATS_KEY);
    if (cached?.length) setCatsState(cached);

    if (!navigator.onLine) return;

    try {
      const res = await api.get("/categories");
      setCatsState(res.data);
      saveLocal(CATS_KEY, res.data);
    } catch {}
  }, [isAuthenticated, NATIVE]);

  useEffect(() => { loadTasks(); loadCategories(); }, [loadTasks, loadCategories]);

  // ── Sync queue (web only) ─────────────────────────────────────────────────
  const addToQueue = (action) => {
    if (NATIVE) return;
    const q = loadLocal(QUEUE_KEY)||[];
    q.push({ ...action, at: Date.now() });
    saveLocal(QUEUE_KEY, q);
  };

  const syncQueue = useCallback(async () => {
    if (NATIVE || syncingRef.current || !isAuthenticated || !navigator.onLine) return;
    const q = loadLocal(QUEUE_KEY)||[];
    if (!q.length) return;
    syncingRef.current = true;
    const failed = [];
    for (const a of q) {
      try {
        if (a.type==="ADD_TASK") {
          const { tempId: tid, ...data } = a.data;
          const res = await api.post("/tasks", data);
          setTasks(prev => prev.map(t => t.id===tid ? res.data : t));
        } else if (a.type==="UPDATE_TASK") {
          const res = await api.put(`/tasks/${a.id}`, a.data);
          setTasks(prev => prev.map(t => t.id===a.id ? res.data : t));
        } else if (a.type==="DELETE_TASK") {
          await api.delete(`/tasks/${a.id}`);
        } else if (a.type==="ADD_CATEGORY") {
          const { tempId: tid, ...data } = a.data;
          const res = await api.post("/categories", data);
          setCategories(prev => prev.map(c => c.id===tid ? res.data : c));
        } else if (a.type==="DELETE_CATEGORY") {
          await api.delete(`/categories/${a.id}`);
        }
      } catch { failed.push(a); }
    }
    saveLocal(QUEUE_KEY, failed);
    syncingRef.current = false;
    if (!failed.length && q.length) {
      toast.success("Synced! ✅");
      loadTasks(); loadCategories();
    }
  }, [NATIVE, isAuthenticated, loadTasks, loadCategories]);

  useEffect(() => {
    const go = () => setTimeout(syncQueue, 2000);
    window.addEventListener("online", go);
    return () => window.removeEventListener("online", go);
  }, [syncQueue]);

  useEffect(() => {
    if (!NATIVE && isAuthenticated && navigator.onLine) setTimeout(syncQueue, 3000);
  }, [isAuthenticated, NATIVE, syncQueue]);

  // ── Add Task ──────────────────────────────────────────────────────────────
  const addTask = useCallback(async (taskData) => {
    // APK: always local
    if (NATIVE) {
      const t = localTasks.add(taskData);
      setTasksState(localTasks.getAll());
      toast.success("Task created! 🎉");
      return t;
    }

    if (!isAuthenticated) return null;

    if (!navigator.onLine) {
      const tid = `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const t = { id:tid, ...taskData, completed:false, attachments:[], subtasks:[], tags:[], createdAt:new Date().toISOString(), _offline:true };
      setTasks(prev => [t, ...prev]);
      addToQueue({ type:"ADD_TASK", data:{ ...taskData, tempId:tid } });
      toast("Saved offline — will sync when connected 📶");
      return t;
    }

    try {
      const res = await api.post("/tasks", taskData);
      setTasks(prev => [res.data, ...prev]);
      toast.success("Task created! 🎉");
      return res.data;
    } catch (err) {
      if (isOfflineErr(err)) return addTask(taskData);
      toast.error(err.response?.data?.error || "Failed to create task");
      return null;
    }
  }, [NATIVE, isAuthenticated]);

  // ── Update Task ───────────────────────────────────────────────────────────
  const updateTask = useCallback(async (id, updates) => {
    if (NATIVE) {
      const t = localTasks.update(id, updates);
      setTasksState(localTasks.getAll());
      return t;
    }

    if (!isAuthenticated) return null;
    setTasks(prev => prev.map(t => t.id===id ? { ...t, ...updates } : t));

    if (!navigator.onLine) { addToQueue({ type:"UPDATE_TASK", id, data:updates }); return { id, ...updates }; }

    try {
      const res = await api.put(`/tasks/${id}`, updates);
      setTasks(prev => prev.map(t => t.id===id ? res.data : t));
      return res.data;
    } catch (err) {
      if (isOfflineErr(err)) { addToQueue({ type:"UPDATE_TASK", id, data:updates }); return { id, ...updates }; }
      toast.error("Failed to update task");
      return null;
    }
  }, [NATIVE, isAuthenticated]);

  // ── Delete Task ───────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (id) => {
    if (NATIVE) {
      localTasks.delete(id);
      setTasksState(localTasks.getAll());
      toast.success("Task deleted");
      return;
    }

    if (!isAuthenticated) return;
    setTasks(prev => prev.filter(t => t.id !== id));

    if (!navigator.onLine) { addToQueue({ type:"DELETE_TASK", id }); return; }

    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Task deleted");
    } catch (err) {
      if (isOfflineErr(err)) { addToQueue({ type:"DELETE_TASK", id }); return; }
      loadTasks();
      toast.error("Failed to delete task");
    }
  }, [NATIVE, isAuthenticated, loadTasks]);

  const toggleComplete = useCallback(async (task) => {
    const updated = await updateTask(task.id, { completed: !task.completed });
    if (updated?.completed) toast.success("Task completed! 🎊");
    return updated;
  }, [updateTask]);

  // ── Add Category ──────────────────────────────────────────────────────────
  const addCategory = useCallback(async (catData) => {
    if (NATIVE) {
      const c = localCategories.add(catData);
      setCatsState(localCategories.getAll());
      toast.success("Category created!");
      return c;
    }

    if (!isAuthenticated) return null;

    if (!navigator.onLine) {
      const tid = `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const c = { id:tid, ...catData, _offline:true };
      setCategories(prev => [...prev, c]);
      addToQueue({ type:"ADD_CATEGORY", data:{ ...catData, tempId:tid } });
      toast("Saved offline 📶");
      return c;
    }

    try {
      const res = await api.post("/categories", catData);
      setCategories(prev => [...prev, res.data]);
      toast.success("Category created!");
      return res.data;
    } catch (err) {
      if (isOfflineErr(err)) return addCategory(catData);
      toast.error(err.response?.data?.error || "Failed");
      return null;
    }
  }, [NATIVE, isAuthenticated]);

  // ── Delete Category ───────────────────────────────────────────────────────
  const deleteCategory = useCallback(async (id) => {
    if (NATIVE) {
      localCategories.delete(id);
      setCatsState(localCategories.getAll());
      toast.success("Category deleted");
      return;
    }

    if (!isAuthenticated) return;
    setCategories(prev => prev.filter(c => c.id !== id));

    if (!navigator.onLine) { addToQueue({ type:"DELETE_CATEGORY", id }); return; }

    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
    } catch (err) {
      if (isOfflineErr(err)) { addToQueue({ type:"DELETE_CATEGORY", id }); return; }
      loadCategories();
      toast.error("Failed");
    }
  }, [NATIVE, isAuthenticated, loadCategories]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      total:        tasks.length,
      completed:    tasks.filter(t => t.completed).length,
      pending:      tasks.filter(t => !t.completed).length,
      highPriority: tasks.filter(t => t.priority==="high" && !t.completed).length,
      dueToday:     tasks.filter(t => t.dueDate===today).length,
      overdue:      tasks.filter(t => t.dueDate && t.dueDate<today && !t.completed).length,
    };
  }, [tasks]);

  return {
    tasks, categories, loading, stats,
    loadTasks, loadCategories,
    addTask, updateTask, deleteTask, toggleComplete,
    addCategory, deleteCategory,
    setTasks, setCategories,
    isNative: NATIVE,
  };
};