import { createEventInCalendarAsync } from 'expo-calendar/legacy';
import { Alert, Share } from 'react-native';

import { formatDateNumeric, localDateTimeToDate, resolveSiteUrl, type EventItem, type Site } from '@aukrug/content';

import { trackEvent } from '@/services/firebase';

import { formatAddress } from './links';

const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

export function eventWebUrl(event: EventItem, site: Site) {
  return resolveSiteUrl(`index.html#event-slide-${event.id}`, site.websiteUrl);
}

/** Opens the system "new event" form, pre-filled; no calendar permission required. */
export async function addEventToCalendar(event: EventItem, site: Site) {
  if (!event.start) return;
  const startDate = localDateTimeToDate(event.start);
  const endDate = event.end ? localDateTimeToDate(event.end) : new Date(startDate.getTime() + DEFAULT_DURATION_MS);
  trackEvent('add_to_calendar', { event_id: event.id });
  try {
    await createEventInCalendarAsync({
      title: `${event.title} – ${site.name}`,
      startDate,
      endDate,
      timeZone: 'Europe/Berlin',
      location: `${site.name}, ${formatAddress(site)}`,
      notes: [event.tagline, ...event.highlights, ...event.description].filter(Boolean).join('\n\n'),
      url: eventWebUrl(event, site),
    });
  } catch {
    Alert.alert('Kalender nicht verfügbar', 'Der Termin konnte nicht in den Kalender übernommen werden.');
  }
}

export async function shareEvent(event: EventItem, site: Site) {
  const when = event.start ? `${formatDateNumeric(event.start.slice(0, 10))}, ${event.start.slice(11)} Uhr\n` : '';
  trackEvent('share', { content_type: 'event', item_id: event.id });
  await Share.share({
    title: event.title,
    message: `${event.title} im ${site.name}\n${when}${eventWebUrl(event, site)}`,
  });
}
