import { ListChecks } from "lucide-react";
import Card from "../components/Card";

export default function IngredientsStep({
  recipe,
  handleIngredientChange,
  addIngredient,
  removeIngredient,
  ingredientsValid,
}) {
  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <ListChecks className="h-5 w-5 text-gray-600" />
          <div className="text-sm font-medium text-gray-900">Ingredients</div>
        </div>

        <button
          type="button"
          onClick={addIngredient}
          className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white active:opacity-80"
        >
          + Add
        </button>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {recipe.ingredients.map((ing, i) => (
          <div
            key={i}
            className="flex items-stretch gap-2 rounded-xl bg-gray-50 p-2 ring-1 ring-gray-200"
          >
            <input
              type="text"
              inputMode="decimal"
              placeholder="Qty"
              className="w-20 shrink-0 rounded-lg bg-white px-2 py-2 text-sm ring-1 ring-gray-200 outline-none"
              value={ing.quantity}
              onChange={(e) => {
                let cleaned = e.target.value.replace(/[^\d./\s]/g, "");
                cleaned = cleaned
                  .replace(/\s*\/\s*/g, "/")
                  .replace(/\s+/g, " ");
                handleIngredientChange(i, "quantity", cleaned);
              }}
            />

            <input
              type="text"
              placeholder="Unit"
              className="w-24 shrink-0 rounded-lg bg-white px-2 py-2 text-sm ring-1 ring-gray-200 outline-none"
              value={ing.unit}
              onChange={(e) => handleIngredientChange(i, "unit", e.target.value)}
            />

            <input
              type="text"
              placeholder="Ingredient"
              className="min-w-0 flex-1 rounded-lg bg-white px-2 py-2 text-sm ring-1 ring-gray-200 outline-none"
              value={ing.name}
              onChange={(e) => handleIngredientChange(i, "name", e.target.value)}
            />

            <button
              type="button"
              onClick={() => removeIngredient(i)}
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-red-600 ring-1 ring-gray-200 active:opacity-70"
              aria-label="Remove ingredient"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        {!ingredientsValid ? (
          <div className="text-xs text-red-600">
            Add at least one ingredient name to continue.
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            Nice. Next: add a photo (optional).
          </div>
        )}
      </div>
    </Card>
  );
}
