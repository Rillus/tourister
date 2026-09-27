export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

type SaveFn = () => Promise<void>;

/**
 * Explicit save queue: mark dirty while editing, save on blur / button.
 * Never overlaps requests; re-runs once if edits arrived mid-save.
 */
export function createTripSaver(
  save: SaveFn,
  onStatus?: (status: SaveStatus) => void
) {
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
      throw new Error("Save failed");
    } finally {
      inFlight = false;
      if (dirty) {
        dirty = false;
        await run();
      }
    }
  };

  return {
    /** Local edits waiting to be saved */
    markPending() {
      dirty = true;
      onStatus?.("pending");
    },
    /** Save now (blur or Save button). No-op if nothing pending. */
    async save() {
      if (!dirty && !inFlight) return;
      await run();
    },
    cancel() {
      dirty = false;
    },
  };
}
