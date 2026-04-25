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
import { usePostHog } from 'posthog-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const designTheme = useTheme();
  const { hydrated, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();

  const handleTabPress = (tabName: string) => {
    posthog?.capture('tab_switched', { tab_name: tabName });
  };

  if (!hydrated) {
    return <FullScreenLoader message="Restoring your session..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Increased Android bottom inset to prevent overlap with system navigation
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 16);
  // Adjusted Android height calculation to be more generous
  const tabHeight = Platform.OS === 'ios'
    ? 60 + bottomInset
    : 66 + (insets.bottom > 0 ? insets.bottom : 16);

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
        listeners={{
          tabPress: () => handleTabPress('Home'),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => handleTabPress('Students'),
        }}
      />
      <Tabs.Screen
        name="seats"
        options={{
          title: 'Seats',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="rectangle.grid.2x2" color={color} />,
        }}
        listeners={{
          tabPress: () => handleTabPress('Seats'),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="creditcard.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => handleTabPress('Payments'),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => handleTabPress('Analytics'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => handleTabPress('Settings'),
        }}
      />
    </Tabs>
  );
}
