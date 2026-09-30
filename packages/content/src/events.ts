import type { EventItem, Notice } from './schema';

/** Last day (inclusive, YYYY-MM-DD) on which an event is shown, if it expires. */
export function eventLastVisibleDate(event: EventItem): string | undefined {
  return event.visibleUntil ?? (event.end ?? event.start)?.slice(0, 10);
}

export function isEventVisible(event: EventItem, today: string): boolean {
  const until = eventLastVisibleDate(event);
  return !until || today <= until;
}

/** Visible events in editorial order. */
export function visibleEvents(events: readonly EventItem[], today: string): EventItem[] {
  return events.filter((e) => isEventVisible(e, today));
}

/** Visible dated events sorted by start. */
export function upcomingEvents(events: readonly EventItem[], today: string): EventItem[] {
  return visibleEvents(events, today)
    .filter((e) => e.kind === 'event' && e.start)
    .sort((a, b) => a.start!.localeCompare(b.start!));
}

/** Visible undated offers (e.g. seasonal specials) in editorial order. */
export function currentOffers(events: readonly EventItem[], today: string): EventItem[] {
  return visibleEvents(events, today).filter((e) => e.kind === 'offer');
}

export function activeNotices(notices: readonly Notice[], today: string): Notice[] {
  return notices.filter((n) => today <= n.visibleUntil);
}

/** Resolves a site-relative path (e.g. "assets/x.jpg") against the website URL. */
export function resolveSiteUrl(link: string, siteUrl: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
  return `${siteUrl.replace(/\/+$/, '')}/${link.replace(/^\/+/, '')}`;
}
