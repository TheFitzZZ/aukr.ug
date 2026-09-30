import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

interface Props {
  label: string;
  detail?: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  external?: boolean;
}

export function ListRow({ label, detail, icon, onPress, external }: Props) {
  return (
    <Pressable
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name={icon} size={22} color={Colors.accent} />
      <View style={styles.text}>
        <AppText variant="strong">{label}</AppText>
        {detail ? <AppText variant="caption">{detail}</AppText> : null}
      </View>
      <Ionicons name={external ? 'open-outline' : 'chevron-forward'} size={18} color={Colors.muted} />
    </Pressable>
  );
}

export function ListGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', backgroundColor: Colors.page },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    minHeight: 56,
  },
  pressed: { backgroundColor: Colors.surface },
  text: { flex: 1 },
});
