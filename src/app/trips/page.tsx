"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedTripTokens, removeSavedTripToken } from "@/lib/saved-trips";
import {
  clearTripPassword,
  storeTripPassword,
  tripPasswordHeaders,
} from "@/lib/trip-auth-client";
import {
  templateFilename,
  tripToTemplateText,
} from "@/lib/trip-template";
import type { Trip } from "@/types/trip";

interface TripSummary {
  id: string;
  title: string;
  shareToken: string;
  itemCount: number;
  updatedAt?: string;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchWithTripPassword(
  url: string,
  token: string,
  init: RequestInit = {}
): Promise<Response> {
  const attempt = (password?: string | null) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...tripPasswordHeaders(token, password),
      },
    });

  let res = await attempt();
  if (res.status !== 401) return res;

  const entered = window.prompt("This trip is password-protected. Enter the password:");
  if (!entered?.trim()) return res;
  storeTripPassword(token, entered.trim());
  res = await attempt(entered.trim());
  return res;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  async function handleExport(trip: TripSummary) {
    setActionError(null);
    setBusyToken(trip.shareToken);
    try {
      const res = await fetchWithTripPassword(
        `/api/share/${trip.shareToken}`,
        trip.shareToken
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ??
            (res.status === 401
              ? "Password required to export this trip"
              : "Could not load trip")
        );
      }
      const data = (await res.json()) as Trip;
      const text = tripToTemplateText(data);
      downloadTextFile(templateFilename(data.title || trip.title), text);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not export template"
      );
    } finally {
      setBusyToken(null);
    }
  }

  async function handleDelete(trip: TripSummary) {
    const confirmed = window.confirm(
      `Delete “${trip.title}” permanently? This cannot be undone.`
    );
    if (!confirmed) return;

    setActionError(null);
    setBusyToken(trip.shareToken);
    try {
      const res = await fetchWithTripPassword(
        `/api/trips/${trip.shareToken}`,
        trip.shareToken,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ??
            (res.status === 401
              ? "Password required to delete this trip"
              : "Could not delete trip")
        );
      }
      removeSavedTripToken(trip.shareToken);
      clearTripPassword(trip.shareToken);
      setTrips((prev) => prev.filter((t) => t.shareToken !== trip.shareToken));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete trip"
      );
    } finally {
      setBusyToken(null);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold tracking-tight">My Trips</h1>
          <div className="flex items-center gap-3 text-sm shrink-0">
            <Link
              href="/format"
              className="text-foreground/50 hover:text-foreground/80"
            >
              Format
            </Link>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              + New trip
            </Link>
          </div>
        </div>

        {actionError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </p>
        )}

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
            {trips.map((trip) => {
              const busy = busyToken === trip.shareToken;
              return (
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
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link
                      href={`/share/${trip.shareToken}`}
                      className="flex-1 min-w-[5.5rem] rounded-lg border border-foreground/15 px-3 py-1.5 text-sm font-medium hover:bg-foreground/5 transition text-center"
                    >
                      View
                    </Link>
                    <Link
                      href={`/trips/${trip.shareToken}/edit`}
                      className="flex-1 min-w-[5.5rem] rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition text-center"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleExport(trip)}
                      className="flex-1 min-w-[5.5rem] rounded-lg border border-foreground/15 px-3 py-1.5 text-sm font-medium hover:bg-foreground/5 transition disabled:opacity-50"
                      title="Download itinerary as pasteable template"
                    >
                      {busy ? "…" : "Export"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(trip)}
                      className="flex-1 min-w-[5.5rem] rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
