import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus } from '@/providers/network-provider';

export function OfflineIndicator() {
  const insets = useSafeAreaInsets();
  const { hasCheckedConnection, isOffline } = useNetworkStatus();

  if (!hasCheckedConnection || !isOffline) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
      style={[styles.container, { top: insets.top + 8 }]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={16} color="#fff" />
        <Text style={styles.text}>No internet connection. Showing cached data when available.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#F59E0B',
    zIndex: 9999,
    borderRadius: 14,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
