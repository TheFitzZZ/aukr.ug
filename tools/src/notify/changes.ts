import {
  formatDateCompact,
  formatDateLong,
  formatTimeRange,
  isEventVisible,
  regularWeek,
  ROUTES,
  toLocalMoment,
  WEEKDAY_SHORT,
  type ContentBundle,
  type EventItem,
  type NotificationTopic,
  type OpeningException,
} from '@aukrug/content';

export interface AppNotification {
  topic: NotificationTopic;
  title: string;
  body: string;
  route: string;
  /** Stable identifier of the change, e.g. "event:schnitzelbuffet". */
  key: string;
}

const MAX_BODY = 180;

export function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\s+/g, ' ').trim();
}

export function truncate(text: string, max = MAX_BODY): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function whenLabel(start: string) {
  const [date, time] = start.split('T') as [string, string];
  return `${formatDateLong(date)}, ${time} Uhr`;
}

function eventBody(event: EventItem) {
  const detail = event.summary ?? event.tagline ?? event.description[0] ?? '';
  if (!event.start) return truncate(plain(detail || event.title));
  return truncate(plain(detail ? `${whenLabel(event.start)} – ${detail}` : whenLabel(event.start)));
}

function exceptionLabel(e: OpeningException) {
  const hours = e.closed ? 'geschlossen' : `${formatTimeRange(e.open!, e.close!)} Uhr`;
  return `${formatDateCompact(e.date)}: ${hours}${e.note ? ` (${e.note})` : ''}`;
}

function sameException(a: OpeningException, b: OpeningException) {
  return a.closed === b.closed && a.open === b.open && a.close === b.close && a.note === b.note;
}

/** Notifications for relevant differences between two published content versions. */
export function detectNotifications(
  previous: ContentBundle | undefined,
  next: ContentBundle,
  now = new Date(),
): AppNotification[] {
  if (!previous) return [];
  const today = toLocalMoment(now).date;
  const result: AppNotification[] = [];

  const oldEvents = new Map(previous.events.events.map((e) => [e.id, e]));
  for (const event of next.events.events) {
    if (!event.notify || !isEventVisible(event, today)) continue;
    const old = oldEvents.get(event.id);
    if (!old) {
      result.push({
        topic: 'events',
        title: `${event.kind === 'event' ? 'Neue Veranstaltung' : 'Neues Angebot'}: ${event.shortTitle}`,
        body: eventBody(event),
        route: ROUTES.event(event.id),
        key: `event:${event.id}`,
      });
    } else if (event.start && old.start !== event.start) {
      result.push({
        topic: 'events',
        title: `Neuer Termin: ${event.shortTitle}`,
        body: `Jetzt am ${whenLabel(event.start)}.`,
        route: ROUTES.event(event.id),
        key: `event-date:${event.id}:${event.start}`,
      });
    }
  }

  const oldNotices = new Set(previous.notices.notices.map((n) => n.id));
  for (const notice of next.notices.notices) {
    if (!notice.notify || oldNotices.has(notice.id) || today > notice.visibleUntil) continue;
    result.push({
      topic: 'notices',
      title: notice.title,
      body: truncate(plain(notice.text)),
      route: ROUTES.home,
      key: `notice:${notice.id}`,
    });
  }

  const week = (b: ContentBundle) => JSON.stringify(regularWeek(b.openingHours));
  if (week(previous) !== week(next)) {
    const summary = regularWeek(next.openingHours)
      .map((d) => `${WEEKDAY_SHORT[d.day]} ${formatTimeRange(d.open, d.close)}`)
      .join(' · ');
    result.push({ topic: 'hours', title: 'Neue Öffnungszeiten', body: summary, route: ROUTES.hours, key: 'hours:regular' });
  }

  const oldExceptions = new Map(previous.openingHours.exceptions.map((e) => [e.date, e]));
  const changedExceptions = next.openingHours.exceptions
    .filter((e) => e.date >= today)
    .filter((e) => {
      const old = oldExceptions.get(e.date);
      return !old || !sameException(old, e);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (changedExceptions.length) {
    result.push({
      topic: 'hours',
      title: 'Geänderte Öffnungszeiten',
      body: truncate(changedExceptions.map(exceptionLabel).join(' · ')),
      route: ROUTES.hours,
      key: `hours:exceptions:${changedExceptions.map((e) => e.date).join(',')}`,
    });
  }

  if (previous.menu.version !== next.menu.version) {
    result.push({
      topic: 'menu',
      title: 'Neue Speisekarte',
      body: 'Unsere neue Karte ist da – jetzt in der App ansehen.',
      route: ROUTES.menu,
      key: `menu:${next.menu.version}`,
    });
  }

  return result;
}
