import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';

import { AppText } from './app-text';

/** Tells the user when content is outdated because the app needs an update. */
export function UpdateHint() {
  const { updateRequired } = useContent();
  if (!updateRequired) return null;
  return (
    <View style={styles.box} accessibilityRole="alert">
      <AppText variant="small" style={styles.text}>
        Es gibt neue Inhalte, die diese App-Version nicht anzeigen kann. Bitte aktualisieren Sie die App im App Store bzw. Play Store.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: Colors.noticeBg, borderRadius: Radius.md, padding: Spacing.md },
  text: { color: Colors.noticeText },
});
