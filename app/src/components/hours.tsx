import { StyleSheet, View } from 'react-native';

import {
  formatDateNumeric,
  formatTimeRange,
  hoursForDate,
  addDays,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  WEEKDAYS,
  type OpeningHours,
} from '@aukrug/content';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useToday } from '@/content/use-now';

import { AppText } from './app-text';

/** Compact day chips like the website header ("Fr 17:00–22:00"). */
export function DayChips({ hours }: { hours: OpeningHours }) {
  return (
    <View style={styles.chips}>
      {WEEKDAYS.flatMap((day) => hours.regular.filter((r) => r.day === day)).map((r) => (
        <View key={r.day} style={styles.chip} accessible accessibilityLabel={`${WEEKDAY_LONG[r.day]} ${r.open} bis ${r.close} Uhr`}>
          <AppText style={styles.chipDay}>{WEEKDAY_SHORT[r.day]}</AppText>
          <AppText style={styles.chipTime}>{formatTimeRange(r.open, r.close)}</AppText>
        </View>
      ))}
    </View>
  );
}

/** The next seven days including special opening hours. */
export function WeekHours({ hours }: { hours: OpeningHours }) {
  const today = useToday();
  const days = Array.from({ length: 7 }, (_, i) => hoursForDate(hours, addDays(today, i)));
  return (
    <View style={styles.table}>
      {days.map((day, index) => {
        const isToday = index === 0;
        const time = day.closed ? 'geschlossen' : `${formatTimeRange(day.open!, day.close!)} Uhr`;
        return (
          <View
            key={day.date}
            style={[styles.row, isToday && styles.today]}
            accessible
            accessibilityLabel={`${isToday ? 'Heute, ' : ''}${formatDateNumeric(day.date)}: ${time}${day.note ? `, ${day.note}` : ''}`}>
            <View style={styles.rowMain}>
              <AppText style={[styles.day, isToday && styles.bold]}>
                {isToday ? 'Heute' : WEEKDAY_LONG[day.weekday]}
                <AppText variant="caption"> {day.date.slice(8, 10)}.{day.date.slice(5, 7)}.</AppText>
              </AppText>
              <AppText style={[styles.time, day.closed && styles.closed, isToday && styles.bold]}>{time}</AppText>
            </View>
            {day.isException ? (
              <AppText variant="small" style={styles.exception}>
                {day.note ?? 'Geänderte Öffnungszeiten'}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipDay: { color: Colors.onDark, fontFamily: Fonts.bold, fontSize: 14 },
  chipTime: { color: Colors.onDarkMuted, fontSize: 14 },
  table: { borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  rowMain: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  today: { backgroundColor: Colors.surface },
  day: { color: Colors.heading },
  time: { color: Colors.heading },
  closed: { color: Colors.muted },
  bold: { fontFamily: Fonts.bold },
  exception: { color: Colors.accent },
});
