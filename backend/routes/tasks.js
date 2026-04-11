const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Op } = require("sequelize");
const Task = require("../models/Task");
const Category = require("../models/Category");
const Project = require("../models/Project");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const allowedMimeTypes = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "application/zip", "application/x-zip-compressed",
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    allowedMimeTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("File type not allowed"), false);
  },
});

const includeModels = [{ model: Category }, { model: Project }];

router.get("/", async (req, res) => {
  try {
    const {
      search, priority, categoryId, completed, view, tag, projectId,
    } = req.query;
    const where = { userId: req.user.id };

    if (search) where.title = { [Op.iLike]: `%${search}%` };
    if (priority && priority !== "all") where.priority = priority;
    if (categoryId && categoryId !== "all") where.categoryId = categoryId;
    if (completed !== undefined) where.completed = completed === "true";
    if (projectId && projectId !== "all") where.projectId = projectId;

    const v = view || "active";
    if (v === "trash") where.lifecycleStatus = "trashed";
    else if (v === "archive") where.lifecycleStatus = "archived";
    else if (v === "all") {
      // no lifecycle filter
    } else {
      where.lifecycleStatus = "active";
    }

    if (tag) {
      where.tags = { [Op.overlap]: [String(tag).replace(/^#/, "")] };
    }

    const tasks = await Task.findAll({
      where,
      include: includeModels,
      order: [["createdAt", "DESC"]],
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { tasks: list, dueDate } = req.body;
    if (!Array.isArray(list) || !list.length) {
      return res.status(400).json({ error: "tasks array required" });
    }
    const created = [];
    for (const item of list) {
      if (!item?.title?.trim()) continue;
      const t = await Task.create({
        title: item.title.trim(),
        description: item.description || "",
        priority: item.priority || "medium",
        categoryId: item.categoryId || null,
        projectId: item.projectId || null,
        tags: item.tags || [],
        dueDate: item.dueDate || dueDate || null,
        isRecurring: item.isRecurring || false,
        recurringFrequency: item.recurringFrequency || null,
        recurringDays: item.recurringDays || [],
        recurringInterval: item.recurringInterval || null,
        recurringSkipDates: item.recurringSkipDates || [],
        completedDates: item.completedDates || [],
        userId: req.user.id,
        attachments: [],
        subtasks: item.subtasks || [],
      });
      created.push(t);
    }
    const withRels = await Task.findAll({
      where: { id: created.map((c) => c.id) },
      include: includeModels,
    });
    res.status(201).json(withRels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: includeModels,
    });

    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title, description, priority, categoryId, projectId, dueDate, startTime, endTime, duration,
      tags, subtasks, isRecurring, recurringFrequency, recurringDays, completedDates,
      recurringInterval, recurringSkipDates, lifecycleStatus,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      priority: priority || "medium",
      categoryId: categoryId || null,
      projectId: projectId || null,
      dueDate: dueDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      duration: duration || null,
      tags: tags || [],
      subtasks: subtasks || [],
      attachments: [],
      isRecurring: !!isRecurring,
      recurringFrequency: recurringFrequency || null,
      recurringDays: recurringDays || [],
      completedDates: completedDates || [],
      recurringInterval: recurringInterval || null,
      recurringSkipDates: recurringSkipDates || [],
      lifecycleStatus: lifecycleStatus && ["active", "archived", "trashed"].includes(lifecycleStatus)
        ? lifecycleStatus
        : "active",
      userId: req.user.id,
    });

    const taskWithCategory = await Task.findByPk(task.id, { include: includeModels });

    res.status(201).json(taskWithCategory);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    const {
      title, description, completed, priority, dueDate, startTime, endTime, duration,
      categoryId, projectId, tags, subtasks, isRecurring, recurringFrequency, recurringDays,
      completedDates, recurringInterval, recurringSkipDates, lifecycleStatus, trashedAt,
    } = req.body;

    await task.update({
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description }),
      ...(completed !== undefined && { completed }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate || null }),
      ...(startTime !== undefined && { startTime: startTime || null }),
      ...(endTime !== undefined && { endTime: endTime || null }),
      ...(duration !== undefined && { duration }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(projectId !== undefined && { projectId: projectId || null }),
      ...(tags !== undefined && { tags }),
      ...(subtasks !== undefined && { subtasks }),
      ...(isRecurring !== undefined && { isRecurring }),
      ...(recurringFrequency !== undefined && { recurringFrequency }),
      ...(recurringDays !== undefined && { recurringDays }),
      ...(completedDates !== undefined && { completedDates }),
      ...(recurringInterval !== undefined && { recurringInterval }),
      ...(recurringSkipDates !== undefined && { recurringSkipDates }),
      ...(lifecycleStatus !== undefined && { lifecycleStatus }),
      ...(trashedAt !== undefined && { trashedAt }),
    });

    const updatedTask = await Task.findByPk(req.params.id, { include: includeModels });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/restore", async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await task.update({ lifecycleStatus: "active", trashedAt: null });
    const updated = await Task.findByPk(task.id, { include: includeModels });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/archive", async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await task.update({ lifecycleStatus: "archived" });
    const updated = await Task.findByPk(task.id, { include: includeModels });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id/permanent", async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((att) => {
        const filePath = path.join(__dirname, "../uploads", path.basename(att.url));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    await task.destroy();
    res.json({ message: "Permanently deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    await task.update({
      lifecycleStatus: "trashed",
      trashedAt: new Date(),
    });

    res.json({ message: "Moved to trash", task: await Task.findByPk(task.id, { include: includeModels }) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/upload", upload.single("file"), async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const attachment = {
      id: Date.now().toString(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    };

    const attachments = [...(task.attachments || []), attachment];
    await task.update({ attachments });

    res.json({ attachment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id/attachments/:attId", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    const attachment = (task.attachments || []).find((a) => a.id === req.params.attId);
    if (!attachment) return res.status(404).json({ error: "Attachment not found" });

    const filePath = path.join(__dirname, "../uploads", attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const attachments = (task.attachments || []).filter((a) => a.id !== req.params.attId);
    await task.update({ attachments });

    res.json({ message: "Attachment deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
