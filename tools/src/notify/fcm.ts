import { GoogleAuth } from 'google-auth-library';

import { fcmTopic, type NotificationTarget } from '@aukrug/content';

import type { AppNotification } from './changes';

const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const BRAND_COLOR = '#F07A1A';

export function buildMessage(notification: AppNotification, target: NotificationTarget) {
  return {
    topic: fcmTopic(notification.topic, target),
    notification: { title: notification.title, body: notification.body },
    data: { route: notification.route, topic: notification.topic, key: notification.key },
    android: { priority: 'HIGH', notification: { color: BRAND_COLOR } },
    apns: { payload: { aps: { sound: 'default' } } },
  };
}

export interface SendOptions {
  projectId: string;
  target: NotificationTarget;
  /** Let FCM validate the message without delivering it. */
  validateOnly: boolean;
  getAccessToken?: () => Promise<string>;
  fetchImpl?: typeof fetch;
}

async function defaultAccessToken() {
  const client = await new GoogleAuth({ scopes: [SCOPE] }).getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Kein Zugriffstoken für Firebase Cloud Messaging erhalten');
  return token;
}

export async function sendNotifications(notifications: AppNotification[], options: SendOptions) {
  const token = await (options.getAccessToken ?? defaultAccessToken)();
  const doFetch = options.fetchImpl ?? fetch;
  const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(options.projectId)}/messages:send`;
  const results: { key: string; name: string }[] = [];
  for (const notification of notifications) {
    const response = await doFetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: buildMessage(notification, options.target), validate_only: options.validateOnly }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`FCM-Fehler ${response.status} für ${notification.key}: ${text}`);
    results.push({ key: notification.key, name: (JSON.parse(text) as { name?: string }).name ?? '' });
  }
  return results;
}
