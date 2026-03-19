const MealPlan = require("../models/MealPlan");
const Recipe = require("../models/Recipe");
const generateMealPlan = require("./mealPlanGenerator");

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
  const dinners = (plan.entries || []).map((entry) => {
    if (entry.type === "fresh") {
      return {
        date: entry.date,
        type: "cook",
        recipeId: entry.recipeId,
        title: entry.title || "",
      };
    }

    return {
      date: entry.date,
      type: "leftovers",
      leftoverOfRecipeId: entry.leftoverOfRecipeId || entry.recipeId || null,
      title: entry.title || "Leftovers",
    };
  });

  return {
    startDate,
    days,
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
  const item = await MealPlan.create({
    userId,
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
      { _id: { $in: cookedIds }, userId },
      { $set: { lastPlannedAt: new Date() } }
    );
  }

  return item;
}

async function listMealPlans({ userId }) {
  return MealPlan.find({ userId }).sort({ createdAt: -1 }).limit(100);
}

async function getMealPlanById({ userId, id }) {
  return MealPlan.findOne({ _id: id, userId });
}

module.exports = {
  generateProposal,
  createMealPlan,
  listMealPlans,
  getMealPlanById,
};
