"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapPickerProps {
  /** Initial center when no existing coords */
  initialCenter?: { lat: number; lon: number };
  /** Existing coordinates to show marker */
  latitude?: number;
  longitude?: number;
  onSelect: (lat: number, lon: number) => void;
  onCancel: () => void;
}

export function MapPicker({
  initialCenter = { lat: 35.6762, lon: 139.6503 },
  latitude,
  longitude,
  onSelect,
  onCancel,
}: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lon: longitude } : null
  );

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const center = picked ?? {
      lon: initialCenter.lon,
      lat: initialCenter.lat,
    };

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center.lon, center.lat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (picked) {
      const el = document.createElement("div");
      el.className = "stop-marker";
      el.innerHTML = "<span>📍</span>";
      marker.current = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([picked.lon, picked.lat])
        .addTo(map.current);

      marker.current.on("dragend", () => {
        const pos = marker.current!.getLngLat();
        setPicked({ lat: pos.lat, lon: pos.lng });
      });
    }

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!map.current || !e.lngLat) return;
      const { lat, lng } = e.lngLat;

      marker.current?.remove();
      const el = document.createElement("div");
      el.className = "stop-marker";
      el.innerHTML = "<span>📍</span>";
      marker.current = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(map.current);

      marker.current.on("dragend", () => {
        const pos = marker.current!.getLngLat();
        setPicked({ lat: pos.lat, lon: pos.lng });
      });

      setPicked({ lat, lon: lng });
    };

    map.current.on("click", handleMapClick);

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, []);

  const handleConfirm = useCallback(() => {
    if (picked) {
      onSelect(picked.lat, picked.lon);
    }
  }, [picked, onSelect]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between p-3 border-b border-foreground/10">
        <p className="text-sm text-foreground/70">
          Click on the map to set location, or drag the marker to adjust
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm hover:bg-foreground/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!picked}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
      <div ref={mapContainer} className="flex-1 min-h-0" />
    </div>
  );
}
