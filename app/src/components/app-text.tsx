import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'strong' | 'small' | 'caption' | 'eyebrow';

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[styles.base, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  base: { color: Colors.text, fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24 },
  title: { color: Colors.heading, fontFamily: Fonts.black, fontSize: 30, lineHeight: 34, letterSpacing: -0.5 },
  heading: {
    color: Colors.heading,
    fontFamily: Fonts.black,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  subheading: { color: Colors.heading, fontFamily: Fonts.bold, fontSize: 19, lineHeight: 25 },
  body: {},
  strong: { fontFamily: Fonts.bold, color: Colors.heading },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 13, lineHeight: 18, color: Colors.muted },
  eyebrow: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.accent,
  },
});
