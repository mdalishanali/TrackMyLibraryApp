import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing, typography } from '@/constants/design';
import type { DueStudent } from '@/hooks/use-whatsapp';
import { useTheme } from '@/hooks/use-theme';
import { getDueBadgeLabel } from '@/utils/due-date-label';
import { getHoursSinceReminder } from '@/utils/reminder-cooldown';

const BUCKET_TONE: Record<string, 'danger' | 'warning' | 'info'> = {
  overdue: 'danger',
  today: 'warning',
  '3day': 'info',
};

type Props = {
  student: DueStudent;
  isSelected: boolean;
  onToggle: (id: string) => void;
};

export function DueStudentRow({ student, isSelected, onToggle }: Props) {
  const theme = useTheme();

  const bucketLabel = getDueBadgeLabel(student.reminderType, student.latestPaymentEndDate);
  const toneKey = student.reminderType ? BUCKET_TONE[student.reminderType] : null;
  const bucketColor = toneKey ? theme[toneKey] : theme.muted;
  const recentHours = getHoursSinceReminder(student.lastReminderSentAt);

  return (
    <Pressable
      onPress={() => onToggle(student._id)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: bucketColor + '18' }]}>
        <Text style={[styles.avatarText, { color: bucketColor }]}>
          {(student.name || '?').slice(0, 1).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {student.name}
        </Text>
        <View style={styles.metaRow}>
          {bucketLabel && (
            <View style={[styles.badge, { backgroundColor: bucketColor + '15' }]}>
              <Text style={[styles.badgeText, { color: bucketColor }]}>{bucketLabel}</Text>
            </View>
          )}
          <Text style={[styles.phone, { color: theme.muted }]} numberOfLines={1}>
            {student.number}
          </Text>
        </View>
        {recentHours !== null && (
          <Text style={[styles.recentHint, { color: theme.warning }]}>
            Reminded {recentHours === 0 ? 'less than an hour' : `${recentHours}h`} ago — will be skipped
          </Text>
        )}
      </View>

      <Ionicons
        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
        size={26}
        color={isSelected ? theme.primary : theme.border}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: '800',
  },
  phone: {
    fontSize: typography.size.xs,
    fontWeight: '500',
    flexShrink: 1,
  },
  recentHint: {
    fontSize: typography.size.xs,
    fontWeight: '600',
  },
});
