import { itineraryFormatPlainText } from "@/lib/itinerary-format";

/**
 * Agent-oriented pointer: fetch this, then /format.txt for the full guide.
 */
export function GET() {
  const body = [
    "# Tourister",
    "",
    "> Turn a plain-text travel itinerary into an interactive map.",
    "",
    "## Itinerary format",
    "",
    "- HTML: /format",
    "- Plain text (preferred for agents): /format.txt",
    "- Parse API: POST /api/parse with JSON { \"text\", \"title?\" }",
    "",
    "## Quick rules",
    "",
    "- One stop per line",
    "- Optional # title comment",
    "- Dates: Day N (D Mon YYYY), D-D Mon YYYY, DD/MM/YYYY, YYYY-MM-DD",
    "- Notes in parentheses or after \" - \"",
    "- Prefer real place names for geocoding",
    "",
    "## Full guide follows",
    "",
    itineraryFormatPlainText(),
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
