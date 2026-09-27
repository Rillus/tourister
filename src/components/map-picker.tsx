"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface PlaceResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

interface MapPickerProps {
  /** Camera centre when the picker opens (prefer the user's last map view) */
  initialCenter?: { lat: number; lon: number };
  /** Camera zoom when the picker opens */
  initialZoom?: number;
  /** Prefill the search box (usually the stop/activity title) */
  initialQuery?: string;
  /** Existing coordinates to show a marker (does not move the camera) */
  latitude?: number;
  longitude?: number;
  onSelect: (lat: number, lon: number) => void;
  onCancel: () => void;
}

function hasCoords(lat?: number, lon?: number): boolean {
  return (
    lat != null && lon != null && !(lat === 0 && lon === 0)
  );
}

export function MapPicker({
  initialCenter = { lat: 35.6762, lon: 139.6503 },
  initialZoom = 12,
  initialQuery = "",
  latitude,
  longitude,
  onSelect,
  onCancel,
}: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(
    hasCoords(latitude, longitude)
      ? { lat: latitude!, lon: longitude! }
      : null
  );
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const placeMarker = useCallback((lat: number, lon: number) => {
    if (!map.current) return;

    marker.current?.remove();
    const el = document.createElement("div");
    el.className = "stop-marker";
    el.innerHTML = "<span>📍</span>";
    marker.current = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([lon, lat])
      .addTo(map.current);

    marker.current.on("dragend", () => {
      const pos = marker.current!.getLngLat();
      setPicked({ lat: pos.lat, lon: pos.lng });
    });

    setPicked({ lat, lon });
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    // Always open on the caller's last view — don't jump to an existing pin.
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [initialCenter.lon, initialCenter.lat],
      zoom: initialZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (hasCoords(latitude, longitude)) {
      placeMarker(latitude!, longitude!);
    }

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.lngLat) return;
      placeMarker(e.lngLat.lat, e.lngLat.lng);
      setResults([]);
    };

    map.current.on("click", handleMapClick);

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
    // Mount once when the picker opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;

      setSearching(true);
      setSearchError(null);
      try {
        const params = new URLSearchParams({ q });
        params.set("latitude", String(initialCenter.lat));
        params.set("longitude", String(initialCenter.lon));
        const res = await fetch(`/api/places?${params}`);
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { places?: PlaceResult[] };
        const places = data.places ?? [];
        setResults(places);
        if (places.length === 0) {
          setSearchError("No places found");
        }
      } catch {
        setSearchError("Search failed");
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [query, initialCenter]
  );

  const handleChooseResult = useCallback(
    (place: PlaceResult) => {
      placeMarker(place.latitude, place.longitude);
      map.current?.flyTo({
        center: [place.longitude, place.latitude],
        zoom: Math.max(initialZoom, 14),
        duration: 800,
      });
      setResults([]);
      setQuery(place.displayName.split(",")[0] ?? place.displayName);
    },
    [placeMarker, initialZoom]
  );

  const handleConfirm = useCallback(() => {
    if (picked) {
      onSelect(picked.lat, picked.lon);
    }
  }, [picked, onSelect]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex flex-col gap-3 p-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            Search for a place, or click the map / drag the pin
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm hover:bg-foreground/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!picked}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <label htmlFor="place-search" className="sr-only">
            Search for a place
          </label>
          <input
            id="place-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Fushimi Inari, Kyoto"
            className="flex-1 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            disabled={!query.trim() || searching}
            className="rounded-lg border border-foreground/15 px-3 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50 cursor-pointer"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>

        {searchError && (
          <p className="text-xs text-red-600" role="alert">
            {searchError}
          </p>
        )}

        {results.length > 0 && (
          <ul className="max-h-40 overflow-y-auto rounded-lg border border-foreground/10 divide-y divide-foreground/8">
            {results.map((place) => (
              <li key={`${place.latitude}-${place.longitude}-${place.displayName}`}>
                <button
                  type="button"
                  onClick={() => handleChooseResult(place)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-foreground/5 cursor-pointer"
                >
                  {place.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div ref={mapContainer} className="flex-1 min-h-0" />
    </div>
  );
}
