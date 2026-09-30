import { Colors, Fonts } from './theme';

export const headerOptions = {
  headerStyle: { backgroundColor: Colors.ink },
  headerTintColor: Colors.onDark,
  headerTitleStyle: { fontFamily: Fonts.black, fontSize: 17 },
  headerBackButtonDisplayMode: 'minimal',
  headerShadowVisible: false,
} as const;
