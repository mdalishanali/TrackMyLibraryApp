import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { spacing, radius, typography } from '@/constants/design';
import { SafeScreen } from '../layout/safe-screen';

interface MaintenanceScreenProps {
  theme: any;
  onRetry: () => void;
  isRetrying?: boolean;
  error?: string;
}

const { width } = Dimensions.get('window');

export const MaintenanceScreen = ({ theme, onRetry, isRetrying, error }: MaintenanceScreenProps) => {
  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        
        <Animated.View 
          entering={FadeInUp.delay(200).duration(800)}
          style={styles.content}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={[theme.danger + '20', theme.danger + '05']}
              style={[StyleSheet.absoluteFill, { borderRadius: 60 }]}
            />
            <Ionicons name="cloud-offline-outline" size={60} color={theme.danger} />
          </View>
          
          <Animated.View entering={FadeInDown.delay(400)} style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Under Maintenance</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              We are currently polishing a few things to make your experience even better. Don't worry, we'll be back in just a short while!
            </Text>
            
            {error && (
               <View style={[styles.errorBox, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.errorText, { color: theme.muted }]}>{error}</Text>
               </View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={styles.buttonContainer}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRetry();
              }}
              disabled={isRetrying}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: theme.primary },
                (pressed || isRetrying) && { opacity: 0.8, transform: [{ scale: 0.98 }] }
              ]}
            >
              <Ionicons 
                name={isRetrying ? "sync" : "refresh"} 
                size={20} 
                color="#fff" 
                style={isRetrying ? { transform: [{ rotate: '45deg' }] } : undefined}
              />
              <Text style={styles.retryText}>
                {isRetrying ? "RECONNECTING..." : "TRY AGAIN"}
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Potential support link
              }}
              style={styles.secondaryButton}
            >
              <Text style={[styles.secondaryText, { color: theme.muted }]}>CHECK SYSTEM STATUS</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
        
        <Text style={[styles.footer, { color: theme.muted + '40' }]}>
          Error: DATABASE_UNHEALTHY_OR_UNREACHABLE
        </Text>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Courier',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  retryButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 10,
    fontWeight: '700',
  }
});
