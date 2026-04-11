const express = require("express");
const Habit = require("../models/Habit");

const router = express.Router();

const habitWritable = (body) => {
  const {
    name, icon, color, frequency, completedDates, streak,
    recurringDays, everyNDays, targetTimesPerWeek, goalMinMinutes, goalMaxPerDay,
    reminderTime, reminderEnabled,
  } = body;
  const patch = {};
  if (name !== undefined) patch.name = name?.trim?.() ?? name;
  if (icon !== undefined) patch.icon = icon;
  if (color !== undefined) patch.color = color;
  if (frequency !== undefined) patch.frequency = frequency;
  if (completedDates !== undefined) patch.completedDates = completedDates;
  if (streak !== undefined) patch.streak = streak;
  if (recurringDays !== undefined) patch.recurringDays = recurringDays;
  if (everyNDays !== undefined) patch.everyNDays = everyNDays;
  if (targetTimesPerWeek !== undefined) patch.targetTimesPerWeek = targetTimesPerWeek;
  if (goalMinMinutes !== undefined) patch.goalMinMinutes = goalMinMinutes;
  if (goalMaxPerDay !== undefined) patch.goalMaxPerDay = goalMaxPerDay;
  if (reminderTime !== undefined) patch.reminderTime = reminderTime || null;
  if (reminderEnabled !== undefined) patch.reminderEnabled = !!reminderEnabled;
  return patch;
};

router.get("/", async (req, res) => {
  try {
    const habits = await Habit.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "ASC"]],
    });
    res.json(habits);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { name, icon, color, frequency } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const extra = habitWritable(req.body);
    delete extra.name;
    const habit = await Habit.create({
      name: name.trim(),
      icon: icon || "⭐",
      color: color || "#ff6b9d",
      frequency: frequency || "daily",
      completedDates: [],
      streak: 0,
      ...extra,
      userId: req.user.id,
    });
    res.status(201).json(habit);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const habit = await Habit.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    const patch = habitWritable(req.body);
    if (patch.name) patch.name = patch.name.trim();
    await habit.update(patch);
    res.json(habit);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const habit = await Habit.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    await habit.destroy();
    res.json({ message: "Habit deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function mergeHabitFields(server, local) {
  const mergedDates = [...new Set([...(server.completedDates || []), ...(local.completedDates || [])])].sort();
  return {
    completedDates: mergedDates,
    streak: Math.max(server.streak || 0, local.streak || 0),
    name: local.name || server.name,
    icon: local.icon || server.icon,
    color: local.color || server.color,
    frequency: local.frequency || server.frequency,
    recurringDays: local.recurringDays?.length ? local.recurringDays : server.recurringDays,
    everyNDays: local.everyNDays ?? server.everyNDays,
    targetTimesPerWeek: local.targetTimesPerWeek ?? server.targetTimesPerWeek,
    goalMinMinutes: local.goalMinMinutes ?? server.goalMinMinutes,
    goalMaxPerDay: local.goalMaxPerDay ?? server.goalMaxPerDay,
    reminderTime: local.reminderTime ?? server.reminderTime,
    reminderEnabled: local.reminderEnabled ?? server.reminderEnabled,
  };
}

router.post("/sync", async (req, res) => {
  try {
    const { habits: localHabits } = req.body;
    if (!Array.isArray(localHabits)) return res.status(400).json({ error: "habits array required" });

    const serverHabits = await Habit.findAll({ where: { userId: req.user.id } });
    const serverMap = new Map(serverHabits.map((h) => [h.id, h]));

    const result = [];
    for (const lh of localHabits) {
      if (lh.id?.startsWith("offline_")) {
        const extra = habitWritable(lh);
        delete extra.name;
        const created = await Habit.create({
          name: lh.name,
          icon: lh.icon || "⭐",
          color: lh.color || "#ff6b9d",
          frequency: lh.frequency || "daily",
          completedDates: lh.completedDates || [],
          streak: lh.streak || 0,
          ...extra,
          userId: req.user.id,
        });
        result.push({ ...created.toJSON(), _localId: lh.id });
      } else if (serverMap.has(lh.id)) {
        const sh = serverMap.get(lh.id);
        const m = mergeHabitFields(sh, lh);
        await sh.update(m);
        result.push(sh.toJSON());
        serverMap.delete(lh.id);
      }
    }
    for (const [, sh] of serverMap) result.push(sh.toJSON());

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
