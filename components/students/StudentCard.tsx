import { memo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { radius, spacing } from '@/constants/design';
import {
  ActionRow,
  ShiftBadges,
  StatusBadges,
  StudentHeader,
  StudentMeta,
  TimeSlots,
  ValidityInfo,
} from './StudentSummary';

const StudentCard = memo(({ student, theme, onView, onEdit, onDelete, onPay, onRemind, onSmsRemind, onAvatarPress, index = 0 }: any) => {
  return (
    <View
    >
      <AppCard style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable
          onPress={onView ? () => onView(student._id) : undefined}
          style={({ pressed }) => [
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            styles.pressableArea
          ]}
        >
          <View style={styles.cardContent}>
            <StudentHeader
              student={student}
              theme={theme}
              onAvatarPress={onAvatarPress}
            />

            <View style={styles.divider} />

            <StudentMeta student={student} theme={theme} />

            <ValidityInfo student={student} theme={theme} />

            <View style={styles.divider} />

            <View style={styles.metricsSection}>
              <ShiftBadges student={student} theme={theme} />
              <TimeSlots student={student} theme={theme} />
              <StatusBadges student={student} theme={theme} />
            </View>

            <View style={styles.divider} />

            <ActionRow
              theme={theme}
              actions={{
                onView: onView ? () => onView(student._id) : undefined,
                onEdit: () => onEdit(student._id),
                onDelete: () => onDelete(student._id),
                onPay: () => onPay(student),
                onRemind: () => onRemind(student),
                onSmsRemind: onSmsRemind ? () => onSmsRemind(student) : undefined,
              }}
            />
          </View>
        </Pressable>
      </AppCard>
    </View>
  );
});

export default StudentCard;

const styles = StyleSheet.create({
  card: {
    padding: 0,
    borderRadius: 24,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  pressableArea: {
    padding: spacing.md,
  },
  cardContent: {
    gap: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: -spacing.md,
  },
  metricsSection: {
    gap: spacing.sm,
  },
});

