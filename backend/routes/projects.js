const express = require("express");
const Project = require("../models/Project");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rows = await Project.findAll({
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
    const { name, color, icon } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const row = await Project.create({
      name: name.trim(),
      color: color || "#49B9FF",
      icon: icon || "◇",
      userId: req.user.id,
    });
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const row = await Project.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ error: "Not found" });
    const { name, color, icon } = req.body;
    await row.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
    });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const row = await Project.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ error: "Not found" });
    await row.destroy();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
