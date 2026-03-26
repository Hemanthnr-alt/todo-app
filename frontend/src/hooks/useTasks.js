import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch {
      toast.error("Failed to load categories");
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  const addTask = useCallback(async (taskData) => {
    try {
      const res = await api.post("/tasks", taskData);
      setTasks((prev) => [res.data, ...prev]);
      toast.success("Task created! 🎉");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create task");
      return null;
    }
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    try {
      const res = await api.put(`/tasks/${id}`, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update task");
      return null;
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }, []);

  const toggleComplete = useCallback(async (task) => {
    const updated = await updateTask(task.id, { completed: !task.completed });
    if (updated?.completed) toast.success("Task completed! 🎊");
    return updated;
  }, [updateTask]);

  const addCategory = useCallback(async (catData) => {
    try {
      const res = await api.post("/categories", catData);
      setCategories((prev) => [...prev, res.data]);
      toast.success("Category created!");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create category");
      return null;
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
      pending: tasks.filter((t) => !t.completed).length,
      highPriority: tasks.filter((t) => t.priority === "high" && !t.completed).length,
      dueToday: tasks.filter((t) => t.dueDate === today).length,
      overdue: tasks.filter((t) => t.dueDate && t.dueDate < today && !t.completed).length,
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