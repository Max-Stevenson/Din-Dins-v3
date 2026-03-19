const mealPlanService = require("../services/mealPlanService");
const {
  validateGenerateRequest,
  validateCreateMealPlanRequest,
} = require("../validators/mealPlanValidators");

async function generate(req, res) {
  const validation = validateGenerateRequest(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const result = await mealPlanService.generateProposal({
    userId: req.userId,
    ...validation.value,
  });

  return res.json(result);
}

async function create(req, res) {
  const validation = validateCreateMealPlanRequest(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const item = await mealPlanService.createMealPlan({
    userId: req.userId,
    ...validation.value,
  });

  return res.status(201).json({ item });
}

async function list(req, res) {
  const items = await mealPlanService.listMealPlans({ userId: req.userId });
  return res.json({ items });
}

async function getById(req, res) {
  const item = await mealPlanService.getMealPlanById({
    userId: req.userId,
    id: req.params.id,
  });

  if (!item) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json({ item });
}

module.exports = {
  generate,
  create,
  list,
  getById,
};
