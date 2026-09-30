import {
  SourceSans3_300Light,
  SourceSans3_400Regular,
  SourceSans3_400Regular_Italic,
  SourceSans3_700Bold,
  SourceSans3_900Black,
  useFonts,
} from '@expo-google-fonts/source-sans-3';
import { DefaultTheme, Stack, ThemeProvider, usePathname, useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { isSafeRoute } from '@aukrug/content';

import { InAppBanner, type BannerMessage } from '@/components/in-app-banner';
import { headerOptions } from '@/constants/navigation';
import { Colors } from '@/constants/theme';
import { ContentProvider, useContent } from '@/content/content-context';
import { listenForNotifications, trackEvent, trackScreen, type RemoteMessage } from '@/services/firebase';
import { SettingsProvider, useSettings } from '@/settings/settings-context';

SplashScreen.preventAutoHideAsync();

// Deep links (e.g. from notifications) open on top of the tabs, so "back" leads into the app.
export const unstable_settings = { initialRouteName: '(tabs)' };

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: Colors.accent, background: Colors.page, card: Colors.ink, text: Colors.onDark },
};

function routeOf(message: RemoteMessage): string | undefined {
  const route = message.data?.route;
  return isSafeRoute(route) ? route : undefined;
}

/** Handles push notifications, onboarding and screen tracking. */
function AppEffects() {
  const router = useRouter();
  const pathname = usePathname();
  const { refresh } = useContent();
  const { settings } = useSettings();
  const [banner, setBanner] = useState<BannerMessage | null>(null);
  const onboardingShown = useRef(false);

  useEffect(
    () =>
      listenForNotifications({
        onForeground: (message) => {
          refresh({ force: true });
          setBanner({
            title: message.notification?.title ?? 'Aukrug',
            body: message.notification?.body ?? '',
            route: routeOf(message),
          });
        },
        onOpened: (message) => {
          refresh({ force: true });
          trackEvent('notification_open', { topic: String(message.data?.topic ?? ''), key: String(message.data?.key ?? '') });
          const route = routeOf(message);
          if (route) router.push(route as Href);
        },
      }),
    [refresh, router],
  );

  useEffect(() => {
    if (!settings.onboardingDone && !onboardingShown.current) {
      onboardingShown.current = true;
      router.push('/welcome');
    }
  }, [settings.onboardingDone, router]);

  useEffect(() => {
    trackScreen(pathname);
  }, [pathname, settings.analyticsConsent]);

  const dismiss = useCallback(() => setBanner(null), []);
  const open = useCallback(() => {
    if (banner?.route) router.push(banner.route as Href);
    setBanner(null);
  }, [banner, router]);

  return <InAppBanner message={banner} onPress={open} onDismiss={dismiss} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SourceSans3_300Light,
    SourceSans3_400Regular,
    SourceSans3_400Regular_Italic,
    SourceSans3_700Bold,
    SourceSans3_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ContentProvider>
        <SettingsProvider>
          <ThemeProvider value={theme}>
            <StatusBar style="light" />
            <Stack screenOptions={{ ...headerOptions, contentStyle: { backgroundColor: Colors.page } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Start' }} />
              <Stack.Screen name="events/[id]" options={{ title: '' }} />
              <Stack.Screen name="pages/[id]" options={{ title: '' }} />
              <Stack.Screen name="hours" options={{ title: 'Öffnungszeiten & Kontakt' }} />
              <Stack.Screen name="calendar" options={{ title: 'Veranstaltungskalender' }} />
              <Stack.Screen name="settings" options={{ title: 'Einstellungen' }} />
              <Stack.Screen name="welcome" options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
            </Stack>
            <AppEffects />
          </ThemeProvider>
        </SettingsProvider>
      </ContentProvider>
    </GestureHandlerRootView>
  );
}
