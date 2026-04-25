import { useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';

/**
 * Hook to track screen views in PostHog
 * @param screenName - Name of the screen to track
 * @param properties - Additional properties to send with the screen view
 */
export const useScreenView = (screenName: string, properties?: Record<string, any>) => {
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.screen(screenName, properties);
  }, [screenName, posthog]);
};
