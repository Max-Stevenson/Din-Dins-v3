import { ListOrdered } from "lucide-react";
import Card from "../components/Card";

export default function MethodStep({
  recipe,
  handleMethodChange,
  addMethodStep,
  removeMethodStep,
  methodValid,
}) {
  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <ListOrdered className="h-5 w-5 text-gray-600" />
          <div className="text-sm font-medium text-gray-900">Method</div>
        </div>

        <button
          type="button"
          onClick={addMethodStep}
          className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white active:opacity-80"
        >
          + Add step
        </button>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {recipe.method.map((step, i) => (
          <div
            key={i}
            className="flex items-stretch gap-2 rounded-xl bg-gray-50 p-2 ring-1 ring-gray-200"
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700 mt-1">
              {i + 1}
            </div>

            <textarea
              rows={3}
              placeholder="Describe this step..."
              className="min-w-0 flex-1 rounded-lg bg-white px-2 py-2 text-sm ring-1 ring-gray-200 outline-none resize-none"
              value={step.text}
              onChange={(e) => handleMethodChange(i, e.target.value)}
            />

            <button
              type="button"
              onClick={() => removeMethodStep(i)}
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-red-600 ring-1 ring-gray-200 active:opacity-70"
              aria-label="Remove method step"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        {!methodValid ? (
          <div className="text-xs text-red-600">
            Add at least one method step to continue.
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            Nice. Next: add a photo (optional).
          </div>
        )}
      </div>
    </Card>
  );
}
