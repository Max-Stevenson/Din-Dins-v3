import assert from "assert";
import { swapDinners } from "./mealPlanSwap.js";

function makeEntry({
  entryId,
  date,
  type = "cook",
  recipeId = "r1",
  title = "Foo",
  protein = "beef",
  leftoverOfRecipeId,
  leftoverOfEntryId,
}) {
  const e = { entryId, date, type, recipeId, title, protein };
  if (leftoverOfRecipeId) e.leftoverOfRecipeId = leftoverOfRecipeId;
  if (leftoverOfEntryId) e.leftoverOfEntryId = leftoverOfEntryId;
  return e;
}

const lunch = { _id: "r2", name: "Lunch", protein: "chicken" };
const dinner = { _id: "r3", name: "Dinner", protein: "fish" };

(function testFreshWithMultipleLinkedLeftovers() {
  const plan = [
    makeEntry({ entryId: "c1", date: "2026-01-01", recipeId: "r1" }),
    makeEntry({
      entryId: "l1",
      date: "2026-01-02",
      type: "leftovers",
      leftoverOfRecipeId: "r1",
      leftoverOfEntryId: "c1",
      title: "Leftovers: Breakfast",
    }),
    makeEntry({ entryId: "c2", date: "2026-01-03", recipeId: "r9" }),
    makeEntry({
      entryId: "l2",
      date: "2026-01-04",
      type: "leftovers",
      leftoverOfRecipeId: "r1",
      leftoverOfEntryId: "c1",
      title: "Leftovers: Breakfast",
    }),
  ];

  const out = swapDinners(plan, 0, lunch);

  assert.strictEqual(out[0].recipeId, "r2");
  assert.strictEqual(out[1].leftoverOfRecipeId, "r2");
  assert.strictEqual(out[3].leftoverOfRecipeId, "r2");
  assert.strictEqual(out[1].leftoverOfEntryId, "c1");
  assert.strictEqual(out[3].leftoverOfEntryId, "c1");
  console.log("testFreshWithMultipleLinkedLeftovers ok");
})();

(function testSwapLeftoverUsesSourceFresh() {
  const plan = [
    makeEntry({ entryId: "c1", date: "2026-01-01", recipeId: "r1" }),
    makeEntry({ entryId: "c2", date: "2026-01-02", recipeId: "r9" }),
    makeEntry({
      entryId: "l1",
      date: "2026-01-03",
      type: "leftovers",
      leftoverOfRecipeId: "r1",
      leftoverOfEntryId: "c1",
      title: "Leftovers: Breakfast",
    }),
  ];

  const out = swapDinners(plan, 2, dinner);

  assert.strictEqual(out[0].recipeId, "r3");
  assert.strictEqual(out[2].leftoverOfRecipeId, "r3");
  assert.strictEqual(out[2].leftoverOfEntryId, "c1");
  assert.strictEqual(out[1].recipeId, "r9");
  console.log("testSwapLeftoverUsesSourceFresh ok");
})();

(function testStandaloneFresh() {
  const plan = [
    makeEntry({ entryId: "c1", date: "2026-01-01", recipeId: "r1" }),
    makeEntry({ entryId: "c2", date: "2026-01-02", recipeId: "r2" }),
  ];

  const out = swapDinners(plan, 0, dinner);

  assert.strictEqual(out[0].recipeId, "r3");
  assert.strictEqual(out[1].recipeId, "r2");
  console.log("testStandaloneFresh ok");
})();

console.log("all helper tests passed");
