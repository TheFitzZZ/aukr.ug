import { describe, expect, it } from 'vitest';

import {
  activeNotices,
  addDays,
  closedDaysLong,
  closedDaysShort,
  currentOffers,
  eventSchema,
  formatDateCompact,
  formatDateLong,
  formatDateNumeric,
  formatPrice,
  hoursForDate,
  isEventVisible,
  localDateTimeToDate,
  openingHoursSchema,
  openingStatus,
  parseMarkdown,
  resolveSiteUrl,
  toLocalMoment,
  upcomingEvents,
  upcomingExceptions,
  weekdayOf,
} from './index';

const hours = openingHoursSchema.parse({
  schemaVersion: 1,
  timezone: 'Europe/Berlin',
  regular: [
    { day: 'fri', open: '17:00', close: '22:00' },
    { day: 'sat', open: '16:00', close: '22:00' },
    { day: 'sun', open: '16:00', close: '21:00' },
  ],
  privateEventsNote: 'Feiern auch außerhalb der Öffnungszeiten',
  exceptions: [
    { date: '2026-10-03', closed: true, note: 'Geschlossene Gesellschaft' },
    { date: '2026-10-08', closed: false, open: '18:00', close: '23:00', note: 'Sonderöffnung' },
  ],
});

describe('time', () => {
  it('converts instants to Berlin wall-clock time in summer and winter', () => {
    expect(toLocalMoment(new Date('2026-07-01T10:30:00Z'))).toEqual({ date: '2026-07-01', time: '12:30' });
    expect(toLocalMoment(new Date('2026-12-31T23:30:00Z'))).toEqual({ date: '2027-01-01', time: '00:30' });
  });

  it('converts Berlin wall-clock time to instants across DST', () => {
    expect(localDateTimeToDate('2026-10-10T18:30').toISOString()).toBe('2026-10-10T16:30:00.000Z');
    expect(localDateTimeToDate('2027-01-16T19:00').toISOString()).toBe('2027-01-16T18:00:00.000Z');
    expect(localDateTimeToDate('2026-10-25T12:00').toISOString()).toBe('2026-10-25T11:00:00.000Z');
    expect(localDateTimeToDate('2026-03-29T12:00').toISOString()).toBe('2026-03-29T10:00:00.000Z');
  });

  it('computes weekdays and adds days across month and year boundaries', () => {
    expect(weekdayOf('2026-10-10')).toBe('sat');
    expect(weekdayOf('2026-09-28')).toBe('mon');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('opening hours', () => {
  const at = (iso: string) => openingStatus(hours, new Date(iso));

  it('reports open until closing time', () => {
    expect(at('2026-10-09T17:00:00Z')).toMatchObject({ state: 'open', closesAt: '22:00' });
  });

  it('reports a later opening on an opening day', () => {
    expect(at('2026-10-09T10:00:00Z')).toMatchObject({ state: 'opens-later', opensAt: '17:00' });
  });

  it('skips closed exceptions and finds the next opening', () => {
    const status = at('2026-10-02T21:00:00Z');
    expect(status.state).toBe('closed');
    expect(status.state === 'closed' && status.next).toMatchObject({ date: '2026-10-04', open: '16:00' });
  });

  it('uses exception hours on otherwise closed days', () => {
    expect(hoursForDate(hours, '2026-10-08')).toMatchObject({ closed: false, open: '18:00', isException: true });
    expect(at('2026-10-08T17:00:00Z')).toMatchObject({ state: 'open', closesAt: '23:00' });
  });

  it('closes at closing time', () => {
    const status = at('2026-10-09T20:00:00Z');
    expect(status.state).toBe('closed');
    expect(status.state === 'closed' && status.next?.date).toBe('2026-10-10');
  });

  it('describes regular closing days', () => {
    expect(closedDaysShort(hours)).toBe('Mo-Do geschlossen');
    expect(closedDaysLong(hours)).toBe('Montag bis Donnerstag geschlossen');
  });

  it('lists upcoming exceptions', () => {
    expect(upcomingExceptions(hours, '2026-10-04').map((e) => e.date)).toEqual(['2026-10-08']);
  });

  it('rejects invalid exceptions', () => {
    const invalid = { ...hours, exceptions: [{ date: '2026-10-01', closed: false }] };
    expect(openingHoursSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('events', () => {
  const event = (data: Record<string, unknown>) =>
    eventSchema.parse({ kind: 'event', title: 'T', shortTitle: 'T', poster: { src: 'a.jpg', alt: 'a' }, ...data });

  it('hides dated events after their day and keeps undated offers', () => {
    const past = event({ id: 'past', start: '2026-09-01T18:00' });
    const later = event({ id: 'later', start: '2026-11-01T18:00' });
    const soon = event({ id: 'soon', start: '2026-10-10T18:30' });
    const offer = event({ id: 'offer', kind: 'offer' });
    const list = [later, past, offer, soon];
    expect(isEventVisible(soon, '2026-10-10')).toBe(true);
    expect(isEventVisible(soon, '2026-10-11')).toBe(false);
    expect(upcomingEvents(list, '2026-10-01').map((e) => e.id)).toEqual(['soon', 'later']);
    expect(currentOffers(list, '2030-01-01').map((e) => e.id)).toEqual(['offer']);
  });

  it('respects explicit visibility dates', () => {
    const offer = event({ id: 'offer', kind: 'offer', visibleUntil: '2026-10-31' });
    expect(isEventVisible(offer, '2026-10-31')).toBe(true);
    expect(isEventVisible(offer, '2026-11-01')).toBe(false);
  });

  it('requires a start for events', () => {
    expect(eventSchema.safeParse({ id: 'x', kind: 'event', title: 'T', shortTitle: 'T', poster: { src: 'a', alt: 'a' } }).success).toBe(false);
  });

  it('filters expired notices', () => {
    const notices = [
      { id: 'a', title: 'Hinweis', text: 'x', visibleUntil: '2026-10-01', severity: 'info' as const, notify: true },
      { id: 'b', title: 'Hinweis', text: 'y', visibleUntil: '2026-10-05', severity: 'info' as const, notify: true },
    ];
    expect(activeNotices(notices, '2026-10-02').map((n) => n.id)).toEqual(['b']);
  });

  it('resolves site-relative links', () => {
    expect(resolveSiteUrl('assets/a.jpg?v=1', 'https://aukr.ug/')).toBe('https://aukr.ug/assets/a.jpg?v=1');
    expect(resolveSiteUrl('/kontakt.html', 'https://aukr.ug')).toBe('https://aukr.ug/kontakt.html');
    expect(resolveSiteUrl('mailto:info@aukr.ug', 'https://aukr.ug/')).toBe('mailto:info@aukr.ug');
  });
});

describe('formatting', () => {
  it('formats German dates and prices', () => {
    expect(formatDateNumeric('2026-10-10')).toBe('Samstag, 10.10.2026');
    expect(formatDateLong('2026-10-10')).toBe('Samstag, 10. Oktober 2026');
    expect(formatDateCompact('2027-01-16')).toBe('Sa, 16. Jan.');
    expect(formatDateCompact('2026-05-02')).toBe('Sa, 2. Mai');
    expect(formatPrice(6)).toBe('6 €');
    expect(formatPrice(6.5)).toBe('6,50 €');
  });
});

describe('markdown', () => {
  it('parses the supported subset', () => {
    const blocks = parseMarkdown(
      [
        '# Titel',
        '',
        'Erste Zeile mit **fett**',
        'zweite Zeile mit [Link](https://aukr.ug).',
        '',
        '- Punkt eins',
        '- Punkt zwei',
        '',
        '![Bild 1](carussel/a.jpg)',
        '![Bild 2](carussel/b.jpg)',
        '## Unterpunkt',
      ].join('\n'),
    );
    expect(blocks).toEqual([
      { type: 'heading', level: 1, text: 'Titel' },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Erste Zeile mit ' },
          { type: 'bold', text: 'fett' },
          { type: 'text', text: '\nzweite Zeile mit ' },
          { type: 'link', text: 'Link', url: 'https://aukr.ug' },
          { type: 'text', text: '.' },
        ],
      },
      { type: 'list', items: [[{ type: 'text', text: 'Punkt eins' }], [{ type: 'text', text: 'Punkt zwei' }]] },
      {
        type: 'gallery',
        images: [
          { alt: 'Bild 1', src: 'carussel/a.jpg' },
          { alt: 'Bild 2', src: 'carussel/b.jpg' },
        ],
      },
      { type: 'heading', level: 2, text: 'Unterpunkt' },
    ]);
  });
});
