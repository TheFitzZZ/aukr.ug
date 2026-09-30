import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { headerOptions } from '@/constants/navigation';
import { Colors, Fonts } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tabIcon =
  (name: IconName, focusedName: IconName) =>
  ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? focusedName : name} color={color} size={size} />
  );

function HeaderLogo() {
  return (
    <Image
      source={require('../../../assets/images/logo-wordmark.png')}
      style={{ width: 132, height: 33 }}
      contentFit="contain"
      accessibilityLabel="Aukrug"
      accessibilityRole="header"
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        headerTitleAlign: 'center',
        tabBarStyle: { backgroundColor: Colors.ink, borderTopColor: 'rgba(255,255,255,0.1)' },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarLabelStyle: { fontFamily: Fonts.bold, fontSize: 12 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Start', headerTitle: () => <HeaderLogo />, tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: tabIcon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="menu" options={{ title: 'Speisekarte', tabBarIcon: tabIcon('restaurant-outline', 'restaurant') }} />
      <Tabs.Screen
        name="info"
        options={{ title: 'Info', tabBarIcon: tabIcon('information-circle-outline', 'information-circle') }}
      />
    </Tabs>
  );
}
