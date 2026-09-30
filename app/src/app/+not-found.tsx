import { Link, Stack } from 'expo-router';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { Colors } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Nicht gefunden' }} />
      <AppText variant="subheading">Diese Seite gibt es leider nicht.</AppText>
      <Link href="/" style={{ color: Colors.accent }}>
        Zur Startseite
      </Link>
    </Screen>
  );
}
