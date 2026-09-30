import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDateNumeric, isEventVisible, resolveSiteUrl } from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { ImageViewer } from '@/components/image-viewer';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';
import { useToday } from '@/content/use-now';
import { addEventToCalendar, shareEvent } from '@/services/calendar';
import { trackEvent } from '@/services/firebase';
import { openLink } from '@/services/links';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bundle } = useContent();
  const today = useToday();
  const [zoom, setZoom] = useState<number | null>(null);
  const event = bundle.events.events.find((e) => e.id === id);
  const { site } = bundle;

  useEffect(() => {
    if (event) trackEvent('view_event', { event_id: event.id });
  }, [event]);

  if (!event) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Veranstaltung' }} />
        <AppText variant="subheading">Diese Veranstaltung ist nicht mehr verfügbar.</AppText>
        <Button label="Alle Veranstaltungen" onPress={() => router.replace('/events')} />
      </Screen>
    );
  }

  const poster = { uri: resolveSiteUrl(event.poster.src, site.websiteUrl), alt: event.poster.zoomAlt ?? event.poster.alt };
  const past = !isEventVisible(event, today);

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: event.shortTitle }} />
      <View style={styles.hero}>
        <Pressable accessibilityRole="imagebutton" accessibilityLabel={`${event.poster.alt}, Plakat vergrößern`} onPress={() => setZoom(0)}>
          <Image source={poster.uri} alt={event.poster.alt} style={styles.poster} contentFit="contain" transition={200} />
          <AppText style={styles.hint}>Tippen zum Vergrößern</AppText>
        </Pressable>
      </View>

      <View style={styles.body}>
        {past ? <AppText style={styles.past}>Diese Veranstaltung hat bereits stattgefunden.</AppText> : null}
        <AppText variant="title" accessibilityRole="header">
          {event.title}
        </AppText>
        {event.tagline ? <AppText style={styles.tagline}>{event.tagline}</AppText> : null}

        {event.start || event.highlights.length ? (
          <View style={styles.facts}>
            {event.start ? (
              <AppText variant="strong">
                {formatDateNumeric(event.start.slice(0, 10))}
                {event.highlights.length ? '' : `, ${event.start.slice(11)} Uhr`}
              </AppText>
            ) : null}
            {event.highlights.map((line) => (
              <AppText key={line}>{line}</AppText>
            ))}
          </View>
        ) : null}

        {event.description.map((paragraph) => (
          <AppText key={paragraph}>{paragraph}</AppText>
        ))}
        {event.closing ? <AppText variant="strong">{event.closing}</AppText> : null}

        <View style={styles.actions}>
          {event.actions.map((action) => (
            <Button
              key={action.url}
              label={action.label}
              icon={action.url.startsWith('mailto:') ? 'mail' : 'ticket'}
              onPress={() => {
                trackEvent('event_action', { event_id: event.id });
                openLink(action.url, site);
              }}
            />
          ))}
          {event.start && !past ? (
            <Button label="In den Kalender eintragen" variant="secondary" icon="calendar-outline" onPress={() => addEventToCalendar(event, site)} />
          ) : null}
          <Button label="Teilen" variant="secondary" icon="share-outline" onPress={() => shareEvent(event, site)} />
        </View>
      </View>
      <ImageViewer images={[poster]} index={zoom} onClose={() => setZoom(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Colors.event[1], paddingVertical: Spacing.lg, alignItems: 'center' },
  poster: { width: 260, height: 360, borderRadius: Radius.md },
  hint: { color: Colors.onDarkMuted, fontSize: 13, textAlign: 'center', marginTop: Spacing.sm },
  body: { padding: Spacing.md, gap: Spacing.md },
  past: { color: Colors.closed, fontFamily: Fonts.bold },
  tagline: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.accent },
  facts: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
});
