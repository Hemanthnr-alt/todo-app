import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

// ── Local storage helpers ─────────────────────────────────────────────────────
const TASKS_KEY    = "30_offline_tasks";
const CATS_KEY     = "30_offline_cats";
const QUEUE_KEY    = "30_sync_queue";

const saveLocal = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

const loadLocal = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
};

// Generate a temp ID for offline items
const tempId = () => `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const isOfflineError = (err) =>
  !err.response && (
    err.code === "ERR_NETWORK"    ||
    err.code === "ECONNABORTED"   ||
    err.message?.includes("Network Error") ||
    err.message?.includes("offline") ||
    !navigator.onLine
  );

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useTasks = () => {
  const { isAuthenticated } = useAuth();
  const [tasks,      setTasks]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const syncingRef = useRef(false);

  // ── Save to local whenever state changes ──
  useEffect(() => {
    if (tasks.length > 0) saveLocal(TASKS_KEY, tasks);
  }, [tasks]);

  useEffect(() => {
    if (categories.length > 0) saveLocal(CATS_KEY, categories);
  }, [categories]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    if (!isAuthenticated) { setTasks([]); setLoading(false); return; }
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
      saveLocal(TASKS_KEY, res.data);
    } catch (err) {
      // Offline — use cached
      const cached = loadLocal(TASKS_KEY);
      if (cached) {
        setTasks(cached);
      } else if (isAuthenticated) {
        toast.error("Failed to load tasks");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadCategories = useCallback(async () => {
    if (!isAuthenticated) { setCategories([]); return; }
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
      saveLocal(CATS_KEY, res.data);
    } catch (err) {
      const cached = loadLocal(CATS_KEY);
      if (cached) {
        setCategories(cached);
      } else if (isAuthenticated) {
        toast.error("Failed to load categories");
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  // ── Sync queue ────────────────────────────────────────────────────────────
  const addToQueue = (action) => {
    const queue = loadLocal(QUEUE_KEY) || [];
    queue.push({ ...action, queuedAt: Date.now() });
    saveLocal(QUEUE_KEY, queue);
  };

  const syncQueue = useCallback(async () => {
    if (syncingRef.current || !isAuthenticated || !navigator.onLine) return;
    const queue = loadLocal(QUEUE_KEY) || [];
    if (queue.length === 0) return;

    syncingRef.current = true;
    const failed = [];

    for (const action of queue) {
      try {
        if (action.type === "ADD_TASK") {
          const { tempId: tid, ...taskData } = action.data;
          const res = await api.post("/tasks", taskData);
          // Replace temp task with real one
          setTasks(prev => prev.map(t => t.id === tid ? res.data : t));

        } else if (action.type === "UPDATE_TASK") {
          const res = await api.put(`/tasks/${action.id}`, action.data);
          setTasks(prev => prev.map(t => t.id === action.id ? res.data : t));

        } else if (action.type === "DELETE_TASK") {
          await api.delete(`/tasks/${action.id}`);

        } else if (action.type === "ADD_CATEGORY") {
          const { tempId: tid, ...catData } = action.data;
          const res = await api.post("/categories", catData);
          setCategories(prev => prev.map(c => c.id === tid ? res.data : c));

        } else if (action.type === "DELETE_CATEGORY") {
          await api.delete(`/categories/${action.id}`);
        }
      } catch {
        failed.push(action);
      }
    }

    saveLocal(QUEUE_KEY, failed);
    syncingRef.current = false;

    if (failed.length === 0 && queue.length > 0) {
      toast.success("Synced offline changes! ✅");
      // Reload fresh data from server
      loadTasks();
      loadCategories();
    }
  }, [isAuthenticated, loadTasks, loadCategories]);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      setTimeout(() => syncQueue(), 2000); // small delay for connection to stabilise
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncQueue]);

  // Sync on mount if online and there's a queue
  useEffect(() => {
    if (isAuthenticated && navigator.onLine) {
      setTimeout(() => syncQueue(), 3000);
    }
  }, [isAuthenticated, syncQueue]);

  // ── Add Task ──────────────────────────────────────────────────────────────
  const addTask = useCallback(async (taskData) => {
    if (!isAuthenticated) return null;

    if (!navigator.onLine) {
      // ✅ Save locally with temp ID
      const tid = tempId();
      const offlineTask = {
        id: tid,
        ...taskData,
        completed:   false,
        attachments: [],
        subtasks:    [],
        tags:        taskData.tags || [],
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
        Category:    null,
        _offline:    true, // flag so UI can show indicator
      };
      setTasks(prev => [offlineTask, ...prev]);
      addToQueue({ type: "ADD_TASK", data: { ...taskData, tempId: tid } });
      toast("Task saved offline — will sync when connected 📶", {
        icon: "⏳",
        style: {
          background: "#1a1a2e",
          color: "#f1f5f9",
          border: "1px solid rgba(245,158,11,0.3)",
        },
      });
      return offlineTask;
    }

    try {
      const res = await api.post("/tasks", taskData);
      setTasks(prev => [res.data, ...prev]);
      toast.success("Task created! 🎉");
      return res.data;
    } catch (err) {
      if (isOfflineError(err)) {
        // Fallback — treat as offline
        return addTask(taskData); // retry as offline
      }
      toast.error(err.response?.data?.error || "Failed to create task");
      return null;
    }
  }, [isAuthenticated]);

  // ── Update Task ───────────────────────────────────────────────────────────
  const updateTask = useCallback(async (id, updates) => {
    if (!isAuthenticated) return null;

    // Optimistic update immediately
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (!navigator.onLine) {
      addToQueue({ type: "UPDATE_TASK", id, data: updates });
      return { id, ...updates };
    }

    try {
      const res = await api.put(`/tasks/${id}`, updates);
      setTasks(prev => prev.map(t => t.id === id ? res.data : t));
      return res.data;
    } catch (err) {
      if (isOfflineError(err)) {
        addToQueue({ type: "UPDATE_TASK", id, data: updates });
        return { id, ...updates };
      }
      toast.error(err.response?.data?.error || "Failed to update task");
      return null;
    }
  }, [isAuthenticated]);

  // ── Delete Task ───────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (id) => {
    if (!isAuthenticated) return;

    // Remove immediately from UI
    setTasks(prev => prev.filter(t => t.id !== id));

    if (!navigator.onLine) {
      addToQueue({ type: "DELETE_TASK", id });
      toast("Deleted offline — will sync when connected 📶");
      return;
    }

    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Task deleted");
    } catch (err) {
      if (isOfflineError(err)) {
        addToQueue({ type: "DELETE_TASK", id });
        return;
      }
      // Restore task if delete failed
      loadTasks();
      toast.error("Failed to delete task");
    }
  }, [isAuthenticated, loadTasks]);

  const toggleComplete = useCallback(async (task) => {
    const updated = await updateTask(task.id, { completed: !task.completed });
    if (updated?.completed) toast.success("Task completed! 🎊");
    return updated;
  }, [updateTask]);

  // ── Add Category ──────────────────────────────────────────────────────────
  const addCategory = useCallback(async (catData) => {
    if (!isAuthenticated) return null;

    if (!navigator.onLine) {
      const tid = tempId();
      const offlineCat = {
        id:    tid,
        name:  catData.name,
        color: catData.color || "#ff6b9d",
        icon:  catData.icon  || "📁",
        _offline: true,
      };
      setCategories(prev => [...prev, offlineCat]);
      addToQueue({ type: "ADD_CATEGORY", data: { ...catData, tempId: tid } });
      toast("Category saved offline — will sync when connected 📶", {
        icon: "⏳",
        style: {
          background: "#1a1a2e",
          color: "#f1f5f9",
          border: "1px solid rgba(245,158,11,0.3)",
        },
      });
      return offlineCat;
    }

    try {
      const res = await api.post("/categories", catData);
      setCategories(prev => [...prev, res.data]);
      toast.success("Category created!");
      return res.data;
    } catch (err) {
      if (isOfflineError(err)) {
        return addCategory(catData);
      }
      toast.error(err.response?.data?.error || "Failed to create category");
      return null;
    }
  }, [isAuthenticated]);

  // ── Delete Category ───────────────────────────────────────────────────────
  const deleteCategory = useCallback(async (id) => {
    if (!isAuthenticated) return;

    setCategories(prev => prev.filter(c => c.id !== id));

    if (!navigator.onLine) {
      addToQueue({ type: "DELETE_CATEGORY", id });
      toast("Deleted offline — will sync when connected 📶");
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
    } catch (err) {
      if (isOfflineError(err)) {
        addToQueue({ type: "DELETE_CATEGORY", id });
        return;
      }
      loadCategories();
      toast.error("Failed to delete category");
    }
  }, [isAuthenticated, loadCategories]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      total:        tasks.length,
      completed:    tasks.filter(t => t.completed).length,
      pending:      tasks.filter(t => !t.completed).length,
      highPriority: tasks.filter(t => t.priority === "high" && !t.completed).length,
      dueToday:     tasks.filter(t => t.dueDate === today).length,
      overdue:      tasks.filter(t => t.dueDate && t.dueDate < today && !t.completed).length,
    };
  }, [tasks]);

  return {
    tasks, categories, loading, stats,
    loadTasks, loadCategories,
    addTask, updateTask, deleteTask, toggleComplete,
    addCategory, deleteCategory,
    setTasks, setCategories,
  };
};