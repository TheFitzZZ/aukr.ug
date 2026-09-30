import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDateCompact, resolveSiteUrl, type EventItem, type Site } from '@aukrug/content';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

export function eventDateLabel(event: EventItem) {
  if (!event.start) return event.tagline ?? 'Aktuelles Angebot';
  return `${formatDateCompact(event.start.slice(0, 10))} · ${event.start.slice(11)} Uhr`;
}

/** Event teaser in the website's dark event-card style. */
export function EventCard({ event, site, compact = false }: { event: EventItem; site: Site; compact?: boolean }) {
  const date = eventDateLabel(event);
  return (
    <Link href={`/events/${event.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${event.title}, ${date}`}
        accessibilityHint="Öffnet die Details"
        style={({ pressed }) => [compact ? styles.compact : null, pressed && styles.pressed]}>
        <LinearGradient colors={Colors.event} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, compact && styles.cardCompact]}>
          <Image
            source={resolveSiteUrl(event.poster.src, site.websiteUrl)}
            alt={event.poster.alt}
            style={compact ? styles.posterCompact : styles.poster}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.body}>
            <AppText style={styles.date} numberOfLines={1}>
              {date}
            </AppText>
            <AppText style={styles.title} numberOfLines={compact ? 3 : 2}>
              {event.title}
            </AppText>
            {!compact && (event.summary ?? event.highlights[0]) ? (
              <AppText style={styles.summary} numberOfLines={2}>
                {event.summary ?? event.highlights[0]}
              </AppText>
            ) : null}
          </View>
        </LinearGradient>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  compact: { width: 260 },
  pressed: { opacity: 0.85 },
  card: { flexDirection: 'row', borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md, overflow: 'hidden' },
  cardCompact: { flexDirection: 'column', height: 330 },
  poster: { width: 88, height: 124, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.08)' },
  posterCompact: { width: '100%', height: 190, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.08)' },
  body: { flex: 1, gap: 4, justifyContent: 'center' },
  date: { color: Colors.onDarkMuted, fontFamily: Fonts.bold, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { color: Colors.gold, fontFamily: Fonts.black, fontSize: 19, lineHeight: 23, letterSpacing: 0.5 },
  summary: { color: Colors.onDark, fontSize: 14, lineHeight: 19 },
});
