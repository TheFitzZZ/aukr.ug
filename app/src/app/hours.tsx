import { StyleSheet, View } from 'react-native';

import { closedDaysLong, formatDateNumeric, formatTimeRange, upcomingExceptions } from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { WeekHours } from '@/components/hours';
import { OpeningStatus } from '@/components/opening-status';
import { QuickActions } from '@/components/quick-actions';
import { Screen } from '@/components/screen';
import { Section } from '@/components/section';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';
import { useToday } from '@/content/use-now';
import { contact, formatAddress } from '@/services/links';

export default function HoursScreen() {
  const today = useToday();
  const { bundle } = useContent();
  const { openingHours, site } = bundle;
  const exceptions = upcomingExceptions(openingHours, today, 90);

  return (
    <Screen>
      <View style={styles.status}>
        <OpeningStatus hours={openingHours} />
      </View>

      <Section title="Die nächsten 7 Tage">
        <WeekHours hours={openingHours} />
        <View style={styles.notes}>
          {closedDaysLong(openingHours) ? <AppText variant="small">Regulär {closedDaysLong(openingHours)}.</AppText> : null}
          {openingHours.kitchenNote ? <AppText variant="small">{openingHours.kitchenNote}.</AppText> : null}
          <AppText variant="small">{openingHours.privateEventsNote} – auf Wunsch auch von Montag bis Donnerstag.</AppText>
        </View>
      </Section>

      {exceptions.length ? (
        <Section title="Besondere Öffnungszeiten">
          {exceptions.map((e) => (
            <View key={e.date} style={styles.exception}>
              <AppText variant="strong">{formatDateNumeric(e.date)}</AppText>
              <AppText>
                {e.closed ? 'geschlossen' : `${formatTimeRange(e.open!, e.close!)} Uhr`}
                {e.note ? ` – ${e.note}` : ''}
              </AppText>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title="Kontakt & Reservierung">
        <AppText>
          Haben Sie Fragen, möchten Sie einen Tisch reservieren oder planen Sie ein besonderes Event? Wir freuen uns auf Ihre Anfrage!
        </AppText>
        <QuickActions site={site} emailSubject="Reservierung" />
        <View style={styles.card}>
          <AppText variant="strong">{site.name}</AppText>
          <AppText>{site.address.street}</AppText>
          <AppText>
            {site.address.postalCode} {site.address.city}
          </AppText>
          <AppText selectable>Telefon: {site.phone.display}</AppText>
          <AppText selectable>E-Mail: {site.email}</AppText>
        </View>
        <Button
          label="Route planen"
          variant="secondary"
          icon="map-outline"
          accessibilityHint={formatAddress(site)}
          onPress={() => contact('route', site)}
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { backgroundColor: Colors.ink, borderRadius: Radius.md, padding: Spacing.sm },
  notes: { gap: 2 },
  exception: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
});
