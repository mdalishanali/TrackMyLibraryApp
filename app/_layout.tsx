import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { QueryProvider } from '@/providers/query-provider';
import { SubscriptionProvider } from '@/providers/subscription-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/lib/toast';
import { ActivityProvider } from '@/providers/activity-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};


import { useOTAUpdates } from '@/hooks/use-updates';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useOTAUpdates();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <SubscriptionProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <ActivityProvider>
                <Stack>
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="profile" options={{ headerShown: false }} />
                  <Stack.Screen name="student-detail/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>
              </ActivityProvider>
              <StatusBar style="auto" />
            </ThemeProvider>
            <Toast config={toastConfig} />
          </SubscriptionProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
