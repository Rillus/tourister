import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TripPasswordGate } from "./trip-password-gate";

describe("TripPasswordGate", () => {
  it("calls onSubmit with the entered password", () => {
    const onSubmit = vi.fn();
    render(
      <TripPasswordGate onSubmit={onSubmit} isChecking={false} error={null} />
    );

    fireEvent.change(screen.getByLabelText(/trip password/i), {
      target: { value: "hunter2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));

    expect(onSubmit).toHaveBeenCalledWith("hunter2");
  });

  it("shows an error message when provided", () => {
    render(
      <TripPasswordGate
        onSubmit={vi.fn()}
        isChecking={false}
        error="Incorrect password"
      />
    );
    expect(screen.getByText("Incorrect password")).toBeInTheDocument();
  });
});
