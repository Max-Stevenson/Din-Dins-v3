export default function BottomSheet({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet wrapper — push it ABOVE the bottom nav */}
      <div
        className={[
          "absolute inset-x-0",
          // Bottom nav is ~5.5rem tall (plus safe area). Adjust if needed.
          "bottom-20",
          "mx-auto w-full max-w-md px-3",
        ].join(" ")}
      >
        <div
          className="rounded-t-3xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="px-4 pt-3 pb-2">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-200" />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:opacity-80"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-4 pb-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
