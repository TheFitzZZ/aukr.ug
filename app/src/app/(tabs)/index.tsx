import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  activeNotices,
  closedDaysShort,
  formatDateNumeric,
  formatTimeRange,
  parseMarkdown,
  upcomingExceptions,
  visibleEvents,
} from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { EventCard } from '@/components/event-card';
import { DayChips } from '@/components/hours';
import { NoticeBanner } from '@/components/notice-banner';
import { OpeningStatus } from '@/components/opening-status';
import { QuickActions } from '@/components/quick-actions';
import { Screen } from '@/components/screen';
import { Section } from '@/components/section';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';
import { useToday } from '@/content/use-now';

const EXCEPTION_LOOKAHEAD_DAYS = 14;

function firstParagraph(markdown: string) {
  const block = parseMarkdown(markdown).find((b) => b.type === 'paragraph');
  if (!block || block.type !== 'paragraph') return '';
  return block.content.map((i) => i.text).join('');
}

export default function StartScreen() {
  const router = useRouter();
  const today = useToday();
  const { bundle } = useContent();
  const { openingHours, site } = bundle;
  const notices = activeNotices(bundle.notices.notices, today);
  const exceptions = upcomingExceptions(openingHours, today, EXCEPTION_LOOKAHEAD_DAYS);
  const events = visibleEvents(bundle.events.events, today);
  const welcome = bundle.pages.willkommen;
  const hoursNote = [closedDaysShort(openingHours), openingHours.kitchenNote].filter(Boolean).join(' · ');

  return (
    <Screen padded={false}>
      <View style={styles.hero}>
        <OpeningStatus hours={openingHours} />
        <AppText style={styles.heroTitle}>Unsere Öffnungszeiten</AppText>
        <DayChips hours={openingHours} />
        {hoursNote ? <AppText style={styles.heroNote}>{hoursNote}</AppText> : null}
        <Link href="/hours" asChild>
          <AppText accessibilityRole="link" style={styles.heroLinkText}>
            Alle Öffnungszeiten & Kontakt ›
          </AppText>
        </Link>
      </View>

      <View style={styles.content}>
        {notices.length || exceptions.length ? (
          <View style={styles.notices}>
            {notices.map((n) => (
              <NoticeBanner key={n.id} title={n.title} text={n.text} severity={n.severity} />
            ))}
            {exceptions.map((e) => (
              <NoticeBanner
                key={e.date}
                title="Geänderte Öffnungszeiten"
                text={`${formatDateNumeric(e.date)}: ${e.closed ? 'geschlossen' : `${formatTimeRange(e.open!, e.close!)} Uhr`}${e.note ? ` – ${e.note}` : ''}`}
              />
            ))}
          </View>
        ) : null}

        <QuickActions site={site} emailSubject="Reservierung" />

        {events.length ? (
          <Section
            title="Aktuelles & Events"
            action={
              <Link href="/events" asChild>
                <Pressable accessibilityRole="link" hitSlop={8}>
                  <AppText style={styles.more}>Alle</AppText>
                </Pressable>
              </Link>
            }>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              style={styles.carouselBleed}>
              {events.map((event) => (
                <EventCard key={event.id} event={event} site={site} compact />
              ))}
            </ScrollView>
          </Section>
        ) : null}

        <Link href="/calendar" asChild>
          <Pressable accessibilityRole="button" accessibilityHint="Zeigt den Veranstaltungskalender">
            <LinearGradient colors={Colors.calendar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.calendar}>
              <AppText style={styles.calendarTitle}>📅 Alle Events im Überblick</AppText>
              <AppText style={styles.calendarText}>Verpassen Sie keine Veranstaltung! In unserem Kalender finden Sie alle kommenden Highlights.</AppText>
              <AppText style={styles.calendarLink}>Zum Veranstaltungskalender →</AppText>
            </LinearGradient>
          </Pressable>
        </Link>

        <Section title="Willkommen">
          <AppText variant="subheading">{welcome.title}</AppText>
          <AppText numberOfLines={6}>{firstParagraph(welcome.markdown)}</AppText>
          <Button label="Weiterlesen" variant="secondary" icon="book-outline" onPress={() => router.push('/pages/willkommen')} />
        </Section>

        <Section title="Feiern im Aukrug">
          <AppText>{openingHours.privateEventsNote} – auf Wunsch auch von Montag bis Donnerstag.</AppText>
          <Button label="Feier anfragen" icon="sparkles-outline" onPress={() => router.push('/pages/feiern')} />
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Colors.ink, padding: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md },
  heroTitle: {
    color: Colors.onDark,
    fontFamily: Fonts.black,
    fontSize: 13,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: Spacing.xs,
  },
  heroNote: { color: Colors.onDarkMuted, fontSize: 13 },
  heroLinkText: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 16, paddingVertical: 4 },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.lg },
  notices: { gap: Spacing.sm },
  more: { color: Colors.accent, fontFamily: Fonts.bold },
  carouselBleed: { marginHorizontal: -Spacing.md },
  carousel: { gap: Spacing.md, paddingHorizontal: Spacing.md },
  calendar: { borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.sm, borderLeftWidth: 4, borderLeftColor: '#4a9dd8' },
  calendarTitle: { color: Colors.onDark, fontFamily: Fonts.black, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' },
  calendarText: { color: 'rgba(255,255,255,0.95)' },
  calendarLink: { color: Colors.onDark, fontFamily: Fonts.bold },
});
