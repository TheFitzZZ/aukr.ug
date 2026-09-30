import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

export interface BannerMessage {
  title: string;
  body: string;
  route?: string;
}

const AUTO_HIDE_MS = 8000;

/** Shows notifications that arrive while the app is open. */
export function InAppBanner({ message, onPress, onDismiss }: { message: BannerMessage | null; onPress: () => void; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={[styles.wrap, { top: insets.top + Spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${message.title}. ${message.body}`}
        accessibilityHint={message.route ? 'Öffnet die Mitteilung' : undefined}
        accessibilityLiveRegion="polite"
        onPress={onPress}
        style={styles.banner}>
        <Ionicons name="notifications" size={22} color={Colors.gold} />
        <View style={styles.text}>
          <AppText style={styles.title} numberOfLines={1}>
            {message.title}
          </AppText>
          <AppText style={styles.body} numberOfLines={3}>
            {message.body}
          </AppText>
        </View>
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Mitteilung schließen" hitSlop={12}>
          <Ionicons name="close" size={20} color={Colors.onDarkMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: Spacing.md, right: Spacing.md, zIndex: 100 },
  banner: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    backgroundColor: Colors.ink,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: { flex: 1, gap: 2 },
  title: { color: Colors.onDark, fontFamily: Fonts.bold },
  body: { color: Colors.onDarkMuted, fontSize: 14, lineHeight: 19 },
});
