import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApiClient } from "../../api/client";
import useDebouncedValue from "../../hooks/useDebouncedValue";

const PAGE_SIZE = 6;

export default function RecipesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [query, setQuery] = useState("");
  const [protein, setProtein] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  const debouncedQuery = useDebouncedValue(query, 300);
  const api = useApiClient();
  const listRecipes = api.recipes.list;
  const hasLoadedRef = useRef(false);
  const previousFiltersRef = useRef({
    query: debouncedQuery,
    protein,
  });

  useEffect(() => {
    let ignore = false;
    const filtersChanged =
      previousFiltersRef.current.query !== debouncedQuery ||
      previousFiltersRef.current.protein !== protein;

    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
      return () => {
        ignore = true;
      };
    }

    async function load() {
      if (!ignore && hasLoadedRef.current) setIsFetching(true);

      try {
        const res = await listRecipes({
          page: currentPage,
          pageSize: PAGE_SIZE,
          query: debouncedQuery,
          protein,
        });
        const data = await res.json();

        if (ignore) return;

        setItems(data.items || []);
        setTotalRecipes(Number(data.totalRecipes) || 0);
        setPagination(
          data.pagination || {
            page: 1,
            pageSize: PAGE_SIZE,
            totalItems: 0,
            totalPages: 1,
          }
        );

        previousFiltersRef.current = {
          query: debouncedQuery,
          protein,
        };
        hasLoadedRef.current = true;

        if (data.pagination?.page && data.pagination.page !== currentPage) {
          setCurrentPage(data.pagination.page);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setIsFetching(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [currentPage, debouncedQuery, listRecipes, protein]);

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

  const hasActiveFilters = useMemo(() => {
    return Boolean(query.trim()) || protein !== "All";
  }, [query, protein]);

  function clearFilters() {
    setQuery("");
    setProtein("All");
    setCurrentPage(1);
  }

  if (loading)
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          Loading...
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
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Search recipes"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
            />
            {query ? (
              <button
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-600"
              >
                &times;
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
              onClick={() => {
                setProtein(p);
                setCurrentPage(1);
              }}
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

        <div className="text-xs text-gray-500">
          Showing {items.length} of {pagination.totalItems}
          {isFetching ? " Updating..." : ""}
        </div>
      </div>

      <div className="space-y-2">
        {totalRecipes === 0 ? (
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
        ) : pagination.totalItems === 0 ? (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
            No matches.
            <div className="mt-3 flex gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-800"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {items.map((r) => (
              <Link
                key={r._id}
                to={`/recipes/${r._id}`}
                className="block rounded-2xl bg-white p-4 ring-1 ring-black/5 active:opacity-80 hover:bg-gray-50"
              >
                <div className="font-semibold text-gray-900">{r.name}</div>
                <div className="text-sm text-gray-600">
                  {r.protein} &bull; {r.portions} portions
                  {r.cookTime ? ` - ${r.cookTime}` : ""}
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
                  View &rarr;
                </div>
              </Link>
            ))}

            {pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pagination.totalPages, page + 1)
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
