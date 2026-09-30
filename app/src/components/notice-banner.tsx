import { StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { InlineText } from './markdown-view';

/** Short-notice hint in the website's notice colours. */
export function NoticeBanner({ title, text, severity = 'info' }: { title: string; text: string; severity?: 'info' | 'warning' }) {
  return (
    <View style={[styles.box, severity === 'warning' && styles.warning]} accessibilityRole="alert">
      <AppText style={styles.text}>
        <AppText style={[styles.text, styles.title]}>{title}: </AppText>
        <InlineText source={text} style={styles.text} linkColor={Colors.gold} />
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: Colors.noticeBg, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  warning: { backgroundColor: Colors.warningBg },
  text: { color: Colors.noticeText, fontSize: 15, lineHeight: 21 },
  title: { fontFamily: Fonts.bold },
});
