"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { StopCard } from "./stop-card";
import { SuggestionPanel } from "./suggestion-panel";
import { MapPicker } from "./map-picker";
import { TripCalendar } from "./trip-calendar";
import { TripSummaryCard } from "./trip-summary-card";
import { CollapsibleSection } from "./collapsible-section";
import type { EnrichedStop } from "@/types/enrichment";
import type { ActivitySuggestion } from "@/types/suggestions";
import { stopsToDays } from "@/types/trip";
import { hasValidCoordinates } from "@/lib/coordinates";
import { tripPasswordHeaders } from "@/lib/trip-auth-client";
import {
  getSidebarCollapsed,
  setSidebarSectionCollapsed,
  type SidebarCollapsedState,
  type SidebarSectionId,
} from "@/lib/sidebar-collapse";

/** Format YYYY-MM-DD as "1 Nov" */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getDaysFromStops(stops: EnrichedStop[]): { date: string; label: string; dayNum: number }[] {
  const dates = new Set<string>();
  stops.forEach((s) => {
    if (s.dateStart) dates.add(s.dateStart);
  });
  const sorted = Array.from(dates).sort();
  return sorted.map((date, i) => ({
    date,
    label: `Day ${i + 1} — ${formatShortDate(date)}`,
    dayNum: i + 1,
  }));
}

interface TripMapProps {
  stops: EnrichedStop[];
  onBack: () => void;
  enrichmentRate?: number;
  shareUrl?: string | null;
  shareToken?: string | null;
  readOnly?: boolean;
  title?: string;
}

export function TripMap({
  stops: initialStops,
  onBack,
  enrichmentRate,
  shareUrl,
  shareToken,
  readOnly,
  title = "Trip",
}: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [stops, setStops] = useState<EnrichedStop[]>(initialStops);
  const [activeDay, setActiveDay] = useState<"all" | string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pickingPinIndex, setPickingPinIndex] = useState<number | null>(null);
  const [enrichingIndex, setEnrichingIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<SidebarCollapsedState>({
    summary: false,
    calendar: false,
    stops: false,
  });
  const [mapView, setMapView] = useState<{
    center: { lat: number; lon: number };
    zoom: number;
  } | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const suggestionMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const stopCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const allowPinEdit = Boolean(shareToken) || !readOnly;

  useEffect(() => {
    setCollapsed(getSidebarCollapsed());
  }, []);

  const toggleSection = useCallback((id: SidebarSectionId, next: boolean) => {
    setCollapsed((prev) => ({ ...prev, [id]: next }));
    setSidebarSectionCollapsed(id, next);
  }, []);

  const handleShare = useCallback(() => {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, [shareUrl]);

  const days = getDaysFromStops(stops);
  const tripDays = useMemo(() => stopsToDays(stops), [stops]);
  const filteredStops = useMemo(
    () =>
      activeDay === "all"
        ? stops
        : stops.filter((s) => s.dateStart === activeDay),
    [stops, activeDay]
  );
  const mappedStops = useMemo(
    () => filteredStops.filter(hasValidCoordinates),
    [filteredStops]
  );

  const flyTo = useCallback((stop: EnrichedStop, zoom = 13) => {
    if (!hasValidCoordinates(stop)) return;
    map.current?.flyTo({
      center: [stop.longitude, stop.latitude],
      zoom,
      duration: 1000,
    });
  }, []);

  const handleAddToTrip = useCallback(
    (suggestion: ActivitySuggestion) => {
      if (readOnly) return;

      const newStop: EnrichedStop = {
        name: suggestion.name,
        nameLocal: suggestion.nameLocal,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        dateStart: selectedIndex !== null ? filteredStops[selectedIndex]?.dateStart : undefined,
      };

      setStops((prev) => {
        if (selectedIndex === null) return [...prev, newStop];
        const insertAfter = filteredStops[selectedIndex];
        const fullIndex = prev.findIndex((s) => s === insertAfter);
        const insertAt = fullIndex >= 0 ? fullIndex + 1 : prev.length;
        const updated = [...prev];
        updated.splice(insertAt, 0, newStop);
        return updated;
      });
      setHasUnsavedChanges(true);
    },
    [selectedIndex, filteredStops, readOnly]
  );

  const handleUpdateNotes = useCallback((index: number, notes: string) => {
    setStops((prev) => {
      const updated = [...prev];
      const fullIndex = prev.findIndex((s) => s === filteredStops[index]);
      if (fullIndex < 0) return prev;
      updated[fullIndex] = { ...updated[fullIndex], notes };
      return updated;
    });
    setHasUnsavedChanges(true);
  }, [filteredStops]);

  const handleUpdateTitle = useCallback((index: number, name: string) => {
    setStops((prev) => {
      const updated = [...prev];
      const fullIndex = prev.findIndex((s) => s === filteredStops[index]);
      if (fullIndex < 0) return prev;
      updated[fullIndex] = { ...updated[fullIndex], name };
      return updated;
    });
    setHasUnsavedChanges(true);
  }, [filteredStops]);

  const handleFetchEnrichment = useCallback(
    async (index: number) => {
      const stop = filteredStops[index];
      if (!stop?.name.trim()) return;
      setEnrichingIndex(index);
      try {
        const res = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stops: [
              {
                name: stop.name,
                nameLocal: stop.nameLocal,
                latitude: stop.latitude,
                longitude: stop.longitude,
                dateStart: stop.dateStart,
                dateEnd: stop.dateEnd,
                notes: stop.notes,
              },
            ],
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          stops?: EnrichedStop[];
        };
        const enriched = data.stops?.[0];
        if (!enriched) return;

        setStops((prev) => {
          const updated = [...prev];
          const fullIndex = prev.findIndex((s) => s === filteredStops[index]);
          if (fullIndex < 0) return prev;
          updated[fullIndex] = {
            ...updated[fullIndex],
            nameLocal: enriched.nameLocal ?? updated[fullIndex].nameLocal,
            enrichment: enriched.enrichment,
          };
          return updated;
        });
        setHasUnsavedChanges(true);
      } finally {
        setEnrichingIndex(null);
      }
    },
    [filteredStops]
  );

  const handleAddActivity = useCallback(() => {
    if (readOnly) return;

    const anchor = selectedIndex !== null ? filteredStops[selectedIndex] : stops[0];
    const dateStart = anchor?.dateStart ?? new Date().toISOString().slice(0, 10);
    const lat = anchor?.latitude ?? 35.6762;
    const lon = anchor?.longitude ?? 139.6503;

    const newStop: EnrichedStop = {
      name: "New activity",
      latitude: lat,
      longitude: lon,
      dateStart,
      dateEnd: dateStart,
    };

    setStops((prev) => {
      if (selectedIndex === null || prev.length === 0) return [...prev, newStop];
      const insertAfter = filteredStops[selectedIndex];
      const fullIndex = prev.findIndex((s) => s === insertAfter);
      const insertAt = fullIndex >= 0 ? fullIndex + 1 : prev.length;
      const updated = [...prev];
      updated.splice(insertAt, 0, newStop);
      return updated;
    });
    setHasUnsavedChanges(true);
  }, [selectedIndex, filteredStops, stops, readOnly]);

  const handleSave = useCallback(async () => {
    if (!shareToken || !allowPinEdit) return;
    setIsSaving(true);
    try {
      const days = stopsToDays(stops);
      const res = await fetch(`/api/trips/${shareToken}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...tripPasswordHeaders(shareToken),
        },
        body: JSON.stringify({
          days: days.map((d, i) => ({
            ...d,
            sortOrder: i,
            items: d.items.map((item) => ({
              name: item.name,
              nameLocal: item.nameLocal,
              latitude: item.latitude,
              longitude: item.longitude,
              notes: item.notes,
              startTime: item.startTime,
              endTime: item.endTime,
              enrichment: item.enrichment,
            })),
          })),
        }),
      });
      if (res.ok) setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [shareToken, stops, allowPinEdit]);

  const handleSuggestionsLoaded = useCallback((loaded: ActivitySuggestion[]) => {
    setSuggestions(loaded);
  }, []);

  // Clear suggestions when selected stop changes (new panel will load its own)
  useEffect(() => {
    setSuggestions([]);
  }, [selectedIndex]);

  // Reset selected stop when day filter changes
  useEffect(() => {
    setSelectedIndex(null);
  }, [activeDay]);

  // Scroll sidebar to selected item when pin is clicked
  useEffect(() => {
    if (selectedIndex !== null) {
      stopCardRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");
      return;
    }

    mapboxgl.accessToken = token;

    const defaultCenter: [number, number] = mappedStops[0]
      ? [mappedStops[0].longitude, mappedStops[0].latitude]
      : [139.6503, 35.6762];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: defaultCenter,
      zoom: mappedStops.length > 0 ? 5 : 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    const syncView = () => {
      if (!map.current) return;
      const c = map.current.getCenter();
      setMapView({
        center: { lat: c.lat, lon: c.lng },
        zoom: map.current.getZoom(),
      });
    };
    map.current.on("moveend", syncView);

    map.current.on("load", () => {
      if (!map.current) return;

      mappedStops.forEach((stop) => {
        const index = filteredStops.indexOf(stop);
        const el = document.createElement("div");
        el.className = "stop-marker";
        el.innerHTML = `<span>${index + 1}</span>`;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([stop.longitude, stop.latitude])
          .addTo(map.current!);

        marker.getElement().addEventListener("click", () => {
          setSelectedIndex(index);
          flyTo(stop);
        });

        markersRef.current.push(marker);
      });

      if (mappedStops.length > 1) {
        const coordinates = mappedStops.map((s) => [s.longitude, s.latitude]);

        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates },
          },
        });

        map.current.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2.5,
            "line-dasharray": [2, 2],
          },
        });
      }

      if (mappedStops.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        mappedStops.forEach((s) => bounds.extend([s.longitude, s.latitude]));
        map.current.fitBounds(bounds, { padding: 60 });
      }

      syncView();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      suggestionMarkersRef.current.forEach((m) => m.remove());
      suggestionMarkersRef.current = [];
      map.current?.remove();
    };
  }, [filteredStops, mappedStops, flyTo]);

  // Add suggestion markers when a stop is selected and suggestions are loaded
  useEffect(() => {
    if (!map.current || selectedIndex === null || suggestions.length === 0) {
      suggestionMarkersRef.current.forEach((m) => m.remove());
      suggestionMarkersRef.current = [];
      return;
    }

    const addSuggestionMarkers = () => {
      if (!map.current) return;

      suggestionMarkersRef.current.forEach((m) => m.remove());
      suggestionMarkersRef.current = [];

      suggestions.forEach((suggestion) => {
        const el = document.createElement("div");
        el.className = "suggestion-marker";
        el.innerHTML = `<span>•</span>`;
        el.title = suggestion.name;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([suggestion.longitude, suggestion.latitude])
          .addTo(map.current!);

        suggestionMarkersRef.current.push(marker);
      });
    };

    if (map.current.isStyleLoaded()) {
      addSuggestionMarkers();
    } else {
      map.current.once("load", addSuggestionMarkers);
    }

    return () => {
      suggestionMarkersRef.current.forEach((m) => m.remove());
      suggestionMarkersRef.current = [];
    };
  }, [selectedIndex, suggestions]);

  const selectedStop =
    selectedIndex !== null ? filteredStops[selectedIndex] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10 shrink-0">
        <button
          onClick={onBack}
          className="text-sm text-foreground/60 hover:text-foreground transition cursor-pointer shrink-0"
        >
          ← Back
        </button>
        <h2 className="text-sm font-semibold shrink-0">
          {filteredStops.length} stop{filteredStops.length !== 1 && "s"}
        </h2>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {enrichmentRate !== undefined && (
            <span className="text-xs text-foreground/40">
              {enrichmentRate}% enriched
            </span>
          )}
          {shareToken && (
            <Link
              href={`/trips/${shareToken}/edit`}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 transition cursor-pointer shrink-0"
            >
              Edit trip
            </Link>
          )}
          {shareUrl && !readOnly && (
            <button
              onClick={handleShare}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 transition cursor-pointer"
            >
              {copyFeedback ? "Copied!" : "Share"}
            </button>
          )}
          {hasUnsavedChanges && shareToken && allowPinEdit && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition cursor-pointer"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* Day-by-day tabs removed — calendar lives in the left sidebar */}

      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar toggle (mobile) */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="md:hidden absolute top-3 left-14 z-10 rounded-lg bg-background/95 backdrop-blur border border-foreground/10 px-3 py-1.5 text-xs font-medium shadow-sm cursor-pointer"
          aria-label={sidebarOpen ? "Hide stops" : "Show stops"}
        >
          {sidebarOpen ? "Hide" : "Stops"}
        </button>

        {/* Sidebar - drawer on mobile, always visible on md+ */}
        <div
          className={`md:relative md:translate-x-0 md:shadow-none w-96 border-r border-foreground/10 overflow-y-auto shrink-0 bg-background
            max-md:fixed max-md:left-0 max-md:top-[3.25rem] max-md:bottom-0 max-md:z-20 max-md:w-[min(20rem,85vw)] max-md:transition-transform max-md:duration-200 max-md:ease-out
            ${sidebarOpen ? "max-md:translate-x-0 max-md:shadow-xl" : "max-md:-translate-x-full"}`}
        >
          <CollapsibleSection
            id="summary"
            title="Summary"
            collapsed={collapsed.summary}
            onCollapsedChange={(next) => toggleSection("summary", next)}
          >
            <TripSummaryCard
              title={title}
              stops={stops}
              activeDay={activeDay}
            />
          </CollapsibleSection>

          {tripDays.length > 0 && (
            <CollapsibleSection
              id="calendar"
              title="Calendar"
              collapsed={collapsed.calendar}
              onCollapsedChange={(next) => toggleSection("calendar", next)}
              headerAction={
                activeDay !== "all" ? (
                  <button
                    type="button"
                    onClick={() => setActiveDay("all")}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    All days
                  </button>
                ) : null
              }
            >
              <TripCalendar
                days={tripDays}
                selectedDate={activeDay === "all" ? null : activeDay}
                onSelectDate={(date) => setActiveDay(date)}
                showWeather={false}
              />
            </CollapsibleSection>
          )}

          <CollapsibleSection
            id="stops"
            title="Stops"
            collapsed={collapsed.stops}
            onCollapsedChange={(next) => toggleSection("stops", next)}
          >
          <div className="space-y-3">
            {activeDay !== "all" && (
              <p className="text-[11px] text-foreground/50">
                Showing{" "}
                {days.find((d) => d.date === activeDay)?.label ??
                  formatShortDate(activeDay)}{" "}
                · {filteredStops.length} stop
                {filteredStops.length !== 1 ? "s" : ""}
              </p>
            )}
            {filteredStops.map((stop, index) => {
              const prevStop = filteredStops[index - 1];
              const showDayDivider =
                activeDay === "all" &&
                (index === 0 ||
                  (stop.dateStart ?? "undated") !==
                    (prevStop?.dateStart ?? "undated"));
              const dayInfo = days.find((d) => d.date === stop.dateStart);

              return (
                <div key={`${stop.name}-${index}`}>
                  {showDayDivider && (
                    <div
                      className="mb-2 mt-4 first:mt-0 pt-2 first:pt-0 border-t border-foreground/10 first:border-t-0 text-xs font-medium text-foreground/50 uppercase tracking-wide"
                      aria-hidden
                    >
                      {dayInfo?.label ?? (stop.dateStart ? formatShortDate(stop.dateStart) : "Undated")}
                    </div>
                  )}
                  <div
                    ref={(el) => {
                      stopCardRefs.current[index] = el;
                    }}
                  >
                    <StopCard
                      stop={stop}
                      index={index}
                      isSelected={selectedIndex === index}
                      onSelect={() => {
                        setSelectedIndex(index);
                        flyTo(stop);
                      }}
                      editable={allowPinEdit}
                      onTitleChange={
                        !readOnly
                          ? (name) => handleUpdateTitle(index, name)
                          : undefined
                      }
                      onNotesChange={
                        !readOnly
                          ? (notes) => handleUpdateNotes(index, notes)
                          : undefined
                      }
                      onDropPin={
                        allowPinEdit
                          ? () => setPickingPinIndex(index)
                          : undefined
                      }
                      onFetchEnrichment={
                        !readOnly
                          ? () => void handleFetchEnrichment(index)
                          : undefined
                      }
                      isEnriching={enrichingIndex === index}
                    />
                {/* Show suggestions panel and add activity under the selected stop */}
                {selectedIndex === index &&
                  selectedStop &&
                  !readOnly &&
                  hasValidCoordinates(selectedStop) && (
                  <div className="mt-2 ml-2 rounded-lg border border-foreground/8 bg-foreground/[0.01] overflow-hidden">
                    <div className="p-2 border-b border-foreground/8">
                      <button
                        type="button"
                        onClick={handleAddActivity}
                        className="w-full rounded-lg border border-dashed border-foreground/20 px-3 py-2 text-xs font-medium text-foreground/60 hover:border-blue-500/50 hover:text-blue-600 transition"
                      >
                        + Add activity
                      </button>
                    </div>
                    <SuggestionPanel
                      stop={selectedStop}
                      onAddToTrip={handleAddToTrip}
                      onSuggestionsLoaded={handleSuggestionsLoaded}
                    />
                  </div>
                )}
                  </div>
                </div>
              );
            })}
            {!readOnly && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="w-full rounded-lg border border-dashed border-foreground/20 px-3 py-2 text-xs font-medium text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition"
                >
                  + Add activity
                </button>
              </div>
            )}
          </div>
          </CollapsibleSection>
        </div>

        {/* Sidebar backdrop (mobile) */}
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-[19] bg-black/30 cursor-pointer"
            aria-label="Close sidebar"
          />
        )}

        {/* Map */}
        <div ref={mapContainer} className="flex-1 min-w-0" />
      </div>

      {pickingPinIndex !== null && filteredStops[pickingPinIndex] && (
        <MapPicker
          initialCenter={
            mapView?.center ??
            (mappedStops.length > 0
              ? {
                  lat:
                    mappedStops.reduce((s, p) => s + p.latitude, 0) /
                    mappedStops.length,
                  lon:
                    mappedStops.reduce((s, p) => s + p.longitude, 0) /
                    mappedStops.length,
                }
              : undefined)
          }
          initialZoom={mapView?.zoom}
          initialQuery={filteredStops[pickingPinIndex].name}
          latitude={
            hasValidCoordinates(filteredStops[pickingPinIndex])
              ? filteredStops[pickingPinIndex].latitude
              : undefined
          }
          longitude={
            hasValidCoordinates(filteredStops[pickingPinIndex])
              ? filteredStops[pickingPinIndex].longitude
              : undefined
          }
          onSelect={(lat, lon) => {
            const filtered = filteredStops[pickingPinIndex];
            setStops((prev) => {
              const fullIndex = prev.findIndex((s) => s === filtered);
              if (fullIndex < 0) return prev;
              const updated = [...prev];
              updated[fullIndex] = {
                ...updated[fullIndex],
                latitude: lat,
                longitude: lon,
              };
              return updated;
            });
            setHasUnsavedChanges(true);
            setPickingPinIndex(null);
            setSelectedIndex(pickingPinIndex);
          }}
          onCancel={() => setPickingPinIndex(null)}
        />
      )}
    </div>
  );
}
