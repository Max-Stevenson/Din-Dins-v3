import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomSheet from "../RecipeWizard/components/BottomSheet";
import { Search } from "lucide-react";
import { useApi } from "../../lib/useApi";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function MealPlanner() {
  const { apiFetch } = useApi();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(todayISO());
  const [days, setDays] = useState(7);
  const [people, setPeople] = useState(2);
  const [meatRatio, setMeatRatio] = useState(0.5);
  const [allowLeftovers, setAllowLeftovers] = useState(true);

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);

  // recipes for swapping
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  // swap UI state
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapIndex, setSwapIndex] = useState(null);
  const [query, setQuery] = useState("");

  const meatPercent = useMemo(() => Math.round(meatRatio * 100), [meatRatio]);

  useEffect(() => {
    let ignore = false;

    async function loadRecipes() {
      setRecipesLoading(true);
      try {
        const res = await apiFetch("/api/v1/recipes");
        const data = await res.json();
        if (!ignore) setRecipes(data.items || []);
      } catch {
        if (!ignore) setRecipes([]);
      } finally {
        if (!ignore) setRecipesLoading(false);
      }
    }

    loadRecipes();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;

    return recipes.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const protein = (r.protein || "").toLowerCase();
      const tags = Array.isArray(r.tags) ? r.tags.join(" ").toLowerCase() : "";
      return name.includes(q) || protein.includes(q) || tags.includes(q);
    });
  }, [recipes, query]);

  const openSwap = (index) => {
    setSwapIndex(index);
    setQuery("");
    setSwapOpen(true);
  };

  const closeSwap = () => {
    setSwapOpen(false);
    setSwapIndex(null);
    setQuery("");
  };

  const applySwap = (recipe) => {
    if (!proposal || swapIndex == null) return;

    const next = structuredClone(proposal); // modern browsers ok; if needed we can replace with a simple copy
    next.dinners[swapIndex] = {
      date: next.dinners[swapIndex].date,
      type: "cook",
      recipeId: recipe._id,
      title: recipe.name,
    };

    setProposal(next);
    closeSwap();
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/meal-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, days, people, meatRatio, allowLeftovers }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate plan");
      }

      const data = await res.json();
      setProposal(data.proposal);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!proposal?.dinners?.length) return;

    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save plan");
      }

      // ✅ tighter loop
      navigate("/meal-plans");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-3">
        <div className="text-lg font-semibold text-gray-900">Meal Planner</div>

        <label className="block text-sm text-gray-700">
          Start date
          <input
            type="date"
            className="mt-1 w-full rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-700">
            Days
            <input
              type="number"
              min="1"
              max="31"
              className="mt-1 w-full rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </label>

          <label className="block text-sm text-gray-700">
            People
            <input
              type="number"
              min="1"
              max="20"
              className="mt-1 w-full rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200"
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
            />
          </label>
        </div>

        <label className="block text-sm text-gray-700">
          Meat / Veg mix ({meatPercent}% meat)
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            className="mt-2 w-full"
            value={meatRatio}
            onChange={(e) => setMeatRatio(Number(e.target.value))}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={allowLeftovers}
            onChange={(e) => setAllowLeftovers(e.target.checked)}
          />
          Allow leftovers
        </label>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Working…" : "Generate plan"}
        </button>
      </div>

      {proposal?.dinners?.length ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Proposed dinners</div>
            <button
              type="button"
              onClick={save}
              disabled={loading}
              className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save
            </button>
          </div>

          <div className="space-y-2">
            {proposal.dinners.map((d, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => openSwap(idx)}
                className="w-full text-left rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200 active:opacity-80"
              >
                <div className="text-xs text-gray-500">{d.date}</div>
                <div className="text-sm font-semibold text-gray-900">
                  {d.title || (d.type === "leftovers" ? "Leftovers" : "Cook")}
                </div>
                <div className="text-xs text-gray-600">
                  Tap to swap
                </div>
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500">
            Swapping currently replaces that day with a “cook” meal (we’ll add leftovers-aware swaps later).
          </div>
        </div>
      ) : null}

      <BottomSheet
        open={swapOpen}
        title="Swap dinner"
        onClose={closeSwap}
      >
        {recipesLoading ? (
          <div className="text-sm text-gray-600 py-4">Loading recipes…</div>
        ) : recipes.length === 0 ? (
          <div className="text-sm text-gray-600 py-4">
            No recipes yet — add some first.
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search recipes…"
                className="w-full rounded-2xl bg-gray-50 pl-9 pr-3 py-2 text-sm ring-1 ring-gray-200 outline-none"
              />
            </div>

            <div className="space-y-2">
              {filteredRecipes.slice(0, 60).map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => applySwap(r)}
                  className="w-full rounded-2xl bg-white p-3 ring-1 ring-gray-200 text-left hover:bg-gray-50 active:opacity-80"
                >
                  <div className="text-sm font-semibold text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-600">
                    {r.protein} • {r.portions} portions
                  </div>
                  {Array.isArray(r.tags) && r.tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>

            {filteredRecipes.length > 60 ? (
              <div className="mt-2 text-xs text-gray-500">
                Showing first 60 results — refine your search to narrow it down.
              </div>
            ) : null}
          </>
        )}
      </BottomSheet>
    </div>
  );
}
