export const TIMELINE_START_HOUR = 6;
export const TIMELINE_END_HOUR = 24;
export const DEFAULT_BLOCK_MINUTES = 45;

export function minutesFromMidnight(time?: string): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export interface BlockStyle {
  topPercent: number;
  heightPercent: number;
}

export function blockStyle(
  startTime?: string,
  endTime?: string
): BlockStyle | null {
  const start = minutesFromMidnight(startTime);
  if (start === null) return null;

  const timelineStart = TIMELINE_START_HOUR * 60;
  const timelineEnd = TIMELINE_END_HOUR * 60;
  const total = timelineEnd - timelineStart;

  const end =
    minutesFromMidnight(endTime) ?? start + DEFAULT_BLOCK_MINUTES;

  const clampedStart = Math.max(timelineStart, Math.min(start, timelineEnd));
  const clampedEnd = Math.max(
    clampedStart + 15,
    Math.min(end, timelineEnd)
  );

  return {
    topPercent: ((clampedStart - timelineStart) / total) * 100,
    heightPercent: ((clampedEnd - clampedStart) / total) * 100,
  };
}

export function hourLabels(): number[] {
  const labels: number[] = [];
  for (let h = TIMELINE_START_HOUR; h < TIMELINE_END_HOUR; h++) {
    labels.push(h);
  }
  return labels;
}

export function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}
