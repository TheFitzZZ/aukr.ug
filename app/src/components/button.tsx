import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'onDark';
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Button({ label, onPress, icon, variant = 'primary', accessibilityHint, style, disabled }: Props) {
  const palette = PALETTES[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={18} color={palette.fg} /> : null}
        <AppText style={[styles.label, { color: palette.fg }]}>{label}</AppText>
      </View>
    </Pressable>
  );
}

const PALETTES = {
  primary: { bg: Colors.accent, border: Colors.accent, fg: '#ffffff' },
  secondary: { bg: Colors.page, border: Colors.border, fg: Colors.heading },
  onDark: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.25)', fg: Colors.gold },
} as const;

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  label: { fontFamily: Fonts.bold, fontSize: 15, letterSpacing: 0.3 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
});
