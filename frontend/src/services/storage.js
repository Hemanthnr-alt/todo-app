// ── Universal local storage for offline-first APK ────────────────────────────
const isNativeApp = () => {
  try { return window?.Capacitor?.isNativePlatform?.() === true; } catch { return false; }
};

const PREFIX = "30app_";

const get = (key) => {
  try { return JSON.parse(localStorage.getItem(PREFIX + key) || "null"); } catch { return null; }
};

const set = (key, value) => {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; }
};

const remove = (key) => {
  try { localStorage.removeItem(PREFIX + key); return true; } catch { return false; }
};

// ── Task CRUD ─────────────────────────────────────────────────────────────────
export const localTasks = {
  getAll: () => get("tasks") || [],
  save:   (tasks) => set("tasks", tasks),
  add: (task) => {
    const tasks = localTasks.getAll();
    const newTask = {
      id:          `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      completed:   false,
      attachments: [],
      subtasks:    [],
      tags:        [],
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      ...task,
    };
    tasks.unshift(newTask);
    localTasks.save(tasks);
    return newTask;
  },
  update: (id, updates) => {
    const tasks = localTasks.getAll().map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    localTasks.save(tasks);
    return tasks.find(t => t.id === id);
  },
  delete: (id) => {
    const tasks = localTasks.getAll().filter(t => t.id !== id);
    localTasks.save(tasks);
  },
};

// ── Category CRUD ─────────────────────────────────────────────────────────────
export const localCategories = {
  getAll: () => get("categories") || [],
  save:   (cats) => set("categories", cats),
  add: (cat) => {
    const cats = localCategories.getAll();
    const newCat = {
      id:    `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      ...cat,
    };
    cats.push(newCat);
    localCategories.save(cats);
    return newCat;
  },
  delete: (id) => {
    const cats = localCategories.getAll().filter(c => c.id !== id);
    localCategories.save(cats);
  },
};

// ── Habit CRUD ────────────────────────────────────────────────────────────────
export const localHabits = {
  getAll: () => get("habits") || [],
  save:   (habits) => set("habits", habits),
  add: (habit) => {
    const habits = localHabits.getAll();
    const newHabit = {
      id:             `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      completedDates: [],
      streak:         0,
      createdAt:      new Date().toISOString(),
      ...habit,
    };
    habits.unshift(newHabit);
    localHabits.save(habits);
    return newHabit;
  },
  toggle: (id, date) => {
    const habits = localHabits.getAll().map(h => {
      if (h.id !== id) return h;
      const dates = h.completedDates || [];
      const done  = dates.includes(date);
      const newDates = done ? dates.filter(d => d !== date) : [...dates, date];

      // Recalculate streak
      let streak = 0;
      const today = new Date().toISOString().split("T")[0];
      let check   = today;
      const sorted = [...newDates].sort().reverse();
      for (const d of sorted) {
        if (d === check) {
          streak++;
          const prev = new Date(check);
          prev.setDate(prev.getDate() - 1);
          check = prev.toISOString().split("T")[0];
        } else break;
      }
      return { ...h, completedDates: newDates, streak };
    });
    localHabits.save(habits);
    return habits.find(h => h.id === id);
  },
  update: (id, data) => {
    const habits = localHabits.getAll().map(h => h.id === id ? { ...h, ...data } : h);
    localHabits.save(habits);
  },
  delete: (id) => {
    const habits = localHabits.getAll().filter(h => h.id !== id);
    localHabits.save(habits);
  },
};

export { isNativeApp };