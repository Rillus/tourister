"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedTripTokens } from "@/lib/saved-trips";

interface TripSummary {
  id: string;
  title: string;
  shareToken: string;
  itemCount: number;
  updatedAt?: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = getSavedTripTokens();
    if (tokens.length === 0) {
      setLoading(false);
      return;
    }

    fetch(`/api/trips?tokens=${tokens.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        setTrips(data.trips ?? []);
      })
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">My Trips</h1>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + New trip
          </Link>
        </div>

        {loading && (
          <p className="text-foreground/60 animate-pulse py-8">Loading…</p>
        )}

        {!loading && trips.length === 0 && (
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-8 text-center">
            <p className="text-foreground/60 mb-4">
              No saved trips yet. Create a trip to see it here.
            </p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create your first trip
            </Link>
          </div>
        )}

        {!loading && trips.length > 0 && (
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.shareToken}
                className="rounded-xl border border-foreground/10 bg-background p-4 hover:border-foreground/20 transition"
              >
                <h2 className="font-semibold truncate">{trip.title}</h2>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {trip.itemCount} stop{trip.itemCount !== 1 ? "s" : ""}
                  {trip.updatedAt &&
                    ` · Updated ${new Date(trip.updatedAt).toLocaleDateString()}`}
                </p>
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/share/${trip.shareToken}`}
                    className="flex-1 rounded-lg border border-foreground/15 px-3 py-1.5 text-sm font-medium hover:bg-foreground/5 transition text-center"
                  >
                    View
                  </Link>
                  <Link
                    href={`/trips/${trip.shareToken}/edit`}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition text-center"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
