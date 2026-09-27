import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TripCalendar } from "./trip-calendar";
import type { TripDay } from "@/types/trip";

const sampleDays: TripDay[] = [
  {
    id: "d1",
    dateStart: "2026-11-13",
    dateEnd: "2026-11-13",
    sortOrder: 0,
    items: [{ name: "Shinjuku", latitude: 0, longitude: 0 }],
  },
  {
    id: "d2",
    dateStart: "2026-11-14",
    dateEnd: "2026-11-14",
    sortOrder: 1,
    items: [],
  },
];

describe("TripCalendar", () => {
  it("renders the month label from selected or trip start", () => {
    render(
      <TripCalendar
        days={sampleDays}
        selectedDate="2026-11-13"
        onSelectDate={vi.fn()}
      />
    );
    expect(screen.getByText(/November 2026/i)).toBeInTheDocument();
  });

  it("calls onSelectDate when a day is clicked", () => {
    const onSelectDate = vi.fn();
    render(
      <TripCalendar
        days={sampleDays}
        selectedDate="2026-11-13"
        onSelectDate={onSelectDate}
      />
    );
    fireEvent.click(screen.getByLabelText("2026-11-14"));
    expect(onSelectDate).toHaveBeenCalledWith("2026-11-14");
  });

  it("marks the selected date", () => {
    render(
      <TripCalendar
        days={sampleDays}
        selectedDate="2026-11-13"
        onSelectDate={vi.fn()}
      />
    );
    expect(screen.getByLabelText("2026-11-13")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
