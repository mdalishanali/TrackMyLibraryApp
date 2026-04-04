import React from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { spacing } from '@/constants/design';

const { width } = Dimensions.get('window');

interface BannersSectionProps {
  theme: any;
}

export function BannersSection({ theme }: BannersSectionProps) {
  const router = useRouter();

  const handleWhatsAppJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/community');
  };

  const handleReferralClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/referral');
  };

  return (
    <View style={styles.bannerSection}>
      {/* Referral Banner */}
      <Animated.View entering={FadeInDown.delay(600).duration(800)}>
        <Pressable
          onPress={handleReferralClick}
          style={({ pressed }) => [
            styles.engagementBanner,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && styles.cardPressed
          ]}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          />
          <View style={styles.bannerIconCircle}>
            <Ionicons name="gift" size={24} color="#fff" />
          </View>
          <View style={styles.bannerTextContent}>
            <Text style={styles.engagementTitle}>Refer & Earn ₹149</Text>
            <Text style={styles.engagementSubtitle}>Get bonus on every successful referral</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </Animated.View>

      {/* WhatsApp Community Banner */}
      <Animated.View entering={FadeInDown.delay(800).duration(800)}>
        <Pressable
          onPress={handleWhatsAppJoin}
          style={({ pressed }) => [
            styles.engagementBanner,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && styles.cardPressed
          ]}
        >
          <LinearGradient
            colors={['#25D366', '#128C7E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          />
          <View style={styles.bannerIconCircle}>
            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          </View>
          <View style={styles.bannerTextContent}>
            <Text style={styles.engagementTitle}>Join Community</Text>
            <Text style={styles.engagementSubtitle}>Get latest updates & library news</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  engagementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    gap: 16,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContent: {
    flex: 1,
  },
  engagementTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  engagementSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
