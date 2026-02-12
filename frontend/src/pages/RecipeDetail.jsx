import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApiClient } from "../api/client";

function displayQty(qty, unit, name) {
  return [qty, unit, name].filter(Boolean).join(" ");
}

export default function RecipeDetail() {
  const api = useApiClient();
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const onDelete = async () => {
    if (!item?._id) return;

    const ok = window.confirm(`Delete "${item.name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      const res = await api.recipes.remove(item._id);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete recipe");
      }

      navigate("/recipes");
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const res = await api.recipes.getById(id);
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

  const tags = useMemo(
    () => (Array.isArray(item?.tags) ? item.tags : []),
    [item],
  );

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-gray-900">
              {loading ? "Loading…" : item?.name || "Recipe"}
            </div>
            {item ? (
              <div className="mt-1 text-sm text-gray-600">
                {item.protein || "—"} • {item.portions || 1} portions
                {item.cookTime ? ` • ${item.cookTime}` : ""}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {item ? (
              <>
                <Link
                  to={`/recipes/${item._id}/edit`}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white active:opacity-80"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white active:opacity-80"
                >
                  Delete
                </button>
              </>
            ) : null}

            <Link
              to="/recipes"
              className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 active:opacity-80"
            >
              Back
            </Link>
          </div>
        </div>

        {tags.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {!loading && !item ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          Recipe not found.
        </div>
      ) : null}

      {item ? (
        <>
          {item?.imageUrl ? (
            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-48 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="text-sm font-semibold text-gray-900">
              Ingredients
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-800 space-y-1">
              {(item.ingredients || [])
                .filter((i) => (i?.name || "").trim())
                .map((i, idx) => (
                  <li key={idx}>{displayQty(i.quantity, i.unit, i.name)}</li>
                ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="text-sm font-semibold text-gray-900">Method</div>
            <ol className="mt-2 list-decimal pl-5 text-sm text-gray-800 space-y-2">
              {(item.method || [])
                .filter((s) => (s?.text || "").trim())
                .map((s, idx) => (
                  <li key={idx} className="whitespace-pre-wrap">
                    {s.text}
                  </li>
                ))}
            </ol>
          </div>
        </>
      ) : null}
    </div>
  );
}
