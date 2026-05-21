import { describe, expect, it } from "vitest";

const {
  validateAndNormalizeRecipePayload,
} = require("../recipeValidators");

describe("recipeValidators", () => {
  it("normalizes known protein values and cook time strings", () => {
    const result = validateAndNormalizeRecipePayload({
      name: "Turkey Chili",
      protein: "turkey",
      portions: 4,
      cookTime: "60",
      tags: [" cozy ", " meal prep "],
      ingredients: [{ quantity: "1", unit: "lb", name: " turkey " }],
      method: [{ text: " Brown meat " }],
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      name: "Turkey Chili",
      protein: "Turkey",
      portions: 4,
      cookTime: "60 minutes",
      tags: ["cozy", "meal prep"],
      ingredients: [{ quantity: "1", unit: "lb", name: "turkey" }],
      method: [{ text: "Brown meat" }],
    });
  });

  it("accepts vegetarian aliases", () => {
    const result = validateAndNormalizeRecipePayload({
      name: "Pasta Primavera",
      protein: "veg",
      portions: 2,
      cookTime: "25 mins",
    });

    expect(result.error).toBeUndefined();
    expect(result.value.protein).toBe("Vegetarian");
    expect(result.value.cookTime).toBe("25 minutes");
  });

  it("rejects unknown protein values", () => {
    const result = validateAndNormalizeRecipePayload({
      name: "Mystery Dish",
      protein: "Lamb",
      portions: 4,
    });

    expect(result.error).toMatch(/Protein must be one of/i);
  });

  it("rejects invalid cook time values", () => {
    const result = validateAndNormalizeRecipePayload({
      name: "Mystery Dish",
      protein: "Chicken",
      portions: 4,
      cookTime: "about an hour",
    });

    expect(result.error).toBe("Cook time must be a positive whole number of minutes");
  });
});
