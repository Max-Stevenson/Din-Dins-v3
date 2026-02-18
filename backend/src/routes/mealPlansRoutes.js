const express = require("express");
const MealPlan = require("../models/MealPlan");
const Recipe = require("../models/Recipe");

const router = express.Router();

function toISODate(d) {
  // d is a Date in local time, but we only output YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, daysToAdd) {
  const d = new Date(date);
  d.setDate(d.getDate() + daysToAdd);
  return d;
}

function isMeatProtein(protein) {
  const p = String(protein || "").toLowerCase();
  return ["chicken", "beef", "fish", "pork", "turkey", "lamb"].includes(p);
}

function pickWeighted(recipes) {
  // Bias toward “novel” recipes: older lastPlannedAt gets higher weight.
  // If lastPlannedAt is null => treat as very old => high weight.
  const now = Date.now();
  const scored = recipes.map((r) => {
    const last = r.lastPlannedAt ? new Date(r.lastPlannedAt).getTime() : 0;
    const ageDays = Math.max(
      1,
      Math.floor((now - last) / (1000 * 60 * 60 * 24))
    );
    // cap weight so it doesn't get insane
    const weight = Math.min(60, ageDays);
    return { r, weight };
  });

  const total = scored.reduce((sum, x) => sum + x.weight, 0);
  let roll = Math.random() * total;

  for (const x of scored) {
    roll -= x.weight;
    if (roll <= 0) return x.r;
  }
  return scored[scored.length - 1]?.r;
}

function countSchedulableLeftoverMeals(leftoverQueue, people) {
  return leftoverQueue.reduce((sum, entry) => {
    return sum + Math.floor(entry.servingsRemaining / people);
  }, 0);
}

function consumeNextLeftover(leftoverQueue, people) {
  while (leftoverQueue.length > 0) {
    const current = leftoverQueue[0];

    if (current.servingsRemaining < people) {
      leftoverQueue.shift();
      continue;
    }

    current.servingsRemaining -= people;
    if (current.servingsRemaining < people) {
      leftoverQueue.shift();
    }

    return current.recipeId;
  }

  return null;
}

// POST /api/v1/meal-plans/generate
router.post("/generate", async (req, res) => {
  const {
    startDate,
    days = 7,
    people = 2,
    meatRatio = 0.5,
    allowLeftovers = true,
  } = req.body ?? {};

  if (!startDate)
    return res
      .status(400)
      .json({ error: "startDate is required (YYYY-MM-DD)" });
  if (!Number.isFinite(days) || days < 1 || days > 31)
    return res.status(400).json({ error: "days must be 1..31" });
  if (!Number.isFinite(people) || people < 1 || people > 20)
    return res.status(400).json({ error: "people must be 1..20" });

  const allRecipes = await Recipe.find({ userId: req.userId }).limit(1000);

  if (!allRecipes.length) {
    return res.json({
      proposal: {
        startDate,
        days,
        people,
        meatRatio,
        allowLeftovers,
        dinners: [],
      },
      warnings: ["No recipes available to generate a plan."],
    });
  }

  const meatRecipes = allRecipes.filter((r) => isMeatProtein(r.protein));
  const vegRecipes = allRecipes.filter((r) => !isMeatProtein(r.protein));

  // FIFO leftover queue so leftovers keep a stable, predictable order.
  const leftoverQueue = [];

  const dinners = [];
  const start = new Date(`${startDate}T12:00:00`); // noon avoids DST weirdness
  let lastCookedId = null;
  let consecutiveCookDays = 0;
  let drainingLeftovers = false;

  for (let i = 0; i < days; i++) {
    const dateStr = toISODate(addDays(start, i));

    const daysRemainingIncludingToday = days - i;
    const pendingLeftoverMeals = countSchedulableLeftoverMeals(
      leftoverQueue,
      people
    );
    const canUseLeftovers = allowLeftovers && pendingLeftoverMeals > 0;
    const shouldFlushByPlanEnd =
      pendingLeftoverMeals >= daysRemainingIncludingToday;
    const shouldStartStaggeredLeftovers = consecutiveCookDays >= 2;
    const shouldUseLeftovers =
      canUseLeftovers &&
      (drainingLeftovers || shouldFlushByPlanEnd || shouldStartStaggeredLeftovers);

    if (shouldUseLeftovers) {
      const recipeId = consumeNextLeftover(leftoverQueue, people);
      if (recipeId) {
        dinners.push({
          date: dateStr,
          type: "leftovers",
          leftoverOfRecipeId: recipeId,
        });
        consecutiveCookDays = 0;
        drainingLeftovers =
          countSchedulableLeftoverMeals(leftoverQueue, people) > 0;
        continue;
      }

      drainingLeftovers = false;
    }

    // decide meat vs veg target
    const wantMeat = Math.random() < meatRatio;

    const pool = wantMeat
      ? meatRecipes.length
        ? meatRecipes
        : allRecipes
      : vegRecipes.length
      ? vegRecipes
      : allRecipes;

    let chosen = pickWeighted(pool) || allRecipes[0];

    // try a few times to avoid same as yesterday (if we have enough recipes)
    if (lastCookedId && allRecipes.length > 1) {
      for (let tries = 0; tries < 5; tries++) {
        if (String(chosen._id) !== String(lastCookedId)) break;
        chosen = pickWeighted(pool) || allRecipes[0];
      }
    }

    dinners.push({ date: dateStr, type: "cook", recipeId: chosen._id });
    lastCookedId = chosen._id;
    consecutiveCookDays += 1;

    // Add leftovers only if there are enough servings for a full leftover dinner.
    const portions = Number.isFinite(Number(chosen.portions))
      ? Number(chosen.portions)
      : 1;
    const producedLeftovers = Math.max(0, portions - people);
    if (allowLeftovers && producedLeftovers >= people) {
      leftoverQueue.push({
        recipeId: String(chosen._id),
        servingsRemaining: producedLeftovers,
      });
    }
  }

  // Optional: populate titles for leftovers to make UI easier
  const recipeById = new Map(allRecipes.map((r) => [String(r._id), r]));
  const dinnersWithTitles = dinners.map((d) => {
    if (d.type === "cook") {
      const r = recipeById.get(String(d.recipeId));
      return { ...d, title: r?.name || "" };
    }
    const r = recipeById.get(String(d.leftoverOfRecipeId));
    return { ...d, title: r ? `Leftovers: ${r.name}` : "Leftovers" };
  });

  res.json({
    proposal: {
      startDate,
      days,
      people,
      meatRatio,
      allowLeftovers,
      dinners: dinnersWithTitles,
    },
  });
});

// POST /api/v1/meal-plans (save)
router.post("/", async (req, res) => {
  const { startDate, days, people, meatRatio, allowLeftovers, dinners } =
    req.body ?? {};
  if (!startDate)
    return res.status(400).json({ error: "startDate is required" });
  if (!Array.isArray(dinners) || dinners.length === 0)
    return res.status(400).json({ error: "dinners is required" });

  const item = await MealPlan.create({
    userId: req.userId,
    startDate,
    days,
    people,
    meatRatio,
    allowLeftovers,
    dinners,
  });

  // Update lastPlannedAt only for cook meals
  const cookedIds = dinners
    .filter((d) => d.type === "cook" && d.recipeId)
    .map((d) => d.recipeId);

  if (cookedIds.length) {
    await Recipe.updateMany(
      { _id: { $in: cookedIds }, userId: req.userId },
      { $set: { lastPlannedAt: new Date() } }
    );
  }

  res.status(201).json({ item });
});

// GET /api/v1/meal-plans (history)
router.get("/", async (req, res) => {
  const items = await MealPlan.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ items });
});

// GET /api/v1/meal-plans/:id
router.get("/:id", async (req, res) => {
  const item = await MealPlan.findOne({ _id: req.params.id, userId: req.userId });
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({ item });
});


module.exports = router;
