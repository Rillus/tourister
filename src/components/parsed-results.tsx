"use client";

import type { ParsedItinerary, ParsedStop } from "@/types/itinerary";

interface ParsedResultsProps {
  itinerary: ParsedItinerary;
  onConfirm: () => void;
  onBack: () => void;
  onUpdateStop: (index: number, stop: ParsedStop) => void;
  onRemoveStop: (index: number) => void;
  isLoading: boolean;
}

export function ParsedResults({
  itinerary,
  onConfirm,
  onBack,
  onUpdateStop,
  onRemoveStop,
  isLoading,
}: ParsedResultsProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{itinerary.title}</h2>
        <span className="text-sm text-foreground/50">
          {itinerary.stops.length} stop{itinerary.stops.length !== 1 && "s"}
        </span>
      </div>

      <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
        {itinerary.stops.map((stop, index) => (
          <div
            key={index}
            className="group relative rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <input
                  value={stop.name}
                  onChange={(e) =>
                    onUpdateStop(index, { ...stop, name: e.target.value })
                  }
                  className="w-full font-medium bg-transparent border-none outline-none text-sm focus:ring-0 p-0"
                />
                {(stop.dateStart || stop.dateEnd) && (
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {stop.dateStart}
                    {stop.dateEnd && ` → ${stop.dateEnd}`}
                  </p>
                )}
                {stop.notes && (
                  <p className="text-xs text-foreground/40 mt-1">
                    {stop.notes}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveStop(index)}
                className="opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-red-500 transition text-lg leading-none cursor-pointer"
                aria-label={`Remove ${stop.name}`}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5 transition cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={itinerary.stops.length === 0 || isLoading}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
        >
          {isLoading ? "Building map…" : "Plot on map"}
        </button>
      </div>
    </div>
  );
}
