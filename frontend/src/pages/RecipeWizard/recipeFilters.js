function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export const RECIPES_PAGE_SIZE = 6;

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

export function paginateRecipes(recipes, currentPage, pageSize = RECIPES_PAGE_SIZE) {
  const safePageSize = Math.max(1, Number(pageSize) || RECIPES_PAGE_SIZE);
  const totalItems = Array.isArray(recipes) ? recipes.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safeCurrentPage = Math.min(
    Math.max(1, Number(currentPage) || 1),
    totalPages,
  );
  const startIndex = (safeCurrentPage - 1) * safePageSize;

  return {
    pageSize: safePageSize,
    currentPage: safeCurrentPage,
    totalPages,
    items: (Array.isArray(recipes) ? recipes : []).slice(
      startIndex,
      startIndex + safePageSize,
    ),
  };
}
