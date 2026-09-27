"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TripEditor } from "@/components/trip-editor";
import type { Trip, TripDay } from "@/types/trip";
import { stopsToDays } from "@/types/trip";

export default function EditTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/share/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Trip not found");
        return res.json();
      })
      .then((data) => {
        let days: TripDay[] = data.days ?? [];
        if (days.length === 0 && data.stops?.length > 0) {
          days = stopsToDays(data.stops);
        }
        setTrip({
          id: data.id,
          title: data.title,
          shareToken: data.shareToken,
          days,
          stops: data.stops ?? [],
        });
      })
      .catch(() => setError("Trip not found"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = useCallback(
    async (updated: { title: string; days: TripDay[] }) => {
      if (!token) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/trips/${token}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updated.title,
            days: updated.days.map((d) => ({
              dateStart: d.dateStart,
              dateEnd: d.dateEnd,
              name: d.name,
              sortOrder: d.sortOrder,
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
        if (!res.ok) throw new Error("Save failed");
        router.push(`/share/${token}`);
      } catch {
        setError("Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [token, router]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-foreground/60">{error ?? "Trip not found"}</p>
        <Link href="/trips" className="text-blue-600 hover:underline">
          ← Back to My Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/trips"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            ← Trips
          </Link>
          <Link
            href={`/share/${token}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View map
          </Link>
        </div>
        <TripEditor trip={trip} onSave={handleSave} isSaving={saving} />
      </div>
    </div>
  );
}
