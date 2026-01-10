import { Image as ImageIcon } from "lucide-react";
import Card from "../components/Card";

export default function PhotoStep({ recipe, setRecipe, imageUrl }) {
  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-5 w-5 text-gray-600" />
          <div className="text-sm font-medium text-gray-900">Photo</div>
        </div>

        <label className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 active:opacity-80 cursor-pointer">
          {recipe.image ? "Change" : "Add"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              setRecipe({
                ...recipe,
                image: e.target.files?.[0] ?? null,
              })
            }
          />
        </label>
      </div>

      {recipe.image ? (
        <div className="px-4 pb-4">
          <img
            src={imageUrl}
            alt="Recipe preview"
            className="h-44 w-full rounded-xl object-cover"
          />
          <div className="mt-2 text-xs text-gray-500">
            Looking good. Next: review and save.
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 text-xs text-gray-500">
          Photo is optional — you can add one later.
        </div>
      )}
    </Card>
  );
}
