import { Redirect, Slot, Stack } from 'expo-router';

import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { useAuth } from '@/hooks/use-auth';

export default function AuthLayout() {
  const { hydrated, isAuthenticated } = useAuth();

  if (!hydrated) {
    return <FullScreenLoader message="Preparing your session..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
