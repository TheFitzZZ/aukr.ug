import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';

import { UpdateHint } from './update-hint';

interface Props extends ScrollViewProps {
  children: ReactNode;
  /** Pull-to-refresh reloads the published content. */
  refreshable?: boolean;
  padded?: boolean;
}

export function Screen({ children, refreshable = true, padded = true, contentContainerStyle, ...props }: Props) {
  const { refreshing, refresh } = useContent();
  return (
    <ScrollView
      style={styles.scroll}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        refreshable ? (
          <RefreshControl refreshing={refreshing} onRefresh={() => refresh({ force: true })} tintColor={Colors.accent} colors={[Colors.accent]} />
        ) : undefined
      }
      {...props}
      contentContainerStyle={[styles.content, contentContainerStyle]}>
      <View style={[styles.inner, padded && styles.padded]}>
        <UpdateHint />
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.page },
  content: { alignItems: 'center', paddingBottom: Spacing.xl },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.lg },
  padded: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
});
