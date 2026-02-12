import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApiClient } from "../../api/client";
import useDebouncedValue from "../../hooks/useDebouncedValue";

export default function RecipesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [protein, setProtein] = useState("All");
  const debouncedQuery = useDebouncedValue(query, 300);
  const api = useApiClient();

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await api.recipes.list();
        const data = await res.json();
        if (!ignore) setItems(data.items || []);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const proteins = [
    "All",
    "Chicken",
    "Beef",
    "Fish",
    "Pork",
    "Turkey",
    "Vegetarian",
    "Other",
  ];

  const filtered = useMemo(() => {
    const q = (debouncedQuery || "").trim().toLowerCase();
    return items.filter((r) => {
      if (protein && protein !== "All" && r.protein !== protein) return false;
      if (q && !(r.name || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, debouncedQuery, protein]);

  function clearFilters() {
    setQuery("");
    setProtein("All");
  }

  if (loading)
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          Loading…
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-md space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
            />
            {query ? (
              <button
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 p-1 text-sm text-gray-600"
              >
                ×
              </button>
            ) : null}
          </div>
          <button
            onClick={clearFilters}
            className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700"
          >
            Clear
          </button>
        </div>

        <div className="flex gap-2 overflow-auto py-1">
          {proteins.map((p) => (
            <button
              key={p}
              onClick={() => setProtein(p)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
                protein === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500">Showing {filtered.length} of {items.length}</div>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
            No recipes yet.
            <div className="mt-3">
              <Link
                to="/recipes/new"
                className="inline-block rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
              >
                Add a recipe
              </Link>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
            No matches.
            <div className="mt-3 flex gap-2">
              <button
                onClick={clearFilters}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-800"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          filtered.map((r) => (
            <Link
              key={r._id}
              to={`/recipes/${r._id}`}
              className="block rounded-2xl bg-white p-4 ring-1 ring-black/5 active:opacity-80 hover:bg-gray-50"
            >
              <div className="font-semibold text-gray-900">{r.name}</div>
              <div className="text-sm text-gray-600">
                {r.protein} • {r.portions} portions
                {r.cookTime ? ` • ${r.cookTime}` : ""}
              </div>

              {r.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 text-xs font-semibold text-blue-600">View →</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
