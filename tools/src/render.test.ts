import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { eventsSchema, noticesSchema, openingHoursSchema } from '@aukrug/content';

import { buildSite, isPublished } from './build-site';
import { loadBundle } from './content';
import { applyMarkers } from './markers';
import { renderAll } from './render';
import { contactHours, eventCarousel, eventTeasers, noticeBars, openingHoursHeader } from './site-render';
import { findExpiredContent, findMissingFiles } from './validate';

const hours = openingHoursSchema.parse({
  schemaVersion: 1,
  timezone: 'Europe/Berlin',
  regular: [
    { day: 'sun', open: '16:00', close: '21:00' },
    { day: 'fri', open: '17:00', close: '22:00' },
  ],
  kitchenNote: 'Küche bis 21 Uhr',
  privateEventsNote: 'Feiern & mehr',
  exceptions: [{ date: '2026-12-24', closed: true, note: 'Frohe Weihnachten' }],
});

const events = eventsSchema.parse({
  schemaVersion: 1,
  calendar: { title: 'Kalender', image: 'assets/k.jpg', alt: 'Kalender' },
  events: [
    {
      id: 'buffet',
      kind: 'event',
      title: 'Buffet <XL>',
      shortTitle: 'Buffet',
      start: '2026-10-10T18:30',
      highlights: ['24 € pro Person'],
      summary: 'Lecker.',
      announce: true,
      actions: [{ label: 'Tickets', url: 'https://example.com/t' }],
      poster: { src: 'assets/b.jpg', alt: 'Plakat' },
    },
    { id: 'offer', kind: 'offer', title: 'Angebot', shortTitle: 'Angebot', poster: { src: 'assets/o.jpg', alt: 'O' } },
  ],
});

describe('markers', () => {
  it('replaces generated blocks with indentation and keeps unknown blocks', () => {
    const html = ['<body>', '\t\t<!-- content:a · Hinweis -->', 'alt', '\t\t<!-- /content:a -->', '<!-- content:b -->', 'x', '<!-- /content:b -->'].join('\n');
    const result = applyMarkers(html, { a: ['<p>', '\tneu', '</p>'] });
    expect(result.html).toBe(
      ['<body>', '\t\t<!-- content:a · Hinweis -->', '\t\t<p>', '\t\t\tneu', '\t\t</p>', '\t\t<!-- /content:a -->', '<!-- content:b -->', 'x', '<!-- /content:b -->'].join('\n'),
    );
    expect(result.replaced).toEqual(['a']);
    expect(result.unknown).toEqual(['b']);
  });

  it('supports empty fragments', () => {
    expect(applyMarkers('<!-- content:a -->\nalt\n<!-- /content:a -->', { a: [] }).html).toBe('<!-- content:a -->\n<!-- /content:a -->');
  });
});

describe('site fragments', () => {
  it('renders opening hours in week order with closing-day summary', () => {
    const html = openingHoursHeader(hours).join('\n');
    expect(html.indexOf('>Fr<')).toBeLessThan(html.indexOf('>So<'));
    expect(html).toContain('Mo-Do, Sa geschlossen | Küche bis 21 Uhr | <a href="kontakt.html" class="flyer-cta__link">Feiern &amp; mehr</a>');
    expect(contactHours(hours).join('\n')).toContain('🕐 Freitag: 17:00–22:00 Uhr<br>');
  });

  it('renders notices and opening exceptions with visibility dates', () => {
    const notices = noticesSchema.parse({ schemaVersion: 1, notices: [{ id: 'n', text: 'Heute **zu**', visibleUntil: '2026-10-01' }] });
    const [notice, exception] = noticeBars(notices, hours);
    expect(notice).toContain('data-visible-until="2026-10-01"');
    expect(notice).toContain('<strong>Hinweis:</strong> Heute <strong>zu</strong>');
    expect(exception).toContain('Donnerstag, 24.12.2026: geschlossen – Frohe Weihnachten');
  });

  it('renders the event carousel with escaped content', () => {
    const html = eventCarousel(events).join('\n');
    expect(html).toContain('1 von 2');
    expect(html).toContain('<h2>Buffet &lt;XL&gt;</h2>');
    expect(html).toContain('<strong>Samstag, 10.10.2026</strong><br />24 € pro Person');
    expect(html).toContain('<a href="https://example.com/t" target="_blank" rel="noopener">Tickets →</a>');
    expect(html).toContain('id="event-slide-buffet" class="event-carousel__slide is-active"');
    expect(html).toContain('data-visible-until="2026-10-10"');
    expect(html).toContain('<div id="offer-modal" class="event-modal" aria-hidden="true">');
    expect(eventCarousel({ ...events, events: [] })).toEqual([]);
  });

  it('renders calendar teasers for announced events', () => {
    expect(eventTeasers(events)).toEqual([
      '<p data-visible-until="2026-10-10"><strong>Neu: Buffet am Samstag, 10. Oktober 2026 ab 18:30 Uhr.</strong> Lecker. <a href="https://example.com/t" target="_blank" rel="noopener">Tickets →</a> <a href="index.html#event-slide-buffet">Plakat auf der Startseite ansehen →</a></p>',
    ]);
  });
});

describe('repository content', () => {
  const bundle = loadBundle();

  it('is valid and references existing files', () => {
    expect(findMissingFiles(bundle)).toEqual([]);
  });

  it('is in sync with the rendered website and bundle', () => {
    const { files, problems } = renderAll(bundle);
    expect(problems).toEqual([]);
    expect(files.filter((f) => f.changed).map((f) => f.file)).toEqual([]);
  });

  it('reports expired content', () => {
    const hints = findExpiredContent(bundle, new Date('2027-06-01T12:00:00Z'));
    expect(hints).toContain('content/events.json: "schnitzelbuffet" ist abgelaufen und kann entfernt werden');
  });
});

describe('site build', () => {
  it('publishes the website and content but not app sources', () => {
    expect(isPublished('index.html')).toBe(true);
    expect(isPublished('content/bundle.json')).toBe(true);
    expect(isPublished('assets/js/main.js')).toBe(true);
    expect(isPublished('app/src/app/index.tsx')).toBe(false);
    expect(isPublished('tools/src/cli.ts')).toBe(false);
    expect(isPublished('package.json')).toBe(false);
    expect(isPublished('.github/workflows/static.yml')).toBe(false);
  });

  it('builds into a _site folder inside the repository root', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'aukrug-site-'));
    try {
      for (const file of ['index.html', 'content/bundle.json', 'assets/x.js', 'app/App.tsx', 'tools/cli.ts', 'package.json']) {
        mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        writeFileSync(path.join(root, file), file);
      }
      const out = buildSite(path.join(root, '_site'), root);
      expect(readdirSync(out).sort()).toEqual(['assets', 'content', 'index.html']);
      expect(existsSync(path.join(out, 'content/bundle.json'))).toBe(true);
      buildSite(path.join(root, '_site'), root);
      expect(existsSync(path.join(out, '_site'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
