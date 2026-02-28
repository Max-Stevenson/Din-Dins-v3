// helper for provisional meal-plan swaps, encapsulating all the leftover/fresh pairing
// rules described in the project spec. exported so that it can be manually
// exercised or unit‑tested later.

/**
 * Perform a swap on a plan's dinners array.
 *
 * The function is pure and does **not** mutate the input array.  It returns a
 * new array of the same length with the requested replacements applied.  The
 * original objects within the array are shallow‑cloned only when they need to
 * be changed.
 *
 * Rules (MVP):
 *   1. Swapping a fresh entry that is immediately followed by a linked
 *      leftover updates both entries (fresh then leftover) to match the
 *      replacement recipe.  The leftover entry keeps the same slot and the
 *      title is kept prefixed with `Leftovers: `.
 *   2. Swapping a fresh entry with no linked leftover only updates that one
 *      slot.
 *   3. Swapping a leftover entry treats the operation as swapping its source
 *      fresh+leftover pair; the preceding entry (if `type === "cook"`) is
 *      updated alongside the leftover.  If there is no preceding fresh, only
 *      the leftover is replaced.
 *   4. Nothing else in the plan is modified; the array length is preserved.
 *
 * @param {Array} dinners  plan entry objects (date, type, recipeId, title, ...)
 * @param {number} index   index of the entry the user elected to swap
 * @param {Object} recipe  replacement recipe object ({_id,name,protein,...})
 * @returns {Array} new dinners array
 */
export function swapDinners(dinners, index, recipe) {
  if (!Array.isArray(dinners)) return dinners;
  const len = dinners.length;
  if (index < 0 || index >= len) return dinners;

  // helper factories that copy an entry but override the relevant fields
  const makeCook = (orig) => ({
    ...orig,
    date: orig.date,
    type: "cook",
    recipeId: recipe._id,
    title: recipe.name,
    protein: recipe.protein,
  });

  const makeLeftover = (orig) => ({
    ...orig,
    date: orig.date,
    type: "leftovers",
    leftoverOfRecipeId: recipe._id,
    title: `Leftovers: ${recipe.name}`,
    protein: recipe.protein,
  });

  const result = dinners.slice(); // shallow copy of the array
  const target = result[index];
  if (!target) return result; // defensive

  if (target.type === "leftovers") {
    // swap pair by updating previous fresh entry if appropriate
    const prev = result[index - 1];
    if (prev && prev.type === "cook") {
      result[index - 1] = makeCook(prev);
      result[index] = makeLeftover(target);
    } else {
      // fall back to replacing only the leftover itself
      result[index] = makeLeftover(target);
    }
  } else {
    // fresh/cook entry
    const next = result[index + 1];
    if (
      next &&
      next.type === "leftovers" &&
      next.leftoverOfRecipeId === target.recipeId
    ) {
      // linked pair: update both slots
      result[index] = makeCook(target);
      result[index + 1] = makeLeftover(next);
    } else {
      // standalone fresh day
      result[index] = makeCook(target);
    }
  }

  return result;
}
