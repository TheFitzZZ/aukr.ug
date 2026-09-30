export const NOTIFICATION_TOPICS = ['events', 'notices', 'hours', 'menu', 'general'] as const;
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number];

export const TOPIC_INFO: Record<NotificationTopic, { label: string; description: string }> = {
  events: { label: 'Neue Veranstaltungen', description: 'Events, Buffets und besondere Abende' },
  notices: { label: 'Kurzfristige Hinweise', description: 'z. B. Schließungen oder geschlossene Gesellschaften' },
  hours: { label: 'Öffnungszeiten', description: 'Geänderte reguläre oder besondere Öffnungszeiten' },
  menu: { label: 'Neue Speisekarte', description: 'Wenn es eine neue Karte gibt' },
  general: { label: 'Neuigkeiten', description: 'Allgemeine Nachrichten vom Aukrug' },
};

export type NotificationTarget = 'production' | 'development';

/** FCM topic name; development builds use separate `dev-` topics. */
export function fcmTopic(topic: NotificationTopic, target: NotificationTarget): string {
  return target === 'development' ? `dev-${topic}` : topic;
}

export const ROUTES = {
  home: '/',
  hours: '/hours',
  menu: '/menu',
  event: (id: string) => `/events/${id}`,
} as const;

/** Only in-app paths are accepted as notification deep links. */
export function isSafeRoute(route: unknown): route is string {
  return typeof route === 'string' && /^\/[a-z0-9\-/]*$/.test(route) && !route.includes('//');
}
