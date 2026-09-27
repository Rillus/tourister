"use client";

import { useState } from "react";
import type { TripItem } from "@/types/trip";
import { sortItemsByTime } from "@/types/trip";
import { hasValidCoordinates } from "@/lib/coordinates";
import {
  blockStyle,
  formatHour,
  hourLabels,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from "./day-plotter-utils";

interface DayPlotterProps {
  date: string;
  dayName?: string;
  items: TripItem[];
  onChangeItems: (items: TripItem[]) => void;
  onSetLocation?: (itemIndex: number) => void;
  onDayNameChange?: (name: string) => void;
}

function formatDisplayDate(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function DayPlotter({
  date,
  dayName,
  items,
  onChangeItems,
  onSetLocation,
  onDayNameChange,
}: DayPlotterProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const sorted = sortItemsByTime(items);
  const hours = hourLabels();
  const hourHeight = 48;
  const timelineHeight =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * hourHeight;

  const resetForm = () => {
    setName("");
    setStartTime("10:00");
    setEndTime("");
    setNotes("");
    setAdding(false);
    setEditingIndex(null);
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || !startTime) return;

    const payload: TripItem = {
      name: trimmed,
      latitude: 0,
      longitude: 0,
      startTime,
      endTime: endTime || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingIndex !== null) {
      const next = [...items];
      const original = items[editingIndex];
      next[editingIndex] = { ...original, ...payload };
      onChangeItems(sortItemsByTime(next));
    } else {
      onChangeItems(sortItemsByTime([...items, payload]));
    }
    resetForm();
  };

  const startEdit = (sortedIndex: number) => {
    const item = sorted[sortedIndex];
    const realIndex = items.findIndex((i) => i === item);
    setEditingIndex(realIndex >= 0 ? realIndex : sortedIndex);
    setName(item.name);
    setStartTime(item.startTime ?? "10:00");
    setEndTime(item.endTime ?? "");
    setNotes(item.notes ?? "");
    setAdding(true);
  };

  const removeItem = (sortedIndex: number) => {
    const item = sorted[sortedIndex];
    onChangeItems(items.filter((i) => i !== item));
  };

  return (
    <div className="rounded-xl border border-foreground/10 bg-background flex flex-col min-h-0">
      <div className="p-3 border-b border-foreground/10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{formatDisplayDate(date)}</h3>
            {onDayNameChange ? (
              <input
                type="text"
                value={dayName ?? ""}
                onChange={(e) => onDayNameChange(e.target.value)}
                placeholder="Day label (e.g. Shinjuku)"
                className="mt-1 w-full max-w-xs rounded border border-foreground/15 bg-background px-2 py-1 text-xs placeholder:text-foreground/30"
              />
            ) : (
              dayName && (
                <p className="text-xs text-foreground/50 mt-0.5">{dayName}</p>
              )
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setAdding(true);
            }}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            + Add activity
          </button>
        </div>

        {adding && (
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3 space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Activity name"
              required
              aria-label="Activity name"
              className="w-full rounded border border-foreground/15 px-3 py-2 text-sm"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <label className="text-xs text-foreground/50 flex items-center gap-1.5">
                Start
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  aria-label="Start time"
                  className="rounded border border-foreground/15 px-2 py-1 text-sm"
                />
              </label>
              <label className="text-xs text-foreground/50 flex items-center gap-1.5">
                End
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  aria-label="End time"
                  className="rounded border border-foreground/15 px-2 py-1 text-sm"
                />
              </label>
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              aria-label="Notes"
              className="w-full rounded border border-foreground/15 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                {editingIndex !== null ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-y-auto p-3 flex-1 min-h-0">
        <div className="relative flex" style={{ height: timelineHeight }}>
          <div className="w-12 shrink-0 relative text-[10px] text-foreground/40">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0"
                style={{
                  top: (h - TIMELINE_START_HOUR) * hourHeight,
                }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>

          <div className="flex-1 relative border-l border-foreground/10 ml-1">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-foreground/5"
                style={{ top: (h - TIMELINE_START_HOUR) * hourHeight }}
              />
            ))}

            {sorted.map((item, sortedIndex) => {
              const style = blockStyle(item.startTime, item.endTime);
              if (!style) {
                return (
                  <div
                    key={`untimed-${sortedIndex}`}
                    className="relative mt-1 rounded-lg border border-dashed border-foreground/20 px-2 py-1.5 text-xs"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-foreground/40 ml-2">No time</span>
                  </div>
                );
              }

              const realIndex = items.findIndex((i) => i === item);

              return (
                <div
                  key={`${item.name}-${item.startTime}-${sortedIndex}`}
                  className="absolute left-1 right-1 rounded-lg bg-blue-600/90 text-white px-2 py-1 overflow-hidden shadow-sm cursor-pointer hover:bg-blue-600"
                  style={{
                    top: `${style.topPercent}%`,
                    height: `${Math.max(style.heightPercent, 3)}%`,
                    minHeight: 28,
                  }}
                  onClick={() => startEdit(sortedIndex)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      startEdit(sortedIndex);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] opacity-80">
                        {item.startTime}
                        {item.endTime ? `–${item.endTime}` : ""}
                      </p>
                      {!hasValidCoordinates(item) && (
                        <p className="text-[10px] text-amber-200 mt-0.5">
                          No location
                        </p>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {onSetLocation && (
                        <button
                          type="button"
                          aria-label={
                            hasValidCoordinates(item)
                              ? `Move pin for ${item.name}`
                              : `Drop pin for ${item.name}`
                          }
                          title={
                            hasValidCoordinates(item) ? "Move pin" : "Drop pin"
                          }
                          onClick={() => onSetLocation(realIndex)}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold hover:bg-white/20 ${
                            !hasValidCoordinates(item)
                              ? "bg-amber-500 text-white"
                              : ""
                          }`}
                        >
                          {hasValidCoordinates(item) ? "📍" : "Drop pin"}
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(sortedIndex)}
                        className="rounded px-1 text-[10px] hover:bg-white/20"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {sorted.length === 0 && !adding && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-foreground/40">
                No activities — add one to start plotting this day
              </p>
            )}
          </div>
        </div>

        {sorted.some((i) => !hasValidCoordinates(i)) && (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-medium">
              Needs a pin
            </p>
            {sorted
              .filter((i) => !hasValidCoordinates(i))
              .map((item) => {
                const sortedIndex = sorted.indexOf(item);
                const realIndex = items.findIndex((i) => i === item);
                return (
                  <div
                    key={`unmapped-${sortedIndex}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80">
                        No location found
                      </p>
                    </div>
                    {onSetLocation && (
                      <button
                        type="button"
                        onClick={() => onSetLocation(realIndex)}
                        className="shrink-0 rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Drop pin
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {sorted.some((i) => !i.startTime) && (
          <div className="mt-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-foreground/40">
              Untimed
            </p>
            {sorted
              .filter((i) => !i.startTime)
              .map((item, i) => {
                const sortedIndex = sorted.indexOf(item);
                return (
                  <div
                    key={`list-untimed-${i}`}
                    className="flex items-center justify-between rounded-lg border border-foreground/10 px-3 py-2 text-sm"
                  >
                    <button
                      type="button"
                      className="text-left flex-1"
                      onClick={() => startEdit(sortedIndex)}
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(sortedIndex)}
                      className="text-foreground/40 hover:text-red-500 px-2"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
