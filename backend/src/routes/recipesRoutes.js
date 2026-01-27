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

// PUT /api/v1/recipes/:id
router.put("/:id", async (req, res) => {
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
      imagePublicId = "",
    } = req.body ?? {};

    if (!name?.trim())
      return res.status(400).json({ error: "Name is required" });
    if (!protein?.trim())
      return res.status(400).json({ error: "Protein is required" });
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

    const updated = await Recipe.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        name: name.trim(),
        protein: protein.trim(),
        portions,
        cookTime: String(cookTime).trim(),
        tags: cleanTags,
        ingredients: cleanIngredients,
        method: cleanMethod,
        imageUrl: String(imageUrl).trim(),
        imagePublicId: String(imagePublicId).trim(),
      },
      { new: true },
    );

    if (!updated) return res.status(404).json({ error: "Not found" });

    res.json({ item: updated });
  } catch (err) {
    if (err?.name === "CastError") {
      return res.status(400).json({ error: "Invalid recipe id" });
    }
    res.status(500).json({ error: "Failed to update recipe" });
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
      imagePublicId = "",
    } = req.body ?? {};

    if (!name?.trim())
      return res.status(400).json({ error: "Name is required" });
    if (!protein?.trim())
      return res.status(400).json({ error: "Protein is required" });
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
      imagePublicId: String(imagePublicId).trim(),
    });

    res.status(201).json({ item: created });
  } catch (err) {
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

router.get("/:id", async (req, res) => {
  const item = await Recipe.findOne({ _id: req.params.id, userId: req.userId });
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({ item });
});

router.delete("/:id", async (req, res) => {
  console.log("DELETE hit", { id: req.params.id, userId: req.userId });

  const deleted = await Recipe.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!deleted) return res.status(404).json({ error: "Not found" });

  res.json({ ok: true });
});

module.exports = router;
