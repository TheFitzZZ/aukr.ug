import { SCHEMA_VERSION } from '@aukrug/content';

import { describeStatus } from '@/components/opening-status';
import { normalizeSettings } from '@/settings/settings-context';

import { parseRemoteBundle, snapshot } from '@/content/bundle';
import { downloadContent } from '@/content/content-context';
import { filterMenu } from '@/content/menu';

describe('bundled content', () => {
  it('ships a valid snapshot of the website content', () => {
    expect(snapshot.site.name).toBe('Aukrug Borsfleth');
    expect(snapshot.menu.categories.length).toBeGreaterThan(3);
    expect(snapshot.pages.impressum.markdown).toContain('Torsten Gerund');
  });

  it('rejects invalid and too new remote content', () => {
    expect(parseRemoteBundle(snapshot)).toEqual({ ok: true, bundle: snapshot });
    expect(parseRemoteBundle({ ...snapshot, schemaVersion: SCHEMA_VERSION + 1 })).toEqual({ ok: false, reason: 'update-required' });
    expect(parseRemoteBundle({ ...snapshot, menu: { categories: 'kaputt' } })).toEqual({ ok: false, reason: 'invalid' });
    expect(parseRemoteBundle(null)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('downloads content without caches', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, json: async () => snapshot }) as unknown as Response);
    await expect(downloadContent(fetchMock as unknown as typeof fetch)).resolves.toEqual({ ok: true, bundle: snapshot });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/^https:\/\/aukr\.ug\/content\/bundle\.json\?t=\d+$/);
    expect(init.headers).toMatchObject({ 'Cache-Control': 'no-cache' });
  });

  it('reports HTTP errors', async () => {
    const fetchMock = jest.fn(async () => ({ ok: false, status: 404 }) as unknown as Response);
    await expect(downloadContent(fetchMock as unknown as typeof fetch)).rejects.toThrow('HTTP 404');
  });
});

describe('menu search', () => {
  const categories = snapshot.menu.categories;

  it('finds dishes by name, description and ignores accents', () => {
    const names = (q: string) => filterMenu(categories, q).flatMap((c) => c.items.map((i) => i.name));
    expect(names('schnitzel')).toEqual(expect.arrayContaining(['Schnitzel „Wiener Art“', 'Schleusenschnitzel', 'Sandwich „Aukrug“']));
    expect(names('kurbis')).toEqual(['Kürbissuppe']);
    expect(names('vanille')).toEqual(['Pack Eis']);
    expect(names('gibt es nicht')).toEqual([]);
  });

  it('keeps whole categories when the title matches', () => {
    expect(filterMenu(categories, 'flammkuchen')[0]?.items.length).toBe(6);
    expect(filterMenu(categories, '  ')).toBe(categories);
  });
});

describe('settings', () => {
  it('fills defaults for missing or broken values', () => {
    expect(normalizeSettings(undefined)).toEqual({
      onboardingDone: false,
      notificationsEnabled: false,
      topics: { events: true, notices: true, hours: true, menu: true, general: true },
      analyticsConsent: null,
    });
    expect(normalizeSettings({ onboardingDone: true, topics: { menu: false, events: 'x' }, analyticsConsent: false })).toMatchObject({
      onboardingDone: true,
      topics: { menu: false, events: true },
      analyticsConsent: false,
    });
  });
});

describe('opening status', () => {
  const hours = snapshot.openingHours;

  it('describes the current state in German', () => {
    expect(describeStatus(hours, new Date('2026-10-09T18:00:00Z'))).toEqual({ open: true, label: 'Jetzt geöffnet', detail: 'bis 22:00 Uhr' });
    expect(describeStatus(hours, new Date('2026-10-09T08:00:00Z'))).toEqual({ open: false, label: 'Heute geöffnet', detail: 'ab 17:00 Uhr' });
    expect(describeStatus(hours, new Date('2026-10-08T10:00:00Z'))).toEqual({
      open: false,
      label: 'Derzeit geschlossen',
      detail: 'wieder morgen, 17:00–22:00 Uhr',
    });
    expect(describeStatus(hours, new Date('2026-10-05T10:00:00Z')).detail).toBe('wieder Fr, 9. Okt., 17:00–22:00 Uhr');
  });
});
