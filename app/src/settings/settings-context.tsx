import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { NOTIFICATION_TOPICS, type NotificationTopic } from '@aukrug/content';

import {
  firebaseEnabled,
  requestNotificationPermission,
  setAnalyticsActive,
  setAnalyticsConsent,
  syncTopicSubscriptions,
} from '@/services/firebase';
import { readJson, writeJson } from '@/services/storage';

const SETTINGS_FILE = 'settings.json';

export interface Settings {
  onboardingDone: boolean;
  notificationsEnabled: boolean;
  topics: Record<NotificationTopic, boolean>;
  /** null until the user decided */
  analyticsConsent: boolean | null;
}

export const DEFAULT_SETTINGS: Settings = {
  onboardingDone: false,
  notificationsEnabled: false,
  topics: Object.fromEntries(NOTIFICATION_TOPICS.map((t) => [t, true])) as Record<NotificationTopic, boolean>,
  analyticsConsent: null,
};

export function normalizeSettings(raw: unknown): Settings {
  const value = (raw ?? {}) as Partial<Settings>;
  return {
    onboardingDone: value.onboardingDone === true,
    notificationsEnabled: value.notificationsEnabled === true,
    topics: Object.fromEntries(
      NOTIFICATION_TOPICS.map((t) => [t, typeof value.topics?.[t] === 'boolean' ? value.topics[t] : true]),
    ) as Record<NotificationTopic, boolean>,
    analyticsConsent: typeof value.analyticsConsent === 'boolean' ? value.analyticsConsent : null,
  };
}

interface SettingsState {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  setTopic: (topic: NotificationTopic, enabled: boolean) => void;
  /** Requests OS permission; returns false if the user declined. */
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
  syncError: boolean;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => normalizeSettings(readJson(SETTINGS_FILE)));
  const [syncError, setSyncError] = useState(false);
  const firstSync = useRef(true);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      writeJson(SETTINGS_FILE, next);
      return next;
    });
  }, []);

  const setTopic = useCallback(
    (topic: NotificationTopic, enabled: boolean) => {
      setSettings((current) => {
        const next = { ...current, topics: { ...current.topics, [topic]: enabled } };
        writeJson(SETTINGS_FILE, next);
        return next;
      });
    },
    [],
  );

  const enableNotifications = useCallback(async () => {
    const result = await requestNotificationPermission();
    if (result !== 'granted') return false;
    update({ notificationsEnabled: true });
    return true;
  }, [update]);

  const disableNotifications = useCallback(() => update({ notificationsEnabled: false }), [update]);

  useEffect(() => {
    if (!firebaseEnabled) return;
    // On first launch without opt-in there is nothing to unsubscribe from.
    if (firstSync.current && !settings.notificationsEnabled) {
      firstSync.current = false;
      return;
    }
    firstSync.current = false;
    syncTopicSubscriptions(settings.notificationsEnabled, settings.topics)
      .then(() => setSyncError(false))
      .catch((error) => {
        console.warn('Themen konnten nicht synchronisiert werden', error);
        setSyncError(true);
      });
  }, [settings.notificationsEnabled, settings.topics]);

  useEffect(() => {
    setAnalyticsActive(settings.analyticsConsent === true);
    if (settings.analyticsConsent !== null) {
      setAnalyticsConsent(settings.analyticsConsent).catch((error) => console.warn('Analyse-Einstellung fehlgeschlagen', error));
    }
  }, [settings.analyticsConsent]);

  const value = useMemo(
    () => ({ settings, update, setTopic, enableNotifications, disableNotifications, syncError }),
    [settings, update, setTopic, enableNotifications, disableNotifications, syncError],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
