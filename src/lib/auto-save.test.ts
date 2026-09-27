import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDebouncedSaver } from "./auto-save";

describe("createDebouncedSaver", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces rapid schedule calls into one save", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const saver = createDebouncedSaver(save, 300);

    saver.schedule();
    saver.schedule();
    saver.schedule();
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("runs again if scheduled while a save is in flight", async () => {
    let resolveSave!: () => void;
    const save = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const saver = createDebouncedSaver(save, 100);

    saver.schedule();
    await vi.advanceTimersByTimeAsync(100);
    expect(save).toHaveBeenCalledTimes(1);

    saver.schedule();
    resolveSave();
    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledTimes(2);
    });
  });

  it("flush saves immediately and cancels the debounce timer", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const saver = createDebouncedSaver(save, 500);

    saver.schedule();
    await saver.flush();
    expect(save).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(500);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("reports pending → saving → saved status", async () => {
    const onStatus = vi.fn();
    const save = vi.fn().mockResolvedValue(undefined);
    const saver = createDebouncedSaver(save, 200, onStatus);

    saver.schedule();
    expect(onStatus).toHaveBeenCalledWith("pending");

    await vi.advanceTimersByTimeAsync(200);
    expect(onStatus).toHaveBeenCalledWith("saving");
    expect(onStatus).toHaveBeenCalledWith("saved");
  });
});
