const express = require("express");
const TaskTemplate = require("../models/TaskTemplate");
const Task = require("../models/Task");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rows = await TaskTemplate.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "ASC"]],
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, items } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const row = await TaskTemplate.create({
      name: name.trim(),
      items: Array.isArray(items) ? items : [],
      userId: req.user.id,
    });
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const row = await TaskTemplate.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ error: "Not found" });
    const { name, items } = req.body;
    await row.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(items !== undefined && { items: Array.isArray(items) ? items : [] }),
    });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const row = await TaskTemplate.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ error: "Not found" });
    await row.destroy();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Create tasks from template; optional dueDate applies to all */
router.post("/:id/apply", async (req, res) => {
  try {
    const row = await TaskTemplate.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ error: "Template not found" });
    const { dueDate } = req.body;
    const items = row.items || [];
    const created = [];
    for (const item of items) {
      if (!item?.title?.trim()) continue;
      const t = await Task.create({
        title: item.title.trim(),
        description: item.description || "",
        priority: item.priority || "medium",
        categoryId: item.categoryId || null,
        projectId: item.projectId || null,
        tags: item.tags || [],
        dueDate: item.dueDate || dueDate || null,
        userId: req.user.id,
        attachments: [],
        subtasks: [],
      });
      created.push(t);
    }
    const Category = require("../models/Category");
    const Project = require("../models/Project");
    const withRels = await Task.findAll({
      where: { id: created.map((c) => c.id) },
      include: [{ model: Category }, { model: Project }],
    });
    res.status(201).json(withRels);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
