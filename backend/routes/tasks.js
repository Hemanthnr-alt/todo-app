const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Op } = require("sequelize");
const Task = require("../models/Task");
const Category = require("../models/Category");

const router = express.Router();

// Multer setup
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
  "image/jpeg","image/png","image/gif","image/webp",
  "application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain","application/zip","application/x-zip-compressed",
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

// GET all tasks for current user
router.get("/", async (req, res) => {
  try {
    const { search, priority, categoryId, completed } = req.query;
    const where = { userId: req.user.id };

    if (search) where.title = { [Op.iLike]: `%${search}%` };
    if (priority && priority !== "all") where.priority = priority;
    if (categoryId && categoryId !== "all") where.categoryId = categoryId;
    if (completed !== undefined) where.completed = completed === "true";

    const tasks = await Task.findAll({
      where,
      include: [{ model: Category }],
      order: [["createdAt", "DESC"]],
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single task
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Category }],
    });

    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create task
router.post("/", async (req, res) => {
  try {
    const { title, description, priority, categoryId, dueDate, startTime, endTime, duration, tags, subtasks } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      priority: priority || "medium",
      categoryId: categoryId || null,
      dueDate: dueDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      duration: duration || null,
      tags: tags || [],
      subtasks: subtasks || [],
      attachments: [],
      userId: req.user.id,
    });

    const taskWithCategory = await Task.findByPk(task.id, {
      include: [{ model: Category }],
    });

    res.status(201).json(taskWithCategory);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    const { title, description, completed, priority, dueDate, startTime, endTime, duration, categoryId, tags, subtasks } = req.body;

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
      ...(tags !== undefined && { tags }),
      ...(subtasks !== undefined && { subtasks }),
    });

    const updatedTask = await Task.findByPk(req.params.id, {
      include: [{ model: Category }],
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    // Delete attached files
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((att) => {
        const filePath = path.join(__dirname, "../uploads", path.basename(att.url));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    await task.destroy();
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST upload attachment
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

// DELETE attachment
router.delete("/:id/attachments/:attId", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    const attachment = (task.attachments || []).find((a) => a.id === req.params.attId);
    if (!attachment) return res.status(404).json({ error: "Attachment not found" });

    // Delete file from disk
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
