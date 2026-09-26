# Tourister — Product Requirements Document

**Version:** 1.0
**Date:** 6 March 2026
**Author:** Riley (Product & Engineering)
**Status:** Draft

---

## 1. Overview

Tourister is a web application that transforms travel itineraries into rich, interactive local-area maps. It pulls in points of interest (POIs) with images and Wikipedia summaries, and suggests granular local activities — from neighbourhood walks and hidden temples to regional food experiences and seasonal events.

The initial release targets a **Japan trip in November 2026** as the primary test case, but the architecture must support arbitrary destinations and date ranges.

---

## 2. Problem Statement

Travel planning today is fragmented. Travellers bounce between Google Maps, TripAdvisor, Reddit threads, blog posts, and spreadsheets to build an itinerary. Key pain points:

1. **Context collapse** — itineraries are flat lists; travellers lose the spatial relationship between stops.
2. **Surface-level suggestions** — mainstream tools recommend the same top-10 attractions and miss hyper-local experiences.
3. **No enrichment** — itinerary entries are bare text with no images, descriptions, or context.
4. **Activity gaps** — travellers struggle to fill downtime between major stops with worthwhile nearby activities.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target (MVP) |
|------|--------|---------------|
| Itinerary-to-map conversion | Time from paste to rendered map | < 5 seconds |
| POI enrichment | % of POIs with image + summary | ≥ 85% |
| Activity suggestions | Avg. suggestions per itinerary stop | ≥ 5 |
| User satisfaction | Post-session thumbs-up rate | ≥ 70% |
| Japan coverage | Successful enrichment for Japan POIs | ≥ 90% |

---

## 4. Target Users

| Persona | Description |
|---------|-------------|
| **Independent traveller** | Plans their own trips, comfortable with tech, wants depth over convenience. |
| **Group trip organiser** | Coordinates travel for 2–8 people, needs shareable visual plans. |
| **Repeat visitor** | Has been to the destination before and wants to discover what they missed. |

---

## 5. User Stories

### 5.1 Itinerary Input
- **US-1:** As a traveller, I can paste a plain-text or structured itinerary so the system parses my stops automatically.
- **US-2:** As a traveller, I can upload a CSV, JSON, or spreadsheet file containing my itinerary.
- **US-3:** As a traveller, I can manually add, edit, reorder, and remove stops from my itinerary.
- **US-4:** As a traveller, I can specify date ranges for each stop so the system knows my schedule.

### 5.2 Map Generation
- **US-5:** As a traveller, I can see all my itinerary stops plotted on an interactive map immediately after input.
- **US-6:** As a traveller, I can view routes and distances between consecutive stops.
- **US-7:** As a traveller, I can switch between a full-trip overview and a day-by-day map view.
- **US-8:** As a traveller, I can see the map styled with clear visual hierarchy — primary stops prominent, suggested activities secondary.

### 5.3 POI Enrichment
- **US-9:** As a traveller, I can see each stop enriched with a Wikipedia summary, so I understand what the place is about.
- **US-10:** As a traveller, I can see representative images for each stop on the map and in a sidebar.
- **US-11:** As a traveller, I can click through to the full Wikipedia article or official website for any POI.
- **US-12:** As a traveller, I can see opening hours, admission fees, and practical tips where available.

### 5.4 Activity Suggestions
- **US-13:** As a traveller, I can see suggested activities near each itinerary stop, ranked by proximity and relevance.
- **US-14:** As a traveller, I can filter suggestions by category (food, culture, nature, shopping, nightlife, etc.).
- **US-15:** As a traveller, I can see seasonal/time-sensitive suggestions (e.g. autumn foliage spots in November, seasonal festivals).
- **US-16:** As a traveller, I can add a suggested activity to my itinerary with one click.
- **US-17:** As a traveller, I can dismiss suggestions I'm not interested in.

### 5.5 Sharing & Export
- **US-18:** As a traveller, I can share my enriched map via a unique URL.
- **US-19:** As a traveller, I can export my itinerary as a PDF with map snapshots and POI details.
- **US-20:** As a traveller, I can export stops as a KML/GeoJSON file for use in other mapping tools.

### 5.6 Japan-Specific (Test Case)
- **US-21:** As a traveller visiting Japan, I can see POI names in both English and Japanese (romaji + kanji).
- **US-22:** As a traveller visiting Japan in November, I can see autumn-specific suggestions (koyo spots, seasonal menus, November festivals).
- **US-23:** As a traveller visiting Japan, I can see transport options between stops (JR lines, local buses, walking).
- **US-24:** As a traveller visiting Japan, I can see neighbourhood-level context (e.g. "Shimokitazawa is known for vintage shops and indie theatre").

---

## 6. Functional Requirements

### 6.1 Itinerary Parser

| ID | Requirement |
|----|-------------|
| FR-1 | Accept plain-text itinerary input (free-form, one stop per line). |
| FR-2 | Accept structured input: CSV, JSON, XLSX upload. |
| FR-3 | Use NLP/LLM to extract location names, dates, and notes from unstructured text. |
| FR-4 | Geocode extracted locations via a geocoding API (e.g. Nominatim, Google Geocoding). |
| FR-5 | Present parsed results for user confirmation before map generation. |

### 6.2 Map Engine

| ID | Requirement |
|----|-------------|
| FR-6 | Render an interactive map using Mapbox GL JS or Leaflet. |
| FR-7 | Plot itinerary stops as numbered, colour-coded markers. |
| FR-8 | Draw route lines between consecutive stops (walking/transit where appropriate). |
| FR-9 | Support day-by-day filtering with a timeline scrubber or tab UI. |
| FR-10 | Cluster nearby markers at low zoom levels to prevent clutter. |
| FR-11 | Provide satellite and standard map layer toggles. |

### 6.3 POI Enrichment Service

| ID | Requirement |
|----|-------------|
| FR-12 | Query Wikipedia API for each POI to retrieve summary text (first 2–3 paragraphs). |
| FR-13 | Query Wikimedia Commons or Unsplash API for representative images. |
| FR-14 | Cache enrichment data to reduce API calls on repeat views. |
| FR-15 | Gracefully degrade when enrichment data is unavailable (show location pin without summary). |
| FR-16 | Support bilingual display for Japanese POIs (English + Japanese). |

### 6.4 Activity Suggestion Engine

| ID | Requirement |
|----|-------------|
| FR-17 | For each itinerary stop, query nearby activities within a configurable radius (default 1 km). |
| FR-18 | Source suggestions from Overpass (OpenStreetMap), Foursquare, and/or curated local datasets. |
| FR-19 | Categorise suggestions: food & drink, culture & history, nature & parks, shopping, nightlife, experiences. |
| FR-20 | Rank suggestions by a composite score: proximity, rating, seasonal relevance, uniqueness. |
| FR-21 | Support seasonal awareness — boost November-relevant activities for the Japan test case. |
| FR-22 | Allow LLM-generated micro-descriptions for activities lacking rich metadata. |

### 6.5 Sharing & Export

| ID | Requirement |
|----|-------------|
| FR-23 | Generate a unique shareable URL for each itinerary (read-only for viewers). |
| FR-24 | Export to PDF with embedded static map images and POI cards. |
| FR-25 | Export to KML and GeoJSON formats. |

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Page load time (initial) | < 2 seconds on 4G |
| NFR-2 | Map interaction latency | < 100 ms for pan/zoom |
| NFR-3 | API response time (enrichment) | < 3 seconds per POI |
| NFR-4 | Availability | 99.5% uptime |
| NFR-5 | Data freshness | Wikipedia/image cache refreshed every 7 days |
| NFR-6 | Accessibility | WCAG 2.1 AA compliance |
| NFR-7 | Browser support | Latest 2 versions of Chrome, Firefox, Safari, Edge |
| NFR-8 | Mobile responsiveness | Fully usable on viewports ≥ 375px |
| NFR-9 | Security | All API keys server-side; no secrets in client bundle |
| NFR-10 | Rate limiting | Respect all third-party API rate limits with backoff |

---

## 8. Technical Architecture (Proposed)

```
┌─────────────────────────────────────────────────────┐
│                    Client (SPA)                     │
│  Next.js / React · Mapbox GL JS · TailwindCSS       │
└──────────────────────┬──────────────────────────────┘
                       │ REST / tRPC
┌──────────────────────▼──────────────────────────────┐
│                  API Server                          │
│  Next.js API Routes / Node.js                        │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────┐ │
│  │ Itinerary  │ │    POI       │ │   Activity     │ │
│  │  Parser    │ │ Enrichment   │ │  Suggestion    │ │
│  │  Service   │ │  Service     │ │   Engine       │ │
│  └─────┬──────┘ └──────┬───────┘ └───────┬────────┘ │
│        │               │                 │           │
│  ┌─────▼───────────────▼─────────────────▼────────┐ │
│  │              Cache Layer (Redis)                │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
  ┌──────────┐  ┌────────────┐   ┌──────────────┐
  │ Wikipedia │  │  Geocoding │   │ OpenStreetMap│
  │ + Commons │  │    API     │   │  Overpass    │
  └──────────┘  └────────────┘   └──────────────┘
```

### Key Technology Choices

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 15 + React 19 | SSR for SEO, App Router for modern patterns |
| Styling | Tailwind CSS 4 | Rapid UI iteration, design-token consistency |
| Maps | Mapbox GL JS | Vector tiles, rich interactivity, strong free tier |
| Backend | Next.js API Routes | Co-located with frontend, serverless-friendly |
| Database | PostgreSQL + Drizzle ORM | Relational data for itineraries, stops, suggestions |
| Cache | Redis (Upstash) | Low-latency caching for enrichment data |
| LLM | OpenAI API (GPT-4o) | Itinerary parsing, activity micro-descriptions |
| Geocoding | Nominatim (OSM) | Free, no API key, good global coverage |
| POI Data | Wikipedia API + Overpass API | Open data, rich content, no licence cost |
| Images | Wikimedia Commons + Unsplash | Free imagery with proper attribution |
| Hosting | Vercel | Zero-config Next.js deployment |
| CI/CD | GitHub Actions | Automated testing and deployment |

---

## 9. Data Model (Core Entities)

```
Itinerary
├── id: UUID
├── title: string
├── created_at: timestamp
├── updated_at: timestamp
├── share_token: string (unique)
│
├── Stop[]
│   ├── id: UUID
│   ├── itinerary_id: FK
│   ├── name: string
│   ├── name_local: string (e.g. Japanese)
│   ├── latitude: decimal
│   ├── longitude: decimal
│   ├── date_start: date
│   ├── date_end: date
│   ├── notes: text
│   ├── sort_order: integer
│   │
│   ├── Enrichment (1:1)
│   │   ├── wikipedia_summary: text
│   │   ├── wikipedia_url: string
│   │   ├── image_url: string
│   │   ├── image_attribution: string
│   │   ├── opening_hours: string
│   │   ├── admission_fee: string
│   │   └── cached_at: timestamp
│   │
│   └── ActivitySuggestion[]
│       ├── id: UUID
│       ├── stop_id: FK
│       ├── name: string
│       ├── name_local: string
│       ├── category: enum
│       ├── description: text
│       ├── latitude: decimal
│       ├── longitude: decimal
│       ├── distance_metres: integer
│       ├── image_url: string
│       ├── relevance_score: decimal
│       ├── seasonal_tags: string[]
│       └── dismissed: boolean
```

---

## 10. Japan November 2026 — Test Case Specification

### 10.1 Sample Itinerary

| Day | Date | Location | Notes |
|-----|------|----------|-------|
| 1–3 | 1–3 Nov | Tokyo (Shinjuku base) | Explore Shibuya, Harajuku, Akihabara |
| 4 | 4 Nov | Day trip: Nikko | Toshogu Shrine, autumn leaves |
| 5–6 | 5–6 Nov | Hakone | Onsen, Open-Air Museum, Lake Ashi |
| 7–9 | 7–9 Nov | Kyoto | Temples, Arashiyama, Fushimi Inari |
| 10 | 10 Nov | Day trip: Nara | Todai-ji, deer park |
| 11–12 | 11–12 Nov | Osaka | Dotonbori, street food, Osaka Castle |
| 13 | 13 Nov | Hiroshima + Miyajima | Peace Memorial, Itsukushima Shrine |
| 14 | 14 Nov | Return to Tokyo | Departure |

### 10.2 Seasonal Context (November)

- **Koyo (紅葉):** Peak autumn foliage across central Honshu. Key spots: Nikko, Arashiyama, Eikando, Tofuku-ji.
- **Shichi-Go-San (七五三):** 15 November — children's festival at shrines.
- **Seasonal food:** Matsutake mushrooms, sanma (Pacific saury), kuri (chestnuts), nabe hotpot, new-season sake.
- **Weather:** 10–18°C in Tokyo/Osaka, cooler in mountain areas. Low rainfall.
- **Events:** Karatsu Kunchi (early Nov), Tori-no-Ichi festival (Tokyo), autumn illuminations begin.

### 10.3 Expected Enrichment Examples

| Stop | Wikipedia Summary (excerpt) | Image | Suggested Activities |
|------|-----------------------------|-------|----------------------|
| Fushimi Inari | "Fushimi Inari-taisha is the head shrine of the kami Inari…" | Torii gate tunnel | Hike to summit (2 hrs), Inari sushi at Nezameya, sake tasting at Gekkeikan Okura |
| Arashiyama | "Arashiyama is a district on the western outskirts of Kyoto…" | Bamboo grove | Tenryu-ji temple, monkey park, tofu kaiseki lunch, Togetsukyo Bridge sunset |
| Dotonbori | "Dotonbori is a district in Osaka known for entertainment…" | Glico running man sign | Takoyaki crawl, Hozenji Yokocho alley, Shinsekai tower, comedy show at NGK |

---

## 11. MVP Scope

The MVP (v0.1) will include:

1. **Itinerary input** — plain-text paste + manual editor.
2. **Map generation** — interactive Mapbox map with stop markers and route lines.
3. **POI enrichment** — Wikipedia summaries and Wikimedia Commons images.
4. **Activity suggestions** — nearby activities via Overpass API with category filtering.
5. **Day-by-day view** — filter map and sidebar by day.
6. **Shareable URL** — read-only sharing via unique link.

### Explicitly Out of Scope for MVP

- User accounts and authentication
- Collaborative editing
- PDF/KML export
- Hotel/flight booking integration
- Offline mode
- Native mobile apps
- Multi-language UI (English only; POI names may be bilingual)

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Wikipedia API rate limiting | Medium | Medium | Aggressive caching, batch requests, respect `Retry-After` headers |
| Geocoding inaccuracy for Japanese place names | Medium | High | Fallback chain: Nominatim → Google Geocoding; allow manual coordinate correction |
| LLM hallucination in itinerary parsing | Medium | Medium | Always present parsed results for user confirmation; structured output schema |
| Mapbox free tier exceeded | Low | Medium | Monitor usage; fallback to Leaflet + OSM tiles |
| Stale seasonal data | Medium | Low | Curate Japan November dataset manually; refresh annually |
| Image copyright issues | Low | High | Use only Wikimedia Commons (CC-licensed) and Unsplash (free licence) |

---

## 13. Future Enhancements (Post-MVP)

1. **User accounts** — save multiple itineraries, trip history.
2. **Collaborative editing** — real-time multi-user itinerary planning.
3. **AI trip planner** — generate a full itinerary from natural-language prompts ("2 weeks in Japan, focus on food and temples").
4. **Budget tracker** — estimate costs per day based on activity types.
5. **Transport integration** — live train/bus schedules via Hyperdia or Jorudan APIs.
6. **Offline PWA** — download maps and enrichment data for offline use.
7. **Review integration** — pull in Google/TripAdvisor ratings.
8. **Multi-destination support** — handle multi-country trips with cross-border routing.
9. **Calendar sync** — export itinerary to Google Calendar / Apple Calendar.
10. **Community suggestions** — user-submitted activity recommendations with upvoting.

---

## 14. Open Questions

1. Should we support authentication from day one (even if lightweight, e.g. magic links) to persist itineraries across sessions?
2. What is the acceptable cost ceiling for LLM API calls per itinerary generation?
3. Should activity suggestions include user-generated content from the start, or curated data only?
4. How do we handle POIs that span large areas (e.g. "Arashiyama district") vs. point locations?
5. Do we want to support itinerary import from Google Maps saved lists or TripIt?

---

## 15. Timeline (Indicative)

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| **Phase 1: Foundation** | 2 weeks | Project setup, itinerary parser, geocoding, basic map rendering |
| **Phase 2: Enrichment** | 2 weeks | Wikipedia integration, image fetching, enrichment cache |
| **Phase 3: Suggestions** | 2 weeks | Activity suggestion engine, category filtering, seasonal awareness |
| **Phase 4: Polish** | 1 week | Day-by-day view, responsive design, sharing URLs |
| **Phase 5: Japan Test** | 1 week | End-to-end testing with Japan Nov 2026 itinerary, data quality audit |
| **Phase 6: Launch** | 1 week | Deploy to production, monitoring, documentation |
| **Phase 7: Trips** | 2 weeks | View saved trips, open, edit, day/item hierarchy |

**Total estimated MVP timeline: ~11 weeks**

### Phase 7: Trips (Added)
- **View saved trips** — My Trips page at `/trips`, localStorage-backed token list
- **Open trips** — View at `/share/[token]`, Edit at `/trips/[token]/edit`
- **Edit trips** — Update title, days, and items; save via PATCH API
- **Day/item hierarchy** — Days contain items (activities); legacy flat stops auto-convert for editing

---

*This is a living document. It will be updated as decisions are made on the open questions and as the build progresses.*
