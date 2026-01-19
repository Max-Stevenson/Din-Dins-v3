// FILE 2: src/pages/MealPlanDetail.jsx
// Note: This expects backend GET /api/v1/meal-plans/:id.
// If you don't have that yet, I'll give you the backend snippet below.

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function MealPlanDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/meal-plans/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        if (!ignore) setItem(data.item || null);
      } catch {
        if (!ignore) setItem(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  const title = useMemo(() => {
    if (!item) return "";
    return `${item.startDate} • ${item.days} days`;
  }, [item]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-gray-900">
              {loading ? "Loading…" : title || "Plan"}
            </div>
            {item ? (
              <div className="mt-1 text-sm text-gray-600">
                {item.people} people
                {typeof item.meatRatio === "number"
                  ? ` • ${Math.round(item.meatRatio * 100)}% meat`
                  : ""}
                {item.allowLeftovers ? " • leftovers" : ""}
              </div>
            ) : null}
          </div>

          <Link
            to="/meal-plans"
            className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 active:opacity-80"
          >
            Back
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          Loading…
        </div>
      ) : !item ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          Plan not found.
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-2">
          {(item.dinners || []).map((d, idx) => {
            const recipeId =
              d.type === "cook" ? d.recipeId : d.leftoverOfRecipeId;
            const to = recipeId ? `/recipes/${recipeId}` : null;

            const Row = (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{d.date}</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {d.title || (d.type === "leftovers" ? "Leftovers" : "Cook")}
                  </div>
                  <div className="text-xs text-gray-600">
                    {d.type === "leftovers" ? "Use leftovers" : "Cook meal"}
                  </div>
                </div>

                <div
                  className={[
                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                    d.type === "leftovers"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700",
                  ].join(" ")}
                >
                  {d.type === "leftovers" ? "Leftovers" : "Cook"}
                </div>
              </div>
            );

            return to ? (
              <Link key={idx} to={to} className="block active:opacity-80">
                {Row}
              </Link>
            ) : (
              <div key={idx}>{Row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
