import { Beef, Clock, Tags, Users, UtensilsCrossed } from "lucide-react";
import Divider from "../components/Divider";
import FieldRow from "../components/FieldRow";
import ProteinGrid from "../components/ProteinGrid";
import Card from "../components/Card";

export default function BasicsStep({ recipe, setRecipe, basicsValid }) {
  const cookTimeMinutes = (String(recipe.cookTime || "").match(/\d+/) || [""])[0];

  const handleCookTimeChange = (value) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (!digitsOnly) {
      setRecipe({ ...recipe, cookTime: "" });
      return;
    }

    const minutes = String(parseInt(digitsOnly, 10));
    setRecipe({ ...recipe, cookTime: `${minutes} minutes` });
  };

  return (
    <Card>
      <FieldRow
        icon={<UtensilsCrossed className="h-5 w-5" />}
        label="Name"
        right={
          <input
            type="text"
            placeholder="e.g. Chicken Tikka"
            className="w-48 max-w-[60vw] bg-transparent text-right text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            value={recipe.name}
            onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
          />
        }
      />

      <Divider />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Beef className="h-5 w-5 text-gray-600" />
          <div className="text-sm font-medium text-gray-900">Protein</div>
        </div>

        <div className="mt-3">
          <ProteinGrid
            value={recipe.protein}
            onChange={(v) => setRecipe({ ...recipe, protein: v })}
          />
        </div>
      </div>

      <Divider />

      <FieldRow
        icon={<Users className="h-5 w-5" />}
        label="Portions"
        right={
          <input
            type="number"
            min="1"
            className="w-20 bg-transparent text-right text-sm text-gray-900 outline-none"
            value={recipe.portions}
            onChange={(e) => {
              const raw = e.target.value;
              const next = raw === "" ? 1 : Number(raw);
              setRecipe({
                ...recipe,
                portions: Number.isFinite(next) && next > 0 ? next : 1,
              });
            }}
          />
        }
      />

      <Divider />

      <FieldRow
        icon={<Clock className="h-5 w-5" />}
        label="Cook Time"
        right={
          <div className="flex items-center justify-end gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="40"
              className="w-14 bg-transparent text-right text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              value={cookTimeMinutes}
              onChange={(e) => handleCookTimeChange(e.target.value)}
            />
            <span className="text-sm text-gray-600">minutes</span>
          </div>
        }
      />

      <Divider />

      <FieldRow
        icon={<Tags className="h-5 w-5" />}
        label="Tags"
        right={
          <input
            type="text"
            placeholder="slow cooker, summer"
            className="w-60 max-w-[65vw] bg-transparent text-right text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            value={recipe.tags}
            onChange={(e) => setRecipe({ ...recipe, tags: e.target.value })}
          />
        }
      />

      {!basicsValid ? (
        <div className="px-4 pb-4 text-xs text-red-600">
          Name, protein, and portions are required to continue.
        </div>
      ) : (
        <div className="px-4 pb-4 text-xs text-gray-500">
          Looks good. Next: ingredients.
        </div>
      )}
    </Card>
  );
}
