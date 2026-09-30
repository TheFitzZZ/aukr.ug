import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, Switch, View } from 'react-native';

import { NOTIFICATION_TOPICS, TOPIC_INFO } from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Section } from '@/components/section';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';
import { firebaseEnabled, hasNotificationPermission, notificationTarget } from '@/services/firebase';
import { askToOpenSystemSettings } from '@/services/system-settings';
import { useSettings } from '@/settings/settings-context';

function SwitchRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.switchRow, disabled && styles.disabled]}>
      <View style={styles.switchText}>
        <AppText variant="strong">{label}</AppText>
        {description ? <AppText variant="caption">{description}</AppText> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityHint={description}
        trackColor={{ true: Colors.accent, false: Colors.border }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())} Uhr`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, update, setTopic, enableNotifications, disableNotifications, syncError } = useSettings();
  const { source, fetchedAt, refreshing, error, refresh } = useContent();
  const [osBlocked, setOsBlocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (settings.notificationsEnabled) hasNotificationPermission().then((granted) => setOsBlocked(!granted));
      else setOsBlocked(false);
    }, [settings.notificationsEnabled]),
  );

  const toggleNotifications = async (value: boolean) => {
    if (!value) return disableNotifications();
    const granted = await enableNotifications();
    if (!granted) askToOpenSystemSettings();
  };

  return (
    <Screen>
      <Section title="Benachrichtigungen">
        {firebaseEnabled ? (
          <>
            <SwitchRow
              label="Benachrichtigungen erhalten"
              description="Wir melden uns nur bei Neuigkeiten aus den gewählten Themen."
              value={settings.notificationsEnabled}
              onChange={toggleNotifications}
            />
            {osBlocked ? (
              <View style={styles.warning}>
                <AppText variant="small" style={styles.warningText}>
                  Mitteilungen sind in den Systemeinstellungen deaktiviert.
                </AppText>
                <Button label="Systemeinstellungen öffnen" variant="secondary" onPress={() => Linking.openSettings()} />
              </View>
            ) : null}
            {syncError ? (
              <AppText variant="small" style={styles.warningText}>
                Die Auswahl konnte nicht gespeichert werden. Bitte prüfen Sie Ihre Internetverbindung.
              </AppText>
            ) : null}
            <View style={styles.group}>
              {NOTIFICATION_TOPICS.map((topic) => (
                <SwitchRow
                  key={topic}
                  label={TOPIC_INFO[topic].label}
                  description={TOPIC_INFO[topic].description}
                  value={settings.topics[topic]}
                  onChange={(value) => setTopic(topic, value)}
                  disabled={!settings.notificationsEnabled}
                />
              ))}
            </View>
            {notificationTarget === 'development' ? (
              <AppText variant="caption">Test-Build: empfängt nur Test-Benachrichtigungen.</AppText>
            ) : null}
          </>
        ) : (
          <AppText>Benachrichtigungen sind in dieser App-Version nicht verfügbar.</AppText>
        )}
      </Section>

      <Section title="Datenschutz">
        <SwitchRow
          label="Nutzungsstatistik erlauben"
          description="Hilft uns zu verstehen, welche Inhalte genutzt werden (Google Analytics for Firebase, ohne Werbe-ID). Jederzeit widerrufbar."
          value={settings.analyticsConsent === true}
          onChange={(value) => update({ analyticsConsent: value })}
          disabled={!firebaseEnabled}
        />
        <Button label="Datenschutzerklärung" variant="secondary" icon="shield-checkmark-outline" onPress={() => router.push('/pages/datenschutz')} />
      </Section>

      <Section title="Inhalte">
        <AppText variant="small">
          {source === 'remote' || fetchedAt
            ? `Zuletzt aktualisiert: ${fetchedAt ? formatTimestamp(fetchedAt) : 'gerade eben'}`
            : 'Es werden die mit der App ausgelieferten Inhalte angezeigt.'}
        </AppText>
        {error === 'offline' ? (
          <AppText variant="small" style={styles.warningText}>
            Keine Verbindung – es werden die zuletzt geladenen Inhalte angezeigt.
          </AppText>
        ) : null}
        <Button
          label={refreshing ? 'Wird aktualisiert …' : 'Jetzt aktualisieren'}
          variant="secondary"
          icon="refresh"
          disabled={refreshing}
          onPress={() => refresh({ force: true })}
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  switchText: { flex: 1, gap: 2 },
  disabled: { opacity: 0.5 },
  warning: { gap: Spacing.sm },
  warningText: { color: Colors.closed },
});
