import type { TripDay } from "@/types/trip";

export interface CalendarCell {
  date: string;
  day: number;
  inMonth: boolean;
}

export function parseYearMonth(isoDate: string): { year: number; month: number } {
  const [y, m] = isoDate.split("-").map(Number);
  return { year: y, month: m };
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Monday-first month grid cells for a given year/month (1–12). */
export function monthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay: 0=Sun … 6=Sat → Monday-first offset
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: CalendarCell[] = [];

  // Leading days from previous month
  const prevMonthLast = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const prev = shiftMonth(year, month, -1);
  for (let i = mondayOffset - 1; i >= 0; i--) {
    const day = prevMonthLast - i;
    cells.push({
      date: toIso(prev.year, prev.month, day),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: toIso(year, month, day),
      day,
      inMonth: true,
    });
  }

  // Trailing days to complete weeks (at least 35, up to 42)
  const next = shiftMonth(year, month, 1);
  let trailing = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({
      date: toIso(next.year, next.month, trailing),
      day: trailing,
      inMonth: false,
    });
    trailing++;
    if (cells.length >= 42) break;
  }

  return cells;
}

export function datesWithItems(days: TripDay[]): Set<string> {
  const set = new Set<string>();
  for (const day of days) {
    if (day.dateStart && day.items.length > 0) {
      set.add(day.dateStart);
    }
  }
  return set;
}
