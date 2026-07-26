import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { WizardHeader } from '@/features/onboarding/components/WizardHeader';
import { SectionCard } from '@/features/onboarding/components/SectionCard';
import { MAX_TOTAL_SEATS } from '@/features/onboarding/constants';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';

/**
 * Stops an out-of-range seat number at the keystroke rather than letting it be
 * typed and rejected afterwards.
 */
const clampSeatInput = (value: string): string => {
  const digitsOnly = value.replace(/[^0-9]/g, '');

  if (!digitsOnly) {
    return '';
  }

  const parsed = Number.parseInt(digitsOnly, 10);

  return String(Math.min(parsed, MAX_TOTAL_SEATS));
};

export default function SectionsStep() {
  const theme = useTheme();
  const router = useRouter();

  const {
    sections,
    plannedSections,
    totalSeats,
    sectionsError,
    canAddSection,
    isSectionsValid,
    addSection,
    updateSection,
    removeSection,
  } = useOnboardingWizard();

  const handleAddSection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addSection();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/shifts');
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <WizardHeader
          step={1}
          title="Set up your seats"
          subtitle="Most libraries have one hall. Add more only if you have separate rooms."
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* The cards read as read-only summaries until tapped, so state
              plainly that every field can be changed. */}
          <View style={[styles.editHint, { backgroundColor: theme.primary + '12' }]}>
            <Ionicons name="create-outline" size={16} color={theme.primary} />
            <Text style={[styles.editHintText, { color: theme.primary }]}>
              Tap any name or seat number to change it
            </Text>
          </View>

          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              index={index}
              name={section.name}
              startSeat={section.startSeat}
              endSeat={section.endSeat}
              planned={plannedSections[index]}
              canRemove={sections.length > 1}
              // Only a newly added row steals focus; the pre-seeded first row
              // must not pop the keyboard over the explanatory subtitle.
              autoFocusName={index > 0 && !section.name}
              onChangeName={(name) => updateSection(section.id, { name })}
              onChangeStartSeat={(value) =>
                updateSection(section.id, { startSeat: clampSeatInput(value) })
              }
              onChangeEndSeat={(value) =>
                updateSection(section.id, { endSeat: clampSeatInput(value) })
              }
              onRemove={() => removeSection(section.id)}
            />
          ))}

          {canAddSection ? (
            <View>
              <Pressable
                onPress={handleAddSection}
                accessibilityRole="button"
                accessibilityLabel="Add another section"
                style={({ pressed }) => [
                  styles.addButton,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={18} color={theme.primary} />
                <Text style={[styles.addButtonText, { color: theme.primary }]}>
                  Add another section
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.capNotice}>
              <Ionicons name="information-circle-outline" size={15} color={theme.muted} />
              <Text style={[styles.capNoticeText, { color: theme.muted }]}>
                You can add more sections later from the Seats tab.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryText, { color: theme.muted }]}>
              {sections.length} {sections.length === 1 ? 'section' : 'sections'}
            </Text>
            <View style={[styles.summaryDot, { backgroundColor: theme.border }]} />
            <Text style={[styles.summaryText, { color: theme.text }]}>
              {totalSeats} {totalSeats === 1 ? 'seat' : 'seats'}
            </Text>
          </View>

          {sectionsError ? (
            <Text
              style={[styles.errorText, { color: theme.warning }]}
            >
              {sectionsError}
            </Text>
          ) : null}

          <AppButton onPress={handleContinue} disabled={!isSectionsValid} fullWidth icon="arrow-forward">
            Continue
          </AppButton>
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
  capNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  capNoticeText: {
    fontSize: typography.size.xs,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  summaryText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  summaryDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  errorText: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
});
