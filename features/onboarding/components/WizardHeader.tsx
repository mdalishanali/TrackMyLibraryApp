import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { TOTAL_STEPS } from '../constants';

type Props = {
  step: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
};

export function WizardHeader({ step, title, subtitle, onBack }: Props) {
  const theme = useTheme();

  const progressWidth = `${(step / TOTAL_STEPS) * 100}%` as const;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <Text style={[styles.stepLabel, { color: theme.muted }]}>
          STEP {step} OF {TOTAL_STEPS}
        </Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View
          style={[styles.progressFill, { backgroundColor: theme.primary, width: progressWidth }]}
        />
      </View>

      <View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  stepLabel: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.xs,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.md,
    fontWeight: '500',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
});
