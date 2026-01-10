import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const designTheme = useTheme();
  const { hydrated, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  if (!hydrated) {
    return <FullScreenLoader message="Restoring your session..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 14);
  const tabHeight = Platform.OS === 'ios' ? 64 + bottomInset : 74 + (insets.bottom > 0 ? insets.bottom / 2 : 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: designTheme.background,
          borderTopWidth: 0,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 12,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: designTheme.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="square.grid.2x2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="seats"
        options={{
          title: 'Seats',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="rectangle.grid.2x2" color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="creditcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
