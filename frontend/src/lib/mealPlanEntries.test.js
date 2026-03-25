import assert from "assert";
import {
  applyLeftoverSlots,
  enforceLeftoverOrder,
  normalizePlannerEntries,
} from "./mealPlanEntries.js";

function makeFresh(entryId, recipeId, title) {
  return {
    entryId,
    type: "fresh",
    recipeId,
    title,
    protein: "beef",
    leftoverSlots: 0,
  };
}

function makeLeftover(entryId, recipeId, sourceCookEntryId, title = "Leftovers") {
  return {
    entryId,
    type: "leftover",
    recipeId,
    leftoverOfRecipeId: recipeId,
    sourceCookEntryId,
    leftoverOfEntryId: sourceCookEntryId,
    title,
    protein: "beef",
  };
}

(function testApplyLeftoverSlotsAddsTwoLinkedEntries() {
  const plan = [makeFresh("cook-1", "r1", "Chili"), makeFresh("cook-2", "r2", "Pasta")];
  const out = normalizePlannerEntries(applyLeftoverSlots(plan, "cook-1", 2));

  assert.strictEqual(out.length, 4);
  assert.strictEqual(out[0].entryId, "cook-1");
  assert.strictEqual(out[1].type, "leftover");
  assert.strictEqual(out[2].type, "leftover");
  assert.strictEqual(out[1].sourceCookEntryId, "cook-1");
  assert.strictEqual(out[2].sourceCookEntryId, "cook-1");
  assert.strictEqual(out[0].leftoverSlots, 2);
  console.log("testApplyLeftoverSlotsAddsTwoLinkedEntries ok");
})();

(function testApplyLeftoverSlotsRemovesLatestLinkedLeftoverFirst() {
  const plan = normalizePlannerEntries([
    makeFresh("cook-1", "r1", "Chili"),
    makeLeftover("leftover-1", "r1", "cook-1", "Leftovers: Chili"),
    makeFresh("cook-2", "r2", "Pasta"),
    makeLeftover("leftover-2", "r1", "cook-1", "Leftovers: Chili"),
  ]);

  const out = normalizePlannerEntries(applyLeftoverSlots(plan, "cook-1", 1));

  assert.strictEqual(out.length, 3);
  assert.strictEqual(out[1].entryId, "leftover-1");
  assert.strictEqual(out.find((entry) => entry.entryId === "leftover-2"), undefined);
  assert.strictEqual(out[0].leftoverSlots, 1);
  console.log("testApplyLeftoverSlotsRemovesLatestLinkedLeftoverFirst ok");
})();

(function testEnforceLeftoverOrderMovesInvalidLeftoverBehindCook() {
  const plan = [
    makeLeftover("leftover-1", "r1", "cook-1", "Leftovers: Chili"),
    makeFresh("cook-1", "r1", "Chili"),
    makeFresh("cook-2", "r2", "Pasta"),
  ];

  const out = normalizePlannerEntries(enforceLeftoverOrder(plan));

  assert.strictEqual(out[0].entryId, "cook-1");
  assert.strictEqual(out[1].entryId, "leftover-1");
  assert.strictEqual(out[2].entryId, "cook-2");
  assert.strictEqual(out[0].leftoverSlots, 1);
  console.log("testEnforceLeftoverOrderMovesInvalidLeftoverBehindCook ok");
})();

console.log("all meal plan entry helper tests passed");
