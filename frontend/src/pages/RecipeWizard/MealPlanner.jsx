import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BottomSheet from "../RecipeWizard/components/BottomSheet";
import { GripVertical, Search } from "lucide-react";
import { useApiClient } from "../../api/client";
import { useToast } from "../../ui/toast";
import { swapDinners } from "./mealPlanSwap";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(date, daysToAdd) {
  const d = new Date(date);
  d.setDate(d.getDate() + daysToAdd);
  return d;
}

function deriveDateForIndex(startDate, index) {
  const start = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(start.getTime())) return "";
  return toISODate(addDays(start, index));
}

function createEntryId(index) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function findSourceCookIndex(entries, leftover, maxIndex = entries.length - 1) {
  if (!leftover || leftover.type !== "leftovers") return -1;

  if (leftover.leftoverOfEntryId) {
    const byEntryId = entries.findIndex(
      (e) =>
        e.type === "cook" &&
        String(e.entryId || "") === String(leftover.leftoverOfEntryId)
    );
    if (byEntryId >= 0) return byEntryId;
  }

  const sourceRecipeId = leftover.leftoverOfRecipeId || leftover.recipeId;
  if (!sourceRecipeId) return -1;

  for (let i = Math.min(maxIndex, entries.length - 1); i >= 0; i -= 1) {
    const e = entries[i];
    if (e?.type !== "cook") continue;
    if (String(e.recipeId || "") === String(sourceRecipeId)) return i;
  }

  return entries.findIndex(
    (e) => e.type === "cook" && String(e.recipeId || "") === String(sourceRecipeId)
  );
}

function normalizeProposalDinners(rawDinners) {
  const dinners = Array.isArray(rawDinners) ? rawDinners : [];

  const withIds = dinners.map((entry, index) => ({
    ...entry,
    entryId: entry.entryId || createEntryId(index),
  }));

  return withIds.map((entry, index) => {
    if (entry.type !== "leftovers") return entry;

    if (entry.leftoverOfEntryId) {
      const hasSource = withIds.some(
        (e) => e.type === "cook" && String(e.entryId) === String(entry.leftoverOfEntryId)
      );
      if (hasSource) return entry;
    }

    const sourceIndex = findSourceCookIndex(withIds, entry, index - 1);
    if (sourceIndex < 0) return entry;

    return {
      ...entry,
      leftoverOfEntryId: withIds[sourceIndex].entryId,
    };
  });
}

function normalizeProposal(rawProposal, fallbackStartDate) {
  const startDate = rawProposal?.startDate || fallbackStartDate || todayISO();
  return {
    ...(rawProposal || {}),
    startDate,
    dinners: normalizeProposalDinners(rawProposal?.dinners),
  };
}

function enforceLeftoversAfterSource(entries) {
  const next = entries.slice();

  for (let i = 0; i < next.length; i += 1) {
    const entry = next[i];
    if (!entry || entry.type !== "leftovers") continue;

    let sourceIndex = findSourceCookIndex(next, entry, next.length - 1);
    if (sourceIndex < 0) continue;

    if (i <= sourceIndex) {
      const [moved] = next.splice(i, 1);
      if (sourceIndex > i) sourceIndex -= 1;
      next.splice(sourceIndex + 1, 0, moved);
      i = -1;
    }
  }

  return next;
}

function toSavePayload(proposal) {
  const startDate = proposal?.startDate || todayISO();
  const dinners = Array.isArray(proposal?.dinners)
    ? proposal.dinners.map((entry, index) => {
        const date = deriveDateForIndex(startDate, index);

        if (entry.type === "leftovers") {
          return {
            date,
            type: "leftovers",
            leftoverOfRecipeId:
              entry.leftoverOfRecipeId || entry.recipeId || null,
            title: entry.title || "",
          };
        }

        return {
          date,
          type: "cook",
          recipeId: entry.recipeId || null,
          title: entry.title || "",
        };
      })
    : [];

  return {
    startDate,
    days: proposal?.days,
    people: proposal?.people,
    meatRatio: proposal?.meatRatio,
    allowLeftovers: proposal?.allowLeftovers,
    dinners,
  };
}

function SortableDinnerRow({ entry, dateLabel, onSwap }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.entryId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center rounded-xl bg-gray-50 ring-1 ring-gray-200 ${
        isDragging ? "opacity-75" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSwap(entry.entryId)}
        className="min-w-0 flex-1 px-3 py-3 text-left active:opacity-80"
      >
        <div className="text-xs text-gray-500">{dateLabel}</div>
        <div className="truncate text-sm font-semibold text-gray-900">
          {entry.title || (entry.type === "leftovers" ? "Leftovers" : "Cook")}
        </div>
        <div className="text-xs text-gray-600">Tap to swap</div>
      </button>

      <button
        type="button"
        aria-label="Reorder dinner"
        className="mr-2 grid h-8 w-8 place-items-center rounded-md text-gray-500 hover:bg-gray-100 active:opacity-80 touch-none cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function MealPlanner() {
  const api = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(todayISO());
  const [days, setDays] = useState(7);
  const [people, setPeople] = useState(2);
  const [meatRatio, setMeatRatio] = useState(0.5);
  const [allowLeftovers, setAllowLeftovers] = useState(true);

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);

  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  const [swapOpen, setSwapOpen] = useState(false);
  const [swapEntryId, setSwapEntryId] = useState(null);
  const [query, setQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    })
  );

  const meatPercent = useMemo(() => Math.round(meatRatio * 100), [meatRatio]);

  useEffect(() => {
    let ignore = false;

    async function loadRecipes() {
      setRecipesLoading(true);
      try {
        const res = await api.recipes.list();
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

  const openSwap = (entryId) => {
    setSwapEntryId(entryId);
    setQuery("");
    setSwapOpen(true);
  };

  const closeSwap = () => {
    setSwapOpen(false);
    setSwapEntryId(null);
    setQuery("");
  };

  const applySwap = (recipe) => {
    if (!proposal || !swapEntryId) return;

    setProposal((prev) => {
      if (!prev) return prev;
      const swapIndex = prev.dinners.findIndex((d) => d.entryId === swapEntryId);
      if (swapIndex < 0) return prev;

      const swapped = swapDinners(prev.dinners, swapIndex, recipe);
      const corrected = enforceLeftoversAfterSource(swapped);
      return { ...prev, dinners: corrected };
    });

    closeSwap();
  };

  const handleDragEnd = ({ active, over }) => {
    if (!proposal?.dinners?.length) return;
    if (!over || active.id === over.id) return;

    setProposal((prev) => {
      if (!prev) return prev;

      const oldIndex = prev.dinners.findIndex((d) => d.entryId === active.id);
      const newIndex = prev.dinners.findIndex((d) => d.entryId === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;

      const moved = arrayMove(prev.dinners, oldIndex, newIndex);
      const corrected = enforceLeftoversAfterSource(moved);
      return { ...prev, dinners: corrected };
    });
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.mealPlans.generate({
        startDate,
        days,
        people,
        meatRatio,
        allowLeftovers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate plan");
      }

      const data = await res.json();
      setProposal(normalizeProposal(data.proposal, startDate));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!proposal?.dinners?.length) return;

    setLoading(true);
    try {
      const payload = toSavePayload(proposal);
      const res = await api.mealPlans.create(payload);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save plan");
      }

      navigate("/meal-plans");
    } catch (e) {
      toast.error(e.message);
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
          {loading ? "Working..." : "Generate plan"}
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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={proposal.dinners.map((d) => d.entryId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {proposal.dinners.map((entry, idx) => (
                  <SortableDinnerRow
                    key={entry.entryId}
                    entry={entry}
                    dateLabel={deriveDateForIndex(proposal.startDate, idx)}
                    onSwap={openSwap}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {proposal.metadata && (
            <div className="text-xs text-gray-500 mt-2">
              Fresh: {proposal.metadata.freshCount}, Leftovers: {proposal.metadata.leftoverCount}
              {proposal.metadata.warnings && proposal.metadata.warnings.length > 0 && (
                <div className="mt-1">
                  {proposal.metadata.warnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      <BottomSheet open={swapOpen} title="Swap dinner" onClose={closeSwap}>
        {recipesLoading ? (
          <div className="text-sm text-gray-600 py-4">Loading recipes...</div>
        ) : recipes.length === 0 ? (
          <div className="text-sm text-gray-600 py-4">No recipes yet - add some first.</div>
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search recipes..."
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
                    {r.protein} - {r.portions} portions
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
                Showing first 60 results - refine your search to narrow it down.
              </div>
            ) : null}
          </>
        )}
      </BottomSheet>
    </div>
  );
}
