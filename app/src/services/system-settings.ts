import { Alert, Linking } from 'react-native';

export function askToOpenSystemSettings() {
  Alert.alert('Benachrichtigungen sind blockiert', 'Bitte erlauben Sie Mitteilungen für die Aukrug-App in den Systemeinstellungen.', [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() },
  ]);
}
