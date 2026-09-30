import { WEEKDAY_LONG, WEEKDAY_SHORT } from './format';
import type { OpeningHours, Weekday } from './schema';
import { addDays, toLocalMoment, WEEKDAYS, weekdayOf } from './time';

export interface DayHours {
  date: string;
  weekday: Weekday;
  open?: string;
  close?: string;
  closed: boolean;
  isException: boolean;
  note?: string;
}

export function hoursForDate(hours: OpeningHours, date: string): DayHours {
  const weekday = weekdayOf(date);
  const exception = hours.exceptions.find((e) => e.date === date);
  if (exception) {
    return exception.closed
      ? { date, weekday, closed: true, isException: true, note: exception.note }
      : { date, weekday, open: exception.open, close: exception.close, closed: false, isException: true, note: exception.note };
  }
  const regular = hours.regular.find((r) => r.day === weekday);
  return regular
    ? { date, weekday, open: regular.open, close: regular.close, closed: false, isException: false }
    : { date, weekday, closed: true, isException: false };
}

export type OpeningStatus =
  | { state: 'open'; today: DayHours; closesAt: string }
  | { state: 'opens-later'; today: DayHours; opensAt: string }
  | { state: 'closed'; today: DayHours; next?: DayHours };

const LOOKAHEAD_DAYS = 21;

export function openingStatus(hours: OpeningHours, now: Date): OpeningStatus {
  const { date, time } = toLocalMoment(now);
  const today = hoursForDate(hours, date);
  if (!today.closed && today.open && today.close) {
    if (time >= today.open && time < today.close) return { state: 'open', today, closesAt: today.close };
    if (time < today.open) return { state: 'opens-later', today, opensAt: today.open };
  }
  for (let offset = 1; offset <= LOOKAHEAD_DAYS; offset += 1) {
    const candidate = hoursForDate(hours, addDays(date, offset));
    if (!candidate.closed) return { state: 'closed', today, next: candidate };
  }
  return { state: 'closed', today };
}

/** Regular opening days in week order (Mon–Sun). */
export function regularWeek(hours: OpeningHours) {
  return WEEKDAYS.flatMap((day) => hours.regular.filter((r) => r.day === day));
}

/** Groups consecutive regular closing days, e.g. [["mon","thu"]]. */
function closedRanges(hours: OpeningHours): [Weekday, Weekday][] {
  const openDays = new Set(hours.regular.map((r) => r.day));
  const ranges: [Weekday, Weekday][] = [];
  for (const day of WEEKDAYS) {
    if (openDays.has(day)) continue;
    const last = ranges.at(-1);
    if (last && WEEKDAYS.indexOf(last[1]) === WEEKDAYS.indexOf(day) - 1) last[1] = day;
    else ranges.push([day, day]);
  }
  return ranges;
}

/** "Mo-Do geschlossen" */
export function closedDaysShort(hours: OpeningHours): string | undefined {
  const ranges = closedRanges(hours);
  if (ranges.length === 0) return undefined;
  const label = ranges
    .map(([from, to]) => (from === to ? WEEKDAY_SHORT[from] : `${WEEKDAY_SHORT[from]}-${WEEKDAY_SHORT[to]}`))
    .join(', ');
  return `${label} geschlossen`;
}

/** "Montag bis Donnerstag geschlossen" */
export function closedDaysLong(hours: OpeningHours): string | undefined {
  const ranges = closedRanges(hours);
  if (ranges.length === 0) return undefined;
  const label = ranges
    .map(([from, to]) => (from === to ? WEEKDAY_LONG[from] : `${WEEKDAY_LONG[from]} bis ${WEEKDAY_LONG[to]}`))
    .join(', ');
  return `${label} geschlossen`;
}

/** Exceptions from `today` (inclusive) within `days` days, sorted by date. */
export function upcomingExceptions(hours: OpeningHours, today: string, days = 60) {
  const until = addDays(today, days);
  return hours.exceptions
    .filter((e) => e.date >= today && e.date <= until)
    .sort((a, b) => a.date.localeCompare(b.date));
}
