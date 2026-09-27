import Link from "next/link";
import {
  ITINERARY_FORMAT_EXAMPLE,
  ITINERARY_FORMAT_INTRO,
  ITINERARY_FORMAT_RULES,
  ITINERARY_FORMAT_TIPS,
  ITINERARY_FORMAT_TITLE,
} from "@/lib/itinerary-format";

export function ItineraryFormatGuide() {
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {ITINERARY_FORMAT_TITLE}
        </h1>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {ITINERARY_FORMAT_INTRO}
        </p>
        <p className="text-sm">
          <a
            href="/format.txt"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Plain text version
          </a>
          <span className="text-foreground/40"> · handy for agents</span>
        </p>
      </header>

      <section className="space-y-5" aria-labelledby="format-rules">
        <h2 id="format-rules" className="text-lg font-semibold">
          Rules
        </h2>
        <ol className="space-y-5 list-decimal list-outside ml-5">
          {ITINERARY_FORMAT_RULES.map((rule) => (
            <li key={rule.title} className="space-y-2 pl-1">
              <h3 className="font-medium text-foreground">{rule.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {rule.body}
              </p>
              <ul className="space-y-1">
                {rule.examples.map((ex) => (
                  <li key={ex}>
                    <code className="block rounded-md border border-foreground/10 bg-foreground/[0.03] px-3 py-2 text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                      {ex}
                    </code>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3" aria-labelledby="format-tips">
        <h2 id="format-tips" className="text-lg font-semibold">
          Tips
        </h2>
        <ul className="space-y-2 text-sm text-foreground/60 list-disc list-outside ml-5">
          {ITINERARY_FORMAT_TIPS.map((tip) => (
            <li key={tip} className="leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="format-example">
        <h2 id="format-example" className="text-lg font-semibold">
          Example
        </h2>
        <p className="text-sm text-foreground/60">
          Copy this into the home form, or POST it to{" "}
          <code className="text-xs font-mono">/api/parse</code>.
        </p>
        <pre className="rounded-lg border border-foreground/10 bg-foreground/[0.03] p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
          {ITINERARY_FORMAT_EXAMPLE.trim()}
        </pre>
      </section>

      <p className="text-sm">
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to create a trip
        </Link>
      </p>
    </article>
  );
}
