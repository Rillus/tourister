import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SuggestionPanel } from "./suggestion-panel";
import type { EnrichedStop } from "@/types/enrichment";

const mockStop: EnrichedStop = {
  name: "Fushimi Inari",
  nameLocal: "伏見稲荷大社",
  latitude: 34.9671,
  longitude: 135.7727,
  dateStart: "2026-11-07",
};

const mockSuggestions = [
  {
    id: "osm-1001",
    name: "Nezameya",
    nameLocal: "祢ざめ家",
    category: "food_and_drink",
    latitude: 34.9672,
    longitude: 135.7728,
    distanceMetres: 150,
    relevanceScore: 7.5,
    seasonalTags: ["koyo"],
    dismissed: false,
  },
  {
    id: "osm-1002",
    name: "Inari Park",
    category: "nature_and_parks",
    latitude: 34.9665,
    longitude: 135.772,
    distanceMetres: 200,
    relevanceScore: 6.2,
    seasonalTags: [],
    dismissed: false,
  },
];

describe("SuggestionPanel", () => {
  const mockFetch = vi.fn();
  const onAddToTrip = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    onAddToTrip.mockReset();
    global.fetch = mockFetch;
  });

  it("renders the nearby activities heading", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ suggestions: [], categoryCounts: {} }),
    });

    render(
      <SuggestionPanel stop={mockStop} onAddToTrip={onAddToTrip} />
    );

    expect(
      screen.getByRole("heading", { name: "Nearby activities" })
    ).toBeInTheDocument();
  });

  it("fetches suggestions on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          suggestions: mockSuggestions,
          categoryCounts: { food_and_drink: 1, nature_and_parks: 1 },
        }),
    });

    render(
      <SuggestionPanel stop={mockStop} onAddToTrip={onAddToTrip} />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/suggestions",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.latitude).toBe(34.9671);
    expect(body.longitude).toBe(135.7727);
    expect(body.radiusMetres).toBe(1000);
    expect(body.month).toBe(11); // from dateStart 2026-11-07
  });

  it("displays suggestions after fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          suggestions: mockSuggestions,
          categoryCounts: {},
        }),
    });

    render(
      <SuggestionPanel stop={mockStop} onAddToTrip={onAddToTrip} />
    );

    await waitFor(() => {
      expect(screen.getByText("Nezameya")).toBeInTheDocument();
    });
    expect(screen.getByText("Inari Park")).toBeInTheDocument();
  });

  it("calls onAddToTrip when add button is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          suggestions: mockSuggestions,
          categoryCounts: {},
        }),
    });

    render(
      <SuggestionPanel stop={mockStop} onAddToTrip={onAddToTrip} />
    );

    await waitFor(() => {
      expect(screen.getByText("Nezameya")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole("button", { name: "+ Add to trip" });
    fireEvent.click(addButtons[0]);

    expect(onAddToTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "osm-1001",
        name: "Nezameya",
      })
    );
  });

  it("removes suggestion from view when dismissed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          suggestions: mockSuggestions,
          categoryCounts: {},
        }),
    });

    render(
      <SuggestionPanel stop={mockStop} onAddToTrip={onAddToTrip} />
    );

    await waitFor(() => {
      expect(screen.getByText("Nezameya")).toBeInTheDocument();
    });

    const dismissButtons = screen.getAllByText("Dismiss");
    fireEvent.click(dismissButtons[0]);

    expect(screen.queryByText("Nezameya")).not.toBeInTheDocument();
    expect(screen.getByText("Inari Park")).toBeInTheDocument();
  });

  it("shows category filter chips", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          suggestions: [],
          categoryCounts: {},
        }),
    });

    render(
      <SuggestionPanel stop={mockStop} onAddToTrip={onAddToTrip} />
    );

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText(/Food & Drink/)).toBeInTheDocument();
    expect(screen.getByText(/Culture & History/)).toBeInTheDocument();
    expect(screen.getByText(/Nature & Parks/)).toBeInTheDocument();
  });

  it("refetches when category filter changes", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            suggestions: mockSuggestions,
            categoryCounts: { food_and_drink: 1, nature_and_parks: 1 },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            suggestions: [mockSuggestions[0]],
            categoryCounts: {},
          }),
      });

    render(
      <SuggestionPanel stop={mockStop} onAddToTrip={onAddToTrip} />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const categoryButtons = screen.getAllByRole("button", {
      name: /Food & Drink/,
    });
    fireEvent.click(categoryButtons[0]); // Filter chip, not card label

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.category).toBe("food_and_drink");
    });
  });

  it("shows empty state when no suggestions found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          suggestions: [],
          categoryCounts: {},
        }),
    });

    render(
      <SuggestionPanel stop={mockStop} onAddToTrip={onAddToTrip} />
    );

    await waitFor(() => {
      expect(
        screen.getByText("No suggestions found nearby.")
      ).toBeInTheDocument();
    });
  });
});
