function isLeftoverLinkedToCook(leftover, cookEntryId, fallbackCookRecipeId) {
  if (!leftover || leftover.type !== "leftovers") return false;

  if (leftover.leftoverOfEntryId && cookEntryId) {
    return String(leftover.leftoverOfEntryId) === String(cookEntryId);
  }

  const linkedRecipeId = leftover.leftoverOfRecipeId || leftover.recipeId;
  return String(linkedRecipeId || "") === String(fallbackCookRecipeId || "");
}

function findSourceCookIndex(entries, leftoverIndex) {
  const leftover = entries[leftoverIndex];
  if (!leftover || leftover.type !== "leftovers") return -1;

  if (leftover.leftoverOfEntryId) {
    const byEntryId = entries.findIndex(
      (e) =>
        e.type === "cook" &&
        String(e.entryId || "") === String(leftover.leftoverOfEntryId)
    );
    if (byEntryId >= 0) return byEntryId;
  }

  const sourceRecipeId = leftover.leftoverOfRecipeId || leftover.recipeId;
  if (!sourceRecipeId) return -1;

  for (let i = leftoverIndex - 1; i >= 0; i -= 1) {
    if (
      entries[i]?.type === "cook" &&
      String(entries[i].recipeId || "") === String(sourceRecipeId)
    ) {
      return i;
    }
  }

  return entries.findIndex(
    (e) =>
      e.type === "cook" && String(e.recipeId || "") === String(sourceRecipeId)
  );
}

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
    type: "cook",
    recipeId: recipe._id,
    title: recipe.name,
    protein: recipe.protein,
  });

  const makeLeftover = (orig, sourceCookEntryId) => ({
    ...orig,
    type: "leftovers",
    leftoverOfEntryId: sourceCookEntryId || orig.leftoverOfEntryId,
    leftoverOfRecipeId: recipe._id,
    title: `Leftovers: ${recipe.name}`,
    protein: recipe.protein,
  });

  const applyCookSwap = (cookIndex) => {
    const cook = result[cookIndex];
    if (!cook || cook.type !== "cook") return;

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

  if (target.type === "leftovers") {
    const sourceCookIndex = findSourceCookIndex(result, index);
    if (sourceCookIndex >= 0) {
      applyCookSwap(sourceCookIndex);
    } else {
      result[index] = makeLeftover(target, target.leftoverOfEntryId);
    }
    return result;
  }

  applyCookSwap(index);
  return result;
}
