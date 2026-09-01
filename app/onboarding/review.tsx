import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { useLibrarySetup } from '@/hooks/use-onboarding';
import { WizardHeader } from '@/features/onboarding/components/WizardHeader';
import { DEFAULT_FIRST_SHIFT, DEFAULT_SHIFT_FEE } from '@/features/onboarding/constants';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { showToast } from '@/lib/toast';
import { formatTime } from '@/utils/format';
import { getErrorMessage } from '@/hooks/use-auth-mutations';

export default function ReviewStep() {
  const theme = useTheme();
  const router = useRouter();
  const setupMutation = useLibrarySetup();

  const { plannedSections, shifts, totalSeats, buildPayload } = useOnboardingWizard();

  // Skipping the shift step still creates one, so the summary must show it.
  const shiftsToShow =
    shifts.length > 0
      ? shifts
      : [{ ...DEFAULT_FIRST_SHIFT, id: 'default-shift', price: String(DEFAULT_SHIFT_FEE) }];

  const handleCreate = async () => {
    try {
      const result = await setupMutation.mutateAsync(buildPayload());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // A retried request finds the library already built — send the owner on
      // rather than reporting a failure for work that succeeded. The success
      // toast lives on the celebration step, which routes on to (tabs).
      if (result?.alreadySetUp) {
        showToast('Your library is ready 🚀', 'success');
      }

      router.replace('/onboarding/community');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(getErrorMessage(error), 'error');
    }
  };

  return (
    <SafeScreen>
      <WizardHeader
        step={3}
        title="Ready to go"
        subtitle="Check everything looks right. You can change all of this later."
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={[styles.heroCard, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '30' }]}
        >
          <View style={styles.heroRow}>
            <Text style={[styles.heroNumber, { color: theme.primary }]}>{totalSeats}</Text>
            <Text style={[styles.heroLabel, { color: theme.primary }]}>
              {totalSeats === 1 ? 'SEAT' : 'SEATS'}
            </Text>
          </View>
          <Text style={[styles.heroSub, { color: theme.muted }]}>
            across {plannedSections.length} {plannedSections.length === 1 ? 'section' : 'sections'}
            {' · '}
            {shiftsToShow.length} {shiftsToShow.length === 1 ? 'shift' : 'shifts'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400).springify()}>
          <Text style={[styles.groupLabel, { color: theme.muted }]}>SECTIONS</Text>

          <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {plannedSections.map((section, index) => (
              <View
                key={section.id}
                style={[
                  styles.row,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                ]}
              >
                <View style={styles.rowLabelGroup}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{section.name}</Text>
                  <Text style={[styles.rowMeta, { color: theme.muted }]}>
                    {section.startSeat === section.endSeat
                      ? `Seat ${section.startSeat}`
                      : `Seats ${section.startSeat}–${section.endSeat}`}
                  </Text>
                </View>

                <Text style={[styles.rowValue, { color: theme.text }]}>{section.seatCount}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400).springify()}>
          <Text style={[styles.groupLabel, { color: theme.muted }]}>SHIFTS</Text>

          <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {shiftsToShow.map((shift, index) => (
              <View
                key={shift.id}
                style={[
                  styles.row,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                ]}
              >
                <View style={styles.rowLabelGroup}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{shift.name}</Text>
                  <Text style={[styles.rowMeta, { color: theme.muted }]}>
                    {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                  </Text>
                </View>

                <Text style={[styles.rowValue, { color: theme.text }]}>
                  ₹{Number.parseInt(String(shift.price), 10) || 0}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.hintRow}>
          <Ionicons name="lock-open-outline" size={15} color={theme.muted} />
          <Text style={[styles.hintText, { color: theme.muted }]}>
            Nothing here is permanent — edit sections, seats and fees anytime.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <AppButton
          onPress={handleCreate}
          loading={setupMutation.isPending}
          disabled={setupMutation.isPending}
          fullWidth
          icon="rocket-outline"
        >
          Create my library
        </AppButton>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  heroNumber: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
  },
  heroLabel: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroSub: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  groupLabel: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowLabelGroup: {
    gap: 2,
  },
  rowTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  rowMeta: {
    fontSize: typography.size.xs,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  hintText: {
    fontSize: typography.size.xs,
    fontWeight: '500',
    flexShrink: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
