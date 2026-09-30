import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Site } from '@aukrug/content';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { contact, type ContactMethod } from '@/services/links';

import { AppText } from './app-text';

const ACTIONS: { method: ContactMethod; label: string; icon: ComponentProps<typeof Ionicons>['name']; hint: string }[] = [
  { method: 'phone', label: 'Anrufen', icon: 'call', hint: 'Ruft das Restaurant an' },
  { method: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', hint: 'Öffnet WhatsApp' },
  { method: 'email', label: 'E-Mail', icon: 'mail', hint: 'Schreibt eine E-Mail' },
  { method: 'route', label: 'Route', icon: 'navigate', hint: 'Öffnet die Karten-App' },
];

export function QuickActions({ site, emailSubject }: { site: Site; emailSubject?: string }) {
  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.method}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityHint={action.hint}
          onPress={() => contact(action.method, site, emailSubject)}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <View style={styles.icon}>
            <Ionicons name={action.icon} size={22} color={Colors.onDark} />
          </View>
          <AppText style={styles.label}>{action.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  action: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  pressed: { backgroundColor: Colors.surface },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.heading },
});
