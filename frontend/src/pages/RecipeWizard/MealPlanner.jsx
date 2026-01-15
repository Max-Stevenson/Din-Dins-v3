import { useMemo, useState } from "react";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function MealPlanner() {
  const [startDate, setStartDate] = useState(todayISO());
  const [days, setDays] = useState(7);
  const [people, setPeople] = useState(2);
  const [meatRatio, setMeatRatio] = useState(0.5);
  const [allowLeftovers, setAllowLeftovers] = useState(true);

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);

  const meatPercent = useMemo(() => Math.round(meatRatio * 100), [meatRatio]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/meal-plans/generate", {
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
      const res = await fetch("/api/v1/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save plan");
      }

      alert("Meal plan saved ✅");
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
              <div key={idx} className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
                <div className="text-xs text-gray-500">{d.date}</div>
                <div className="text-sm font-semibold text-gray-900">
                  {d.title || (d.type === "leftovers" ? "Leftovers" : "Cook")}
                </div>
                <div className="text-xs text-gray-600">
                  {d.type === "leftovers" ? "Use leftovers" : "Cook meal"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
