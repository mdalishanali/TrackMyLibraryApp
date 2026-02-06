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

import { PostHogProvider } from 'posthog-react-native';

// ... imports

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useOTAUpdates();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <PostHogProvider
            apiKey="phc_dltVo9iYK5gTfaYXBpcLEiKpaRRnvUHQL7cWDZLjMej"
            options={{
              host: "https://us.i.posthog.com",
              enableSessionReplay: true,
              sessionReplayConfig: {
                maskAllTextInputs: true,
                maskAllImages: true,
                captureLog: true,
                captureNetworkTelemetry: true,
                throttleDelayMs: 1000,
              },
            }}
          >
            <SubscriptionProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <ActivityProvider>
                  <Stack>
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="profile" options={{ headerShown: false }} />
                    <Stack.Screen name="student-detail/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding/setup" options={{ headerShown: false }} />
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  </Stack>
                </ActivityProvider>
                <StatusBar style="auto" />
              </ThemeProvider>
              <Toast config={toastConfig} />
            </SubscriptionProvider>
          </PostHogProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
