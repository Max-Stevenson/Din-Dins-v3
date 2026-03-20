import assert from "assert";
import { filterRecipes } from "./recipeFilters.js";

const recipes = [
  { _id: "1", name: "Chicken Curry", protein: "Chicken" },
  { _id: "2", name: "beef tacos", protein: " beef " },
  { _id: "3", name: "Veggie Pasta", protein: "Vegetarian" },
];

(function testSearchFilterMatchesNameCaseInsensitively() {
  const out = filterRecipes(recipes, { query: "TACOS", protein: "All" });
  assert.deepStrictEqual(
    out.map((recipe) => recipe._id),
    ["2"],
  );
  console.log("testSearchFilterMatchesNameCaseInsensitively ok");
})();

(function testProteinFilterIgnoresCaseAndWhitespace() {
  const out = filterRecipes(recipes, { protein: "Beef" });
  assert.deepStrictEqual(
    out.map((recipe) => recipe._id),
    ["2"],
  );
  console.log("testProteinFilterIgnoresCaseAndWhitespace ok");
})();

(function testCombinedFiltersStillIntersectCorrectly() {
  const out = filterRecipes(recipes, {
    query: "veg",
    protein: "vegetarian",
  });
  assert.deepStrictEqual(
    out.map((recipe) => recipe._id),
    ["3"],
  );
  console.log("testCombinedFiltersStillIntersectCorrectly ok");
})();

(function testAllProteinLeavesSearchOnlyBehavior() {
  const out = filterRecipes(recipes, { query: "", protein: "All" });
  assert.strictEqual(out.length, 3);
  console.log("testAllProteinLeavesSearchOnlyBehavior ok");
})();

console.log("all recipe filter tests passed");
