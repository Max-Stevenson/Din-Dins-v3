import { describe, it, expect } from 'vitest';
import generateMealPlan from '../mealPlanGenerator';

// Test fixture helpers

function makeRecipe(id, name, protein, lastPlannedAt = null, portions = 4) {
  return { _id: id, name, protein, lastPlannedAt, portions };
}

describe('mealPlanGenerator', () => {
  // ===== VALIDATION TESTS =====

  describe('validation: startDate', () => {
    it('rejects past start dates', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '2000-01-01',
          days: 1,
          peopleCount: 1,
          meatVegRatio: 0.5,
          allowLeftovers: false,
        })
      ).toThrow(/cannot be in the past/i);
    });

    it('accepts future dates', () => {
      const result = generateMealPlan({
        recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
        startDate: '3000-01-01',
        days: 1,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: false,
      });
      expect(result.entries).toHaveLength(1);
    });

    it('rejects invalid date format', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: 'not-a-date',
          days: 1,
          peopleCount: 1,
          meatVegRatio: 0.5,
          allowLeftovers: false,
        })
      ).toThrow(/invalid/i);
    });
  });

  describe('validation: days', () => {
    it('rejects days < 1', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 0,
          peopleCount: 1,
          meatVegRatio: 0.5,
          allowLeftovers: false,
        })
      ).toThrow(/days must be an integer between 1 and 31/i);
    });

    it('rejects days > 31', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 32,
          peopleCount: 1,
          meatVegRatio: 0.5,
          allowLeftovers: false,
        })
      ).toThrow(/days must be an integer between 1 and 31/i);
    });

    it('rejects non-integer days', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 2.5,
          peopleCount: 1,
          meatVegRatio: 0.5,
          allowLeftovers: false,
        })
      ).toThrow(/days must be an integer between 1 and 31/i);
    });
  });

  describe('validation: peopleCount', () => {
    it('rejects peopleCount < 1', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 1,
          peopleCount: 0,
          meatVegRatio: 0.5,
          allowLeftovers: false,
        })
      ).toThrow(/peopleCount must be an integer between 1 and 20/i);
    });

    it('rejects peopleCount > 20', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 1,
          peopleCount: 21,
          meatVegRatio: 0.5,
          allowLeftovers: false,
        })
      ).toThrow(/peopleCount must be an integer between 1 and 20/i);
    });

    it('rejects non-integer peopleCount', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 1,
          peopleCount: 1.5,
          meatVegRatio: 0.5,
          allowLeftovers: false,
        })
      ).toThrow(/peopleCount must be an integer between 1 and 20/i);
    });
  });

  describe('validation: meatVegRatio', () => {
    it('rejects meatVegRatio < 0', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 1,
          peopleCount: 1,
          meatVegRatio: -0.1,
          allowLeftovers: false,
        })
      ).toThrow(/meatVegRatio must be a number between 0 and 1/i);
    });

    it('rejects meatVegRatio > 1', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 1,
          peopleCount: 1,
          meatVegRatio: 1.1,
          allowLeftovers: false,
        })
      ).toThrow(/meatVegRatio must be a number between 0 and 1/i);
    });

    it('rejects non-number meatVegRatio', () => {
      expect(() =>
        generateMealPlan({
          recipes: [makeRecipe('r1', 'Test', 'Vegetarian')],
          startDate: '3000-01-01',
          days: 1,
          peopleCount: 1,
          meatVegRatio: 'invalid',
          allowLeftovers: false,
        })
      ).toThrow(/meatVegRatio must be a number between 0 and 1/i);
    });

    it('accepts 0 and 1 as valid extremes', () => {
      const recipes = [
        makeRecipe('v1', 'Salad', 'Vegetarian'),
        makeRecipe('m1', 'Chicken', 'Chicken'),
      ];

      const result0 = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 2,
        peopleCount: 1,
        meatVegRatio: 0,
        allowLeftovers: false,
      });
      expect(result0.entries).toHaveLength(2);

      const result1 = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 2,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });
      expect(result1.entries).toHaveLength(2);
    });
  });

  // ===== GENERATION TESTS =====

  describe('generation: fresh entries', () => {
    it('generates the requested number of fresh entries when enough recipes exist', () => {
      const recipes = [
        makeRecipe('m1', 'Chicken', 'Chicken'),
        makeRecipe('m2', 'Beef', 'Beef'),
        makeRecipe('v1', 'Salad', 'Vegetarian'),
        makeRecipe('v2', 'Tofu', 'Vegetarian'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 2,
        meatVegRatio: 0.5,
        allowLeftovers: false,
      });

      expect(result.entries).toHaveLength(6);
      expect(result.entries.every((e) => e.type === 'fresh')).toBe(true);
    });

    it('includes date, recipeId, title, and protein in each entry', () => {
      const recipes = [makeRecipe('r1', 'Chicken Curry', 'Chicken')];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-03-15',
        days: 1,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });

      expect(result.entries).toHaveLength(1);
      const entry = result.entries[0];
      expect(entry.date).toBe('3000-03-15');
      expect(entry.type).toBe('fresh');
      expect(entry.recipeId).toBe('r1');
      expect(entry.title).toBe('Chicken Curry');
      expect(entry.protein).toBe('Chicken');
    });

    it('increments dates correctly across days', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Meat'),
        makeRecipe('r2', 'Recipe2', 'Meat'),
        makeRecipe('r3', 'Recipe3', 'Meat'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-05-01',
        days: 3,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });

      expect(result.entries[0].date).toBe('3000-05-01');
      expect(result.entries[1].date).toBe('3000-05-02');
      expect(result.entries[2].date).toBe('3000-05-03');
    });
  });

  describe('generation: preference for novel recipes', () => {
    it('prefers recipes never planned before (lastPlannedAt = null)', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Meat', null), // never planned
        makeRecipe('r2', 'Recipe2', 'Meat', '2026-01-01'), // planned before
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 2,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });

      // First day should pick the never-planned recipe
      expect(result.entries[0].recipeId).toBe('r1');
      // Second day (if repetition allowed) should pick the older one
      expect(result.entries[1].recipeId).toBe('r2');
    });

    it('prefers oldest lastPlannedAt over more recent', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Meat', '2026-01-01'), // older
        makeRecipe('r2', 'Recipe2', 'Meat', '2026-02-01'), // more recent
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 2,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });

      expect(result.entries[0].recipeId).toBe('r1');
      expect(result.entries[1].recipeId).toBe('r2');
    });
  });

  describe('generation: meat/veg ratio', () => {
    it('approximates 50/50 meat/veg ratio across fresh days', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken'),
        makeRecipe('m2', 'Meat2', 'Beef'),
        makeRecipe('m3', 'Meat3', 'Pork'),
        makeRecipe('v1', 'Veg1', 'Vegetarian'),
        makeRecipe('v2', 'Veg2', 'Vegetarian'),
        makeRecipe('v3', 'Veg3', 'Vegetarian'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: false,
      });

      const meatCount = result.entries.filter(
        (e) => e.protein !== 'Vegetarian'
      ).length;
      const vegCount = result.entries.filter(
        (e) => e.protein === 'Vegetarian'
      ).length;

      expect(meatCount).toBe(3);
      expect(vegCount).toBe(3);
    });

    it('skews toward all-meat when meatVegRatio = 1', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken'),
        makeRecipe('m2', 'Meat2', 'Beef'),
        makeRecipe('v1', 'Veg1', 'Vegetarian'),
        makeRecipe('v2', 'Veg2', 'Vegetarian'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 4,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });

      const meatCount = result.entries.filter(
        (e) => e.protein !== 'Vegetarian'
      ).length;
      expect(meatCount).toBe(4);
    });

    it('skews toward all-veg when meatVegRatio = 0', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken'),
        makeRecipe('m2', 'Meat2', 'Beef'),
        makeRecipe('v1', 'Veg1', 'Vegetarian'),
        makeRecipe('v2', 'Veg2', 'Vegetarian'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 4,
        peopleCount: 1,
        meatVegRatio: 0,
        allowLeftovers: false,
      });

      const vegCount = result.entries.filter(
        (e) => e.protein === 'Vegetarian'
      ).length;
      expect(vegCount).toBe(4);
    });
  });

  describe('generation: avoiding repetition', () => {
    it('avoids repeating the same recipe if alternatives exist', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Meat'),
        makeRecipe('r2', 'Recipe2', 'Meat'),
        makeRecipe('r3', 'Recipe3', 'Meat'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });

      const recipeIds = result.entries.map((e) => e.recipeId);
      // With 3 recipes and 6 days, exact distribution depends on novelty ordering
      // but ensure at least some variety
      expect(new Set(recipeIds).size).toBeGreaterThan(1);
    });

    it('allows and warns about repetition when too few recipes exist', () => {
      const recipes = [makeRecipe('r1', 'OnlyRecipe', 'Meat')];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 3,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });

      expect(result.entries).toHaveLength(3);
      expect(result.entries[0].recipeId).toBe('r1');
      expect(result.entries[1].recipeId).toBe('r1');
      expect(result.entries[2].recipeId).toBe('r1');

      expect(result.warnings.some((w) =>
        w.toLowerCase().includes('repeated')
      )).toBe(true);
    });
  });

  describe('generation: handling insufficient recipe categories', () => {
    it('falls back gracefully when one category is insufficient', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken'),
        makeRecipe('m2', 'Meat2', 'Beef'),
        makeRecipe('v1', 'OnlyVeg', 'Vegetarian'), // only 1 veg
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 1,
        meatVegRatio: 0.5, // wants 3/3 split
        allowLeftovers: false,
      });

      expect(result.entries).toHaveLength(6); // still generates full plan
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) =>
        w.toLowerCase().includes('vegetarian')
      )).toBe(true);
    });

    it('includes a warning when ratio cannot be met exactly', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken'),
        makeRecipe('m2', 'Meat2', 'Beef'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 4,
        peopleCount: 1,
        meatVegRatio: 0.5, // wants 2/2, but no veg recipes
        allowLeftovers: false,
      });

      expect(result.warnings.some((w) =>
        w.toLowerCase().includes('ratio')
      )).toBe(true);
    });
  });

  describe('generation: edge cases', () => {
    it('handles empty recipe list gracefully', () => {
      const result = generateMealPlan({
        recipes: [],
        startDate: '3000-01-01',
        days: 1,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: false,
      });

      expect(result.entries).toHaveLength(0);
      expect(result.warnings.some((w) =>
        w.toLowerCase().includes('no recipes')
      )).toBe(true);
    });

    it('ignores recipes with missing required fields', () => {
      const recipes = [
        { _id: 'r1', name: 'NoProtein', protein: null }, // missing protein
        { _id: 'r2', name: '', protein: 'Chicken' }, // empty name
        { name: 'NoId', protein: 'Chicken' }, // missing id
        { _id: 'r4', name: 'Valid', protein: 'Vegetarian' }, // valid
      ];

      const result = generateMealPlan({
        recipes: recipes,
        startDate: '3000-01-01',
        days: 1,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: false,
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].recipeId).toBe('r4');
    });

    it('does not mutate input recipes', () => {
      const recipe = makeRecipe('r1', 'Test', 'Chicken');
      const originalCopy = { ...recipe };
      const recipes = [recipe];

      generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 1,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: false,
      });

      expect(recipe).toEqual(originalCopy);
    });
  });

  describe('generation: determinism', () => {
    it('produces identical output for identical inputs (deterministic)', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken', '2026-01-01'),
        makeRecipe('m2', 'Meat2', 'Beef', '2026-02-01'),
        makeRecipe('v1', 'Veg1', 'Vegetarian', null),
        makeRecipe('v2', 'Veg2', 'Vegetarian', '2026-01-15'),
      ];

      const input = {
        recipes,
        startDate: '3000-01-01',
        days: 7,
        peopleCount: 2,
        meatVegRatio: 0.5,
        allowLeftovers: false,
      };

      const result1 = generateMealPlan(input);
      const result2 = generateMealPlan(input);

      expect(result1.entries).toEqual(result2.entries);
      expect(result1.warnings).toEqual(result2.warnings);
    });
  });

  // ===== LEFTOVER TESTS =====

  describe('generation: leftovers', () => {
    it('when leftovers are disabled, all entries remain fresh', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken'),
        makeRecipe('m2', 'Meat2', 'Beef'),
        makeRecipe('v1', 'Veg1', 'Vegetarian'),
        makeRecipe('v2', 'Veg2', 'Vegetarian'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: false,
      });

      expect(result.entries).toHaveLength(6);
      expect(result.entries.every((e) => e.type === 'fresh')).toBe(true);
    });

    it('when leftovers are enabled, some leftover entries are created', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken'),
        makeRecipe('m2', 'Meat2', 'Beef'),
        makeRecipe('v1', 'Veg1', 'Vegetarian'),
        makeRecipe('v2', 'Veg2', 'Vegetarian'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: true,
      });

      expect(result.entries).toHaveLength(6); // total stays same
      const leftoverCount = result.entries.filter((e) => e.type === 'leftover')
        .length;
      expect(leftoverCount).toBeGreaterThan(0);
      const freshCount = result.entries.filter((e) => e.type === 'fresh').length;
      expect(freshCount + leftoverCount).toBe(6);
    });

    it('fresh-day meat/veg ratio is based only on fresh entries with leftovers enabled', () => {
      // compute fresh days for 8 total days -> 4 fresh days (alternating pattern)
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken'),
        makeRecipe('m2', 'Meat2', 'Beef'),
        makeRecipe('m3', 'Meat3', 'Pork'),
        makeRecipe('v1', 'Veg1', 'Vegetarian'),
        makeRecipe('v2', 'Veg2', 'Vegetarian'),
        makeRecipe('v3', 'Veg3', 'Vegetarian'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 8,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: true,
      });

      const freshEntries = result.entries.filter((e) => e.type === 'fresh');
      const meatCount = freshEntries.filter((e) => e.protein !== 'Vegetarian')
        .length;
      const vegCount = freshEntries.length - meatCount;

      // with 8 total days and leftovers enabled, the pattern is alternating F, L, F, L, ...
      // which yields 4 fresh and 4 leftover days. With 0.5 ratio, 2 meat and 2 veg.
      expect(freshEntries.length).toBe(4);
      expect(meatCount).toBe(2);
      expect(vegCount).toBe(2);
    });

    it('leftover entries always immediately follow their source fresh day', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Chicken'),
        makeRecipe('r2', 'Recipe2', 'Beef'),
        makeRecipe('r3', 'Recipe3', 'Chicken'),
        makeRecipe('r4', 'Recipe4', 'Beef'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: true,
      });

      for (let i = 0; i < result.entries.length - 1; i++) {
        if (result.entries[i + 1].type === 'leftover') {
          expect(result.entries[i].type).toBe('fresh');
          expect(result.entries[i + 1].leftoverOfRecipeId).toBe(
            result.entries[i].recipeId
          );
        }
      }
    });

    it('leftover entries preserve the same recipeId and protein as the source fresh day', () => {
      const recipes = [
        makeRecipe('r1', 'Chicken Curry', 'Chicken'),
        makeRecipe('r2', 'Beef Stew', 'Beef'),
        makeRecipe('r3', 'Pork Roast', 'Pork'),
        makeRecipe('r4', 'Turkey Breast', 'Turkey'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 8,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: true,
      });

      result.entries.forEach((entry) => {
        if (entry.type === 'leftover') {
          const sourceEntry = result.entries.find(
            (e) =>
              e.type === 'fresh' &&
              e.recipeId === entry.leftoverOfRecipeId
          );
          expect(sourceEntry).toBeDefined();
          expect(entry.recipeId).toBe(sourceEntry.recipeId);
          expect(entry.protein).toBe(sourceEntry.protein);
          expect(entry.title).toContain('Leftovers:');
          expect(entry.title).toContain(sourceEntry.title);
        }
      });
    });

    it('leftover entries do not exceed requested total day count', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Chicken'),
        makeRecipe('r2', 'Recipe2', 'Beef'),
        makeRecipe('r3', 'Recipe3', 'Chicken'),
        makeRecipe('r4', 'Recipe4', 'Beef'),
        makeRecipe('r5', 'Recipe5', 'Chicken'),
        makeRecipe('r6', 'Recipe6', 'Beef'),
      ];

      for (const days of [3, 5, 7, 10, 14]) {
        const result = generateMealPlan({
          recipes,
          startDate: '3000-01-01',
          days,
          peopleCount: 1,
          meatVegRatio: 1,
          allowLeftovers: true,
        });

        expect(result.entries).toHaveLength(days);
      }
    });

    it('no leftover-of-leftover chains are created', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Chicken'),
        makeRecipe('r2', 'Recipe2', 'Beef'),
        makeRecipe('r3', 'Recipe3', 'Chicken'),
        makeRecipe('r4', 'Recipe4', 'Beef'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: true,
      });

      result.entries.forEach((entry) => {
        if (entry.type === 'leftover') {
          // leftoverOfRecipeId should reference a fresh day, not another leftover
          const sourceEntry = result.entries.find(
            (e) => e.type === 'fresh' && e.recipeId === entry.leftoverOfRecipeId
          );
          expect(sourceEntry).toBeDefined(
            `Leftover ${entry.recipeId} should reference a fresh entry`
          );
        }
      });
    });

    it('generation remains deterministic with leftovers enabled', () => {
      const recipes = [
        makeRecipe('m1', 'Meat1', 'Chicken', '2026-01-01'),
        makeRecipe('m2', 'Meat2', 'Beef', '2026-02-01'),
        makeRecipe('v1', 'Veg1', 'Vegetarian', null),
        makeRecipe('v2', 'Veg2', 'Vegetarian', '2026-01-15'),
      ];

      const input = {
        recipes,
        startDate: '3000-01-01',
        days: 8,
        peopleCount: 2,
        meatVegRatio: 0.5,
        allowLeftovers: true,
      };

      const result1 = generateMealPlan(input);
      const result2 = generateMealPlan(input);

      expect(result1.entries).toEqual(result2.entries);
      expect(result1.warnings).toEqual(result2.warnings);
    });

    it('leftover policy: alternating fresh and leftover entries fill all days', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Chicken'),
        makeRecipe('r2', 'Recipe2', 'Beef'),
        makeRecipe('r3', 'Recipe3', 'Pork'),
        makeRecipe('r4', 'Recipe4', 'Chicken'),
        makeRecipe('r5', 'Recipe5', 'Beef'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 8,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: true,
      });

      // Pattern should be: F (0), L (1), F (2), L (3), F (4), L (5), F (6), L (7)
      // Entries at even indices are fresh, odd indices are leftover
      for (let i = 0; i < result.entries.length; i++) {
        const entry = result.entries[i];
        if (i % 2 === 0) {
          expect(entry.type).toBe('fresh');
        } else {
          expect(entry.type).toBe('leftover');
        }
      }

      // Verify counts: 8 days -> 4 fresh, 4 leftover
      const freshCount = result.entries.filter((e) => e.type === 'fresh').length;
      const leftoverCount = result.entries.filter((e) => e.type === 'leftover').length;
      expect(freshCount).toBe(4);
      expect(leftoverCount).toBe(4);
    });

    it('leftover title includes "Leftovers: " prefix', () => {
      const recipes = [
        makeRecipe('r1', 'Chicken Curry', 'Chicken'),
        makeRecipe('r2', 'Beef Stew', 'Beef'),
        makeRecipe('r3', 'Pork Roast', 'Pork'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 6,
        peopleCount: 1,
        meatVegRatio: 1,
        allowLeftovers: true,
      });

      result.entries.forEach((entry) => {
        if (entry.type === 'leftover') {
          expect(entry.title).toMatch(/^Leftovers: /);
        }
      });
    });

    it('4 days with leftovers enabled yields exactly 2 fresh and 2 leftover', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Chicken'),
        makeRecipe('r2', 'Recipe2', 'Beef'),
        makeRecipe('r3', 'Recipe3', 'Pork'),
        makeRecipe('r4', 'Recipe4', 'Chicken'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 4,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: true,
      });

      const freshEntries = result.entries.filter((e) => e.type === 'fresh');
      const leftoverEntries = result.entries.filter((e) => e.type === 'leftover');

      expect(freshEntries).toHaveLength(2);
      expect(leftoverEntries).toHaveLength(2);
      expect(result.entries).toHaveLength(4);

      // Pattern should be: F, L, F, L
      expect(result.entries[0].type).toBe('fresh');
      expect(result.entries[1].type).toBe('leftover');
      expect(result.entries[2].type).toBe('fresh');
      expect(result.entries[3].type).toBe('leftover');
    });

    it('5 days with leftovers enabled yields exactly 3 fresh and 2 leftover', () => {
      const recipes = [
        makeRecipe('r1', 'Recipe1', 'Chicken'),
        makeRecipe('r2', 'Recipe2', 'Beef'),
        makeRecipe('r3', 'Recipe3', 'Pork'),
        makeRecipe('r4', 'Recipe4', 'Chicken'),
        makeRecipe('r5', 'Recipe5', 'Beef'),
      ];

      const result = generateMealPlan({
        recipes,
        startDate: '3000-01-01',
        days: 5,
        peopleCount: 1,
        meatVegRatio: 0.5,
        allowLeftovers: true,
      });

      const freshEntries = result.entries.filter((e) => e.type === 'fresh');
      const leftoverEntries = result.entries.filter((e) => e.type === 'leftover');

      expect(freshEntries).toHaveLength(3);
      expect(leftoverEntries).toHaveLength(2);
      expect(result.entries).toHaveLength(5);

      // Pattern should be: F, L, F, L, F
      expect(result.entries[0].type).toBe('fresh');
      expect(result.entries[1].type).toBe('leftover');
      expect(result.entries[2].type).toBe('fresh');
      expect(result.entries[3].type).toBe('leftover');
      expect(result.entries[4].type).toBe('fresh');
    });
  });
});
