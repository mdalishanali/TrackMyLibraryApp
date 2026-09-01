import { useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, typography } from '@/constants/design';
import { CommunityPitchCard, WHATSAPP_GREEN, useJoinCommunity } from '@/features/community';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { useAuth } from '@/hooks/use-auth';
import { useScreenView } from '@/hooks/use-screen-view';
import { useTheme } from '@/hooks/use-theme';

const BADGE_SPRING_DELAY_MS = 200;
const STAGGER_STEP_MS = 90;

/**
 * Final onboarding step: celebrate the freshly created library, then pitch the
 * official WhatsApp community while motivation is at its peak. Shown exactly
 * once — only the wizard routes here.
 */
export default function CommunityStep() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { totalSeats, plannedSections, shifts } = useOnboardingWizard();
  const { joinCommunity, skipCommunity } = useJoinCommunity('onboarding');

  useScreenView('OnboardingCommunity');

  const badgeScale = useSharedValue(0);

  useEffect(() => {
    badgeScale.value = withDelay(BADGE_SPRING_DELAY_MS, withSpring(1, { damping: 11 }));
  }, [badgeScale]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const goToDashboard = () => router.replace('/(tabs)');

  // This screen is reached via replace, so a hardware back would fall into the
  // finished wizard — send it to the dashboard instead.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goToDashboard();
      return true;
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = () => {
    joinCommunity();
    goToDashboard();
  };

  const handleSkip = () => {
    skipCommunity();
    goToDashboard();
  };

  const firstName = user?.name?.trim().split(' ')[0];

  // Skipping the shift step still creates one on the server.
  const shiftCount = Math.max(shifts.length, 1);

  const stats = [
    { value: totalSeats, label: totalSeats === 1 ? 'SEAT' : 'SEATS' },
    { value: plannedSections.length, label: plannedSections.length === 1 ? 'SECTION' : 'SECTIONS' },
    { value: shiftCount, label: shiftCount === 1 ? 'SHIFT' : 'SHIFTS' },
  ];

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Celebration hero */}
        <View style={styles.hero}>
          <Animated.View style={badgeStyle}>
            <LinearGradient
              colors={[theme.primary, theme.primarySoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successBadge}
            >
              <Ionicons name="checkmark" size={44} color="#fff" />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(STAGGER_STEP_MS).duration(400).springify()}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              {firstName ? `Your library is live, ${firstName}! 🎉` : 'Your library is live! 🎉'}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.muted }]}>
              Everything is set up and ready for your first student.
            </Text>
          </Animated.View>
        </View>

        {/* What they just built */}
        <Animated.View
          entering={FadeInDown.delay(STAGGER_STEP_MS * 2).duration(400).springify()}
          style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          {stats.map((stat, index) => (
            <View key={stat.label} style={styles.statCell}>
              {index > 0 && <View style={[styles.statDivider, { backgroundColor: theme.border }]} />}
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Community pitch */}
        <Animated.View
          entering={FadeInDown.delay(STAGGER_STEP_MS * 3).duration(400).springify()}
          style={styles.communityBlock}
        >
          <Text style={[styles.kicker, { color: theme.muted }]}>ONE LAST THING</Text>
          <CommunityPitchCard />
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(STAGGER_STEP_MS * 4).duration(400).springify()}
        style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}
      >
        <Pressable
          onPress={handleJoin}
          style={({ pressed }) => [
            styles.joinBtn,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={styles.joinBtnText}>Join WhatsApp Community</Text>
        </Pressable>

        <AppButton onPress={handleSkip} variant="ghost" fullWidth icon="arrow-forward-outline">
          Go to my dashboard
        </AppButton>
      </Animated.View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: typography.size.md,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    position: 'absolute',
    left: 0,
    top: '15%',
    bottom: '15%',
    width: StyleSheet.hairlineWidth,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  communityBlock: {
    gap: spacing.sm,
  },
  kicker: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: WHATSAPP_GREEN,
    shadowColor: WHATSAPP_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: typography.size.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
