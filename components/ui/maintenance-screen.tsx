import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { spacing } from '@/constants/design';
import { SafeScreen } from '../layout/safe-screen';

interface MaintenanceScreenProps {
  theme: any;
  onRetry: () => void;
  isRetrying?: boolean;
  error?: string;
}

const { width } = Dimensions.get('window');

const Ripple = ({ delay, theme }: { delay: number; theme: any }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(2, { duration: 2500, easing: Easing.out(Easing.ease) }), -1, false)
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }), -1, false)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ripple,
        { borderColor: theme.primary + '40' },
        animatedStyle
      ]}
    />
  );
};

export const MaintenanceScreen = ({ theme, onRetry, isRetrying, error }: MaintenanceScreenProps) => {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Deep background gradient */}
        <LinearGradient
          colors={[theme.surface, theme.background]}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Central Content */}
        <View style={styles.mainContent}>
          <Animated.View entering={FadeInUp.duration(1000)} style={styles.visualContainer}>
            <Ripple delay={0} theme={theme} />
            <Ripple delay={800} theme={theme} />
            <Ripple delay={1600} theme={theme} />
            
            <Animated.View style={[styles.iconCircle, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }, animatedIconStyle]}>
               <LinearGradient
                  colors={[theme.primary + '10', 'transparent']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 60 }]}
               />
               <Ionicons name="cloud-offline" size={64} color={theme.primary} />
            </Animated.View>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.textContainer}>
            <View style={[styles.statusBadge, { backgroundColor: theme.danger + '15' }]}>
               <View style={[styles.dot, { backgroundColor: theme.danger }]} />
               <Text style={[styles.statusText, { color: theme.danger }]}>SYSTEM OFFLINE</Text>
            </View>
            
            <Text style={[styles.title, { color: theme.text }]}>Under Maintenance</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              We are currently optimizing the server performance to serve you better. We'll be back online in a few minutes.
            </Text>
            
            {error && (
               <View style={[styles.errorBox, { backgroundColor: theme.surfaceAlt + '80' }]}>
                  <Text style={[styles.errorText, { color: theme.muted }]}>{error}</Text>
               </View>
            )}
          </Animated.View>
        </View>

        {/* Floating Bottom Actions */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.actions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRetry();
              }}
              disabled={isRetrying}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: theme.primary },
                (pressed || isRetrying) && { opacity: 0.9, transform: [{ scale: 0.98 }] }
              ]}
            >
              <Ionicons 
                name={isRetrying ? "sync" : "refresh"} 
                size={22} 
                color="#fff" 
              />
              <Text style={styles.retryText}>
                {isRetrying ? "RECONNECTING..." : "RETRY CONNECTION"}
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const msg = encodeURIComponent("Hey TrackMyLibrary! I'm facing connection issues. Is the server down?");
                Linking.openURL(`whatsapp://send?phone=916391417248&text=${msg}`);
              }}
              style={({ pressed }) => [
                styles.supportButton,
                pressed && { backgroundColor: theme.surfaceAlt }
              ]}
            >
              <Ionicons name="logo-whatsapp" size={18} color={theme.primary} />
              <Text style={[styles.supportText, { color: theme.primary }]}>CONTACT SUPPORT</Text>
            </Pressable>
        </Animated.View>

        <View style={styles.footer}>
           <Text style={[styles.footerText, { color: theme.muted + '40' }]}>
              ERR_CONNECTION_REFUSED_OR_DB_UNHEALTHY
           </Text>
        </View>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  visualContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    paddingHorizontal: 12,
  },
  errorBox: {
    padding: 12,
    borderRadius: 14,
    width: '100%',
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'Courier',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    paddingBottom: 20,
  },
  retryButton: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  supportButton: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  supportText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
  }
});


