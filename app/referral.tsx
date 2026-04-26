import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Linking, Share } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';
import { STORE_URLS } from '@/constants/config';

export default function ReferralScreen() {
  const theme = useTheme();
  const router = useRouter();

  const handleShareLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const message = `Hey! I'm using Track My Library to manage my seats and fees. It's truly simplified my work and made everything professional. 🛡️📚\n\nDownload Now:\n🌐 Website: https://TrackMyLibrary.in\n🤖 Android: ${STORE_URLS.android}\n🍎 iOS: ${STORE_URLS.ios}`;
    
    try {
      await Share.share({
        message,
        title: 'Track My Library - Referral',
      });
    } catch (error) {
      console.error('Sharing failed', error);
    }
  };

  const handleWhatsAppDM = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const phoneNumber = '917348335273';
    const message = encodeURIComponent('Hi! I referred someone to Track My Library. What are the next steps?');
    Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${message}`);
  };

  return (
    <SafeScreen>
      <Stack.Screen options={{ headerShown: false }} />
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Refer & Earn</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.duration(800)}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.heroCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.giftIconBox}>
                <Ionicons name="gift" size={50} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Grow with us</Text>
              <Text style={styles.heroAmount}>Earn ₹149</Text>
              <Text style={styles.heroSubtitle}>Per Successful Referral</Text>
            </LinearGradient>
          </Animated.View>

          {/* Mission Content */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.contentBox}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Our Mission</Text>
            <Text style={[styles.missionText, { color: theme.muted }]}>
              At <Text style={{ color: theme.primary, fontWeight: '700' }}>Track My Library</Text>, we are dedicated to providing the best tools for library owners like you. 
              {"\n\n"}
              We really need your support to keep improving and reaching more people. If you've found our app helpful, please consider referring it to your fellow library owners.
              {"\n\n"}
              You can also visit our official website at <Text style={{ color: theme.primary, fontWeight: '700' }} onPress={() => Linking.openURL('https://TrackMyLibrary.in')}>TrackmYlibrary.in</Text> to learn more about our future vision.
            </Text>

            <View style={[styles.infoCard, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="information-circle" size={20} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                After you refer someone and they subscribe, please let us know so we can credit your bonus!
              </Text>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.actionBox}>
            <Pressable
              onPress={handleShareLink}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.primary },
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
              ]}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Share with Friends</Text>
            </Pressable>

            <Pressable
              onPress={handleWhatsAppDM}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: 'rgba(37, 211, 102, 0.15)' },
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
              ]}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={[styles.actionBtnText, { color: '#25D366' }]}>DM to Claim Bonus</Text>
            </Pressable>

            <Text style={[styles.phoneNote, { color: theme.muted }]}>
              WhatsApp us at +91 7348335273
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
  },
  heroCard: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  giftIconBox: {
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
  heroAmount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.9,
  },
  contentBox: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  missionText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  actionBox: {
    gap: 12,
  },
  phoneNote: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
});
