import { registerBackgroundHandler } from './src/services/firebase';

import 'expo-router/entry';

// Must be registered outside React so Android can handle messages while the app is in the background.
registerBackgroundHandler();
