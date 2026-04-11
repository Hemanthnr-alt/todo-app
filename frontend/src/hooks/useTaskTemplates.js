import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { isNativeApp } from "../services/storage";

const KEY = "30_offline_templates";

const saveLocal = (v) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
};
const loadLocal = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
};

export const useTaskTemplates = () => {
  const { isAuthenticated } = useAuth();
  const NATIVE = isNativeApp();
  const [templates, setTemplates] = useState(() => (NATIVE ? [] : (loadLocal() || [])));
  const [loading, setLoading] = useState(!NATIVE);

  const loadTemplates = useCallback(async () => {
    if (NATIVE) {
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    const cached = loadLocal();
    if (cached?.length) setTemplates(cached);
    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/task-templates");
      setTemplates(res.data);
      saveLocal(res.data);
    } catch {
      /* keep */
    } finally {
      setLoading(false);
    }
  }, [NATIVE, isAuthenticated]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const saveTemplate = useCallback(async (name, items) => {
    if (!isAuthenticated || NATIVE) return null;
    try {
      const res = await api.post("/task-templates", { name, items });
      setTemplates((t) => { const n = [...t, res.data]; saveLocal(n); return n; });
      toast.success("Template saved");
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed");
      return null;
    }
  }, [NATIVE, isAuthenticated]);

  const applyTemplate = useCallback(async (templateId, dueDate) => {
    if (!isAuthenticated || NATIVE) return [];
    try {
      const res = await api.post(`/task-templates/${templateId}/apply`, { dueDate: dueDate || null });
      toast.success(`Added ${res.data.length} tasks`);
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to apply");
      return [];
    }
  }, [NATIVE, isAuthenticated]);

  return { templates, loading, loadTemplates, saveTemplate, applyTemplate, setTemplates };
};
