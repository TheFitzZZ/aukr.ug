import type { Weekday } from './schema';
import { weekdayOf } from './time';

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  mon: 'Mo',
  tue: 'Di',
  wed: 'Mi',
  thu: 'Do',
  fri: 'Fr',
  sat: 'Sa',
  sun: 'So',
};

export const WEEKDAY_LONG: Record<Weekday, string> = {
  mon: 'Montag',
  tue: 'Dienstag',
  wed: 'Mittwoch',
  thu: 'Donnerstag',
  fri: 'Freitag',
  sat: 'Samstag',
  sun: 'Sonntag',
};

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

function split(date: string) {
  const [year, month, day] = date.split('-') as [string, string, string];
  return { year, month, day };
}

/** "Samstag, 10.10.2026" */
export function formatDateNumeric(date: string): string {
  const { year, month, day } = split(date);
  return `${WEEKDAY_LONG[weekdayOf(date)]}, ${day}.${month}.${year}`;
}

/** "Samstag, 10. Oktober 2026" */
export function formatDateLong(date: string): string {
  const { year, month, day } = split(date);
  return `${WEEKDAY_LONG[weekdayOf(date)]}, ${Number(day)}. ${MONTHS[Number(month) - 1]} ${year}`;
}

/** "Sa, 10. Okt." */
export function formatDateCompact(date: string): string {
  const { month, day } = split(date);
  const monthName = MONTHS[Number(month) - 1]!;
  const shortMonth = monthName.length > 4 ? `${monthName.slice(0, 3)}.` : monthName;
  return `${WEEKDAY_SHORT[weekdayOf(date)]}, ${Number(day)}. ${shortMonth}`;
}

/** "17:00–22:00" */
export function formatTimeRange(open: string, close: string): string {
  return `${open}–${close}`;
}

/** 6 → "6 €", 6.5 → "6,50 €" */
export function formatPrice(value: number): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
  return `${formatted} €`;
}
