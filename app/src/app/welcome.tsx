import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NOTIFICATION_TOPICS, TOPIC_INFO } from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { firebaseEnabled } from '@/services/firebase';
import { askToOpenSystemSettings } from '@/services/system-settings';
import { useSettings } from '@/settings/settings-context';

type Step = 'notifications' | 'analytics';

export default function WelcomeScreen() {
  const router = useRouter();
  const { update, enableNotifications } = useSettings();
  const [step, setStep] = useState<Step>('notifications');
  const [busy, setBusy] = useState(false);

  const finish = (analyticsConsent: boolean | null) => {
    update({ onboardingDone: true, ...(analyticsConsent !== null && { analyticsConsent }) });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const allowNotifications = async () => {
    setBusy(true);
    const granted = await enableNotifications();
    setBusy(false);
    if (!granted) askToOpenSystemSettings();
    setStep('analytics');
  };

  return (
    <LinearGradient colors={[Colors.ink, '#3a2a2a']} style={styles.root}>
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <Image source={require('../../assets/images/logo-wordmark.png')} style={styles.logo} contentFit="contain" accessibilityLabel="Aukrug" />
          <AppText style={styles.title} accessibilityRole="header">
            Schön, dass Sie da sind!
          </AppText>
          <AppText style={styles.text}>
            Mit der Aukrug-App haben Sie Öffnungszeiten, Veranstaltungen, unsere Speisekarte und alle Kontaktmöglichkeiten immer dabei.
          </AppText>

          {!firebaseEnabled ? (
            <View style={styles.card}>
              <Button label="Los geht's" icon="arrow-forward" onPress={() => finish(null)} />
            </View>
          ) : step === 'notifications' ? (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>Immer informiert bleiben?</AppText>
              <AppText style={styles.text}>Wir benachrichtigen Sie bei:</AppText>
              {NOTIFICATION_TOPICS.map((topic) => (
                <AppText key={topic} style={styles.bullet}>
                  • {TOPIC_INFO[topic].label}
                </AppText>
              ))}
              <AppText style={styles.small}>Die Themen können Sie jederzeit in den Einstellungen ändern.</AppText>
              <Button label="Benachrichtigungen erlauben" icon="notifications" onPress={allowNotifications} disabled={busy} />
              <Button label="Später" variant="onDark" onPress={() => setStep('analytics')} disabled={busy} />
            </View>
          ) : (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>Dürfen wir die App-Nutzung auswerten?</AppText>
              <AppText style={styles.text}>
                Mit Ihrer Zustimmung nutzen wir Google Analytics for Firebase, um zu verstehen, welche Inhalte gefragt sind, und die App zu verbessern. Wir
                verwenden keine Werbe-ID. Sie können Ihre Entscheidung jederzeit in den Einstellungen ändern.
              </AppText>
              <View style={styles.choice}>
                <Button label="Ablehnen" variant="onDark" style={styles.choiceButton} onPress={() => finish(false)} />
                <Button label="Zustimmen" variant="onDark" style={styles.choiceButton} onPress={() => finish(true)} />
              </View>
              <AppText
                style={[styles.small, styles.link]}
                accessibilityRole="link"
                onPress={() => router.push('/pages/datenschutz')}>
                Datenschutzerklärung lesen
              </AppText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  logo: { width: 220, height: 56, alignSelf: 'center', marginTop: Spacing.lg },
  title: { color: Colors.onDark, fontFamily: Fonts.black, fontSize: 28, lineHeight: 32, textAlign: 'center' },
  text: { color: Colors.onDarkMuted },
  card: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  cardTitle: { color: Colors.gold, fontFamily: Fonts.black, fontSize: 20, lineHeight: 24 },
  bullet: { color: Colors.onDark },
  small: { color: Colors.onDarkMuted, fontSize: 13, lineHeight: 18 },
  link: { color: Colors.gold, textDecorationLine: 'underline', textAlign: 'center', marginTop: Spacing.sm },
  choice: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  choiceButton: { flex: 1 },
});
