export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

type SaveFn = () => Promise<void>;

/**
 * Debounced save queue: coalesces rapid edits, never overlaps requests,
 * and always runs one more pass if edits arrived while saving.
 */
export function createDebouncedSaver(
  save: SaveFn,
  delayMs = 800,
  onStatus?: (status: SaveStatus) => void
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let dirty = false;

  const run = async () => {
    if (inFlight) {
      dirty = true;
      return;
    }
    inFlight = true;
    dirty = false;
    onStatus?.("saving");
    try {
      await save();
      if (!dirty) onStatus?.("saved");
    } catch {
      onStatus?.("error");
    } finally {
      inFlight = false;
      if (dirty) {
        dirty = false;
        await run();
      }
    }
  };

  return {
    schedule() {
      dirty = true;
      onStatus?.("pending");
      if (inFlight) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void run();
      }, delayMs);
    },
    async flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      dirty = true;
      await run();
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      dirty = false;
    },
  };
}
