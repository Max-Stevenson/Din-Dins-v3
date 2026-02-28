// simple smoke tests for swapDinners helper. there isn't a formal test
// framework configuration in this repo, but this script can be executed with
// `node` or wired up later.  The intent is to capture the required scenarios
// from the specification so the logic can be reviewed and verified.

import assert from "assert";
import { swapDinners } from "./mealPlanSwap.js";

function makeEntry({date, type = "cook", recipeId = "r1", title = "foo", protein = "beef", leftoverOfRecipeId}) {
  const e = { date, type, recipeId, title, protein };
  if (leftoverOfRecipeId) e.leftoverOfRecipeId = leftoverOfRecipeId;
  return e;
}

const helper = swapDinners;

// recipes used for testing
const lunch = { _id: "r2", name: "Lunch", protein: "chicken" };
const dinner = { _id: "r3", name: "Dinner", protein: "fish" };

// 1. swapping day0 fresh in a fresh+leftover pair updates both
(function testFreshWithLeftover() {
  const plan = [
    makeEntry({ date: "2026-01-01", recipeId: "r1" }),
    makeEntry({ date: "2026-01-02", type: "leftovers", leftoverOfRecipeId: "r1", title: "Leftovers: Breakfast" }),
    makeEntry({ date: "2026-01-03", recipeId: "r2" }),
  ];
  const out = helper(plan, 0, lunch);
  assert.strictEqual(out.length, plan.length, "length preserved");
  assert.strictEqual(out[0].recipeId, "r2");
  assert.strictEqual(out[1].leftoverOfRecipeId, "r2");
  assert.ok(out[1].title.startsWith("Leftovers"));
  console.log("testFreshWithLeftover ok");
})();

// 2. swapping standalone fresh only updates that day
(function testStandaloneFresh() {
  const plan = [
    makeEntry({ date: "2026-01-01", recipeId: "r1" }),
    makeEntry({ date: "2026-01-02", recipeId: "r2" }),
  ];
  const out = helper(plan, 0, dinner);
  assert.strictEqual(out[0].recipeId, "r3");
  assert.strictEqual(out[1].recipeId, "r2");
  console.log("testStandaloneFresh ok");
})();

// 3. swapping a leftover updates both the leftover and its source
(function testSwapLeftover() {
  const plan = [
    makeEntry({ date: "2026-01-01", recipeId: "r1" }),
    makeEntry({ date: "2026-01-02", type: "leftovers", leftoverOfRecipeId: "r1", title: "Leftovers: Breakfast" }),
  ];
  const out = helper(plan, 1, lunch);
  assert.strictEqual(out[0].recipeId, "r2");
  assert.strictEqual(out[1].leftoverOfRecipeId, "r2");
  console.log("testSwapLeftover ok");
})();

// 4. swapping a mixed pair doesn't touch rest of plan
(function testNoRebalance() {
  const plan = [
    makeEntry({ date: "2026-01-01", recipeId: "r1" }),
    makeEntry({ date: "2026-01-02", type: "leftovers", leftoverOfRecipeId: "r1", title: "Leftovers: Breakfast" }),
    makeEntry({ date: "2026-01-03", recipeId: "r2" }),
    makeEntry({ date: "2026-01-04", recipeId: "r3" }),
  ];
  const out = helper(plan, 0, dinner);
  assert.strictEqual(out[2].recipeId, "r2");
  assert.strictEqual(out[3].recipeId, "r3");
  console.log("testNoRebalance ok");
})();

console.log("all helper tests passed");
