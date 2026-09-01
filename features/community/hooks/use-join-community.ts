import { Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { usePostHog } from 'posthog-react-native';

import { WHATSAPP_GROUP_LINK } from '../constants';

/**
 * Join/skip actions for the official WhatsApp group. Every entry point tags
 * its events with a source so join-rate can be compared per surface
 * (onboarding step vs dashboard) in PostHog.
 */
export const useJoinCommunity = (source: 'onboarding' | 'dashboard') => {
  const posthog = usePostHog();

  const joinCommunity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    posthog?.capture('community_join_pressed', { source });
    Linking.openURL(WHATSAPP_GROUP_LINK);
  };

  const skipCommunity = () => {
    Haptics.selectionAsync();
    posthog?.capture('community_join_skipped', { source });
  };

  return { joinCommunity, skipCommunity };
};
