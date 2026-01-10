import { proteinTiles } from "../constants";

export default function ProteinGrid({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {proteinTiles.map(({ value: v, label, Icon }, idx) => {
        const selected = v === value;

        const isLast = idx === proteinTiles.length - 1;
        const shouldCenterLast = proteinTiles.length % 3 === 1 && isLast;

        return (
          <div
            key={v}
            className={shouldCenterLast ? "col-span-3 flex justify-center" : ""}
          >
            <button
              type="button"
              onClick={() => onChange(v)}
              className={[
                "flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-sm font-semibold",
                "ring-1 transition active:scale-[0.99]",
                shouldCenterLast ? "w-full max-w-[10rem]" : "w-full",
                selected
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-800 ring-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-6 w-6",
                  selected ? "text-white" : "text-gray-600",
                ].join(" ")}
              />
              <span className="text-xs">{label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
