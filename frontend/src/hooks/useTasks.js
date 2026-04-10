import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { isNativeApp, localCategories, localTasks } from "../services/storage";

const TASKS_KEY = "30_offline_tasks";
const CATS_KEY = "30_offline_cats";
const QUEUE_KEY = "30_sync_queue";

const saveLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const loadLocal = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

const isOfflineErr = (error) => !error.response && (
  error.code === "ERR_NETWORK"
  || error.code === "ECONNABORTED"
  || error.message?.includes("Network Error")
  || !navigator.onLine
);

export const useTasks = () => {
  const { isAuthenticated } = useAuth();
  const NATIVE = isNativeApp();

  const [tasks, setTasksState] = useState(() => (NATIVE ? localTasks.getAll() : (loadLocal(TASKS_KEY) || [])));
  const [categories, setCatsState] = useState(() => (NATIVE ? localCategories.getAll() : (loadLocal(CATS_KEY) || [])));
  const [loading, setLoading] = useState(!NATIVE);
  const syncingRef = useRef(false);

  const setTasks = useCallback((updater) => {
    setTasksState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (NATIVE) localTasks.save(next);
      else saveLocal(TASKS_KEY, next);
      return next;
    });
  }, [NATIVE]);

  const setCategories = useCallback((updater) => {
    setCatsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (NATIVE) localCategories.save(next);
      else saveLocal(CATS_KEY, next);
      return next;
    });
  }, [NATIVE]);

  const loadTasks = useCallback(async () => {
    if (NATIVE) {
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setTasksState([]);
      setLoading(false);
      return;
    }

    const cached = loadLocal(TASKS_KEY);
    if (cached?.length) setTasksState(cached);

    if (!navigator.onLine) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/tasks");
      setTasksState(res.data);
      saveLocal(TASKS_KEY, res.data);
    } catch {
      // Keep cached data.
    } finally {
      setLoading(false);
    }
  }, [NATIVE, isAuthenticated]);

  const loadCategories = useCallback(async () => {
    if (NATIVE) return;

    if (!isAuthenticated) {
      setCatsState([]);
      return;
    }

    const cached = loadLocal(CATS_KEY);
    if (cached?.length) setCatsState(cached);

    if (!navigator.onLine) return;

    try {
      const res = await api.get("/categories");
      setCatsState(res.data);
      saveLocal(CATS_KEY, res.data);
    } catch {}
  }, [NATIVE, isAuthenticated]);

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  const addToQueue = (action) => {
    if (NATIVE) return;
    const queue = loadLocal(QUEUE_KEY) || [];
    queue.push({ ...action, at: Date.now() });
    saveLocal(QUEUE_KEY, queue);
  };

  const syncQueue = useCallback(async () => {
    if (NATIVE || syncingRef.current || !isAuthenticated || !navigator.onLine) return;

    const queue = loadLocal(QUEUE_KEY) || [];
    if (!queue.length) return;

    syncingRef.current = true;
    const failed = [];

    for (const action of queue) {
      try {
        if (action.type === "ADD_TASK") {
          const { tempId, ...data } = action.data;
          const res = await api.post("/tasks", data);
          setTasks((prev) => prev.map((task) => (task.id === tempId ? res.data : task)));
        } else if (action.type === "UPDATE_TASK") {
          const res = await api.put(`/tasks/${action.id}`, action.data);
          setTasks((prev) => prev.map((task) => (task.id === action.id ? res.data : task)));
        } else if (action.type === "DELETE_TASK") {
          await api.delete(`/tasks/${action.id}`);
        } else if (action.type === "ADD_CATEGORY") {
          const { tempId, ...data } = action.data;
          const res = await api.post("/categories", data);
          setCategories((prev) => prev.map((category) => (category.id === tempId ? res.data : category)));
        } else if (action.type === "DELETE_CATEGORY") {
          await api.delete(`/categories/${action.id}`);
        }
      } catch {
        failed.push(action);
      }
    }

    saveLocal(QUEUE_KEY, failed);
    syncingRef.current = false;

    if (!failed.length && queue.length) {
      toast.success("Synced successfully.");
      loadTasks();
      loadCategories();
    }
  }, [NATIVE, isAuthenticated, loadCategories, loadTasks, setCategories, setTasks]);

  useEffect(() => {
    const handleOnline = () => setTimeout(syncQueue, 2000);
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncQueue]);

  useEffect(() => {
    if (!NATIVE && isAuthenticated && navigator.onLine) {
      setTimeout(syncQueue, 3000);
    }
  }, [NATIVE, isAuthenticated, syncQueue]);

  const createOfflineTask = useCallback((taskData) => {
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const task = {
      id: tempId,
      ...taskData,
      completed: false,
      attachments: [],
      subtasks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      _offline: true,
    };
    setTasks((prev) => [task, ...prev]);
    addToQueue({ type: "ADD_TASK", data: { ...taskData, tempId } });
    toast("Saved offline. It will sync when connected.");
    return task;
  }, [setTasks]);

  const addTask = useCallback(async (taskData) => {
    if (NATIVE) {
      const task = localTasks.add(taskData);
      setTasksState(localTasks.getAll());
      toast.success("Task created.");
      return task;
    }

    if (!isAuthenticated) return null;
    if (!navigator.onLine) return createOfflineTask(taskData);

    try {
      const res = await api.post("/tasks", taskData);
      setTasks((prev) => [res.data, ...prev]);
      toast.success("Task created.");
      return res.data;
    } catch (error) {
      if (isOfflineErr(error)) return createOfflineTask(taskData);
      toast.error(error.response?.data?.error || "Failed to create task");
      return null;
    }
  }, [NATIVE, isAuthenticated, createOfflineTask, setTasks]);

  const updateTask = useCallback(async (id, updates) => {
    if (NATIVE) {
      const task = localTasks.update(id, updates);
      setTasksState(localTasks.getAll());
      return task;
    }

    if (!isAuthenticated) return null;

    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));

    if (!navigator.onLine) {
      addToQueue({ type: "UPDATE_TASK", id, data: updates });
      return { id, ...updates };
    }

    try {
      const res = await api.put(`/tasks/${id}`, updates);
      setTasks((prev) => prev.map((task) => (task.id === id ? res.data : task)));
      return res.data;
    } catch (error) {
      if (isOfflineErr(error)) {
        addToQueue({ type: "UPDATE_TASK", id, data: updates });
        return { id, ...updates };
      }
      toast.error("Failed to update task");
      return null;
    }
  }, [NATIVE, isAuthenticated, setTasks]);

  const deleteTask = useCallback(async (id) => {
    if (NATIVE) {
      localTasks.delete(id);
      setTasksState(localTasks.getAll());
      toast.success("Task deleted");
      return;
    }

    if (!isAuthenticated) return;

    setTasks((prev) => prev.filter((task) => task.id !== id));

    if (!navigator.onLine) {
      addToQueue({ type: "DELETE_TASK", id });
      return;
    }

    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Task deleted");
    } catch (error) {
      if (isOfflineErr(error)) {
        addToQueue({ type: "DELETE_TASK", id });
        return;
      }
      loadTasks();
      toast.error("Failed to delete task");
    }
  }, [NATIVE, isAuthenticated, loadTasks, setTasks]);

  const toggleComplete = useCallback(async (task) => {
    const updated = await updateTask(task.id, { completed: !task.completed });
    if (updated?.completed) toast.success("Task completed.");
    return updated;
  }, [updateTask]);

  const createOfflineCategory = useCallback((catData) => {
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const category = { id: tempId, ...catData, _offline: true };
    setCategories((prev) => [...prev, category]);
    addToQueue({ type: "ADD_CATEGORY", data: { ...catData, tempId } });
    toast("Saved offline.");
    return category;
  }, [setCategories]);

  const addCategory = useCallback(async (catData) => {
    if (NATIVE) {
      const category = localCategories.add(catData);
      setCatsState(localCategories.getAll());
      toast.success("Category created.");
      return category;
    }

    if (!isAuthenticated) return null;
    if (!navigator.onLine) return createOfflineCategory(catData);

    try {
      const res = await api.post("/categories", catData);
      setCategories((prev) => [...prev, res.data]);
      toast.success("Category created.");
      return res.data;
    } catch (error) {
      if (isOfflineErr(error)) return createOfflineCategory(catData);
      toast.error(error.response?.data?.error || "Failed");
      return null;
    }
  }, [NATIVE, isAuthenticated, createOfflineCategory, setCategories]);

  const deleteCategory = useCallback(async (id) => {
    if (NATIVE) {
      localCategories.delete(id);
      setCatsState(localCategories.getAll());
      toast.success("Category deleted");
      return;
    }

    if (!isAuthenticated) return;

    setCategories((prev) => prev.filter((category) => category.id !== id));

    if (!navigator.onLine) {
      addToQueue({ type: "DELETE_CATEGORY", id });
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
    } catch (error) {
      if (isOfflineErr(error)) {
        addToQueue({ type: "DELETE_CATEGORY", id });
        return;
      }
      loadCategories();
      toast.error("Failed");
    }
  }, [NATIVE, isAuthenticated, loadCategories, setCategories]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      total: tasks.length,
      completed: tasks.filter((task) => task.completed).length,
      pending: tasks.filter((task) => !task.completed).length,
      highPriority: tasks.filter((task) => task.priority === "high" && !task.completed).length,
      dueToday: tasks.filter((task) => task.dueDate === today).length,
      overdue: tasks.filter((task) => task.dueDate && task.dueDate < today && !task.completed).length,
    };
  }, [tasks]);

  return {
    tasks,
    categories,
    loading,
    stats,
    loadTasks,
    loadCategories,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    addCategory,
    deleteCategory,
    setTasks,
    setCategories,
    isNative: NATIVE,
  };
};
