const express = require("express");
const Recipe = require("../models/Recipe");

const router = express.Router();

// GET /api/recipes
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .limit(200);

    res.json({ items: recipes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// POST /api/recipes
router.post("/", async (req, res) => {
  try {
    const {
      name,
      protein,
      portions,
      cookTime = "",
      tags = [],
      ingredients = [],
      method = [],
      imageUrl = "",
    } = req.body ?? {};

    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    if (!protein?.trim()) return res.status(400).json({ error: "Protein is required" });
    if (!Number.isFinite(portions) || portions < 1)
      return res.status(400).json({ error: "Portions must be >= 1" });

    const cleanIngredients = (ingredients || [])
      .filter((i) => i?.name && String(i.name).trim())
      .map((i) => ({
        quantity: String(i.quantity ?? "").trim(),
        unit: String(i.unit ?? "").trim(),
        name: String(i.name).trim(),
      }));

    const cleanMethod = (method || [])
      .filter((s) => s?.text && String(s.text).trim())
      .map((s) => ({ text: String(s.text).trim() }));

    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : [];

    const created = await Recipe.create({
      userId: req.userId,
      name: name.trim(),
      protein: protein.trim(),
      portions,
      cookTime: String(cookTime).trim(),
      tags: cleanTags,
      ingredients: cleanIngredients,
      method: cleanMethod,
      imageUrl: String(imageUrl).trim(),
    });

    res.status(201).json({ item: created });
  } catch (err) {
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

module.exports = router;
