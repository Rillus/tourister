"use client";

import { useState } from "react";
import type { EnrichedStop } from "@/types/enrichment";
import { hasValidCoordinates } from "@/lib/coordinates";

interface StopCardProps {
  stop: EnrichedStop;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  editable?: boolean;
  onNotesChange?: (notes: string) => void;
  onDropPin?: () => void;
}

export function StopCard({
  stop,
  index,
  isSelected,
  onSelect,
  editable,
  onNotesChange,
  onDropPin,
}: StopCardProps) {
  const [imageError, setImageError] = useState(false);
  const enrichment = stop.enrichment;
  const hasImage = enrichment?.imageUrl && !imageError;
  const mapped = hasValidCoordinates(stop);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`w-full text-left rounded-xl transition cursor-pointer overflow-hidden ${
        isSelected
          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "hover:bg-foreground/[0.03] border border-foreground/8"
      }`}
    >
      {hasImage && (
        <div className="relative h-32 w-full overflow-hidden bg-foreground/5">
          <img
            src={enrichment.imageUrl}
            alt={stop.name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          {enrichment.imageAttribution && (
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white/80">
              {enrichment.imageAttribution}
            </span>
          )}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5 ${
              mapped ? "bg-blue-600" : "bg-amber-600"
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{stop.name}</p>
            {stop.nameLocal && (
              <p className="text-xs text-foreground/50 mt-0.5">
                {stop.nameLocal}
              </p>
            )}
            {(stop.dateStart || stop.dateEnd) && (
              <p className="text-[11px] text-foreground/40 mt-0.5">
                {stop.dateStart}
                {stop.dateEnd && ` → ${stop.dateEnd}`}
              </p>
            )}
          </div>
        </div>

        {enrichment?.wikipediaSummary && (
          <p className="mt-2 text-xs text-foreground/60 leading-relaxed line-clamp-3">
            {enrichment.wikipediaSummary}
          </p>
        )}

        {editable && isSelected && onNotesChange ? (
          <textarea
            value={stop.notes ?? ""}
            onChange={(e) => onNotesChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Add notes…"
            rows={2}
            className="mt-2 w-full resize-none rounded border border-foreground/15 bg-background px-2 py-1.5 text-xs text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
          />
        ) : (
          stop.notes &&
          !enrichment?.wikipediaSummary && (
            <p className="mt-2 text-xs text-foreground/40 leading-relaxed line-clamp-2">
              {stop.notes}
            </p>
          )
        )}

        {!mapped && (
          <div
            className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-amber-900 dark:text-amber-100 font-medium">
              No location found
            </p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 mt-0.5">
              This stop isn&apos;t on the map until you place a pin.
            </p>
            {onDropPin ? (
              <button
                type="button"
                onClick={onDropPin}
                className="mt-2 w-full rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Drop pin
              </button>
            ) : null}
          </div>
        )}

        {mapped && onDropPin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDropPin();
            }}
            className="mt-2 text-[11px] text-blue-600 hover:underline"
          >
            Move pin
          </button>
        )}

        {enrichment?.wikipediaUrl && (
          <a
            href={enrichment.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-block text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            Read more on Wikipedia →
          </a>
        )}
      </div>
    </div>
  );
}
