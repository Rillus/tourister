/**
 * Published itinerary template format — single source for UI + plain-text docs.
 * Paste into the home form or POST { text } to /api/parse.
 */

export interface FormatRule {
  title: string;
  body: string;
  examples: string[];
}

export const ITINERARY_FORMAT_TITLE = "Tourister itinerary format";

export const ITINERARY_FORMAT_INTRO =
  "Plain text, one stop per line. Paste into Tourister or POST JSON { \"text\": \"…\", \"title\": \"…\" } to /api/parse. Lines starting with # are comments and are ignored.";

export const ITINERARY_FORMAT_RULES: FormatRule[] = [
  {
    title: "One stop per line",
    body: "Each non-empty line becomes a stop. Blank lines are skipped.",
    examples: ["Tokyo", "Kyoto", "Osaka"],
  },
  {
    title: "Optional title comment",
    body: "Start with # Title if you like. The form title field still wins when you paste on the site.",
    examples: ["# Japan November 2026"],
  },
  {
    title: "Dates",
    body: "Put a date or range before the place. Year is optional (inferred from today). Accepted shapes include Day N (D Mon YYYY), Day N, D-D Mon, D-D Mon YYYY, DD/MM/YYYY, and YYYY-MM-DD.",
    examples: [
      "1-3 Nov 2026: Tokyo",
      "Day 4 (4 Nov) - Nikko",
      "07/11/2026 - Kyoto",
      "2026-11-13 - Hiroshima",
    ],
  },
  {
    title: "Day prefixes",
    body: "Day N or Day N-M is fine. After the date, use \" - \" or \": \" then the place name.",
    examples: [
      "Day 1-3, 1-3 Nov: Tokyo (Explore Shibuya)",
      "Day 7 (19 Nov) - Day Trip: Kyoto - Train from Osaka",
    ],
  },
  {
    title: "Notes",
    body: "Extra detail after the place — in parentheses, or after another \" - \".",
    examples: [
      "Tokyo (Explore Shibuya, Harajuku)",
      "Day 2 (14 Nov) - Shibuya - Explore",
    ],
  },
  {
    title: "Times",
    body: "Clock times are decorative for now (kept in notes). Prefer ~HH:mm after the note text so the place name stays geocodable.",
    examples: [
      "Day 1 (13 Nov 2026) - Tokyo Haneda - Land at HND T3 ~10:25",
    ],
  },
];

/** Canonical example — must stay parseable by parseItineraryText. */
export const ITINERARY_FORMAT_EXAMPLE = `# Japan November 2026
Day 1-3, 1-3 Nov 2026: Tokyo (Explore Shibuya, Harajuku, Akihabara)
Day 4, 4 Nov 2026: Nikko (Toshogu Shrine, autumn leaves)
Day 5-6, 5-6 Nov 2026: Hakone (Onsen, Lake Ashi)
Day 7 (13 Nov 2026) - Tokyo Haneda - Departure ~14:00`;

export const ITINERARY_FORMAT_TIPS = [
  "Use real place names the map can find (city, neighbourhood, landmark).",
  "Vague words alone (Arrival, Free day) work poorly — pair them with a place, e.g. Land at Tokyo Haneda.",
  "Export from My Trips downloads this same shape, ready to edit and paste again.",
];

export function itineraryFormatPlainText(): string {
  const lines: string[] = [
    ITINERARY_FORMAT_TITLE,
    "",
    ITINERARY_FORMAT_INTRO,
    "",
    "Rules",
    "-----",
  ];

  for (const rule of ITINERARY_FORMAT_RULES) {
    lines.push("");
    lines.push(`${rule.title}`);
    lines.push(rule.body);
    for (const ex of rule.examples) {
      lines.push(`  ${ex}`);
    }
  }

  lines.push("");
  lines.push("Tips");
  lines.push("----");
  for (const tip of ITINERARY_FORMAT_TIPS) {
    lines.push(`- ${tip}`);
  }

  lines.push("");
  lines.push("Example (paste as-is)");
  lines.push("---------------------");
  lines.push(ITINERARY_FORMAT_EXAMPLE.trim());
  lines.push("");
  lines.push("API");
  lines.push("---");
  lines.push('POST /api/parse');
  lines.push('Content-Type: application/json');
  lines.push('{ "text": "<itinerary lines>", "title": "Optional trip title" }');
  lines.push("");
  lines.push("HTML guide: /format");
  lines.push("Plain text: /format.txt");

  return lines.join("\n");
}
