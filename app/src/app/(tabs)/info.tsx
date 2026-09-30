import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ListGroup, ListRow } from '@/components/list-row';
import { Screen } from '@/components/screen';
import { Section } from '@/components/section';
import { Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';
import { contact, formatAddress, openLink } from '@/services/links';

export default function InfoScreen() {
  const router = useRouter();
  const { bundle } = useContent();
  const { site, pages } = bundle;

  return (
    <Screen>
      <Section title="Das Aukrug">
        <ListGroup>
          <ListRow icon="time-outline" label="Öffnungszeiten & Kontakt" detail={formatAddress(site)} onPress={() => router.push('/hours')} />
          <ListRow icon="beer-outline" label={pages.raeumlichkeiten.title} onPress={() => router.push('/pages/raeumlichkeiten')} />
          <ListRow icon="sparkles-outline" label={pages.feiern.title} onPress={() => router.push('/pages/feiern')} />
          <ListRow icon="people-outline" label={pages['ueber-uns'].title} onPress={() => router.push('/pages/ueber-uns')} />
          <ListRow icon="sunny-outline" label="Willkommen" onPress={() => router.push('/pages/willkommen')} />
        </ListGroup>
      </Section>

      <Section title="Online">
        <ListGroup>
          <ListRow icon="logo-instagram" label="Instagram" detail="@aukr.ug" external onPress={() => contact('instagram', site)} />
          <ListRow icon="globe-outline" label="Website" detail="aukr.ug" external onPress={() => openLink(site.websiteUrl, site)} />
        </ListGroup>
      </Section>

      <Section title="App">
        <ListGroup>
          <ListRow icon="notifications-outline" label="Einstellungen" detail="Benachrichtigungen & Datenschutz" onPress={() => router.push('/settings')} />
          <ListRow icon="document-text-outline" label={pages.impressum.title} onPress={() => router.push('/pages/impressum')} />
          <ListRow icon="shield-checkmark-outline" label={pages.datenschutz.title} onPress={() => router.push('/pages/datenschutz')} />
        </ListGroup>
      </Section>

      <View style={styles.footer}>
        <AppText variant="caption" style={styles.center}>
          Inhalt & Bildmaterial © {site.name} – Inh. {site.owner}
        </AppText>
        <AppText variant="caption" style={styles.center}>
          Technische Umsetzung und Betreuung: Christoph Schmidt IT Dienstleistungen
        </AppText>
        <AppText variant="caption" style={styles.center}>
          Version {Constants.expoConfig?.version}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: Spacing.xs, paddingVertical: Spacing.md },
  center: { textAlign: 'center' },
});
