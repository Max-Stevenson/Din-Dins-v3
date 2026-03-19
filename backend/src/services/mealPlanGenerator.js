/**
 * Pure meal plan generator for Din-Dins MVP.
 * No DB calls, no mutations of input arrays, fully deterministic.
 */

function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validateInputs(startDate, days, peopleCount, meatVegRatio) {
  // Validate startDate
  if (!startDate || typeof startDate !== 'string') {
    throw new Error('startDate is required and must be a string');
  }
  const start = new Date(`${startDate}T12:00:00`);
  if (isNaN(start.getTime())) {
    throw new Error('startDate is invalid (expected YYYY-MM-DD)');
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    throw new Error('startDate cannot be in the past');
  }

  // Validate days
  if (!Number.isInteger(days) || days < 1 || days > 31) {
    throw new Error('days must be an integer between 1 and 31');
  }

  // Validate peopleCount
  if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 20) {
    throw new Error('peopleCount must be an integer between 1 and 20');
  }

  // Validate meatVegRatio
  if (typeof meatVegRatio !== 'number' || meatVegRatio < 0 || meatVegRatio > 1) {
    throw new Error('meatVegRatio must be a number between 0 and 1');
  }
}

function isVegetarian(recipe) {
  return String(recipe.protein) === 'Vegetarian';
}

function compareRecipes(a, b) {
  // null lastPlannedAt is treated as "very old" (higher priority)
  const aLast = a.lastPlannedAt ? new Date(a.lastPlannedAt).getTime() : 0;
  const bLast = b.lastPlannedAt ? new Date(b.lastPlannedAt).getTime() : 0;

  if (aLast !== bLast) return aLast - bLast; // older first

  // Alphabetical by name
  const aName = String(a.name || '');
  const bName = String(b.name || '');
  const nameCmp = aName.localeCompare(bName);
  if (nameCmp !== 0) return nameCmp;

  // Final tie-break: by id
  const aId = String(a._id || a.id || '');
  const bId = String(b._id || b.id || '');
  return aId.localeCompare(bId);
}

/**
 * Generate a meal plan.
 * @param {Object} input
 * @param {Array} input.recipes - array of recipe objects
 * @param {string} input.startDate - YYYY-MM-DD format, today or future
 * @param {number} input.days - 1-31
 * @param {number} input.peopleCount - 1-20
 * @param {number} input.meatVegRatio - 0-1
 * @param {boolean} input.allowLeftovers - when true, alternates fresh and leftover entries (F, L, F, L, ...)
 * @returns {Object} { entries, warnings }
 */
function generateMealPlan(input) {
  const {
    recipes = [],
    startDate,
    days,
    peopleCount,
    meatVegRatio,
    allowLeftovers = false,
  } = input;

  // Validate
  validateInputs(startDate, days, peopleCount, meatVegRatio);

  // Filter and prepare recipes
  const eligible = (Array.isArray(recipes) ? recipes : [])
    .filter((r) => {
      if (!r) return false;
      const hasId = r._id != null || r.id != null;
      if (!hasId) return false;
      if (typeof r.name !== 'string' || r.name.trim() === '') return false;
      if (r.protein == null) return false;
      return true;
    })
    .map((r) => ({ ...r })); // shallow copy to never mutate inputs

  const warnings = [];

  if (eligible.length === 0) {
    return {
      entries: [],
      warnings: ['No recipes available to generate a plan.'],
    };
  }

  // Classify and sort
  const sorted = eligible.slice().sort(compareRecipes);
  const meatRecipes = sorted.filter((r) => !isVegetarian(r));
  const vegRecipes = sorted.filter(isVegetarian);
  const allRecipes = sorted;

  // Track state
  const entries = [];
  const usedRecipeIds = new Set();
  let meatCount = 0;
  let vegCount = 0;
  let lastChosenId = null;
  let repetitionOccurred = false;
  let ratioWarningNeeded = false;
  let wantMeat = false; // track for warning message

  // Determine how many fresh-cook days we will have based on the
  // leftover policy. When leftovers are enabled, the pattern is strictly
  // alternating: fresh, leftover, fresh, leftover, ... which naturally
  // results in ceil(n/2) fresh days and floor(n/2) leftover days.
  //
  // Meat/veg ratio is calculated based on fresh days only.
  function computeFreshDays(totalDays) {
    return Math.ceil(totalDays / 2);
  }

  const freshDaysTarget = allowLeftovers ? computeFreshDays(days) : days;
  const targetMeatCount = Math.round(freshDaysTarget * meatVegRatio);

  // Generate entries day by day using alternating pattern when leftovers enabled.
  // Pattern with leftovers: fresh, leftover, fresh, leftover, ...
  // Pattern without leftovers: fresh, fresh, fresh, ...
  const startDateObj = new Date(`${startDate}T12:00:00`);
  let lastFreshRecipeId = null;

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(currentDate.getDate() + dayIndex);
    const dateStr = toISODate(currentDate);

    // Determine if this day should be a leftover or fresh.
    // With leftovers enabled, odd-indexed days (1, 3, 5, ...) are leftovers.
    const isLeftoverSlot = allowLeftovers && dayIndex % 2 === 1;

    if (isLeftoverSlot) {
      // Insert a leftover entry referencing the previous fresh entry
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && lastEntry.type === 'fresh' && lastFreshRecipeId) {
        entries.push({
          date: dateStr,
          type: 'leftover',
          recipeId: lastFreshRecipeId,
          leftoverOfRecipeId: lastFreshRecipeId,
          title: `Leftovers: ${lastEntry.title}`,
          protein: lastEntry.protein,
        });
      }
      continue;
    }

    // Place a fresh-cook entry
    // Determine if we want meat or veg today (only count fresh days)
    wantMeat = meatCount < targetMeatCount;

    // Pick appropriate pool
    let pool = wantMeat ? meatRecipes : vegRecipes;

    if (pool.length === 0) {
      // Not enough of this category; fall back to all recipes
      ratioWarningNeeded = true;
      pool = allRecipes;
    }

    // Pick the best recipe from the pool
    let chosen = null;

    // First pass: find an unused recipe that isn't yesterday's
    for (const recipe of pool) {
      const recipeId = String(recipe._id || recipe.id);
      if (usedRecipeIds.has(recipeId)) continue;
      if (lastChosenId && recipeId === String(lastChosenId)) continue;
      chosen = recipe;
      break;
    }

    // Second pass: allow yesterday's recipe if necessary but avoid already used
    if (!chosen) {
      for (const recipe of pool) {
        const recipeId = String(recipe._id || recipe.id);
        if (usedRecipeIds.has(recipeId)) continue;
        chosen = recipe;
        break;
      }
    }

    // Third pass: allow any recipe from pool (repetition will occur)
    if (!chosen && pool.length > 0) {
      chosen = pool[0];
      repetitionOccurred = true;
    }

    // Fallback: use any recipe from eligible list
    if (!chosen && eligible.length > 0) {
      chosen = eligible[0];
      repetitionOccurred = true;
    }

    if (!chosen) {
      // This shouldn't happen if we filtered eligible correctly
      throw new Error('Internal error: no recipe available');
    }

    const recipeId = String(chosen._id || chosen.id);
    lastChosenId = recipeId;
    lastFreshRecipeId = recipeId;
    usedRecipeIds.add(recipeId);

    // Track meat/veg counts for fresh entries only
    if (isVegetarian(chosen)) {
      vegCount += 1;
    } else {
      meatCount += 1;
    }

    // Add entry
    entries.push({
      date: dateStr,
      type: 'fresh',
      recipeId,
      title: chosen.name || '',
      protein: chosen.protein,
    });
  }

  // Warn if ratio couldn't be met
  if (ratioWarningNeeded) {
    const needed = wantMeat ? 'meat' : 'vegetarian';
    warnings.push(`Not enough ${needed} recipes to satisfy requested ratio exactly.`);
  }

  // Additional warnings based on fresh-day targets
  if (repetitionOccurred) {
    if (
      meatRecipes.length === 1 &&
      targetMeatCount > meatRecipes.length
    ) {
      warnings.push('Not enough meat recipes to satisfy requested ratio exactly.');
    } else if (
      vegRecipes.length === 1 &&
      targetMeatCount < freshDaysTarget &&
      freshDaysTarget - targetMeatCount > vegRecipes.length
    ) {
      warnings.push('Not enough vegetarian recipes to satisfy requested ratio exactly.');
    }
  }

  // Warn if repetition occurred
  const totalFreshPlanned = meatCount + vegCount;
  if (
    repetitionOccurred &&
    usedRecipeIds.size < totalFreshPlanned
  ) {
    warnings.push('Plan contains repeated recipes due to limited available recipes.');
  }


  return {
    entries,
    warnings,
  };
}

module.exports = generateMealPlan;
