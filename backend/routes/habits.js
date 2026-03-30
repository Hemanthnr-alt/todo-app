const express = require("express");
const Habit   = require("../models/Habit");
const router  = express.Router();

// GET all habits for user
router.get("/", async (req, res) => {
  try {
    const habits = await Habit.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "ASC"]],
    });
    res.json(habits);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create habit
router.post("/", async (req, res) => {
  try {
    const { name, icon, color, frequency } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const habit = await Habit.create({
      name: name.trim(),
      icon: icon || "⭐",
      color: color || "#ff6b9d",
      frequency: frequency || "daily",
      completedDates: [],
      streak: 0,
      userId: req.user.id,
    });
    res.status(201).json(habit);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update habit (toggle date, update streak)
router.put("/:id", async (req, res) => {
  try {
    const habit = await Habit.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    const { completedDates, streak, name, icon, color, frequency } = req.body;
    await habit.update({
      ...(completedDates !== undefined && { completedDates }),
      ...(streak       !== undefined && { streak }),
      ...(name         !== undefined && { name }),
      ...(icon         !== undefined && { icon }),
      ...(color        !== undefined && { color }),
      ...(frequency    !== undefined && { frequency }),
    });
    res.json(habit);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE habit
router.delete("/:id", async (req, res) => {
  try {
    const habit = await Habit.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    await habit.destroy();
    res.json({ message: "Habit deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST bulk sync — send all local habits, get merged result
router.post("/sync", async (req, res) => {
  try {
    const { habits: localHabits } = req.body;
    if (!Array.isArray(localHabits)) return res.status(400).json({ error: "habits array required" });

    const serverHabits = await Habit.findAll({ where: { userId: req.user.id } });
    const serverMap = new Map(serverHabits.map(h => [h.id, h]));

    const result = [];
    for (const lh of localHabits) {
      if (lh.id?.startsWith("offline_")) {
        // New habit created offline — create on server
        const created = await Habit.create({
          name: lh.name, icon: lh.icon, color: lh.color,
          frequency: lh.frequency || "daily",
          completedDates: lh.completedDates || [],
          streak: lh.streak || 0,
          userId: req.user.id,
        });
        result.push({ ...created.toJSON(), _localId: lh.id });
      } else if (serverMap.has(lh.id)) {
        // Merge — union of completedDates, take max streak
        const sh = serverMap.get(lh.id);
        const merged = [...new Set([...(sh.completedDates||[]), ...(lh.completedDates||[])])];
        await sh.update({ completedDates: merged, streak: Math.max(sh.streak||0, lh.streak||0) });
        result.push(sh.toJSON());
        serverMap.delete(lh.id);
      }
    }
    // Add server-only habits
    for (const [, sh] of serverMap) result.push(sh.toJSON());

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;