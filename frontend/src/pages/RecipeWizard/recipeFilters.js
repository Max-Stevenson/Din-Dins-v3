function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function filterRecipes(recipes, { query = "", protein = "All" } = {}) {
  const normalizedQuery = normalizeText(query);
  const normalizedProtein = normalizeText(protein);

  return (Array.isArray(recipes) ? recipes : []).filter((recipe) => {
    const recipeProtein = normalizeText(recipe?.protein);
    const recipeName = normalizeText(recipe?.name);

    if (
      normalizedProtein &&
      normalizedProtein !== "all" &&
      recipeProtein !== normalizedProtein
    ) {
      return false;
    }

    if (normalizedQuery && !recipeName.includes(normalizedQuery)) {
      return false;
    }

    return true;
  });
}
