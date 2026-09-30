import { describe, expect, it, vi } from 'vitest';

import type { ContentBundle } from '@aukrug/content';

import { loadBundle } from '../content';
import { detectNotifications } from './changes';
import { buildMessage, sendNotifications } from './fcm';

const base = loadBundle();
const now = new Date('2026-10-01T10:00:00Z');
const clone = (): ContentBundle => structuredClone(base);

describe('detectNotifications', () => {
  it('sends nothing without a previous version or without changes', () => {
    expect(detectNotifications(undefined, base, now)).toEqual([]);
    expect(detectNotifications(base, clone(), now)).toEqual([]);
  });

  it('announces new visible events and skips opted-out or expired ones', () => {
    const next = clone();
    const template = next.events.events[0]!;
    next.events.events.push(
      { ...template, id: 'neu', shortTitle: 'Neu', start: '2026-11-07T18:00', summary: 'Tolles **Essen**.' },
      { ...template, id: 'still', shortTitle: 'Still', start: '2026-11-08T18:00', notify: false },
      { ...template, id: 'alt', shortTitle: 'Alt', start: '2026-09-01T18:00' },
    );
    expect(detectNotifications(base, next, now)).toEqual([
      {
        topic: 'events',
        title: 'Neue Veranstaltung: Neu',
        body: 'Samstag, 7. November 2026, 18:00 Uhr – Tolles Essen.',
        route: '/events/neu',
        key: 'event:neu',
      },
    ]);
  });

  it('announces a changed event date', () => {
    const next = clone();
    next.events.events[0]!.start = '2026-10-17T18:30';
    expect(detectNotifications(base, next, now)).toMatchObject([
      { topic: 'events', title: 'Neuer Termin: Schnitzelbuffet', key: 'event-date:schnitzelbuffet:2026-10-17T18:30' },
    ]);
  });

  it('announces new notices', () => {
    const next = clone();
    next.notices.notices.push({ id: 'zu', title: 'Hinweis', text: 'Heute **geschlossen**', visibleUntil: '2026-10-02', severity: 'warning', notify: true });
    expect(detectNotifications(base, next, now)).toEqual([
      { topic: 'notices', title: 'Hinweis', body: 'Heute geschlossen', route: '/', key: 'notice:zu' },
    ]);
  });

  it('announces regular and exceptional opening-hour changes', () => {
    const next = clone();
    next.openingHours.regular.push({ day: 'thu', open: '17:00', close: '22:00' });
    next.openingHours.exceptions.push(
      { date: '2026-10-03', closed: true, note: 'Feier' },
      { date: '2026-09-01', closed: true },
    );
    const result = detectNotifications(base, next, now);
    expect(result).toEqual([
      {
        topic: 'hours',
        title: 'Neue Öffnungszeiten',
        body: 'Do 17:00–22:00 · Fr 17:00–22:00 · Sa 16:00–22:00 · So 16:00–21:00',
        route: '/hours',
        key: 'hours:regular',
      },
      {
        topic: 'hours',
        title: 'Geänderte Öffnungszeiten',
        body: 'Sa, 3. Okt.: geschlossen (Feier)',
        route: '/hours',
        key: 'hours:exceptions:2026-10-03',
      },
    ]);
  });

  it('announces a new menu version only', () => {
    const typo = clone();
    typo.menu.categories[0]!.items[0]!.description = 'mit Basilikum';
    expect(detectNotifications(base, typo, now)).toEqual([]);
    const next = clone();
    next.menu.version = '2027-01';
    expect(detectNotifications(base, next, now)).toMatchObject([{ topic: 'menu', route: '/menu', key: 'menu:2027-01' }]);
  });
});

describe('FCM', () => {
  const notification = { topic: 'events' as const, title: 'T', body: 'B', route: '/events/x', key: 'event:x' };

  it('builds topic messages with deep links and dev topics', () => {
    expect(buildMessage(notification, 'production')).toMatchObject({ topic: 'events', data: { route: '/events/x' } });
    expect(buildMessage(notification, 'development').topic).toBe('dev-events');
  });

  it('posts to the FCM v1 API and reports errors', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ name: 'projects/p/messages/1' }), { status: 200 }));
    const result = await sendNotifications([notification], {
      projectId: 'p',
      target: 'production',
      validateOnly: true,
      getAccessToken: async () => 'token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual([{ key: 'event:x', name: 'projects/p/messages/1' }]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://fcm.googleapis.com/v1/projects/p/messages:send');
    expect(JSON.parse(init.body as string)).toMatchObject({ validate_only: true, message: { topic: 'events' } });

    const failing = vi.fn(async () => new Response('{"error":"denied"}', { status: 403 }));
    await expect(
      sendNotifications([notification], {
        projectId: 'p',
        target: 'production',
        validateOnly: false,
        getAccessToken: async () => 'token',
        fetchImpl: failing as unknown as typeof fetch,
      }),
    ).rejects.toThrow('FCM-Fehler 403');
  });
});
