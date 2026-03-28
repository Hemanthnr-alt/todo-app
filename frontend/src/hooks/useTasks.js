import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

export const useTasks = () => {
  const { isAuthenticated } = useAuth();
  const [tasks,      setTasks]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const loadTasks = useCallback(async () => {
    // KEY FIX: never call API when not logged in
    if (!isAuthenticated) { setTasks([]); setLoading(false); return; }
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch {
      // Only show error if actually authenticated (avoids spam on logout)
      if (isAuthenticated) toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadCategories = useCallback(async () => {
    if (!isAuthenticated) { setCategories([]); return; }
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch {
      if (isAuthenticated) toast.error("Failed to load categories");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  const addTask = useCallback(async (taskData) => {
    if (!isAuthenticated) return null;
    try {
      const res = await api.post("/tasks", taskData);
      setTasks(prev => [res.data, ...prev]);
      toast.success("Task created! 🎉");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create task");
      return null;
    }
  }, [isAuthenticated]);

  const updateTask = useCallback(async (id, updates) => {
    if (!isAuthenticated) return null;
    try {
      const res = await api.put(`/tasks/${id}`, updates);
      setTasks(prev => prev.map(t => t.id === id ? res.data : t));
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update task");
      return null;
    }
  }, [isAuthenticated]);

  const deleteTask = useCallback(async (id) => {
    if (!isAuthenticated) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }, [isAuthenticated]);

  const toggleComplete = useCallback(async (task) => {
    const updated = await updateTask(task.id, { completed: !task.completed });
    if (updated?.completed) toast.success("Task completed! 🎊");
    return updated;
  }, [updateTask]);

  const addCategory = useCallback(async (catData) => {
    if (!isAuthenticated) return null;
    try {
      const res = await api.post("/categories", catData);
      setCategories(prev => [...prev, res.data]);
      toast.success("Category created!");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create category");
      return null;
    }
  }, [isAuthenticated]);

  const deleteCategory = useCallback(async (id) => {
    if (!isAuthenticated) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  }, [isAuthenticated]);

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
