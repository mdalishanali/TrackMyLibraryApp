import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { radius, spacing } from '@/constants/design';

interface NoInternetScreenProps {
  theme: any;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function NoInternetScreen({
  theme,
  onRetry,
  isRetrying = false,
}: NoInternetScreenProps) {
  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.warning + '14', theme.background]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={[styles.iconShell, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <LinearGradient
              colors={[theme.warning + '20', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="cloud-offline" size={52} color={theme.warning} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.textBlock}>
            <Text style={[styles.title, { color: theme.text }]}>No internet connection</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Check your mobile data or Wi-Fi and try again. We&apos;ll keep showing cached data
              whenever it&apos;s available.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.actions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRetry();
              }}
              disabled={isRetrying}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: theme.primary },
                (pressed || isRetrying) && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name={isRetrying ? 'sync' : 'refresh'}
                size={18}
                color="#fff"
              />
              <Text style={styles.retryText}>
                {isRetrying ? 'Checking...' : 'Try Again'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  iconShell: {
    width: 132,
    height: 132,
    borderRadius: radius.xxl * 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 280,
  },
  retryButton: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
