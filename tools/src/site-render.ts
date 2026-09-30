import {
  closedDaysLong,
  closedDaysShort,
  eventLastVisibleDate,
  formatDateLong,
  formatDateNumeric,
  formatTimeRange,
  regularWeek,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  type ContentBundle,
  type EventItem,
  type Events,
  type Notices,
  type OpeningHours,
} from '@aukrug/content';

import { escapeHtml as esc, inlineHtml } from './html';
import type { Fragments } from './markers';

const NOTICE_STYLE =
  'text-align:center;padding:8px 12px;background-color:#3a2a1a;color:#ffd9a8;font-size:0.85rem;border-bottom:1px solid rgba(255,255,255,0.1);';

const indent = (lines: string[], depth = 1) => lines.map((line) => (line ? '\t'.repeat(depth) + line : line));

const visibleUntilAttr = (date: string | undefined) => (date ? ` data-visible-until="${esc(date)}"` : '');

function linkAttrs(url: string) {
  return /^https?:\/\//.test(url) ? ` target="_blank" rel="noopener"` : '';
}

export function openingHoursHeader(hours: OpeningHours): string[] {
  const days = regularWeek(hours).flatMap((day) => [
    '<div class="opening-day">',
    `\t<span class="day">${WEEKDAY_SHORT[day.day]}</span>`,
    `\t<span class="time">${formatTimeRange(day.open, day.close)}</span>`,
    '</div>',
  ]);
  const notes = [closedDaysShort(hours), hours.kitchenNote]
    .filter((n): n is string => Boolean(n))
    .map(esc);
  notes.push(`<a href="kontakt.html" class="flyer-cta__link">${esc(hours.privateEventsNote)}</a>`);
  return [
    '<div class="opening-times-header">',
    '\t<h2 class="flyer-title">Unsere Öffnungszeiten:</h2>',
    '\t<div class="opening-hours">',
    ...indent(days, 2),
    '\t</div>',
    `\t<div class="flyer-cta">${notes.join(' | ')}</div>`,
    '</div>',
  ];
}

export function noticeBars(notices: Notices, hours: OpeningHours): string[] {
  const exceptionLines = [...hours.exceptions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const time = e.closed ? 'geschlossen' : `${formatTimeRange(e.open!, e.close!)} Uhr geöffnet`;
      const note = e.note ? ` – ${esc(e.note)}` : '';
      return `<div class="holiday-info" role="status"${visibleUntilAttr(e.date)} style="${NOTICE_STYLE}"><strong>Geänderte Öffnungszeiten:</strong> ${esc(formatDateNumeric(e.date))}: ${time}${note}</div>`;
    });
  const noticeLines = notices.notices.map(
    (n) =>
      `<div class="holiday-info" role="status"${visibleUntilAttr(n.visibleUntil)} style="${NOTICE_STYLE}"><strong>${esc(n.title)}:</strong> ${inlineHtml(n.text)}</div>`,
  );
  return [...noticeLines, ...exceptionLines];
}

export function contactHours(hours: OpeningHours): string[] {
  const lines = regularWeek(hours).map(
    (day) => `🕐 ${WEEKDAY_LONG[day.day]}: ${formatTimeRange(day.open, day.close)} Uhr<br>`,
  );
  const closed = closedDaysLong(hours);
  const extras = [closed, hours.kitchenNote].filter((n): n is string => Boolean(n)).map((n) => `<i>${esc(n)}</i>`);
  return ['<p><b>Öffnungszeiten</b><br>', ...lines, `${extras.join('<br>')}</p>`];
}

function noteHtml(event: EventItem) {
  const parts = event.start ? [`<strong>${esc(formatDateNumeric(event.start.slice(0, 10)))}</strong>`] : [];
  parts.push(...event.highlights.map(esc));
  return parts.join('<br />');
}

function ctaHtml(event: EventItem) {
  const parts = event.closing ? [esc(event.closing)] : [];
  parts.push(
    ...event.actions.map((a) => `<a href="${esc(a.url)}"${linkAttrs(a.url)}>${esc(a.label)} →</a>`),
  );
  return parts.join('<br />');
}

function slide(event: EventItem, index: number, count: number): string[] {
  const active = index === 0 ? ' is-active' : '';
  const content = [
    `<h2>${esc(event.title)}</h2>`,
    event.tagline ? `<p class="event-announcement__date">${esc(event.tagline)}</p>` : '',
    event.start || event.highlights.length ? `<p class="event-announcement__note">${noteHtml(event)}</p>` : '',
    ...event.description.map((p) => `<p class="event-announcement__promo">${esc(p)}</p>`),
    event.closing || event.actions.length ? `<p class="event-announcement__cta">${ctaHtml(event)}</p>` : '',
  ].filter(Boolean);
  return [
    `<li id="event-slide-${event.id}" class="event-carousel__slide${active}" role="group" aria-roledescription="Folie" aria-label="${index + 1} von ${count}: ${esc(event.shortTitle)}" data-carousel-slide data-carousel-title="${esc(event.shortTitle)}"${visibleUntilAttr(eventLastVisibleDate(event))}>`,
    '\t<article class="event-announcement">',
    '\t\t<div class="event-announcement__media">',
    `\t\t\t<a class="event-thumb" href="#${event.id}-modal" aria-label="Plakat „${esc(event.shortTitle)}“ vergrößern">`,
    '\t\t\t\t<span class="event-thumb__image">',
    `\t\t\t\t\t<img src="${esc(event.poster.src)}" alt="${esc(event.poster.alt)}" />`,
    '\t\t\t\t</span>',
    '\t\t\t\t<span class="event-thumb__hint">Tippen/Klicken zum Vergrößern</span>',
    '\t\t\t</a>',
    '\t\t</div>',
    '\t\t<div class="event-announcement__content">',
    ...indent(content, 3),
    '\t\t</div>',
    '\t</article>',
    '</li>',
  ];
}

export function eventCarousel(events: Events): string[] {
  const list = events.events;
  if (list.length === 0) return [];
  const dots = list.map(
    (e, i) =>
      `<button class="event-carousel__dot${i === 0 ? ' is-active' : ''}" type="button" aria-label="${esc(e.shortTitle)} anzeigen" aria-controls="event-slide-${e.id}"${i === 0 ? ' aria-current="true"' : ''} data-carousel-dot="${i}" data-event-id="${e.id}"></button>`,
  );
  const modals = list.flatMap((e) => [
    `<div id="${e.id}-modal" class="event-modal" aria-hidden="true"${visibleUntilAttr(eventLastVisibleDate(e))}>`,
    '\t<a href="#" class="event-modal__close" aria-label="Bild schließen">×</a>',
    '\t<div class="event-modal__content">',
    `\t\t<img src="${esc(e.poster.src)}" alt="${esc(e.poster.zoomAlt ?? e.poster.alt)}" />`,
    '\t</div>',
    '</div>',
  ]);
  return [
    '<section class="event-carousel event-announcement-wrapper" role="region" aria-roledescription="Karussell" aria-label="Kommende Veranstaltungen" data-event-carousel>',
    '\t<div class="event-carousel__controls" aria-label="Karussellsteuerung">',
    '\t\t<button class="event-carousel__autoplay" type="button" aria-pressed="false" data-carousel-autoplay>',
    '\t\t\t<span data-carousel-autoplay-label>Pause</span>',
    '\t\t</button>',
    '\t\t<button class="event-carousel__arrow" type="button" aria-label="Vorherige Veranstaltung" data-carousel-prev>&#8592;</button>',
    '\t\t<div class="event-carousel__dots" role="group" aria-label="Veranstaltung auswählen">',
    ...indent(dots, 3),
    '\t\t</div>',
    `\t\t<span class="event-carousel__status" data-carousel-status>1 von ${list.length}</span>`,
    '\t\t<button class="event-carousel__arrow" type="button" aria-label="Nächste Veranstaltung" data-carousel-next>&#8594;</button>',
    '\t</div>',
    '\t<p class="event-carousel__announcement" aria-live="polite" aria-atomic="true" data-carousel-announcement></p>',
    '\t<div class="event-carousel__viewport" data-carousel-viewport>',
    '\t\t<ul class="event-carousel__slides">',
    ...indent(
      list.flatMap((e, i) => slide(e, i, list.length)),
      3,
    ),
    '\t\t</ul>',
    '\t</div>',
    '</section>',
    ...modals,
  ];
}

function teaserHeadline(event: EventItem) {
  if (!event.start) return event.shortTitle;
  const [date, time] = event.start.split('T') as [string, string];
  return `${event.shortTitle} am ${formatDateLong(date)} ab ${time} Uhr`;
}

export function eventTeasers(events: Events): string[] {
  return events.events
    .filter((e) => e.announce)
    .map((e) => {
      const links = [
        ...e.actions.map((a) => `<a href="${esc(a.url)}"${linkAttrs(a.url)}>${esc(a.label)} →</a>`),
        `<a href="index.html#event-slide-${e.id}">Plakat auf der Startseite ansehen →</a>`,
      ];
      return `<p${visibleUntilAttr(eventLastVisibleDate(e))}><strong>Neu: ${esc(teaserHeadline(e))}.</strong> ${esc(e.summary ?? '')} ${links.join(' ')}</p>`;
    });
}

export function calendarImage(events: Events): string[] {
  const { image, alt } = events.calendar;
  return [`<img src="${esc(image)}" alt="${esc(alt)}" class="calendar-image" />`];
}

export function siteFragments(bundle: ContentBundle): Fragments {
  return {
    'opening-hours': openingHoursHeader(bundle.openingHours),
    notices: noticeBars(bundle.notices, bundle.openingHours),
    'contact-hours': contactHours(bundle.openingHours),
    events: eventCarousel(bundle.events),
    'event-teasers': eventTeasers(bundle.events),
    'calendar-image': calendarImage(bundle.events),
  };
}
