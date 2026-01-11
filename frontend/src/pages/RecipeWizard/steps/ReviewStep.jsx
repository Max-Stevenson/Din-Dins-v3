import { Check } from "lucide-react";
import Card from "../components/Card";

export default function ReviewStep({ recipe, imageUrl }) {
  return (
    <Card>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-700" />
          <div className="text-sm font-medium text-gray-900">Review</div>
        </div>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900 text-right">
              {recipe.name || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Protein</span>
            <span className="font-medium text-gray-900 text-right">
              {recipe.protein || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Portions</span>
            <span className="font-medium text-gray-900 text-right">
              {recipe.portions}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Cook Time</span>
            <span className="font-medium text-gray-900 text-right">
              {recipe.cookTime || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Tags</span>
            <span className="font-medium text-gray-900 text-right">
              {recipe.tags || "—"}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ingredients
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-800">
            {recipe.ingredients
              .filter((i) => i.name.trim())
              .map((i, idx) => (
                <li key={idx}>
                  {[i.quantity, i.unit, i.name].filter(Boolean).join(" ")}
                </li>
              ))}
          </ul>
        </div>
        // inside ReviewStep.jsx, after Ingredients block (recommended)
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Method
          </div>

          <ol className="mt-2 list-decimal pl-5 text-sm text-gray-800 space-y-1">
            {recipe.method
              .filter((s) => s.text.trim())
              .map((s, idx) => (
                <li key={idx}>{s.text}</li>
              ))}
          </ol>

          {recipe.method.filter((s) => s.text.trim()).length === 0 && (
            <div className="mt-1 text-sm text-gray-500">—</div>
          )}
        </div>
        {recipe.image ? (
          <div className="mt-4">
            <img
              src={imageUrl}
              alt="Recipe preview"
              className="h-36 w-full rounded-xl object-cover"
            />
          </div>
        ) : null}
        <button
          type="submit"
          className="mt-5 w-full rounded-2xl bg-green-600 py-3 text-sm font-semibold text-white shadow-sm active:opacity-80"
        >
          Save Recipe
        </button>
      </div>
    </Card>
  );
}
