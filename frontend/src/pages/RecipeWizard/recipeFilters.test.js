import assert from "assert";
import {
  filterRecipes,
  paginateRecipes,
  RECIPES_PAGE_SIZE,
} from "./recipeFilters.js";

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

(function testPaginateRecipesReturnsFirstPageByDefault() {
  const out = paginateRecipes(
    Array.from({ length: 8 }, (_, index) => ({ _id: `${index + 1}` })),
    1,
  );
  assert.strictEqual(out.pageSize, RECIPES_PAGE_SIZE);
  assert.strictEqual(out.totalPages, 2);
  assert.deepStrictEqual(
    out.items.map((recipe) => recipe._id),
    ["1", "2", "3", "4", "5", "6"],
  );
  console.log("testPaginateRecipesReturnsFirstPageByDefault ok");
})();

(function testPaginateRecipesReturnsLaterPageSlice() {
  const out = paginateRecipes(
    Array.from({ length: 8 }, (_, index) => ({ _id: `${index + 1}` })),
    2,
  );
  assert.deepStrictEqual(
    out.items.map((recipe) => recipe._id),
    ["7", "8"],
  );
  console.log("testPaginateRecipesReturnsLaterPageSlice ok");
})();

(function testPaginateRecipesClampsInvalidPage() {
  const out = paginateRecipes(
    Array.from({ length: 2 }, (_, index) => ({ _id: `${index + 1}` })),
    99,
  );
  assert.strictEqual(out.currentPage, 1);
  assert.deepStrictEqual(
    out.items.map((recipe) => recipe._id),
    ["1", "2"],
  );
  console.log("testPaginateRecipesClampsInvalidPage ok");
})();

console.log("all recipe filter tests passed");
