import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';

type StudentTime = { start?: string; end?: string };

type Student = {
  _id: string;
  id?: string | number;
  name: string;
  number?: string;
  shift?: string;
  joiningDate?: string;
  seatNumber?: number;
  status?: string;
  dueAmount?: number;
  profilePicture?: string;
  lastPayment?: {
    paymentDate?: string;
    startDate?: string;
    endDate?: string;
    rupees?: number;
    paymentMode?: string;
  };
  time?: StudentTime[];
};

type Actions = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPay?: () => void;
};

type Theme = ReturnType<typeof themeFor>;

const statusTone = (status?: string) => {
  if (status === 'Active') return 'success';
  if (status === 'Trial') return 'info';
  if (status === 'Defaulter') return 'danger';
  if (status === 'Inactive') return 'warning';
  return 'default';
};

export function StudentHeader({
  student,
  theme,
  onAvatarPress,
}: {
  student: Student;
  theme: Theme;
  onAvatarPress?: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <TouchableOpacity
        onPress={onAvatarPress}
        activeOpacity={student.profilePicture ? 0.8 : 1}
        style={[styles.avatar, { backgroundColor: theme.surfaceAlt }]}
      >
        {student.profilePicture ? (
          <Image source={{ uri: student.profilePicture }} style={styles.avatarImg} />
        ) : (
          <Text style={[styles.avatarText, { color: theme.text }]}>
            {student.name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.text }]}>{student.name}</Text>
          <AppBadge tone={statusTone(student.status)}>
            {student.status ?? '—'}
          </AppBadge>
        </View>
        <Text style={[styles.meta, { color: theme.muted }]}>ID: {student.id ?? '—'}</Text>
        {typeof student.dueAmount === 'number' && student.dueAmount > 0 && (
          <View style={[styles.duePill, { backgroundColor: theme.surfaceAlt, borderColor: theme.warning }]}>
            <Ionicons name="alert-circle" size={14} color={theme.warning} />
            <Text style={[styles.dueText, { color: theme.warning }]}>
              Due: {formatCurrency(student.dueAmount)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const InfoItem = ({ icon, label, value, theme }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | number | null; theme: Theme }) => (
  <View style={[styles.infoItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
    <View style={[styles.infoIconWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name={icon} size={16} color={theme.text} />
    </View>
    <View>
      <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value ?? '—'}</Text>
    </View>
  </View>
);

export function StudentMeta({ student, theme }: { student: Student; theme: Theme }) {
  return (
    <View style={styles.metaGrid}>
      <InfoItem icon="call-outline" label="Phone" value={student.number} theme={theme} />
      <InfoItem icon="time-outline" label="Shift" value={student.shift} theme={theme} />
      <InfoItem icon="calendar-outline" label="Joined" value={student.joiningDate ? formatDate(student.joiningDate) : '—'} theme={theme} />
      <InfoItem icon="location-outline" label="Seat" value={student.seatNumber ?? 'Unallocated'} theme={theme} />
    </View>
  );
}

export function PaymentSummary({ student, theme }: { student: Student; theme: Theme }) {
  return (
    <View style={[styles.paymentBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentTitleRow}>
          <Ionicons name="card-outline" size={16} color={theme.text} />
          <Text style={[styles.paymentTitle, { color: theme.text }]}>Payment Info</Text>
        </View>
        {student.lastPayment?.paymentMode ? (
          <AppBadge tone="info" style={{ paddingHorizontal: spacing.xs + 2 }}>
            {student.lastPayment.paymentMode}
          </AppBadge>
        ) : null}
      </View>

      <Text style={[styles.paymentText, { color: theme.muted }]}>
        Last Payment: {student.lastPayment?.paymentDate ? formatDate(student.lastPayment.paymentDate) : 'No payment'}
      </Text>

      <Text style={[styles.paymentText, { color: theme.muted }]}>
        Period:{' '}
        {student.lastPayment?.startDate
          ? `${formatDate(student.lastPayment.startDate)} - ${formatDate(student.lastPayment.endDate)}`
          : '—'}
      </Text>

      {typeof student.lastPayment?.rupees === 'number' && (
        <Text style={[styles.paymentAmount, { color: theme.text }]}>
          {formatCurrency(student.lastPayment.rupees)}
        </Text>
      )}
    </View>
  );
}

export function TimeSlots({ student, theme }: { student: Student; theme: Theme }) {
  if (!student.time?.length) return null;

  return (
    <View style={styles.timeRow}>
      {student.time.map((slot, idx) => (
        <View key={`${slot.start}-${slot.end}-${idx}`} style={[styles.timeChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="time-outline" size={12} color={theme.text} />
          <Text style={[styles.timeText, { color: theme.text }]}>
            {formatTime(slot.start)} - {formatTime(slot.end)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ActionRow({ theme, actions }: { theme: Theme; actions: Actions }) {
  return (
    <View style={styles.actions}>
      {actions.onView ? (
        <View style={styles.actionWrap}>
          <AppButton variant="outline" onPress={actions.onView} fullWidth>
            View
          </AppButton>
        </View>
      ) : null}
      {actions.onEdit ? (
        <View style={styles.actionWrap}>
          <AppButton variant="outline" onPress={actions.onEdit} fullWidth>
            Edit
          </AppButton>
        </View>
      ) : null}
      {actions.onDelete ? (
        <View style={styles.actionWrap}>
          <AppButton variant="outline" onPress={actions.onDelete} fullWidth>
            Delete
          </AppButton>
        </View>
      ) : null}
      {actions.onPay ? (
        <View style={styles.actionWrap}>
          <AppButton onPress={actions.onPay} fullWidth>
            Pay
          </AppButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: typography.size.lg, fontWeight: '800' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  meta: {
    marginTop: 2,
    fontSize: typography.size.sm,
  },
  duePill: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dueText: {
    fontWeight: '700',
    fontSize: typography.size.sm,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoItem: {
    flexBasis: '48%',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  paymentBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  paymentText: {
    fontSize: typography.size.sm,
  },
  paymentAmount: {
    marginTop: spacing.xs,
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timeText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionWrap: {
    flexGrow: 1,
    minWidth: '45%',
  },
});
