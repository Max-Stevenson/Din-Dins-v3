import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../lib/useApi";

export default function RecipesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { apiFetch } = useApi();

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await apiFetch("/api/v1/recipes");
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

  if (loading)
    return (
      <div className="mx-auto max-w-md text-sm text-gray-600">Loading…</div>
    );

  return (
    <div className="mx-auto max-w-md space-y-2">
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          No recipes yet.
        </div>
      ) : (
        items.map((r) => (
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

            <div className="mt-3 text-xs font-semibold text-blue-600">
              View →
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
