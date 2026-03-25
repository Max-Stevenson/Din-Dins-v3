function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export function createEntryId(index = 0) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `entry-${Date.now()}-${index}-${randomSuffix()}`;
}

export function isFreshEntry(entry) {
  const type = String(entry?.type || entry?.entryType || "").toLowerCase();
  return type === "fresh" || type === "cook";
}

export function isLeftoverEntry(entry) {
  const type = String(entry?.type || entry?.entryType || "").toLowerCase();
  return type === "leftover" || type === "leftovers";
}

export function clampLeftoverSlots(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(2, parsed));
}

function normalizeFreshEntry(entry, index) {
  return {
    ...entry,
    entryId: entry.entryId || createEntryId(index),
    type: "fresh",
    leftoverSlots: clampLeftoverSlots(entry.leftoverSlots),
  };
}

function normalizeLeftoverEntry(entry, index) {
  const sourceCookEntryId =
    entry.sourceCookEntryId || entry.leftoverOfEntryId || null;

  return {
    ...entry,
    entryId: entry.entryId || createEntryId(index),
    type: "leftover",
    sourceCookEntryId,
    leftoverOfEntryId: sourceCookEntryId,
  };
}

export function isLeftoverLinkedToCook(leftover, cookEntryId, fallbackCookRecipeId) {
  if (!isLeftoverEntry(leftover)) return false;

  const sourceCookEntryId =
    leftover.sourceCookEntryId || leftover.leftoverOfEntryId || null;

  if (sourceCookEntryId && cookEntryId) {
    return String(sourceCookEntryId) === String(cookEntryId);
  }

  const linkedRecipeId = leftover.leftoverOfRecipeId || leftover.recipeId;
  return String(linkedRecipeId || "") === String(fallbackCookRecipeId || "");
}

export function findSourceCookIndex(entries, leftover, maxIndex = entries.length - 1) {
  if (!isLeftoverEntry(leftover)) return -1;

  const sourceCookEntryId =
    leftover.sourceCookEntryId || leftover.leftoverOfEntryId || null;

  if (sourceCookEntryId) {
    const byEntryId = entries.findIndex(
      (entry) =>
        isFreshEntry(entry) &&
        String(entry.entryId || "") === String(sourceCookEntryId)
    );
    if (byEntryId >= 0) return byEntryId;
  }

  const sourceRecipeId = leftover.leftoverOfRecipeId || leftover.recipeId;
  if (!sourceRecipeId) return -1;

  for (let i = Math.min(maxIndex, entries.length - 1); i >= 0; i -= 1) {
    const entry = entries[i];
    if (!isFreshEntry(entry)) continue;
    if (String(entry.recipeId || "") === String(sourceRecipeId)) return i;
  }

  return entries.findIndex(
    (entry) =>
      isFreshEntry(entry) &&
      String(entry.recipeId || "") === String(sourceRecipeId)
  );
}

function buildLeftoverEntry(sourceCook, indexSeed = 0) {
  return {
    entryId: createEntryId(indexSeed),
    type: "leftover",
    recipeId: sourceCook.recipeId || null,
    leftoverOfRecipeId: sourceCook.recipeId || null,
    title: `Leftovers: ${sourceCook.title || "Meal"}`,
    protein: sourceCook.protein || "",
    sourceCookEntryId: sourceCook.entryId,
    leftoverOfEntryId: sourceCook.entryId,
  };
}

function syncSourceCookLinks(entries) {
  return entries.map((entry, index, allEntries) => {
    if (!isLeftoverEntry(entry)) return entry;

    const existingSourceCookId =
      entry.sourceCookEntryId || entry.leftoverOfEntryId || null;

    if (existingSourceCookId) {
      const hasSource = allEntries.some(
        (candidate) =>
          isFreshEntry(candidate) &&
          String(candidate.entryId || "") === String(existingSourceCookId)
      );

      if (hasSource) {
        return {
          ...entry,
          sourceCookEntryId: existingSourceCookId,
          leftoverOfEntryId: existingSourceCookId,
        };
      }
    }

    const sourceIndex = findSourceCookIndex(allEntries, entry, index - 1);
    if (sourceIndex < 0) return entry;

    return {
      ...entry,
      sourceCookEntryId: allEntries[sourceIndex].entryId,
      leftoverOfEntryId: allEntries[sourceIndex].entryId,
    };
  });
}

export function enforceLeftoverOrder(entries) {
  const invalidLeftovers = [];
  const keptEntries = [];

  entries.forEach((entry, index) => {
    if (!isLeftoverEntry(entry)) {
      keptEntries.push(entry);
      return;
    }

    const sourceIndex = findSourceCookIndex(entries, entry, entries.length - 1);
    if (sourceIndex >= 0 && index <= sourceIndex) {
      invalidLeftovers.push(entry);
      return;
    }

    keptEntries.push(entry);
  });

  const insertedCountByCookId = new Map();

  invalidLeftovers.forEach((leftover) => {
    const sourceIndex = findSourceCookIndex(keptEntries, leftover, keptEntries.length - 1);
    if (sourceIndex < 0) {
      keptEntries.push(leftover);
      return;
    }

    const sourceCookEntryId =
      leftover.sourceCookEntryId || leftover.leftoverOfEntryId || "";
    const insertedCount = insertedCountByCookId.get(String(sourceCookEntryId)) || 0;
    keptEntries.splice(sourceIndex + 1 + insertedCount, 0, leftover);
    insertedCountByCookId.set(String(sourceCookEntryId), insertedCount + 1);
  });

  return keptEntries;
}

export function countLinkedLeftovers(entries, cookEntryId, fallbackCookRecipeId) {
  return entries.filter((entry) =>
    isLeftoverLinkedToCook(entry, cookEntryId, fallbackCookRecipeId)
  ).length;
}

export function normalizePlannerEntries(rawEntries) {
  const normalized = (Array.isArray(rawEntries) ? rawEntries : []).map((entry, index) =>
    isLeftoverEntry(entry)
      ? normalizeLeftoverEntry(entry, index)
      : normalizeFreshEntry(entry, index)
  );

  const withLinkedSources = syncSourceCookLinks(normalized);
  const ordered = enforceLeftoverOrder(withLinkedSources);

  return ordered.map((entry) => {
    if (!isFreshEntry(entry)) return entry;

    return {
      ...entry,
      leftoverSlots: countLinkedLeftovers(ordered, entry.entryId, entry.recipeId),
    };
  });
}

export function applyLeftoverSlots(entries, cookEntryId, requestedSlots) {
  const next = normalizePlannerEntries(entries);
  const cookIndex = next.findIndex(
    (entry) => isFreshEntry(entry) && String(entry.entryId) === String(cookEntryId)
  );

  if (cookIndex < 0) return next;

  const cook = next[cookIndex];
  const slots = clampLeftoverSlots(requestedSlots);
  const linkedLeftovers = next
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) =>
      isLeftoverLinkedToCook(entry, cook.entryId, cook.recipeId)
    );

  next[cookIndex] = {
    ...cook,
    leftoverSlots: slots,
  };

  if (linkedLeftovers.length > slots) {
    const removeIndexes = linkedLeftovers
      .slice()
      .sort((a, b) => b.index - a.index)
      .slice(0, linkedLeftovers.length - slots)
      .map(({ index }) => index);

    return next.filter((_, index) => !removeIndexes.includes(index));
  }

  if (linkedLeftovers.length < slots) {
    const missingCount = slots - linkedLeftovers.length;
    let insertAt = cookIndex + 1;

    while (
      insertAt < next.length &&
      isLeftoverLinkedToCook(next[insertAt], cook.entryId, cook.recipeId)
    ) {
      insertAt += 1;
    }

    const leftoversToInsert = Array.from({ length: missingCount }, (_, offset) =>
      buildLeftoverEntry(cook, next.length + offset)
    );

    next.splice(insertAt, 0, ...leftoversToInsert);
  }

  return next;
}

export function summarizeProposalEntries(entries, warnings = []) {
  const normalized = normalizePlannerEntries(entries);
  return {
    freshCount: normalized.filter(isFreshEntry).length,
    leftoverCount: normalized.filter(isLeftoverEntry).length,
    warnings: Array.isArray(warnings) ? warnings : [],
  };
}
