"use client";

export type TripViewMode = "map" | "plotter";

interface TripViewToggleProps {
  value: TripViewMode;
  onChange: (mode: TripViewMode) => void;
}

const OPTIONS: { id: TripViewMode; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "plotter", label: "Plotter" },
];

export function TripViewToggle({ value, onChange }: TripViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Trip view"
      className="inline-flex rounded-lg border border-foreground/15 p-0.5 bg-foreground/[0.02]"
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
