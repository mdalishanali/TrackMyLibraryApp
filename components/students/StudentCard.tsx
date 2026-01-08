import { memo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { AppCard } from '@/components/ui/app-card';
import { radius, spacing } from '@/constants/design';
import {
  ActionRow,
  PaymentSummary,
  StudentHeader,
  StudentMeta,
  TimeSlots,
} from './StudentSummary';

const StudentCard = memo(({ student, theme, onView, onEdit, onDelete, onPay, onRemind, onAvatarPress, index = 0 }: any) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(600)}
      layout={Layout.springify()}
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

            <View style={styles.divider} />

            <View style={styles.footerRow}>
              <View style={{ flex: 1 }}>
                <TimeSlots student={student} theme={theme} />
              </View>
              <ActionRow
                theme={theme}
                actions={{
                  onView: onView ? () => onView(student._id) : undefined,
                  onEdit: () => onEdit(student._id),
                  onDelete: () => onDelete(student._id),
                  onPay: () => onPay(student),
                  onRemind: () => onRemind(student),
                }}
              />
            </View>
          </View>
        </Pressable>
      </AppCard>
    </Animated.View>
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
  footerRow: {
    gap: spacing.md,
  }
});

