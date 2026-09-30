import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { currentOffers, resolveSiteUrl, upcomingEvents } from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { EventCard } from '@/components/event-card';
import { Screen } from '@/components/screen';
import { Section } from '@/components/section';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';
import { useToday } from '@/content/use-now';
import { useSettings } from '@/settings/settings-context';

export default function EventsScreen() {
  const router = useRouter();
  const today = useToday();
  const { bundle } = useContent();
  const { settings } = useSettings();
  const { site, events } = bundle;
  const upcoming = upcomingEvents(events.events, today);
  const offers = currentOffers(events.events, today);

  return (
    <Screen>
      <Section title="Kommende Veranstaltungen">
        {upcoming.length ? (
          upcoming.map((event) => <EventCard key={event.id} event={event} site={site} />)
        ) : (
          <AppText>Aktuell sind keine Veranstaltungen angekündigt – schauen Sie bald wieder vorbei!</AppText>
        )}
      </Section>

      {offers.length ? (
        <Section title="Aktuelle Angebote">
          {offers.map((event) => (
            <EventCard key={event.id} event={event} site={site} />
          ))}
        </Section>
      ) : null}

      <Section title={events.calendar.title}>
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={`${events.calendar.alt}, vergrößern`}
          onPress={() => router.push('/calendar')}>
          <Image
            source={resolveSiteUrl(events.calendar.image, site.websiteUrl)}
            alt={events.calendar.alt}
            style={styles.calendar}
            contentFit="cover"
            contentPosition="top"
            transition={200}
          />
        </Pressable>
      </Section>

      {!settings.notificationsEnabled ? (
        <View style={styles.hint}>
          <AppText variant="strong">Nichts mehr verpassen</AppText>
          <AppText variant="small">Lassen Sie sich benachrichtigen, sobald neue Veranstaltungen angekündigt werden.</AppText>
          <Button label="Benachrichtigungen einrichten" icon="notifications-outline" onPress={() => router.push('/settings')} />
        </View>
      ) : null}

      <View style={styles.hint}>
        <AppText variant="strong">Eigene Feier geplant?</AppText>
        <AppText variant="small">
          Feiern und geschlossene Gesellschaften sind bei uns auch außerhalb der Öffnungszeiten möglich – auf Wunsch auch von Montag bis Donnerstag.
        </AppText>
        <Button label="Jetzt Termin anfragen" variant="secondary" icon="chatbubble-ellipses-outline" onPress={() => router.push('/pages/feiern')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  calendar: { width: '100%', height: 260, borderRadius: Radius.md, backgroundColor: Colors.surface },
  hint: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
});
