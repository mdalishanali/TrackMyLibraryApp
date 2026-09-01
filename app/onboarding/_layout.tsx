import { Stack } from 'expo-router';

import { OnboardingWizardProvider } from '@/features/onboarding/hooks/use-onboarding-wizard';

/**
 * Wraps every wizard step so drafts survive navigation between steps.
 */
export default function OnboardingLayout() {
  return (
    <OnboardingWizardProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="sections" />
        <Stack.Screen name="shifts" />
        <Stack.Screen name="review" />
        <Stack.Screen name="community" />
        <Stack.Screen name="setup" />
      </Stack>
    </OnboardingWizardProvider>
  );
}
