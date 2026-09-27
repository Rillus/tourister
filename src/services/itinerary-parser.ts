import type { ParsedItinerary, ParsedStop } from "@/types/itinerary";

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

function padDay(day: string): string {
  return day.padStart(2, "0");
}

function parseMonthName(name: string): string | undefined {
  return MONTHS[name.toLowerCase()];
}

function inferYear(month: string): string {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const parsedMonth = parseInt(month, 10);
  if (parsedMonth >= currentMonth) {
    return now.getFullYear().toString();
  }
  return (now.getFullYear() + 1).toString();
}

interface ExtractedDate {
  dateStart?: string;
  dateEnd?: string;
}

interface DateExtractionResult {
  dates: ExtractedDate;
  rest: string;
  /** Location extracted directly from "Day X: Location (date)" format */
  locationFromDayLabel?: string;
}

function extractDates(line: string): DateExtractionResult {
  let rest = line;
  const dates: ExtractedDate = {};
  let locationFromDayLabel: string | undefined;

  // Format: "Day X: Location (DD Month YYYY?)" — location is between colon and parens
  const dayColonLocationDatePattern =
    /Day\s+\d+(?:-\d+)?:\s*(.+?)\s*\((\d{1,2})\s+(\w+)(?:\s+(\d{4}))?\)/i;

  // Format: "Day X (DD Mon YYYY?)" — date in parens after Day N
  const dayParenDatePattern =
    /Day\s+\d+(?:-\d+)?\s*\((\d{1,2})\s+(\w+)(?:\s+(\d{4}))?\)/i;

  // Format: "Day X-Y, D-D Mon YYYY?" or "Day X, D Mon YYYY?"
  const dayPrefixRangePattern =
    /Day\s+\d+(?:-\d+)?,?\s*(\d{1,2})-(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/i;
  const dayPrefixSinglePattern =
    /Day\s+\d+(?:-\d+)?,?\s*(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/i;

  // Format: "D-D Mon YYYY" (no Day prefix)
  const rangeMonthPattern = /(\d{1,2})-(\d{1,2})\s+(\w+)\s+(\d{4})/;
  const singleMonthPattern = /(\d{1,2})\s+(\w+)\s+(\d{4})/;

  const slashDatePattern = /(\d{2})\/(\d{2})\/(\d{4})/;
  const isoDatePattern = /(\d{4})-(\d{2})-(\d{2})/;

  let match: RegExpMatchArray | null;

  if ((match = rest.match(dayColonLocationDatePattern))) {
    const month = parseMonthName(match[3]);
    if (month) {
      const year = match[4] || inferYear(month);
      dates.dateStart = `${year}-${month}-${padDay(match[2])}`;
      locationFromDayLabel = match[1].trim();
      rest = rest.replace(match[0], "").trim();
    }
  } else if ((match = rest.match(dayParenDatePattern))) {
    const month = parseMonthName(match[2]);
    if (month) {
      const year = match[3] || inferYear(month);
      dates.dateStart = `${year}-${month}-${padDay(match[1])}`;
      rest = rest.replace(match[0], "").trim();
    }
  } else if ((match = rest.match(dayPrefixRangePattern))) {
    const month = parseMonthName(match[3]);
    if (month) {
      const year = match[4] || inferYear(month);
      dates.dateStart = `${year}-${month}-${padDay(match[1])}`;
      dates.dateEnd = `${year}-${month}-${padDay(match[2])}`;
      rest = rest.replace(match[0], "").trim();
    }
  } else if ((match = rest.match(dayPrefixSinglePattern))) {
    const month = parseMonthName(match[2]);
    if (month) {
      const year = match[3] || inferYear(month);
      dates.dateStart = `${year}-${month}-${padDay(match[1])}`;
      rest = rest.replace(match[0], "").trim();
    }
  } else if ((match = rest.match(rangeMonthPattern))) {
    const month = parseMonthName(match[3]);
    if (month) {
      dates.dateStart = `${match[4]}-${month}-${padDay(match[1])}`;
      dates.dateEnd = `${match[4]}-${month}-${padDay(match[2])}`;
      rest = rest.replace(match[0], "").trim();
    }
  } else if ((match = rest.match(singleMonthPattern))) {
    const month = parseMonthName(match[2]);
    if (month) {
      dates.dateStart = `${match[3]}-${month}-${padDay(match[1])}`;
      rest = rest.replace(match[0], "").trim();
    }
  } else if ((match = rest.match(slashDatePattern))) {
    dates.dateStart = `${match[3]}-${match[2]}-${match[1]}`;
    rest = rest.replace(match[0], "").trim();
  } else if ((match = rest.match(isoDatePattern))) {
    dates.dateStart = `${match[1]}-${match[2]}-${match[3]}`;
    rest = rest.replace(match[0], "").trim();
  }

  return { dates, rest, locationFromDayLabel };
}

function extractNotes(line: string): { name: string; notes?: string } {
  const match = line.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (match) {
    return { name: match[1].trim(), notes: match[2].trim() };
  }
  return { name: line.trim() };
}

const LOCATION_PATTERNS: {
  pattern: RegExp;
  extract: (m: RegExpMatchArray) => string;
}[] = [
  // "Day Trip: Kyoto" → Kyoto
  {
    pattern: /^Day\s+Trip:\s*(.+)$/i,
    extract: (m) => m[1].trim(),
  },
  // "Travel to Osaka & Peace Memorial" → Osaka
  {
    pattern: /^Travel\s+to\s+([^&\-–—]+)/i,
    extract: (m) => m[1].trim(),
  },
  // "Return to Tokyo" → Tokyo
  {
    pattern: /^Return\s+to\s+(.+)$/i,
    extract: (m) => m[1].trim(),
  },
  // "Tokyo exploration" → Tokyo
  {
    pattern: /^(.+?)\s+exploration$/i,
    extract: (m) => m[1].trim(),
  },
  // "Tokyo: Last day" → Tokyo
  {
    pattern: /^([^:]+):\s+.+$/,
    extract: (m) => m[1].trim(),
  },
  // "Arrival" or similar non-location → null (handled separately)
];

const NON_LOCATION_WORDS = new Set([
  "arrival",
  "departure",
  "rest",
  "free",
  "travel",
]);

/**
 * Try to extract a geocodable location name from a descriptive segment.
 */
function extractLocationFromSegment(segment: string): string | null {
  for (const { pattern, extract } of LOCATION_PATTERNS) {
    const match = segment.match(pattern);
    if (match) {
      return extract(match);
    }
  }

  if (NON_LOCATION_WORDS.has(segment.toLowerCase().trim())) {
    return null;
  }

  return segment.trim() || null;
}

/**
 * For non-location first segments (like "Arrival"), scan subsequent
 * segments for clues like "Land at Tokyo Haneda".
 */
function extractLocationFromDetails(segments: string[]): string | null {
  for (const seg of segments) {
    // "Land at Tokyo Haneda (HND T3) ~10:25"
    const landAt = seg.match(/(?:Land|Arrive|Fly)\s+(?:at|in|to)\s+([^(~\-–]+)/i);
    if (landAt) return landAt[1].trim();

    // "Travel to Tokyo Haneda"
    const travelTo = seg.match(/Travel\s+to\s+([^(~\-–&]+)/i);
    if (travelTo) return travelTo[1].trim();
  }
  return null;
}

function cleanName(name: string): string {
  return name
    .replace(/^[:\-–—,\s]+/, "")
    .replace(/[:\-–—,\s]+$/, "")
    .trim();
}

function parseLine(line: string): ParsedStop | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const { dates, rest, locationFromDayLabel } = extractDates(trimmed);

  // If we got a location from "Day X: Location (date)", use it
  if (locationFromDayLabel) {
    const segments = rest.split(/\s+-\s+/).filter(Boolean);
    const notes = segments.length > 0 ? segments.join(" - ") : undefined;
    let name = cleanName(locationFromDayLabel);

    // If the label is a non-location word, try to find a real location in details
    if (NON_LOCATION_WORDS.has(name.toLowerCase())) {
      const fallback = extractLocationFromDetails(segments);
      if (fallback) name = fallback;
    }

    return {
      name,
      ...(dates.dateStart && { dateStart: dates.dateStart }),
      ...(dates.dateEnd && { dateEnd: dates.dateEnd }),
      ...(notes && { notes: cleanName(notes) }),
    };
  }

  // Split by " - " to separate descriptive segments
  const segments = rest.split(/\s+-\s+/).filter(Boolean);

  if (segments.length > 1) {
    const firstSegment = cleanName(segments[0]);
    const remainingSegments = segments.slice(1);

    let name = extractLocationFromSegment(firstSegment);

    // If the first segment isn't a location, look in later segments
    if (!name || NON_LOCATION_WORDS.has(name.toLowerCase())) {
      const fallback = extractLocationFromDetails(remainingSegments);
      if (fallback) {
        name = fallback;
      } else if (name) {
        // Keep the non-location word as a last resort
      } else {
        name = firstSegment;
      }
    }

    if (!name) return null;

    const notes = remainingSegments.join(" - ");
    return {
      name: cleanName(name),
      ...(dates.dateStart && { dateStart: dates.dateStart }),
      ...(dates.dateEnd && { dateEnd: dates.dateEnd }),
      ...(notes && { notes }),
    };
  }

  // Single segment — try parenthesised notes
  const { name: rawName, notes } = extractNotes(rest);
  const name = cleanName(rawName);
  if (!name) return null;

  return {
    name,
    ...(dates.dateStart && { dateStart: dates.dateStart }),
    ...(dates.dateEnd && { dateEnd: dates.dateEnd }),
    ...(notes && { notes }),
  };
}

export function parseItineraryText(
  text: string,
  title?: string
): ParsedItinerary {
  const lines = text.split("\n");
  const stops: ParsedStop[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const stop = parseLine(trimmed);
    if (stop) {
      stops.push(stop);
    }
  }

  if (stops.length === 0) {
    throw new Error("No stops could be parsed from the input text.");
  }

  return {
    title: title || "My Trip",
    stops,
  };
}
