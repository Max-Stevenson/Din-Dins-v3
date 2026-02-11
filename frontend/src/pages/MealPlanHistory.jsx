import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../lib/useApi";

function formatDate(isoYYYYMMDD) {
  return isoYYYYMMDD || "";
}

export default function MealPlanHistory() {
  const { apiFetch } = useApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch("/api/v1/meal-plans");
        const data = await res.json();
        if (!ignore) setItems(data.items || []);
      } catch {
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const grouped = useMemo(() => {
    // already sorted newest first from backend, but keep safe:
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [items]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">Plan History</div>
          <Link
            to="/meal-planner"
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white active:opacity-80"
          >
            New plan
          </Link>
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Saved weekly dinner plans.
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          Loading…
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          No saved meal plans yet.
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map((p) => (
            <Link
              key={p._id}
              to={`/meal-plans/${p._id}`}
              className="block rounded-2xl bg-white p-4 ring-1 ring-black/5 hover:bg-gray-50 active:opacity-80"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(p.startDate)} • {p.days} days
                  </div>
                  <div className="text-xs text-gray-600">
                    {p.people} people
                    {typeof p.meatRatio === "number"
                      ? ` • ${Math.round(p.meatRatio * 100)}% meat`
                      : ""}
                    {p.allowLeftovers ? " • leftovers" : ""}
                  </div>
                </div>
                <div className="text-xs font-semibold text-blue-600">
                  View →
                </div>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1">
                {(p.dinners || []).slice(0, 7).map((d, idx) => (
                  <div
                    key={idx}
                    className={[
                      "h-2 rounded-full",
                      d.type === "leftovers" ? "bg-amber-300" : "bg-green-400",
                    ].join(" ")}
                    title={d.title || d.type}
                  />
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
