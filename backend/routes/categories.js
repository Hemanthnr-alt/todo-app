const express = require("express");
const { body, validationResult } = require("express-validator");
const Category = require("../models/Category");

const router = express.Router();

// GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["name", "ASC"]],
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create category
router.post(
  "/",
  [
    body("name")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name is required (max 50 chars)"),
    body("color")
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage("Invalid color format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, color, icon } = req.body;

      const category = await Category.create({
        name: name.trim(),
        color: color || "#ff6b9d",
        icon: icon || "📁",
      });

      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT update category
router.put(
  "/:id",
  [
    body("name").optional().trim().isLength({ min: 1, max: 50 }),
    body("color").optional().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  async (req, res) => {
    try {
      const category = await Category.findOne({
        where: { id: req.params.id },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const { name, color, icon } = req.body;

      await category.update({
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
      });

      res.json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE category
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.destroy();
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;