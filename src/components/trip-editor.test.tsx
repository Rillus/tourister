import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TripEditor } from "./trip-editor";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("./map-picker", () => ({
  MapPicker: ({
    onSelect,
    onCancel,
  }: {
    onSelect: (lat: number, lon: number) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="map-picker">
      <button type="button" onClick={() => onSelect(35.5, 139.7)}>
        Confirm location
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));
import type { Trip, TripDay } from "@/types/trip";

const sampleTrip: Trip = {
  id: "1",
  title: "Japan 2026",
  shareToken: "abc123",
  days: [
    {
      id: "d1",
      dateStart: "2026-11-01",
      dateEnd: "2026-11-03",
      name: "Tokyo",
      sortOrder: 0,
      items: [
        {
          name: "Shibuya",
          latitude: 35.66,
          longitude: 139.7,
          notes: "Explore",
        },
      ],
    },
  ],
  stops: [],
};

describe("TripEditor", () => {
  it("renders trip title", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    expect(screen.getByDisplayValue("Japan 2026")).toBeInTheDocument();
  });

  it("renders day with date and items", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    expect(screen.getByDisplayValue("Tokyo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Shibuya")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Explore")).toBeInTheDocument();
  });

  it("calls onSave when Save is clicked", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByText("Save changes"));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Japan 2026",
        days: expect.any(Array),
      })
    );
    expect(onSave.mock.calls[0][0].days[0].items[0].name).toBe("Shibuya");
  });

  it("adds a new day when Add day is clicked", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByText("+ Add day"));

    expect(screen.getAllByPlaceholderText(/Day name/)).toHaveLength(2);
  });

  it("adds a new activity when Add activity is clicked", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByText("+ Add activity"));

    expect(screen.getAllByPlaceholderText("Activity name")).toHaveLength(2);
  });

  it("disables save button when saving", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={true} />);

    expect(screen.getByText("Saving…")).toBeDisabled();
  });

  it("opens map picker when Set location is clicked and updates item on confirm", async () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    const pinButton = screen.getByLabelText("Set location on map");
    fireEvent.click(pinButton);

    expect(screen.getByTestId("map-picker")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Confirm location"));

    expect(screen.queryByTestId("map-picker")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Save changes"));

    expect(onSave).toHaveBeenCalled();
    const savedItems = onSave.mock.calls[0][0].days[0].items;
    expect(savedItems[0]).toMatchObject({ latitude: 35.5, longitude: 139.7 });
  });
});
