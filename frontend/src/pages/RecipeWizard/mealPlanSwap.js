import {
  findSourceCookIndex,
  isFreshEntry,
  isLeftoverEntry,
  isLeftoverLinkedToCook,
} from "../../lib/mealPlanEntries.js";

/**
 * Perform a swap on a plan's dinners array.
 *
 * Rules (MVP):
 * 1. Swapping a fresh entry updates that fresh entry and all linked leftovers.
 * 2. Swapping a leftover swaps its source fresh entry (and all linked leftovers).
 * 3. If a source cook cannot be resolved, only the targeted leftover is updated.
 * 4. Array length/order is preserved.
 */
export function swapDinners(dinners, index, recipe) {
  if (!Array.isArray(dinners)) return dinners;
  if (index < 0 || index >= dinners.length) return dinners;

  const result = dinners.slice();
  const target = result[index];
  if (!target) return result;

  const makeCook = (orig) => ({
    ...orig,
    type: "fresh",
    recipeId: recipe._id,
    title: recipe.name,
    protein: recipe.protein,
  });

  const makeLeftover = (orig, sourceCookEntryId) => ({
    ...orig,
    type: "leftover",
    recipeId: recipe._id,
    sourceCookEntryId:
      sourceCookEntryId || orig.sourceCookEntryId || orig.leftoverOfEntryId,
    leftoverOfEntryId:
      sourceCookEntryId || orig.sourceCookEntryId || orig.leftoverOfEntryId,
    leftoverOfRecipeId: recipe._id,
    title: `Leftovers: ${recipe.name}`,
    protein: recipe.protein,
  });

  const applyCookSwap = (cookIndex) => {
    const cook = result[cookIndex];
    if (!isFreshEntry(cook)) return;

    const oldCookRecipeId = cook.recipeId;
    const cookEntryId = cook.entryId;
    result[cookIndex] = makeCook(cook);

    for (let i = 0; i < result.length; i += 1) {
      if (i === cookIndex) continue;
      const entry = result[i];
      if (!isLeftoverLinkedToCook(entry, cookEntryId, oldCookRecipeId)) continue;
      result[i] = makeLeftover(entry, cookEntryId);
    }
  };

  if (isLeftoverEntry(target)) {
    const sourceCookIndex = findSourceCookIndex(result, target, index);
    if (sourceCookIndex >= 0) {
      applyCookSwap(sourceCookIndex);
    } else {
      result[index] = makeLeftover(
        target,
        target.sourceCookEntryId || target.leftoverOfEntryId
      );
    }
    return result;
  }

  applyCookSwap(index);
  return result;
}
