import { StyleSheet, View } from 'react-native';

import {
  formatDateCompact,
  formatTimeRange,
  openingStatus,
  toLocalMoment,
  addDays,
  type OpeningHours,
} from '@aukrug/content';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/content/use-now';

import { AppText } from './app-text';

export function describeStatus(hours: OpeningHours, now: Date) {
  const status = openingStatus(hours, now);
  const today = toLocalMoment(now).date;
  switch (status.state) {
    case 'open':
      return { open: true, label: 'Jetzt geöffnet', detail: `bis ${status.closesAt} Uhr` };
    case 'opens-later':
      return { open: false, label: 'Heute geöffnet', detail: `ab ${status.opensAt} Uhr` };
    case 'closed': {
      const next = status.next;
      if (!next?.open || !next.close) return { open: false, label: 'Derzeit geschlossen', detail: '' };
      const day = next.date === addDays(today, 1) ? 'morgen' : formatDateCompact(next.date);
      return { open: false, label: 'Derzeit geschlossen', detail: `wieder ${day}, ${formatTimeRange(next.open, next.close)} Uhr` };
    }
  }
}

/** Live "open now" status in the website's dark header style. */
export function OpeningStatus({ hours }: { hours: OpeningHours }) {
  const now = useNow();
  const status = describeStatus(hours, now);
  const today = openingStatus(hours, now).today;
  return (
    <View style={styles.box} accessible accessibilityLabel={`${status.label} ${status.detail}`}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: status.open ? Colors.open : Colors.closed }]} />
        <AppText style={styles.label}>{status.label}</AppText>
        {status.detail ? <AppText style={styles.detail}>{status.detail}</AppText> : null}
      </View>
      {today.isException && today.note ? <AppText style={styles.note}>Heute: {today.note}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { color: Colors.onDark, fontFamily: Fonts.bold, fontSize: 17 },
  detail: { color: Colors.onDarkMuted, fontSize: 16 },
  note: { color: Colors.noticeText, fontSize: 14 },
});
