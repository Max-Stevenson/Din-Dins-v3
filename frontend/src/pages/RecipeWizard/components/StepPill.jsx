export default function StepPill({ active, done, children }) {
  return (
    <div
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold",
        active
          ? "bg-blue-600 text-white"
          : done
          ? "bg-green-100 text-green-700"
          : "bg-gray-200 text-gray-700",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
