const express = require("express");
const Recipe = require("../models/Recipe");

const router = express.Router();

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/recipes
router.get("/", async (req, res) => {
  try {
    const pageSize = Math.min(toPositiveInt(req.query.pageSize, 6), 50);
    const requestedPage = toPositiveInt(req.query.page, 1);
    const query = String(req.query.query || "").trim();
    const protein = String(req.query.protein || "All").trim();

    const baseFilter = { userId: req.userId };
    const listFilter = { ...baseFilter };

    if (query) {
      listFilter.name = { $regex: escapeRegex(query), $options: "i" };
    }

    if (protein && protein.toLowerCase() !== "all") {
      listFilter.protein = {
        $regex: `^${escapeRegex(protein)}$`,
        $options: "i",
      };
    }

    const [totalRecipes, totalItems] = await Promise.all([
      Recipe.countDocuments(baseFilter),
      Recipe.countDocuments(listFilter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(requestedPage, totalPages);

    const recipes = await Recipe.find(listFilter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({
      items: recipes,
      totalRecipes,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
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
