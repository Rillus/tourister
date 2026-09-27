import type { Trip, TripDay } from "@/types/trip";
import { stopsToDays, sortItemsByTime } from "@/types/trip";

function formatDayLabel(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeSuffix(
  startTime?: string,
  endTime?: string
): string | undefined {
  if (!startTime) return undefined;
  return endTime ? `~${startTime}–${endTime}` : `~${startTime}`;
}

function formatItemLine(
  dayNum: number,
  dateLabel: string,
  item: {
    name: string;
    notes?: string;
    startTime?: string;
    endTime?: string;
  }
): string {
  const head = dateLabel
    ? `Day ${dayNum} (${dateLabel})`
    : `Day ${dayNum}`;

  const time = formatTimeSuffix(item.startTime, item.endTime);
  let notes = item.notes?.trim() || "";
  if (time) {
    notes = notes ? `${notes} ${time}` : time;
  }

  if (notes) {
    return `${head} - ${item.name} - ${notes}`;
  }
  return `${head} - ${item.name}`;
}

function daysForExport(trip: Trip): TripDay[] {
  if (trip.days.length > 0) return trip.days;
  return stopsToDays(trip.stops);
}

/**
 * Build a pasteable itinerary template from a trip.
 * Lines are compatible with parseItineraryText (title is a # comment).
 */
export function tripToTemplateText(trip: Trip): string {
  const days = daysForExport(trip);
  const lines: string[] = [`# ${trip.title}`];

  days.forEach((day, dayIndex) => {
    const dayNum = dayIndex + 1;
    const dateLabel = formatDayLabel(day.dateStart);
    const items = sortItemsByTime(day.items);

    if (items.length === 0) {
      const name = day.name?.trim() || "Free day";
      lines.push(formatItemLine(dayNum, dateLabel, { name }));
      return;
    }

    for (const item of items) {
      lines.push(
        formatItemLine(dayNum, dateLabel, {
          name: item.name,
          notes: item.notes,
          startTime: item.startTime,
          endTime: item.endTime,
        })
      );
    }
  });

  return lines.join("\n");
}

export function templateFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "trip"}-template.txt`;
}
