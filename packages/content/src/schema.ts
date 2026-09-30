import { z } from 'zod';

export const SCHEMA_VERSION = 1;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format JJJJ-MM-TT erwartet');
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/, 'Zeitpunkt im Format JJJJ-MM-TTTHH:MM erwartet');
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Uhrzeit im Format HH:MM erwartet');
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Nur Kleinbuchstaben, Ziffern und Bindestriche');
const text = z.string().trim().min(1);

/** Absolute http(s)/mailto/tel URL or a path relative to the website root. */
export const linkSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => /^(https?:\/\/|mailto:|tel:)/.test(value) || !/^[a-z][a-z0-9+.-]*:/i.test(value),
    'Nur https-, mailto-, tel-Links oder relative Pfade erlaubt',
  );

export const weekdaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
export type Weekday = z.infer<typeof weekdaySchema>;

export const siteSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  name: text,
  shortName: text,
  tagline: text,
  owner: text,
  address: z.object({ street: text, postalCode: text, city: text }),
  coordinates: z.object({ latitude: z.number(), longitude: z.number() }),
  phone: z.object({ display: text, uri: z.string().regex(/^tel:\+\d+$/) }),
  whatsappUrl: linkSchema,
  email: z.email(),
  instagramUrl: linkSchema,
  mapsUrl: linkSchema,
  websiteUrl: z.url(),
  menuPdf: linkSchema,
  privacyPolicyUrl: z.url(),
  imprintUrl: z.url(),
});
export type Site = z.infer<typeof siteSchema>;

const regularHoursSchema = z
  .object({ day: weekdaySchema, open: clockTime, close: clockTime })
  .refine((h) => h.open < h.close, 'Öffnung muss vor Schließung liegen');

const exceptionSchema = z
  .object({
    date: isoDate,
    closed: z.boolean(),
    open: clockTime.optional(),
    close: clockTime.optional(),
    note: text.optional(),
  })
  .refine(
    (e) => (e.closed ? !e.open && !e.close : Boolean(e.open && e.close && e.open < e.close)),
    'Ausnahme: entweder "closed": true oder gültige "open"/"close"-Zeiten',
  );

export const openingHoursSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    timezone: z.literal('Europe/Berlin'),
    regular: z.array(regularHoursSchema).min(1),
    kitchenNote: text.optional(),
    privateEventsNote: text,
    exceptions: z.array(exceptionSchema).default([]),
  })
  .refine((h) => new Set(h.regular.map((r) => r.day)).size === h.regular.length, 'Jeder Wochentag nur einmal')
  .refine((h) => new Set(h.exceptions.map((e) => e.date)).size === h.exceptions.length, 'Jedes Ausnahmedatum nur einmal');
export type OpeningHours = z.infer<typeof openingHoursSchema>;
export type OpeningException = OpeningHours['exceptions'][number];

export const noticeSchema = z.object({
  id: slug,
  title: text.default('Hinweis'),
  text,
  visibleUntil: isoDate,
  severity: z.enum(['info', 'warning']).default('info'),
  notify: z.boolean().default(true),
});
export const noticesSchema = z
  .object({ schemaVersion: z.literal(SCHEMA_VERSION), notices: z.array(noticeSchema) })
  .refine((n) => new Set(n.notices.map((x) => x.id)).size === n.notices.length, 'Hinweis-IDs müssen eindeutig sein');
export type Notice = z.infer<typeof noticeSchema>;
export type Notices = z.infer<typeof noticesSchema>;

export const actionSchema = z.object({ label: text, url: linkSchema });

export const eventSchema = z
  .object({
    id: slug,
    kind: z.enum(['event', 'offer']),
    title: text,
    shortTitle: text,
    tagline: text.optional(),
    start: localDateTime.optional(),
    end: localDateTime.optional(),
    highlights: z.array(text).default([]),
    description: z.array(text).default([]),
    closing: text.optional(),
    summary: text.optional(),
    announce: z.boolean().default(false),
    actions: z.array(actionSchema).default([]),
    poster: z.object({ src: linkSchema, alt: text, zoomAlt: text.optional() }),
    visibleUntil: isoDate.optional(),
    notify: z.boolean().default(true),
  })
  .refine((e) => e.kind !== 'event' || Boolean(e.start), 'Veranstaltungen brauchen "start"')
  .refine((e) => !e.end || (Boolean(e.start) && e.start! < e.end), '"end" muss nach "start" liegen')
  .refine((e) => !e.announce || Boolean(e.summary), '"announce" erfordert "summary"');
export type EventItem = z.infer<typeof eventSchema>;

export const eventsSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    calendar: z.object({ title: text, image: linkSchema, alt: text }),
    events: z.array(eventSchema),
  })
  .refine((e) => new Set(e.events.map((x) => x.id)).size === e.events.length, 'Event-IDs müssen eindeutig sein');
export type Events = z.infer<typeof eventsSchema>;

const price = z.number().nonnegative().multipleOf(0.01);

export const menuItemSchema = z
  .object({
    name: text,
    description: text.optional(),
    price: price.optional(),
    variants: z.array(z.object({ label: text, price })).default([]),
    options: z.array(z.object({ label: text, surcharge: price })).default([]),
    choices: z.array(text).default([]),
    tags: z.array(z.enum(['vegetarian', 'fish', 'kids'])).default([]),
  })
  .refine((i) => i.price !== undefined || i.variants.length > 0, 'Preis oder Varianten angeben');
export type MenuItem = z.infer<typeof menuItemSchema>;

export const menuSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    version: text,
    title: text,
    intro: text.optional(),
    footnote: text.optional(),
    categories: z
      .array(z.object({ id: slug, title: text, subtitle: text.optional(), items: z.array(menuItemSchema).min(1) }))
      .min(1),
  })
  .refine((m) => new Set(m.categories.map((c) => c.id)).size === m.categories.length, 'Kategorie-IDs müssen eindeutig sein');
export type Menu = z.infer<typeof menuSchema>;
export type MenuCategory = Menu['categories'][number];

export const pageSchema = z.object({ title: text, markdown: text });
export type Page = z.infer<typeof pageSchema>;

export const PAGE_IDS = ['willkommen', 'raeumlichkeiten', 'ueber-uns', 'feiern', 'impressum', 'datenschutz'] as const;
export type PageId = (typeof PAGE_IDS)[number];

export const contentBundleSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  site: siteSchema,
  openingHours: openingHoursSchema,
  notices: noticesSchema,
  events: eventsSchema,
  menu: menuSchema,
  pages: z.object(Object.fromEntries(PAGE_IDS.map((id) => [id, pageSchema])) as Record<PageId, typeof pageSchema>),
});
export type ContentBundle = z.infer<typeof contentBundleSchema>;
