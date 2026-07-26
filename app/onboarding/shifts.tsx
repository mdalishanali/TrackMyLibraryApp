import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { WizardHeader } from '@/features/onboarding/components/WizardHeader';
import { EditableShiftCard } from '@/features/onboarding/components/EditableShiftCard';
import { ShiftTemplateSheet } from '@/features/onboarding/components/ShiftTemplateSheet';
import { DEFAULT_SHIFT_FEE } from '@/features/onboarding/constants';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';

export default function ShiftsStep() {
  const theme = useTheme();
  const router = useRouter();

  const { shifts, addShift, updateShift, removeShift, shiftsError, isShiftsValid } =
    useOnboardingWizard();

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const hasShifts = shifts.length > 0;

  const goToReview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/review');
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <WizardHeader
          step={2}
          title="When do students sit?"
          subtitle="Add the shifts you run. Rename, retime and price each one."
          onBack={() => router.back()}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* The cards look like read-only summaries until you tap one, so say
              plainly that every field is editable. */}
          <View style={[styles.editHint, { backgroundColor: theme.primary + '12' }]}>
            <Ionicons name="create-outline" size={16} color={theme.primary} />
            <Text style={[styles.editHintText, { color: theme.primary }]}>
              Tap any name, time or fee to change it
            </Text>
          </View>

          {shifts.map((shift, index) => (
            <EditableShiftCard
              key={shift.id}
              index={index}
              name={shift.name}
              startTime={shift.startTime}
              endTime={shift.endTime}
              price={shift.price}
              onChangeName={(name) => updateShift(shift.id, { name })}
              onChangeStartTime={(startTime) => updateShift(shift.id, { startTime })}
              onChangeEndTime={(endTime) => updateShift(shift.id, { endTime })}
              onChangePrice={(price) => updateShift(shift.id, { price })}
              onRemove={() => removeShift(shift.id)}
            />
          ))}

          {!hasShifts ? (
            <View style={[styles.emptyState, { borderColor: theme.border }]}>
              <Ionicons name="time-outline" size={28} color={theme.muted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No shifts yet</Text>
              <Text style={[styles.emptyText, { color: theme.muted }]}>
                Add one for each sitting you run. Continue without any and we
                will create a Full Day shift at ₹{DEFAULT_SHIFT_FEE}, which you
                can change later.
              </Text>
            </View>
          ) : null}

          <View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSheetOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Add a shift"
              style={({ pressed }) => [
                styles.addButton,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="add" size={18} color={theme.primary} />
              <Text style={[styles.addButtonText, { color: theme.primary }]}>Add shift</Text>
              <Ionicons name="chevron-down" size={16} color={theme.primary} />
            </Pressable>
          </View>
        </ScrollView>

        <ShiftTemplateSheet
          isVisible={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onSelect={addShift}
        />

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          {hasShifts ? (
            <Text style={[styles.summaryText, { color: theme.text }]}>
              {shifts.length} {shifts.length === 1 ? 'shift' : 'shifts'}
            </Text>
          ) : null}

          {shiftsError ? (
            <Text style={[styles.errorText, { color: theme.warning }]}>
              {shiftsError}
            </Text>
          ) : null}

          <AppButton onPress={goToReview} disabled={!isShiftsValid} fullWidth icon="arrow-forward">
            Continue
          </AppButton>

          {/* Names the shift that will be created, so the review screen never
              shows a shift the owner did not expect. */}
          {!hasShifts ? (
            <Pressable
              onPress={goToReview}
              accessibilityRole="button"
              accessibilityLabel="Continue with a single Full Day shift"
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            >
              <Text style={[styles.skipText, { color: theme.muted }]}>
                Skip — use one Full Day shift at ₹{DEFAULT_SHIFT_FEE}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  editHintText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    flexShrink: 1,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  emptyText: {
    fontSize: typography.size.sm,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  summaryText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  skipText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
});
