export default function FieldRow({ icon, label, right }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-gray-600">{icon}</span>
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}
