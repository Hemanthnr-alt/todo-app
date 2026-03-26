// frontend/src/components/NotificationManager.jsx
import { useEffect } from "react";

const NotificationManager = () => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    async function checkDueTasks() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/tasks", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tasks = await res.json();

        const today = new Date().toISOString().split("T")[0];
        const dueTasks = tasks.filter(task => task.dueDate === today && !task.completed);
        const overdueTasks = tasks.filter(task => {
          return task.dueDate && task.dueDate < today && !task.completed;
        });

        const stored = localStorage.getItem("notifications");
        let notifications = stored ? JSON.parse(stored) : [];
        let hasNew = false;

        if (dueTasks.length > 0 && !notifications.some(n => n.type === "due_today" && n.date === today)) {
          notifications.unshift({
            id: Date.now(),
            type: "task_due",
            title: `${dueTasks.length} Task${dueTasks.length > 1 ? "s" : ""} Due Today`,
            message: dueTasks.map(t => t.title).join(", "),
            time: "Just now",
            date: today,
            read: false,
          });
          hasNew = true;
        }

        if (overdueTasks.length > 0 && !notifications.some(n => n.type === "overdue")) {
          notifications.unshift({
            id: Date.now() + 1,
            type: "task_overdue",
            title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? "s" : ""}`,
            message: overdueTasks.map(t => t.title).join(", "),
            time: "Just now",
            read: false,
          });
          hasNew = true;
        }

        if (hasNew) {
          localStorage.setItem("notifications", JSON.stringify(notifications));
        }

        if (dueTasks.length > 0 && Notification.permission === "granted") {
          /* optional browser popups */
        }
      } catch (error) {
        console.error("Error checking tasks:", error);
      }
    }

    const interval = setInterval(checkDueTasks, 300000);
    checkDueTasks();

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default NotificationManager;
