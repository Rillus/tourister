"use client";

import type { ActivitySuggestion } from "@/types/suggestions";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  getSeasonalTagLabel,
} from "@/types/suggestions";

interface SuggestionCardProps {
  suggestion: ActivitySuggestion;
  onAdd: () => void;
  onDismiss: () => void;
}

export function SuggestionCard({
  suggestion,
  onAdd,
  onDismiss,
}: SuggestionCardProps) {
  if (suggestion.dismissed) return null;

  return (
    <div className="group rounded-lg border border-foreground/8 bg-foreground/[0.01] p-3 transition hover:border-foreground/15">
      <div className="flex items-start gap-2.5">
        <span className="text-base mt-0.5" role="img" aria-label={suggestion.category}>
          {CATEGORY_ICONS[suggestion.category]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{suggestion.name}</p>
          {suggestion.nameLocal && (
            <p className="text-xs text-foreground/45 mt-0.5">
              {suggestion.nameLocal}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] rounded-full bg-foreground/5 px-2 py-0.5 text-foreground/50">
              {CATEGORY_LABELS[suggestion.category]}
            </span>
            <span className="text-[10px] text-foreground/35">
              {suggestion.distanceMetres}m away
            </span>
          </div>
          {suggestion.seasonalTags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {suggestion.seasonalTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-amber-700 dark:text-amber-400"
                >
                  {getSeasonalTagLabel(tag)}
                </span>
              ))}
            </div>
          )}
          {suggestion.description && (
            <p className="mt-1.5 text-xs text-foreground/50 line-clamp-2 leading-relaxed">
              {suggestion.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2.5 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={onAdd}
          className="flex-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 transition cursor-pointer"
        >
          + Add to trip
        </button>
        <button
          onClick={onDismiss}
          className="rounded-md border border-foreground/10 px-2.5 py-1.5 text-[11px] text-foreground/50 hover:text-foreground/70 hover:border-foreground/20 transition cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
