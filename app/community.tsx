import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';

export default function CommunityScreen() {
  const theme = useTheme();
  const router = useRouter();

  const handleJoinNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const groupLink = 'https://chat.whatsapp.com/EwWTjFuXvP9CiLPVmhFMlu?mode=gi_t';
    Linking.openURL(groupLink);
  };

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Library Community</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Community Hero */}
          <Animated.View entering={FadeInUp.duration(800)}>
            <LinearGradient
              colors={['#25D366', '#128C7E']}
              style={styles.heroCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.communityIconBox}>
                <Ionicons name="logo-whatsapp" size={50} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Track My Library</Text>
              <Text style={styles.heroHeadline}>Official Group</Text>
              <View style={styles.badgeRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.badgeText}>News</Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={styles.badgeText}>Support</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={styles.badgeText}>Updates</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Benefits List */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.contentBox}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Why Join?</Text>
            
            <View style={styles.benefitsGrid}>
              <View style={[styles.benefitItem, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="notifications-outline" size={24} color="#25D366" />
                <View style={styles.benefitText}>
                  <Text style={[styles.benefitTitle, { color: theme.text }]}>New Updates</Text>
                  <Text style={[styles.benefitDesc, { color: theme.muted }]}>Be the first to know about new features and bug fixes.</Text>
                </View>
              </View>

              <View style={[styles.benefitItem, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="help-buoy-outline" size={24} color="#25D366" />
                <View style={styles.benefitText}>
                  <Text style={[styles.benefitTitle, { color: theme.text }]}>Direct Help</Text>
                  <Text style={[styles.benefitDesc, { color: theme.muted }]}>Get quick answers to your technical or billing issues.</Text>
                </View>
              </View>

              <View style={[styles.benefitItem, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="people-outline" size={24} color="#25D366" />
                <View style={styles.benefitText}>
                  <Text style={[styles.benefitTitle, { color: theme.text }]}>Networking</Text>
                  <Text style={[styles.benefitDesc, { color: theme.muted }]}>Connect with other library owners across India.</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Action Button */}
          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <Pressable
              onPress={handleJoinNow}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: '#25D366' },
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
              ]}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Join the Group Now</Text>
            </Pressable>
            <Text style={[styles.disclaimer, { color: theme.muted }]}>
              Safe & Secure. Only for library owners.
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  communityIconBox: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroHeadline: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  contentBox: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  benefitText: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  benefitDesc: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    opacity: 0.8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    gap: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  disclaimer: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    fontWeight: '600',
  },
});
