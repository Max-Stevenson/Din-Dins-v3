function validateGenerateRequest(body) {
  const {
    startDate,
    days = 7,
    people = 2,
    meatRatio = 0.5,
    allowLeftovers = true,
  } = body ?? {};

  if (!startDate) {
    return { error: "startDate is required (YYYY-MM-DD)" };
  }
  if (!Number.isFinite(days) || days < 1 || days > 31) {
    return { error: "days must be 1..31" };
  }
  if (!Number.isFinite(people) || people < 1 || people > 20) {
    return { error: "people must be 1..20" };
  }

  return {
    value: {
      startDate,
      days,
      people,
      meatRatio,
      allowLeftovers,
    },
  };
}

function validateCreateMealPlanRequest(body) {
  const { startDate, days, people, meatRatio, allowLeftovers, dinners } =
    body ?? {};

  if (!startDate) {
    return { error: "startDate is required" };
  }
  if (!Array.isArray(dinners) || dinners.length === 0) {
    return { error: "dinners is required" };
  }

  return {
    value: {
      startDate,
      days,
      people,
      meatRatio,
      allowLeftovers,
      dinners,
    },
  };
}

module.exports = {
  validateGenerateRequest,
  validateCreateMealPlanRequest,
};
