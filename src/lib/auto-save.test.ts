import { describe, it, expect, vi } from "vitest";
import { createTripSaver } from "./auto-save";

describe("createTripSaver", () => {
  it("does not save until save() is called", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const saver = createTripSaver(save);

    saver.markPending();
    expect(save).not.toHaveBeenCalled();

    await saver.save();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("runs again if marked pending while a save is in flight", async () => {
    let resolveSave!: () => void;
    const save = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const saver = createTripSaver(save);

    saver.markPending();
    const first = saver.save();
    expect(save).toHaveBeenCalledTimes(1);

    saver.markPending();
    resolveSave();
    await first;

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledTimes(2);
    });
  });

  it("reports pending → saving → saved status", async () => {
    const onStatus = vi.fn();
    const save = vi.fn().mockResolvedValue(undefined);
    const saver = createTripSaver(save, onStatus);

    saver.markPending();
    expect(onStatus).toHaveBeenCalledWith("pending");

    await saver.save();
    expect(onStatus).toHaveBeenCalledWith("saving");
    expect(onStatus).toHaveBeenCalledWith("saved");
  });
});
