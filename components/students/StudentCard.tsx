import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard } from '@/components/ui/app-card';
import { radius, spacing } from '@/constants/design';
import {
  ActionRow,
  PaymentSummary,
  StudentHeader,
  StudentMeta,
  TimeSlots,
} from './StudentSummary';

const StudentCard = memo(({ student, theme, onView, onEdit, onDelete, onPay, onAvatarPress }: any) => {
  return (
    <AppCard style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={{ gap: spacing.md }}>
        <StudentHeader
          student={student}
          theme={theme}
          onAvatarPress={onAvatarPress}
        />

        <StudentMeta student={student} theme={theme} />

        <PaymentSummary student={student} theme={theme} />

        <TimeSlots student={student} theme={theme} />
      </View>

      <ActionRow
        theme={theme}
        actions={{
          onView: onView ? () => onView(student._id) : undefined,
          onEdit: () => onEdit(student._id),
          onDelete: () => onDelete(student._id),
          onPay: () => onPay(student),
        }}
      />
    </AppCard>
  );
});

export default StudentCard;

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.xl,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});
