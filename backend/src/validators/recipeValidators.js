const CANONICAL_PROTEINS = Object.freeze([
  "Chicken",
  "Beef",
  "Fish",
  "Pork",
  "Turkey",
  "Vegetarian",
  "Other",
]);

const PROTEIN_LOOKUP = new Map(
  CANONICAL_PROTEINS.map((value) => [value.toLowerCase(), value]),
);

PROTEIN_LOOKUP.set("veg", "Vegetarian");
PROTEIN_LOOKUP.set("veggie", "Vegetarian");

function normalizeProteinValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return PROTEIN_LOOKUP.get(raw.toLowerCase()) || raw;
}

function isCanonicalProtein(value) {
  return CANONICAL_PROTEINS.includes(value);
}

function parseCookTimeMinutes(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const match = raw.match(/^(\d+)(?:\s*(?:m|min|mins|minute|minutes))?$/i);
  if (!match) return null;

  const minutes = Number.parseInt(match[1], 10);
  if (!Number.isFinite(minutes) || minutes < 1) return null;

  return minutes;
}

function formatCookTime(minutes) {
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function normalizeCookTimeValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const minutes = parseCookTimeMinutes(raw);
  return minutes == null ? raw : formatCookTime(minutes);
}

function isValidCookTimeValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return true;
  return parseCookTimeMinutes(raw) != null;
}

function cleanIngredients(ingredients) {
  return (ingredients || [])
    .filter((ingredient) => ingredient?.name && String(ingredient.name).trim())
    .map((ingredient) => ({
      quantity: String(ingredient.quantity ?? "").trim(),
      unit: String(ingredient.unit ?? "").trim(),
      name: String(ingredient.name).trim(),
    }));
}

function cleanMethod(method) {
  return (method || [])
    .filter((step) => step?.text && String(step.text).trim())
    .map((step) => ({ text: String(step.text).trim() }));
}

function cleanTags(tags) {
  return Array.isArray(tags)
    ? tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
}

function validateAndNormalizeRecipePayload(body) {
  const {
    name,
    protein,
    portions,
    cookTime = "",
    tags = [],
    ingredients = [],
    method = [],
    imageUrl = "",
    imagePublicId = "",
  } = body ?? {};

  const normalizedName = String(name ?? "").trim();
  if (!normalizedName) {
    return { error: "Name is required" };
  }

  const normalizedProtein = normalizeProteinValue(protein);
  if (!isCanonicalProtein(normalizedProtein)) {
    return {
      error: `Protein must be one of: ${CANONICAL_PROTEINS.join(", ")}`,
    };
  }

  if (!Number.isFinite(portions) || portions < 1) {
    return { error: "Portions must be >= 1" };
  }

  const normalizedCookTime = normalizeCookTimeValue(cookTime);
  if (!isValidCookTimeValue(cookTime)) {
    return { error: "Cook time must be a positive whole number of minutes" };
  }

  return {
    value: {
      name: normalizedName,
      protein: normalizedProtein,
      portions,
      cookTime: normalizedCookTime,
      tags: cleanTags(tags),
      ingredients: cleanIngredients(ingredients),
      method: cleanMethod(method),
      imageUrl: String(imageUrl ?? "").trim(),
      imagePublicId: String(imagePublicId ?? "").trim(),
    },
  };
}

module.exports = {
  CANONICAL_PROTEINS,
  cleanIngredients,
  cleanMethod,
  cleanTags,
  formatCookTime,
  isCanonicalProtein,
  isValidCookTimeValue,
  normalizeCookTimeValue,
  normalizeProteinValue,
  parseCookTimeMinutes,
  validateAndNormalizeRecipePayload,
};
