import { describe, expect, it } from "vitest";
import helpers from "../mealPlanEntries";

const { normalizeDinners, serializeMealPlan } = helpers;

describe("mealPlanEntries", () => {
  it("normalizes repeated leftovers with source cook linkage and fresh slot counts", () => {
    const dinners = normalizeDinners([
      {
        entryId: "cook-1",
        date: "2026-04-01",
        type: "fresh",
        recipeId: "r1",
        title: "Chili",
      },
      {
        entryId: "leftover-1",
        date: "2026-04-02",
        type: "leftover",
        recipeId: "r1",
        sourceCookEntryId: "cook-1",
        title: "Leftovers: Chili",
      },
      {
        entryId: "leftover-2",
        date: "2026-04-03",
        type: "leftover",
        recipeId: "r1",
        sourceCookEntryId: "cook-1",
        title: "Leftovers: Chili",
      },
    ]);

    expect(dinners[0].type).toBe("cook");
    expect(dinners[0].entryType).toBe("fresh");
    expect(dinners[0].leftoverSlots).toBe(2);
    expect(dinners[1].type).toBe("leftovers");
    expect(dinners[1].entryType).toBe("leftover");
    expect(dinners[1].leftoverOfEntryId).toBe("cook-1");
    expect(dinners[2].sourceCookEntryId).toBe("cook-1");
  });

  it("serializes meal plans with additive fields and derived day count", () => {
    const item = serializeMealPlan({
      startDate: "2026-04-01",
      days: 2,
      dinners: [
        {
          entryId: "cook-1",
          date: "2026-04-01",
          type: "cook",
          recipeId: "r1",
          title: "Chili",
        },
        {
          entryId: "leftover-1",
          date: "2026-04-02",
          type: "leftovers",
          leftoverOfRecipeId: "r1",
          sourceCookEntryId: "cook-1",
          title: "Leftovers: Chili",
        },
        {
          entryId: "leftover-2",
          date: "2026-04-03",
          type: "leftovers",
          leftoverOfRecipeId: "r1",
          sourceCookEntryId: "cook-1",
          title: "Leftovers: Chili",
        },
      ],
    });

    expect(item.days).toBe(3);
    expect(item.dinners[0].leftoverSlots).toBe(2);
    expect(item.dinners[1].legacyType).toBe("leftovers");
    expect(item.dinners[2].entryType).toBe("leftover");
  });
});
