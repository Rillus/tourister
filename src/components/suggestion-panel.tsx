"use client";

import { useState, useEffect, useCallback } from "react";
import { SuggestionCard } from "./suggestion-card";
import type { ActivitySuggestion, ActivityCategory } from "@/types/suggestions";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/types/suggestions";
import type { EnrichedStop } from "@/types/enrichment";

interface SuggestionPanelProps {
  stop: EnrichedStop;
  onAddToTrip: (suggestion: ActivitySuggestion) => void;
  /** Called when suggestions are loaded (for map markers). Only fires when showing all categories. */
  onSuggestionsLoaded?: (suggestions: ActivitySuggestion[]) => void;
}

const ALL_CATEGORIES: ActivityCategory[] = [
  "food_and_drink",
  "culture_and_history",
  "nature_and_parks",
  "shopping",
  "nightlife",
  "experiences",
];

export function SuggestionPanel({
  stop,
  onAddToTrip,
  onSuggestionsLoaded,
}: SuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    ActivityCategory | "all"
  >("all");
  const [categoryCounts, setCategoryCounts] = useState<
    Record<string, number>
  >({});

  const month = stop.dateStart
    ? parseInt(stop.dateStart.split("-")[1], 10)
    : undefined;

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        latitude: stop.latitude,
        longitude: stop.longitude,
        radiusMetres: 1000,
        limit: 20,
      };
      if (month) body.month = month;
      if (activeCategory !== "all") body.category = activeCategory;

      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) return;

      const data = await res.json();
      setSuggestions(data.suggestions);
      if (activeCategory === "all") {
        setCategoryCounts(data.categoryCounts);
        onSuggestionsLoaded?.(data.suggestions);
      }
    } catch {
      // Silently fail — suggestions are non-critical
    } finally {
      setIsLoading(false);
    }
  }, [stop.latitude, stop.longitude, month, activeCategory, onSuggestionsLoaded]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleDismiss = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, dismissed: true } : s))
    );
  };

  const visibleSuggestions = suggestions.filter((s) => !s.dismissed);

  return (
    <div className="border-t border-foreground/10">
      <div className="px-3 pt-3 pb-2">
        <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
          Nearby activities
        </h3>
      </div>

      {/* Category filter chips */}
      <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
            activeCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
          }`}
        >
          All
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
              }`}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              {count > 0 && activeCategory === "all" && (
                <span className="ml-1 text-[9px] opacity-70">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Suggestions list */}
      <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
        {isLoading && (
          <p className="text-xs text-foreground/40 py-4 text-center animate-pulse">
            Finding nearby activities…
          </p>
        )}
        {!isLoading && visibleSuggestions.length === 0 && (
          <p className="text-xs text-foreground/40 py-4 text-center">
            No suggestions found nearby.
          </p>
        )}
        {!isLoading &&
          visibleSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAdd={() => onAddToTrip(suggestion)}
              onDismiss={() => handleDismiss(suggestion.id)}
            />
          ))}
      </div>
    </div>
  );
}
