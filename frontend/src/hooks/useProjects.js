import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { isNativeApp } from "../services/storage";

const KEY = "30_offline_projects";

const saveLocal = (v) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
};
const loadLocal = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
};

const isOfflineErr = (error) => !error.response && (
  error.code === "ERR_NETWORK"
  || error.code === "ECONNABORTED"
  || error.message?.includes("Network Error")
  || !navigator.onLine
);

export const useProjects = () => {
  const { isAuthenticated } = useAuth();
  const NATIVE = isNativeApp();
  const [projects, setProjects] = useState(() => (NATIVE ? [] : (loadLocal() || [])));
  const [loading, setLoading] = useState(!NATIVE);

  const loadProjects = useCallback(async () => {
    if (NATIVE) {
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setProjects([]);
      setLoading(false);
      return;
    }
    const cached = loadLocal();
    if (cached?.length) setProjects(cached);
    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
      saveLocal(res.data);
    } catch {
      /* keep cache */
    } finally {
      setLoading(false);
    }
  }, [NATIVE, isAuthenticated]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const addProject = useCallback(async (data) => {
    if (!isAuthenticated || NATIVE) {
      const row = { id: `local_${Date.now()}`, ...data, userId: "local" };
      setProjects((p) => { const n = [...p, row]; saveLocal(n); return n; });
      return row;
    }
    try {
      const res = await api.post("/projects", data);
      setProjects((p) => { const n = [...p, res.data]; saveLocal(n); return n; });
      toast.success("Project created");
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed");
      return null;
    }
  }, [NATIVE, isAuthenticated]);

  const updateProject = useCallback(async (id, updates) => {
    if (NATIVE) return null;
    try {
      const res = await api.put(`/projects/${id}`, updates);
      setProjects((p) => { const n = p.map((x) => (x.id === id ? res.data : x)); saveLocal(n); return n; });
      return res.data;
    } catch (e) {
      if (isOfflineErr(e)) return null;
      toast.error("Failed to update project");
      return null;
    }
  }, [NATIVE]);

  const deleteProject = useCallback(async (id) => {
    if (NATIVE) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((p) => { const n = p.filter((x) => x.id !== id); saveLocal(n); return n; });
      toast.success("Project removed");
    } catch {
      toast.error("Failed");
    }
  }, [NATIVE]);

  return { projects, loading, loadProjects, addProject, updateProject, deleteProject, setProjects };
};
