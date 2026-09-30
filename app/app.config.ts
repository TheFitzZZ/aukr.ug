import { existsSync } from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Firebase is enabled when both platform config files are available, either locally in
 * `app/firebase/` (git-ignored) or via EAS file environment variables.
 */
const iosFirebaseFile = process.env.GOOGLE_SERVICE_INFO_PLIST ?? './firebase/GoogleService-Info.plist';
const androidFirebaseFile = process.env.GOOGLE_SERVICES_JSON ?? './firebase/google-services.json';
const firebaseEnabled =
  existsSync(path.resolve(__dirname, iosFirebaseFile)) && existsSync(path.resolve(__dirname, androidFirebaseFile));

/** Production builds use the public notification topics, all other builds the `dev-` topics. */
const notificationTarget = process.env.APP_VARIANT === 'production' ? 'production' : 'development';

const BRAND_DARK = '#2c2a2a';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Aukrug',
  slug: 'aukrug',
  owner: process.env.EXPO_OWNER,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'aukrug',
  userInterfaceStyle: 'light',
  backgroundColor: '#ffffff',
  ios: {
    bundleIdentifier: 'com.bitanker.aukrug',
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
    ...(firebaseEnabled && {
      googleServicesFile: iosFirebaseFile,
      entitlements: { 'aps-environment': 'production' },
      infoPlist: { UIBackgroundModes: ['remote-notification'] },
    }),
  },
  android: {
    package: 'com.bitanker.aukrug',
    adaptiveIcon: {
      backgroundColor: BRAND_DARK,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['android.permission.POST_NOTIFICATIONS'],
    blockedPermissions: [
      'android.permission.READ_CALENDAR',
      'android.permission.WRITE_CALENDAR',
      'com.google.android.gms.permission.AD_ID',
    ],
    predictiveBackGestureEnabled: false,
    ...(firebaseEnabled && { googleServicesFile: androidFirebaseFile }),
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      { backgroundColor: BRAND_DARK, image: './assets/images/splash-icon.png', imageWidth: 220 },
    ],
    [
      'expo-calendar',
      {
        calendarPermission: false,
        remindersPermission: false,
        writeOnlyCalendarPermission: 'Damit können Sie Veranstaltungen des Aukrug in Ihren Kalender eintragen.',
      },
    ],
    [
      'expo-build-properties',
      // React Native Firebase resolves the Firebase Apple SDK via Swift Package Manager, which needs dynamic frameworks.
      { ios: { useFrameworks: 'dynamic', enableSceneSupport: true } },
    ],
    './plugins/with-notification-icon',
    ...(firebaseEnabled
      ? [
          '@react-native-firebase/app',
          '@react-native-firebase/messaging',
          ['@react-native-firebase/analytics', { ios: { withoutAdIdSupport: true } }] as [string, unknown],
        ]
      : []),
  ],
  experiments: {
    reactCompiler: true,
  },
  extra: {
    firebaseEnabled,
    notificationTarget,
    contentUrl: 'https://aukr.ug/content/bundle.json',
    siteUrl: 'https://aukr.ug/',
    ...(process.env.EAS_PROJECT_ID && { eas: { projectId: process.env.EAS_PROJECT_ID } }),
  },
});
