const { randomUUID } = require("node:crypto");

function createEntryId(index = 0) {
  return `entry-${index}-${randomUUID()}`;
}

function toCanonicalEntryType(value) {
  const type = String(value || "").toLowerCase();
  if (type === "leftover" || type === "leftovers") return "leftover";
  return "fresh";
}

function toLegacyDinnerType(value) {
  return toCanonicalEntryType(value) === "leftover" ? "leftovers" : "cook";
}

function clampLeftoverSlots(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(2, parsed));
}

function isFreshDinner(entry) {
  return toCanonicalEntryType(entry?.entryType || entry?.type) === "fresh";
}

function isLeftoverDinner(entry) {
  return toCanonicalEntryType(entry?.entryType || entry?.type) === "leftover";
}

function normalizeDinnerEntry(entry, index = 0) {
  const entryType = toCanonicalEntryType(entry?.entryType || entry?.type);
  const legacyType = toLegacyDinnerType(entryType);
  const normalized = {
    entryId: entry?.entryId || createEntryId(index),
    date: entry?.date || "",
    type: legacyType,
    entryType,
    legacyType,
    recipeId: entry?.recipeId || null,
    title: entry?.title || "",
    protein: entry?.protein || "",
  };

  if (entryType === "leftover") {
    const sourceCookEntryId =
      entry?.sourceCookEntryId || entry?.leftoverOfEntryId || null;

    return {
      ...normalized,
      leftoverOfRecipeId: entry?.leftoverOfRecipeId || entry?.recipeId || null,
      sourceCookEntryId,
      leftoverOfEntryId: sourceCookEntryId,
    };
  }

  return {
    ...normalized,
    leftoverSlots: clampLeftoverSlots(entry?.leftoverSlots),
  };
}

function findSourceCookEntryId(dinners, leftover, maxIndex = dinners.length - 1) {
  const sourceCookEntryId =
    leftover?.sourceCookEntryId || leftover?.leftoverOfEntryId || null;

  if (sourceCookEntryId) return sourceCookEntryId;

  const sourceRecipeId = leftover?.leftoverOfRecipeId || leftover?.recipeId;
  if (!sourceRecipeId) return null;

  for (let i = Math.min(maxIndex, dinners.length - 1); i >= 0; i -= 1) {
    const candidate = dinners[i];
    if (!isFreshDinner(candidate)) continue;
    if (String(candidate.recipeId || "") !== String(sourceRecipeId)) continue;
    return candidate.entryId || null;
  }

  return null;
}

function syncSourceCookLinks(dinners) {
  return dinners.map((entry, index, allEntries) => {
    if (!isLeftoverDinner(entry)) return entry;

    const sourceCookEntryId = findSourceCookEntryId(allEntries, entry, index - 1);
    if (!sourceCookEntryId) return entry;

    return {
      ...entry,
      sourceCookEntryId,
      leftoverOfEntryId: sourceCookEntryId,
    };
  });
}

function syncFreshLeftoverSlots(dinners) {
  return dinners.map((entry) => {
    if (!isFreshDinner(entry)) return entry;

    const leftoverSlots = dinners.filter((candidate) => {
      if (!isLeftoverDinner(candidate)) return false;

      const sourceCookEntryId =
        candidate.sourceCookEntryId || candidate.leftoverOfEntryId || null;
      const fallbackRecipeId =
        candidate.leftoverOfRecipeId || candidate.recipeId || null;

      if (sourceCookEntryId) {
        return String(sourceCookEntryId || "") === String(entry.entryId || "");
      }

      return String(fallbackRecipeId || "") === String(entry.recipeId || "");
    }).length;

    return {
      ...entry,
      leftoverSlots: clampLeftoverSlots(leftoverSlots),
    };
  });
}

function normalizeDinners(dinners) {
  const normalized = (Array.isArray(dinners) ? dinners : []).map((entry, index) =>
    normalizeDinnerEntry(entry, index)
  );
  const linked = syncSourceCookLinks(normalized);

  return syncFreshLeftoverSlots(linked);
}

function serializeMealPlan(plan) {
  if (!plan) return plan;

  const item = typeof plan.toObject === "function" ? plan.toObject() : { ...plan };
  const dinners = normalizeDinners(item.dinners);

  return {
    ...item,
    days: dinners.length || item.days,
    dinners,
  };
}

module.exports = {
  createEntryId,
  isFreshDinner,
  isLeftoverDinner,
  normalizeDinnerEntry,
  normalizeDinners,
  serializeMealPlan,
  toCanonicalEntryType,
  toLegacyDinnerType,
};
