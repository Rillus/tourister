# Trips Phase: Saved Trips, Edit, Day/Item Hierarchy

## Overview
Enable users to view saved trips, open them, edit them, and organise trips by **Days** with **Items** (activities) within each day.

## Data Model

```
Itinerary
├── id, title, shareToken, createdAt, updatedAt
├── Day[]
│   ├── id, itineraryId, dateStart, dateEnd, sortOrder, name (optional)
│   └── Item[] (stops)
│       ├── id, dayId, name, nameLocal, latitude, longitude, notes, sortOrder
│       ├── Enrichment (1:1)
│       └── ActivitySuggestion[]
```

**Backward compatibility:** Legacy trips have stops with `itineraryId` and no `dayId`. New trips use `days` and `items` (stops with `dayId`). The share API returns a normalised structure for both.

## Features

### 1. View Previously Saved Trips
- **My Trips** page at `/trips`
- Uses `localStorage` key `tourister_saved_trips` to store share tokens of trips the user has created or opened
- Fetches each trip via `/api/share/[token]` and displays cards
- Add-to-saved: when user creates a trip or opens a share link, add token to localStorage

### 2. Open a Trip
- Click a trip card → navigate to `/share/[token]` (read-only map view)
- Or → navigate to `/trips/[token]/edit` (edit mode)

### 3. Edit a Trip
- Edit page at `/trips/[token]/edit`
- Edit title
- Edit days: add, remove, reorder, change date range and name
- Edit items within each day: add, remove, reorder, edit name/notes
- Geocode new items, enrich on demand
- Save changes via PATCH `/api/trips/[token]`

### 4. Day/Item Hierarchy
- **Day**: date range (dateStart, dateEnd), optional name (e.g. "Tokyo", "Nikko")
- **Item**: activity within a day (name, lat, lon, notes) — same as current Stop
- Map flattens all items for display; day-by-day filter uses day dates

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/share/[token] | Get trip (read) — returns days + items or flat stops |
| POST | /api/itineraries | Create trip — accepts days/items or flat stops |
| GET | /api/trips?tokens=... | Batch fetch trips by tokens (for list page) |
| PATCH | /api/trips/[token] | Update trip (title, days, items) |

## UI

- **Trips list**: Cards with title, stop count, last updated; "Open" and "Edit" buttons
- **Edit page**: 
  - Header: title (editable), Save, View map
  - Day sections (collapsible): Day name, date range, item list
  - Add day, Add item, Reorder (drag or buttons)
  - Inline edit for item name, notes; geocode when coordinates missing
