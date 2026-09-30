import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PAGE_IDS, type PageId } from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { MarkdownView } from '@/components/markdown-view';
import { QuickActions } from '@/components/quick-actions';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';

const isPageId = (id: string | undefined): id is PageId => PAGE_IDS.includes(id as PageId);

export default function ContentPageScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bundle } = useContent();

  if (!isPageId(id)) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Nicht gefunden' }} />
        <AppText>Diese Seite gibt es nicht.</AppText>
        <Button label="Zur Startseite" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const page = bundle.pages[id];
  const showContact = id === 'feiern' || id === 'raeumlichkeiten';
  return (
    <Screen>
      <Stack.Screen options={{ title: page.title }} />
      <AppText variant="title" accessibilityRole="header">
        {page.title}
      </AppText>
      <MarkdownView source={page.markdown} />
      {showContact ? (
        <View style={styles.contact}>
          <AppText variant="heading">Jetzt anfragen</AppText>
          <QuickActions site={bundle.site} emailSubject="Anfrage Feier / Veranstaltung" />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  contact: { gap: Spacing.md, marginTop: Spacing.md },
});
