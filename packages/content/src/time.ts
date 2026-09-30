import type { Weekday } from './schema';

export const TIME_ZONE = 'Europe/Berlin';

export const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export interface LocalMoment {
  /** YYYY-MM-DD in Europe/Berlin */
  date: string;
  /** HH:MM (24h) in Europe/Berlin */
  time: string;
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function zonedParts(instant: Date) {
  const parts: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(instant)) parts[part.type] = part.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Wall-clock date and time of `instant` at the restaurant. */
export function toLocalMoment(instant: Date): LocalMoment {
  const p = zonedParts(instant);
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

function parseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

export function weekdayOf(date: string): Weekday {
  const { year, month, day } = parseDate(date);
  const sundayFirst = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return WEEKDAYS[(sundayFirst + 6) % 7]!;
}

export function addDays(date: string, days: number): string {
  const { year, month, day } = parseDate(date);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Converts a restaurant wall-clock time (YYYY-MM-DDTHH:MM) to an absolute instant. */
export function localDateTimeToDate(local: string): Date {
  const [date, time = '00:00'] = local.split('T') as [string, string?];
  const { year, month, day } = parseDate(date);
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let guess = wallClockAsUtc;
  for (let i = 0; i < 3; i += 1) {
    const p = zonedParts(new Date(guess));
    const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - guess;
    const next = wallClockAsUtc - offset;
    if (next === guess) break;
    guess = next;
  }
  return new Date(guess);
}
