import Constants from 'expo-constants';
import { PermissionsAndroid, Platform } from 'react-native';

import {
  fcmTopic,
  NOTIFICATION_TOPICS,
  type NotificationTarget,
  type NotificationTopic,
} from '@aukrug/content';

import type * as MessagingModule from '@react-native-firebase/messaging';
import type * as AnalyticsModule from '@react-native-firebase/analytics';

/** Firebase is only compiled in when the build had Firebase config files (see app.config.ts). */
export const firebaseEnabled: boolean = Boolean(Constants.expoConfig?.extra?.firebaseEnabled);

export const notificationTarget: NotificationTarget =
  Constants.expoConfig?.extra?.notificationTarget === 'production' ? 'production' : 'development';

// Loaded lazily so builds without Firebase never touch the native modules.
const messagingModule = () => require('@react-native-firebase/messaging') as typeof MessagingModule;
const analyticsModule = () => require('@react-native-firebase/analytics') as typeof AnalyticsModule;

export type RemoteMessage = MessagingModule.RemoteMessage;

export type PermissionResult = 'granted' | 'denied' | 'unavailable';

/** Asks the OS for permission to show notifications. */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  if (!firebaseEnabled) return 'unavailable';
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return 'denied';
  }
  const { getMessaging, requestPermission, AuthorizationStatus } = messagingModule();
  const status = await requestPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL ? 'granted' : 'denied';
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!firebaseEnabled) return false;
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  const { getMessaging, hasPermission, AuthorizationStatus } = messagingModule();
  const status = await hasPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

/**
 * Subscribes to the selected topics and unsubscribes from the others.
 * With notifications disabled, the FCM registration token is deleted as well.
 */
export async function syncTopicSubscriptions(enabled: boolean, topics: Record<NotificationTopic, boolean>) {
  if (!firebaseEnabled) return;
  const m = messagingModule();
  const messaging = m.getMessaging();
  if (!enabled) {
    if (!(await m.isAutoInitEnabled(messaging))) return;
    await Promise.all(NOTIFICATION_TOPICS.map((t) => m.unsubscribeFromTopic(messaging, fcmTopic(t, notificationTarget))));
    await m.deleteToken(messaging);
    await m.setAutoInitEnabled(messaging, false);
    return;
  }
  await m.setAutoInitEnabled(messaging, true);
  if (Platform.OS === 'ios' && !m.isDeviceRegisteredForRemoteMessages(messaging)) {
    await m.registerDeviceForRemoteMessages(messaging);
  }
  await Promise.all(
    NOTIFICATION_TOPICS.map((t) =>
      topics[t]
        ? m.subscribeToTopic(messaging, fcmTopic(t, notificationTarget))
        : m.unsubscribeFromTopic(messaging, fcmTopic(t, notificationTarget)),
    ),
  );
}

/** Registers listeners for notifications; returns an unsubscribe function. */
export function listenForNotifications(handlers: {
  onForeground: (message: RemoteMessage) => void;
  onOpened: (message: RemoteMessage) => void;
}): () => void {
  if (!firebaseEnabled) return () => {};
  const m = messagingModule();
  const messaging = m.getMessaging();
  const unsubscribeForeground = m.onMessage(messaging, async (message) => handlers.onForeground(message));
  const unsubscribeOpened = m.onNotificationOpenedApp(messaging, handlers.onOpened);
  m.getInitialNotification(messaging).then((message) => {
    if (message) handlers.onOpened(message);
  });
  return () => {
    unsubscribeForeground();
    unsubscribeOpened();
  };
}

/** Must be called at startup (outside React) so Android can process messages in the background. */
export function registerBackgroundHandler() {
  if (!firebaseEnabled) return;
  const m = messagingModule();
  m.setBackgroundMessageHandler(m.getMessaging(), async () => {});
}

export async function setAnalyticsConsent(granted: boolean) {
  if (!firebaseEnabled) return;
  const a = analyticsModule();
  const analytics = a.getAnalytics();
  await a.setConsent(analytics, {
    analytics_storage: granted,
    ad_storage: false,
    ad_user_data: false,
    ad_personalization: false,
  });
  await a.setAnalyticsCollectionEnabled(analytics, granted);
  if (!granted) await a.resetAnalyticsData(analytics);
}

let analyticsActive = false;

export function setAnalyticsActive(active: boolean) {
  analyticsActive = active && firebaseEnabled;
}

export function trackScreen(screenName: string) {
  if (!analyticsActive) return;
  try {
    const a = analyticsModule();
    Promise.resolve(a.logScreenView(a.getAnalytics(), { screen_name: screenName, screen_class: screenName })).catch(() => {});
  } catch {
    // Analytics must never break the app.
  }
}

export function trackEvent(name: string, params?: Record<string, string | number>) {
  if (!analyticsActive) return;
  try {
    const a = analyticsModule();
    Promise.resolve(a.logEvent(a.getAnalytics(), name, params)).catch(() => {});
  } catch {
    // Analytics must never break the app.
  }
}
