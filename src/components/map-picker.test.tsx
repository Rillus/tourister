import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MapPicker } from "./map-picker";

vi.mock("mapbox-gl", () => {
  class Map {
    addControl = vi.fn();
    on = vi.fn();
    remove = vi.fn();
    flyTo = vi.fn();
  }
  class Marker {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    on = vi.fn();
    remove = vi.fn();
  }
  class NavigationControl {}
  return {
    default: {
      Map,
      Marker,
      NavigationControl,
      accessToken: "",
    },
  };
});

describe("MapPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "test-token";
  });

  it("prefills the search bar with the place title", () => {
    render(
      <MapPicker
        onSelect={vi.fn()}
        onCancel={vi.fn()}
        initialCenter={{ lat: 35.66, lon: 139.7 }}
        initialQuery="Fushimi Inari"
      />
    );
    expect(screen.getByLabelText(/search for a place/i)).toHaveValue(
      "Fushimi Inari"
    );
  });

  it("renders a location search field", () => {
    render(
      <MapPicker
        onSelect={vi.fn()}
        onCancel={vi.fn()}
        initialCenter={{ lat: 35.66, lon: 139.7 }}
      />
    );
    expect(screen.getByLabelText(/search for a place/i)).toBeInTheDocument();
  });

  it("shows search results and drops a pin when one is chosen", async () => {
    const onSelect = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [
          {
            latitude: 35.6595,
            longitude: 139.7005,
            displayName: "Shibuya Crossing, Tokyo",
          },
        ],
      }),
    });

    render(
      <MapPicker
        onSelect={onSelect}
        onCancel={vi.fn()}
        initialCenter={{ lat: 35.66, lon: 139.7 }}
      />
    );

    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: "Shibuya" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Shibuya Crossing/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Shibuya Crossing/i }));

    expect(
      screen.getByRole("button", { name: /confirm/i })
    ).not.toBeDisabled();
  });
});
