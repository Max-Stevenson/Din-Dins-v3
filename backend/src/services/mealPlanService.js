const MealPlan = require("../models/MealPlan");
const Recipe = require("../models/Recipe");
const generateMealPlan = require("./mealPlanGenerator");
const {
  createEntryId,
  isFreshDinner,
  normalizeDinners,
  serializeMealPlan,
} = require("./mealPlanEntries");

function buildMealPlan({
  recipes,
  startDate,
  days,
  people,
  meatRatio,
  allowLeftovers,
}) {
  return generateMealPlan({
    recipes,
    startDate,
    days,
    peopleCount: people,
    meatVegRatio: meatRatio,
    allowLeftovers,
  });
}

function buildProposalFromPlan({
  plan,
  startDate,
  days,
  people,
  meatRatio,
  allowLeftovers,
}) {
  let lastFreshEntryId = null;

  const dinners = normalizeDinners(
    (plan.entries || []).map((entry, index) => {
      if (entry.type === "fresh") {
        lastFreshEntryId = createEntryId(index);
        return {
          entryId: lastFreshEntryId,
          date: entry.date,
          type: "fresh",
          recipeId: entry.recipeId,
          title: entry.title || "",
          protein: entry.protein || "",
          leftoverSlots: 0,
        };
      }

      return {
        entryId: createEntryId(index),
        date: entry.date,
        type: "leftover",
        recipeId: entry.recipeId || null,
        leftoverOfRecipeId: entry.leftoverOfRecipeId || entry.recipeId || null,
        sourceCookEntryId: lastFreshEntryId,
        leftoverOfEntryId: lastFreshEntryId,
        title: entry.title || "Leftovers",
        protein: entry.protein || "",
      };
    })
  );

  return {
    startDate,
    days: dinners.length || days,
    people,
    meatRatio,
    allowLeftovers,
    dinners,
    metadata: {
      freshCount: (plan.entries || []).filter((entry) => entry.type === "fresh").length,
      leftoverCount: (plan.entries || []).filter((entry) => entry.type === "leftover").length,
      warnings: plan.warnings || [],
    },
  };
}

async function generateProposal({
  userId,
  startDate,
  days,
  people,
  meatRatio,
  allowLeftovers,
}) {
  const recipes = await Recipe.find({ userId }).limit(1000).lean();
  const plan = buildMealPlan({
    recipes,
    startDate,
    days,
    people,
    meatRatio,
    allowLeftovers,
  });
  const proposal = buildProposalFromPlan({
    plan,
    startDate,
    days,
    people,
    meatRatio,
    allowLeftovers,
  });

  return {
    proposal,
    warnings: plan.warnings || [],
  };
}

async function createMealPlan({
  userId,
  startDate,
  days,
  people,
  meatRatio,
  allowLeftovers,
  dinners,
}) {
  const normalizedDinners = normalizeDinners(dinners);
  const item = await MealPlan.create({
    userId,
    startDate,
    days: normalizedDinners.length || days,
    people,
    meatRatio,
    allowLeftovers,
    dinners: normalizedDinners,
  });

  // Update lastPlannedAt only for cook meals
  const cookedIds = normalizedDinners
    .filter((d) => isFreshDinner(d) && d.recipeId)
    .map((d) => d.recipeId);

  if (cookedIds.length) {
    await Recipe.updateMany(
      { _id: { $in: cookedIds }, userId },
      { $set: { lastPlannedAt: new Date() } }
    );
  }

  return serializeMealPlan(item);
}

async function listMealPlans({ userId }) {
  const items = await MealPlan.find({ userId }).sort({ createdAt: -1 }).limit(100);
  return items.map((item) => serializeMealPlan(item));
}

async function getMealPlanById({ userId, id }) {
  const item = await MealPlan.findOne({ _id: id, userId });
  return serializeMealPlan(item);
}

module.exports = {
  generateProposal,
  createMealPlan,
  listMealPlans,
  getMealPlanById,
};
