import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { isNativeApp, localCategories, localTasks } from "../services/storage";
import { localTodayYMD } from "../utils/date";
import { lifecycleOf } from "../utils/recurringTask";

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

const isUnsupportedRouteErr = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501;
};

const newerWins = (localTask, serverTask) => {
  const a = new Date(localTask.updatedAt || localTask.createdAt || 0).getTime();
  const b = new Date(serverTask.updatedAt || serverTask.createdAt || 0).getTime();
  return b >= a ? serverTask : localTask;
};

export const useTasks = () => {
  const { isAuthenticated } = useAuth();
  const NATIVE = isNativeApp();

  const [tasks, setTasksState] = useState(() => {
    if (NATIVE) return localTasks.getAll();
    const cached = loadLocal(TASKS_KEY);
    return Array.isArray(cached) ? cached : [];
  });
  const [categories, setCatsState] = useState(() => {
    if (NATIVE) return localCategories.getAll();
    const cached = loadLocal(CATS_KEY);
    return Array.isArray(cached) ? cached : [];
  });
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

  const loadTasks = useCallback(async (opts = {}) => {
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
      const params = { view: opts.view ?? "all" };
      if (opts.tag) params.tag = opts.tag.replace(/^#/, "");
      if (opts.projectId) params.projectId = opts.projectId;
      const res = await api.get("/tasks", { params });
      setTasksState((prev) => {
        const server = res.data;
        const merged = new Map(server.map((t) => [t.id, t]));
        for (const t of prev) {
          if (t._offline && !merged.has(t.id)) merged.set(t.id, t);
          else if (merged.has(t.id) && t.updatedAt) {
            const s = merged.get(t.id);
            merged.set(t.id, newerWins(t, s));
          }
        }
        const arr = [...merged.values()];
        if (!NATIVE) saveLocal(TASKS_KEY, arr);
        return arr;
      });
    } catch {
      /* keep cache */
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
    loadTasks({ view: "all" });
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
        } else if (action.type === "PERMANENT_DELETE_TASK") {
          await api.delete(`/tasks/${action.id}/permanent`);
        } else if (action.type === "ADD_CATEGORY") {
          const { tempId, ...data } = action.data;
          const res = await api.post("/categories", data);
          setCategories((prev) => prev.map((category) => (category.id === tempId ? res.data : category)));
        } else if (action.type === "DELETE_CATEGORY") {
          await api.delete(`/categories/${action.id}`);
        }
      } catch (err) {
        if (err.response?.status === 404 && action.type === "UPDATE_TASK") {
          /* dropped stale update */
        } else {
          failed.push(action);
        }
      }
    }

    saveLocal(QUEUE_KEY, failed);
    syncingRef.current = false;

    if (!failed.length && queue.length) {
      toast.success("Synced successfully.");
      loadTasks({ view: "all" });
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
      subtasks: taskData.subtasks || [],
      tags: taskData.tags || [],
      lifecycleStatus: taskData.lifecycleStatus || "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

  const bulkAddTasks = useCallback(async (list, dueDate) => {
    if (!isAuthenticated || NATIVE) return [];
    if (!navigator.onLine) {
      list.forEach((item) => createOfflineTask({ ...item, dueDate: item.dueDate || dueDate || null }));
      return [];
    }
    try {
      const res = await api.post("/tasks/bulk", { tasks: list, dueDate: dueDate || null });
      setTasks((prev) => [...res.data, ...prev]);
      toast.success(`Created ${res.data.length} tasks`);
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.error || "Bulk create failed");
      return [];
    }
  }, [NATIVE, isAuthenticated, createOfflineTask, setTasks]);

  const updateTask = useCallback(async (id, updates) => {
    if (NATIVE) {
      const task = localTasks.update(id, updates);
      setTasksState(localTasks.getAll());
      return task;
    }

    if (!isAuthenticated) return null;

    const optimistic = { ...updates, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...optimistic } : task)));

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
      localTasks.trash(id);
      setTasksState(localTasks.getAll());
      toast.success("Moved to trash");
      return;
    }

    if (!isAuthenticated) return;

    setTasks((prev) => prev.map((task) => (task.id === id
      ? { ...task, lifecycleStatus: "trashed", trashedAt: new Date().toISOString() }
      : task)));

    if (!navigator.onLine) {
      addToQueue({ type: "DELETE_TASK", id });
      toast.success("Moved to trash (offline)");
      return;
    }

    try {
      const res = await api.delete(`/tasks/${id}`);
      const t = res.data?.task;
      if (t) setTasks((prev) => prev.map((task) => (task.id === id ? t : task)));
      toast.success("Moved to trash");
    } catch (error) {
      if (isOfflineErr(error)) {
        addToQueue({ type: "DELETE_TASK", id });
        return;
      }
      loadTasks({ view: "all" });
      toast.error("Failed to delete task");
    }
  }, [NATIVE, isAuthenticated, loadTasks, setTasks]);

  const restoreTask = useCallback(async (id) => {
    if (NATIVE) {
      localTasks.restore(id);
      setTasksState(localTasks.getAll());
      toast.success("Restored");
      return;
    }
    if (!isAuthenticated) return;

    setTasks((prev) => prev.map((task) => (task.id === id
      ? { ...task, lifecycleStatus: "active", trashedAt: null, updatedAt: new Date().toISOString() }
      : task)));

    if (!navigator.onLine) {
      addToQueue({ type: "UPDATE_TASK", id, data: { lifecycleStatus: "active", trashedAt: null } });
      toast.success("Restored");
      return;
    }

    try {
      const res = await api.post(`/tasks/${id}/restore`);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
      toast.success("Restored");
    } catch (error) {
      if (isOfflineErr(error)) {
        addToQueue({ type: "UPDATE_TASK", id, data: { lifecycleStatus: "active", trashedAt: null } });
        toast.success("Restored");
        return;
      }
      if (isUnsupportedRouteErr(error)) {
        const updated = await updateTask(id, { lifecycleStatus: "active", trashedAt: null });
        if (updated) toast.success("Restored");
        return;
      }
      toast.error("Failed to restore");
    }
  }, [NATIVE, isAuthenticated, setTasks, updateTask]);

  const archiveTask = useCallback(async (id) => {
    if (NATIVE) {
      localTasks.archive(id);
      setTasksState(localTasks.getAll());
      toast.success("Archived");
      return;
    }
    if (!isAuthenticated) return;

    setTasks((prev) => prev.map((task) => (task.id === id
      ? { ...task, lifecycleStatus: "archived", trashedAt: null, updatedAt: new Date().toISOString() }
      : task)));

    if (!navigator.onLine) {
      addToQueue({ type: "UPDATE_TASK", id, data: { lifecycleStatus: "archived", trashedAt: null } });
      toast.success("Archived");
      return;
    }

    try {
      const res = await api.post(`/tasks/${id}/archive`);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
      toast.success("Archived");
    } catch (error) {
      if (isOfflineErr(error)) {
        addToQueue({ type: "UPDATE_TASK", id, data: { lifecycleStatus: "archived", trashedAt: null } });
        toast.success("Archived");
        return;
      }
      if (isUnsupportedRouteErr(error)) {
        const updated = await updateTask(id, { lifecycleStatus: "archived", trashedAt: null });
        if (updated) toast.success("Archived");
        return;
      }
      toast.error("Failed to archive");
    }
  }, [NATIVE, isAuthenticated, setTasks, updateTask]);

  const permanentDeleteTask = useCallback(async (id) => {
    if (NATIVE) {
      localTasks.delete(id);
      setTasksState(localTasks.getAll());
      toast.success("Deleted permanently");
      return;
    }
    if (!isAuthenticated) return;

    const previousTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== id));

    if (!navigator.onLine) {
      addToQueue({ type: "PERMANENT_DELETE_TASK", id });
      toast.success("Deleted permanently");
      return;
    }

    try {
      await api.delete(`/tasks/${id}/permanent`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Deleted permanently");
    } catch (error) {
      if (isOfflineErr(error)) {
        addToQueue({ type: "PERMANENT_DELETE_TASK", id });
        toast.success("Deleted permanently");
        return;
      }
      if (isUnsupportedRouteErr(error)) {
        const deleted = await api.delete(`/tasks/${id}`);
        const restoredTask = deleted?.data?.task;
        if (restoredTask) {
          setTasks(previousTasks);
          toast.error("This server only supports moving tasks to trash.");
          return;
        }
      }
      setTasks(previousTasks);
      toast.error("Failed");
    }
  }, [NATIVE, isAuthenticated, setTasks, tasks]);

  const mergeAppliedTasks = useCallback((list) => {
    if (!list?.length) return;
    setTasks((prev) => {
      const ids = new Set(list.map((t) => t.id));
      return [...list, ...prev.filter((t) => !ids.has(t.id))];
    });
  }, [setTasks]);

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
    const today = localTodayYMD();
    const active = tasks.filter((t) => lifecycleOf(t) === "active");
    return {
      total: active.length,
      completed: active.filter((task) => task.completed).length,
      pending: active.filter((task) => !task.completed).length,
      highPriority: active.filter((task) => task.priority === "high" && !task.completed).length,
      dueToday: active.filter((task) => task.dueDate === today).length,
      overdue: active.filter((task) => task.dueDate && task.dueDate < today && !task.completed).length,
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
    bulkAddTasks,
    updateTask,
    deleteTask,
    restoreTask,
    archiveTask,
    permanentDeleteTask,
    mergeAppliedTasks,
    toggleComplete,
    addCategory,
    deleteCategory,
    setTasks,
    setCategories,
    isNative: NATIVE,
  };
};
