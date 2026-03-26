import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const API_URL = "http://localhost:5000/api";

function Tasks() {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [selectedDueTime, setSelectedDueTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#ff6b9d");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📁");
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDueDate, setFilterDueDate] = useState("all");
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Theme-aware styles
  const themeStyles = {
    background: isDark ? "#1a1a2e" : "#f5f5f5",
    cardBg: isDark ? "#2d2d3a" : "#ffffff",
    text: isDark ? "#ffffff" : "#333333",
    textSecondary: isDark ? "#aaaaaa" : "#666666",
    border: isDark ? "#4a4a5a" : "#e0e0e0",
    inputBg: isDark ? "#3a3a4a" : "#ffffff",
    primary: "#ff6b9d"
  };

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`);
      setTasks(res.data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      const res = await axios.post(`${API_URL}/tasks`, {
        title: newTask,
        description: "",
        priority: selectedPriority,
        categoryId: selectedCategory || null,
        dueDate: selectedDueDate || null,
        dueTime: selectedDueTime || null
      });
      setTasks([res.data, ...tasks]);
      setNewTask("");
      setSelectedDueDate("");
      setSelectedDueTime("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const res = await axios.post(`${API_URL}/categories`, {
        name: newCategoryName,
        color: newCategoryColor,
        icon: newCategoryIcon
      });
      setCategories([...categories, res.data]);
      setShowCategoryModal(false);
      setNewCategoryName("");
      alert("Category created!");
    } catch (error) {
      console.error("Error adding category:", error);
      alert(error.response?.data?.error || "Error creating category");
    }
  };

  const toggleComplete = async (task) => {
    try {
      const updated = { ...task, completed: !task.completed };
      const res = await axios.put(`${API_URL}/tasks/${task.id}`, updated);
      setTasks(tasks.map(t => t.id === task.id ? res.data : t));
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const updatePriority = async (task, newPriority) => {
    try {
      const updated = { ...task, priority: newPriority };
      const res = await axios.put(`${API_URL}/tasks/${task.id}`, updated);
      setTasks(tasks.map(t => t.id === task.id ? res.data : t));
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const updateDueDate = async (task, newDueDate, newDueTime) => {
    try {
      const updated = { ...task, dueDate: newDueDate || null, dueTime: newDueTime || null };
      const res = await axios.put(`${API_URL}/tasks/${task.id}`, updated);
      setTasks(tasks.map(t => t.id === task.id ? res.data : t));
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleFileSelect = (taskId, event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadingTaskId(taskId);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      const res = await axios.post(`${API_URL}/tasks/${uploadingTaskId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setTasks(tasks.map(task => 
        task.id === uploadingTaskId 
          ? { ...task, attachments: [...(task.attachments || []), res.data.attachment] }
          : task
      ));
      
      setSelectedFile(null);
      setUploadingTaskId(null);
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading file.");
    }
  };

  const deleteAttachment = async (taskId, attachmentId) => {
    if (!confirm("Delete this file?")) return;
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}/attachments/${attachmentId}`);
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, attachments: task.attachments.filter(a => a.id !== attachmentId) }
          : task
      ));
      alert("File deleted");
    } catch (error) {
      console.error("Error deleting attachment:", error);
      alert("Error deleting file");
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("sheet")) return "📊";
    if (mimeType === "text/plain") return "📃";
    if (mimeType.includes("zip")) return "📦";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date().toISOString().split("T")[0];
    return dueDate < today;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    
    if (dueDate === today) return "Today";
    if (dueDate === tomorrowStr) return "Tomorrow";
    
    const date = new Date(dueDate);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPriorityStyle = (priority) => {
    switch(priority) {
      case "high":
        return { color: "#ef4444", bg: "#fee2e2", icon: "🔴", label: "High" };
      case "medium":
        return { color: "#f59e0b", bg: "#ffede5", icon: "🟠", label: "Medium" };
      case "low":
        return { color: "#10b981", bg: "#e6f7ec", icon: "🟢", label: "Low" };
      default:
        return { color: "#6b7280", bg: "#f3f4f6", icon: "⚪", label: "Medium" };
    }
  };

  const filteredBySearch = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredByCategory = filterCategory === "all" 
    ? filteredBySearch 
    : filteredBySearch.filter(t => t.categoryId === filterCategory);

  const filteredByPriority = filterPriority === "all"
    ? filteredByCategory
    : filteredByCategory.filter(t => t.priority === filterPriority);

  const filteredTasks = filteredByPriority.filter(task => {
    if (filterDueDate === "all") return true;
    if (filterDueDate === "today") {
      const today = new Date().toISOString().split("T")[0];
      return task.dueDate === today;
    }
    if (filterDueDate === "overdue") {
      const today = new Date().toISOString().split("T")[0];
      return task.dueDate && task.dueDate < today && !task.completed;
    }
    if (filterDueDate === "thisWeek") {
      const today = new Date().toISOString().split("T")[0];
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      return task.dueDate && task.dueDate >= today && task.dueDate <= weekEnd.toISOString().split("T")[0];
    }
    return true;
  });

  const getCategory = (categoryId) => {
    return categories.find(c => c.id === categoryId);
  };

  const dueDateCounts = {
    today: tasks.filter(t => t.dueDate === new Date().toISOString().split("T")[0]).length,
    overdue: tasks.filter(t => t.dueDate && t.dueDate < new Date().toISOString().split("T")[0] && !t.completed).length,
    thisWeek: tasks.filter(t => {
      if (!t.dueDate) return false;
      const today = new Date().toISOString().split("T")[0];
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      return t.dueDate >= today && t.dueDate <= weekEnd.toISOString().split("T")[0];
    }).length
  };

  return (
    <div style={{ ...styles.container, background: themeStyles.background }}>
      <h1 style={{ ...styles.title, color: themeStyles.primary }}>📋 My Tasks</h1>
      
      {/* Search Bar */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="🔍 Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...styles.searchInput, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} style={{ ...styles.clearSearch, color: themeStyles.textSecondary }}>
            ✕
          </button>
        )}
      </div>
      
      {/* Add Task Form */}
      <div style={styles.addForm}>
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTask()}
          style={{ ...styles.input, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
        />
        <input
          type="date"
          value={selectedDueDate}
          onChange={(e) => setSelectedDueDate(e.target.value)}
          style={{ ...styles.dateInput, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
        />
        <input
          type="time"
          value={selectedDueTime}
          onChange={(e) => setSelectedDueTime(e.target.value)}
          style={{ ...styles.timeInput, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
        />
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          style={{ ...styles.prioritySelect, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
        >
          <option value="high">🔴 High</option>
          <option value="medium">🟠 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ ...styles.select, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
        >
          <option value="">No Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        <button onClick={addTask} style={{ ...styles.addButton, background: themeStyles.primary }}>
          Add Task
        </button>
      </div>

      {/* Due Date Filter */}
      <div style={styles.dueDateFilterBar}>
        <button
          onClick={() => setFilterDueDate("all")}
          style={{
            ...styles.dueDateFilterBtn,
            background: filterDueDate === "all" ? themeStyles.primary : themeStyles.cardBg,
            color: filterDueDate === "all" ? "white" : themeStyles.text,
            borderColor: themeStyles.border
          }}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilterDueDate("today")}
          style={{
            ...styles.dueDateFilterBtn,
            background: filterDueDate === "today" ? themeStyles.primary : themeStyles.cardBg,
            color: filterDueDate === "today" ? "white" : themeStyles.text,
            borderColor: themeStyles.border
          }}
        >
          📅 Today ({dueDateCounts.today})
        </button>
        <button
          onClick={() => setFilterDueDate("overdue")}
          style={{
            ...styles.dueDateFilterBtn,
            background: filterDueDate === "overdue" ? "#ef4444" : themeStyles.cardBg,
            color: filterDueDate === "overdue" ? "white" : "#ef4444",
            borderColor: themeStyles.border
          }}
        >
          ⚠️ Overdue ({dueDateCounts.overdue})
        </button>
        <button
          onClick={() => setFilterDueDate("thisWeek")}
          style={{
            ...styles.dueDateFilterBtn,
            background: filterDueDate === "thisWeek" ? "#10b981" : themeStyles.cardBg,
            color: filterDueDate === "thisWeek" ? "white" : "#10b981",
            borderColor: themeStyles.border
          }}
        >
          📆 This Week ({dueDateCounts.thisWeek})
        </button>
      </div>

      {/* Priority Filter */}
      <div style={styles.priorityFilterBar}>
        <button
          onClick={() => setFilterPriority("all")}
          style={{
            ...styles.priorityFilterBtn,
            background: filterPriority === "all" ? themeStyles.primary : themeStyles.cardBg,
            color: filterPriority === "all" ? "white" : themeStyles.text,
            borderColor: themeStyles.border
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilterPriority("high")}
          style={{
            ...styles.priorityFilterBtn,
            background: filterPriority === "high" ? "#ef4444" : themeStyles.cardBg,
            color: filterPriority === "high" ? "white" : "#ef4444",
            borderColor: themeStyles.border
          }}
        >
          🔴 High
        </button>
        <button
          onClick={() => setFilterPriority("medium")}
          style={{
            ...styles.priorityFilterBtn,
            background: filterPriority === "medium" ? "#f59e0b" : themeStyles.cardBg,
            color: filterPriority === "medium" ? "white" : "#f59e0b",
            borderColor: themeStyles.border
          }}
        >
          🟠 Medium
        </button>
        <button
          onClick={() => setFilterPriority("low")}
          style={{
            ...styles.priorityFilterBtn,
            background: filterPriority === "low" ? "#10b981" : themeStyles.cardBg,
            color: filterPriority === "low" ? "white" : "#10b981",
            borderColor: themeStyles.border
          }}
        >
          🟢 Low
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ ...styles.filterBar, borderBottomColor: themeStyles.border }}>
        <button
          onClick={() => setFilterCategory("all")}
          style={{
            ...styles.filterButton,
            background: filterCategory === "all" ? themeStyles.primary : themeStyles.cardBg,
            color: filterCategory === "all" ? "white" : themeStyles.text,
            borderColor: themeStyles.border
          }}
        >
          All Categories
        </button>
        {categories.map(cat => {
          const count = tasks.filter(t => t.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              style={{
                ...styles.filterButton,
                background: filterCategory === cat.id ? cat.color : themeStyles.cardBg,
                color: filterCategory === cat.id ? "white" : themeStyles.text,
                borderColor: themeStyles.border
              }}
            >
              {cat.icon} {cat.name} ({count})
            </button>
          );
        })}
        <button
          onClick={() => setShowCategoryModal(true)}
          style={{ ...styles.addCategoryButton, background: themeStyles.primary }}
        >
          + New Category
        </button>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div style={{ ...styles.searchInfo, background: isDark ? "#2d2d3a" : "#e6f7ff", color: "#0056b3" }}>
          🔍 Found {filteredTasks.length} result(s) for "{searchQuery}"
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <p style={{ color: themeStyles.textSecondary }}>Loading...</p>
      ) : filteredTasks.length === 0 ? (
        <p style={{ ...styles.empty, color: themeStyles.textSecondary }}>
          {searchQuery 
            ? `No tasks matching "${searchQuery}"` 
            : "No tasks. Add one above!"}
        </p>
      ) : (
        <div style={styles.taskList}>
          {filteredTasks.map((task) => {
            const category = getCategory(task.categoryId);
            const priorityStyle = getPriorityStyle(task.priority);
            const dueDateFormatted = formatDueDate(task.dueDate);
            const overdue = isOverdue(task.dueDate) && !task.completed;
            
            return (
              <div key={task.id} style={{
                ...styles.taskCard,
                background: themeStyles.cardBg,
                borderColor: themeStyles.border,
                borderLeft: `4px solid ${priorityStyle.color}`,
                backgroundColor: overdue ? (isDark ? "#3a2a2a" : "#fff5f5") : themeStyles.cardBg
              }}>
                <div style={styles.taskContent}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task)}
                    style={styles.checkbox}
                  />
                  <div style={styles.taskInfo}>
                    <div>
                      <span style={{
                        ...styles.taskTitle,
                        color: themeStyles.text,
                        textDecoration: task.completed ? "line-through" : "none",
                        opacity: task.completed ? 0.6 : 1
                      }}>
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span style={{
                          ...styles.dueDateBadge,
                          background: overdue ? "#fee2e2" : (isDark ? "#2d2d3a" : "#e6f7ff"),
                          color: overdue ? "#ef4444" : "#0056b3"
                        }}>
                          📅 {dueDateFormatted}
                          {task.dueTime && ` at ${task.dueTime}`}
                          {overdue && " ⚠️ Overdue"}
                        </span>
                      )}
                      <span style={{
                        ...styles.priorityBadge,
                        background: priorityStyle.bg,
                        color: priorityStyle.color
                      }}>
                        {priorityStyle.icon} {priorityStyle.label}
                      </span>
                      {category && (
                        <span style={{
                          ...styles.categoryBadge,
                          background: `${category.color}20`,
                          color: category.color
                        }}>
                          {category.icon} {category.name}
                        </span>
                      )}
                    </div>
                    
                    {/* File Attachments Section */}
                    {task.attachments && task.attachments.length > 0 && (
                      <div style={{ ...styles.attachmentsSection, background: isDark ? "#1a1a2e" : "#f9f9f9", borderColor: themeStyles.border }}>
                        <div style={{ ...styles.attachmentsHeader, color: themeStyles.textSecondary }}>📎 Attachments ({task.attachments.length})</div>
                        <div style={styles.attachmentsList}>
                          {task.attachments.map(att => (
                            <div key={att.id} style={styles.attachmentItem}>
                              <span style={styles.attachmentIcon}>{getFileIcon(att.mimeType)}</span>
                              <a 
                                href={att.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ ...styles.attachmentLink, color: themeStyles.primary }}
                              >
                                {att.originalName.length > 30 ? att.originalName.substring(0, 27) + "..." : att.originalName}
                              </a>
                              <span style={{ ...styles.attachmentSize, color: themeStyles.textSecondary }}>({formatFileSize(att.size)})</span>
                              <button
                                onClick={() => deleteAttachment(task.id, att.id)}
                                style={styles.deleteAttachmentBtn}
                                title="Delete file"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* File Upload Section */}
                    <div style={styles.uploadSection}>
                      <input
                        type="file"
                        id={`file-upload-${task.id}`}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileSelect(task.id, e)}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                      />
                      <button
                        onClick={() => document.getElementById(`file-upload-${task.id}`).click()}
                        style={{ ...styles.uploadBtn, background: isDark ? "#2d2d3a" : "#e6f7ff", borderColor: themeStyles.border, color: themeStyles.primary }}
                      >
                        📎 Attach File
                      </button>
                      {uploadingTaskId === task.id && selectedFile && (
                        <div style={{ ...styles.uploadConfirm, background: themeStyles.cardBg, borderColor: themeStyles.border }}>
                          <span style={{ color: themeStyles.text }}>{selectedFile.name}</span>
                          <button onClick={uploadFile} style={styles.confirmUploadBtn}>Upload</button>
                          <button onClick={() => { setSelectedFile(null); setUploadingTaskId(null); }} style={styles.cancelUploadBtn}>Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={styles.taskActions}>
                  <div style={styles.dueDateEdit}>
                    <input
                      type="date"
                      value={task.dueDate || ""}
                      onChange={(e) => updateDueDate(task, e.target.value, task.dueTime)}
                      style={{ ...styles.editDateInput, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
                    />
                    <input
                      type="time"
                      value={task.dueTime || ""}
                      onChange={(e) => updateDueDate(task, task.dueDate, e.target.value)}
                      style={{ ...styles.editTimeInput, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
                    />
                  </div>
                  <select
                    value={task.priority}
                    onChange={(e) => updatePriority(task, e.target.value)}
                    style={{ ...styles.priorityDropdown, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟠 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{ ...styles.deleteButton, background: "#ef4444" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div style={{ ...styles.modal, background: themeStyles.cardBg }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: themeStyles.text }}>Create New Category</h2>
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ ...styles.modalInput, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
            />
            <div style={styles.modalRow}>
              <div>
                <label style={{ color: themeStyles.textSecondary }}>Icon</label>
                <input
                  type="text"
                  placeholder="📁"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  style={{ ...styles.modalInputSmall, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
                />
              </div>
              <div>
                <label style={{ color: themeStyles.textSecondary }}>Color</label>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  style={styles.colorInput}
                />
              </div>
            </div>
            <button onClick={addCategory} style={{ ...styles.modalButton, background: themeStyles.primary }}>
              Create Category
            </button>
            <button
              onClick={() => setShowCategoryModal(false)}
              style={{ ...styles.modalCancel, background: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh"
  },
  title: {
    textAlign: "center",
    marginBottom: "30px"
  },
  searchBar: {
    position: "relative",
    marginBottom: "20px"
  },
  searchInput: {
    width: "100%",
    padding: "12px 40px 12px 16px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "16px",
    boxSizing: "border-box"
  },
  clearSearch: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer"
  },
  addForm: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  input: {
    flex: 2,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "16px"
  },
  dateInput: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "14px"
  },
  timeInput: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "14px"
  },
  prioritySelect: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "14px",
    cursor: "pointer"
  },
  select: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "14px"
  },
  addButton: {
    padding: "12px 24px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px"
  },
  dueDateFilterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "15px"
  },
  dueDateFilterBtn: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid",
    cursor: "pointer",
    fontSize: "13px"
  },
  priorityFilterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "15px"
  },
  priorityFilterBtn: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid",
    cursor: "pointer",
    fontSize: "13px"
  },
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
    paddingBottom: "10px",
    borderBottom: "1px solid"
  },
  filterButton: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid",
    cursor: "pointer",
    fontSize: "13px"
  },
  addCategoryButton: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "13px"
  },
  searchInfo: {
    marginBottom: "15px",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "14px"
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  taskCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px 16px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    borderLeft: "4px solid",
    flexWrap: "wrap"
  },
  taskContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    flex: 1,
    minWidth: "200px"
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
    marginTop: "2px"
  },
  taskInfo: {
    flex: 1
  },
  taskTitle: {
    fontSize: "16px",
    marginRight: "10px"
  },
  dueDateBadge: {
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    marginLeft: "8px",
    display: "inline-block"
  },
  priorityBadge: {
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    marginLeft: "8px",
    display: "inline-block"
  },
  categoryBadge: {
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    marginLeft: "8px",
    display: "inline-block"
  },
  attachmentsSection: {
    marginTop: "10px",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid"
  },
  attachmentsHeader: {
    fontSize: "11px",
    fontWeight: "bold",
    marginBottom: "6px"
  },
  attachmentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  attachmentItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    padding: "4px 0",
    borderBottom: "1px solid #eee"
  },
  attachmentIcon: {
    fontSize: "14px"
  },
  attachmentLink: {
    textDecoration: "none",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  attachmentSize: {
    fontSize: "10px"
  },
  deleteAttachmentBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#ef4444",
    fontSize: "12px",
    padding: "2px 4px"
  },
  uploadSection: {
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap"
  },
  uploadBtn: {
    padding: "4px 8px",
    border: "1px solid",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px"
  },
  uploadConfirm: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid"
  },
  confirmUploadBtn: {
    padding: "2px 8px",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "4px",
    color: "white",
    cursor: "pointer",
    fontSize: "10px"
  },
  cancelUploadBtn: {
    padding: "2px 8px",
    backgroundColor: "#ef4444",
    border: "none",
    borderRadius: "4px",
    color: "white",
    cursor: "pointer",
    fontSize: "10px"
  },
  taskActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  dueDateEdit: {
    display: "flex",
    gap: "4px"
  },
  editDateInput: {
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "11px",
    width: "100px"
  },
  editTimeInput: {
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "11px",
    width: "70px"
  },
  priorityDropdown: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "12px",
    cursor: "pointer"
  },
  deleteButton: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "white"
  },
  empty: {
    textAlign: "center",
    marginTop: "40px"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modal: {
    padding: "24px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "400px"
  },
  modalInput: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  modalRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px"
  },
  modalInputSmall: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "14px"
  },
  colorInput: {
    width: "60px",
    height: "40px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer"
  },
  modalButton: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    marginBottom: "8px"
  },
  modalCancel: {
    width: "100%",
    padding: "10px",
    border: "1px solid",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  }
};

export default Tasks;