import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';

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
        activeOpacity={0.8}
        style={[styles.avatarWrapper, { shadowColor: theme.primary }]}
      >
        <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          {student.profilePicture ? (
            <>
              <Image source={{ uri: student.profilePicture }} style={styles.avatarImg} />
              <View style={[styles.imageActionOverlay, { backgroundColor: theme.primary }]}>
                <Ionicons name="expand" size={10} color="#fff" />
              </View>
            </>
          ) : (
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {student.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{student.name}</Text>
          <AppBadge tone={statusTone(student.status)}>
            {student.status?.toUpperCase() ?? 'ACTIVE'}
          </AppBadge>
        </View>
        <View style={styles.idRow}>
          <Text style={[styles.meta, { color: theme.muted }]}>MEMBER ID: {student.id ?? '—'}</Text>
          {typeof student.dueAmount === 'number' && student.dueAmount > 0 && (
            <View style={[styles.dueBadge, { backgroundColor: theme.danger + '15' }]}>
              <Text style={[styles.dueText, { color: theme.danger }]}>
                DUE: {formatCurrency(student.dueAmount)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const InfoItem = ({ icon, label, value, theme, index = 0 }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | number | null; theme: Theme; index?: number }) => (
  <Animated.View
    entering={FadeInRight.delay(index * 100).duration(500)}
    style={[styles.infoItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
  >
    <View style={[styles.infoIconWrap, { backgroundColor: theme.primary + '10' }]}>
      <Ionicons name={icon} size={16} color={theme.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>{value ?? '—'}</Text>
    </View>
  </Animated.View>
);

export function StudentMeta({ student, theme }: { student: Student; theme: Theme }) {
  return (
    <View style={styles.metaGrid}>
      <InfoItem icon="call-outline" label="Phone" value={student.number} theme={theme} index={0} />
      <InfoItem icon="calendar-outline" label="Joined" value={student.joiningDate ? formatDate(student.joiningDate) : '—'} theme={theme} index={1} />
      <InfoItem icon="location-outline" label="Seat" value={student.seatNumber ? `Seat ${student.seatNumber}` : 'Unallocated'} theme={theme} index={2} />
      <InfoItem icon="time-outline" label="Shift" value={student.shift} theme={theme} index={3} />
    </View>
  );
}

export function PaymentSummary({ student, theme }: { student: Student; theme: Theme }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(400)}
      style={[styles.paymentBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentTitleRow}>
          <View style={[styles.paymentIconWrap, { backgroundColor: theme.primary }]}>
            <Ionicons name="card" size={14} color="#fff" />
          </View>
          <Text style={[styles.paymentTitle, { color: theme.text }]}>Payment Summary</Text>
        </View>
        {student.lastPayment?.paymentMode ? (
          <AppBadge tone="info" style={{ borderRadius: 6 }}>
            {student.lastPayment.paymentMode.toUpperCase()}
          </AppBadge>
        ) : null}
      </View>

      <View style={styles.paymentBody}>
        <View style={styles.paymentDetailRow}>
          <Text style={[styles.paymentLabel, { color: theme.muted }]}>Last Payment</Text>
          <Text style={[styles.paymentVal, { color: theme.text }]}>
            {student.lastPayment?.paymentDate ? formatDate(student.lastPayment.paymentDate) : 'N/A'}
          </Text>
        </View>
        <View style={styles.paymentDetailRow}>
          <Text style={[styles.paymentLabel, { color: theme.muted }]}>Validity Period</Text>
          <Text style={[styles.paymentVal, { color: theme.text }]}>
            {student.lastPayment?.startDate
              ? `${formatDate(student.lastPayment.startDate)} - ${formatDate(student.lastPayment.endDate)}`
              : '—'}
          </Text>
        </View>
        {typeof student.lastPayment?.rupees === 'number' && (
          <View style={[styles.amountTag, { backgroundColor: theme.primary + '15' }]}>
            <Text style={[styles.amountTagText, { color: theme.primary }]}>
              {formatCurrency(student.lastPayment.rupees)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export function TimeSlots({ student, theme }: { student: Student; theme: Theme }) {
  if (!student.time?.length) return null;

  return (
    <View style={styles.timeRow}>
      {student.time.map((slot, idx) => (
        <View key={`${slot.start}-${slot.end}-${idx}`} style={[styles.timeChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="time" size={12} color={theme.primary} />
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
        <TouchableOpacity
          onPress={actions.onView}
          style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
        >
          <Ionicons name="eye-outline" size={18} color={theme.text} />
          <Text style={[styles.actionBtnText, { color: theme.text }]}>View</Text>
        </TouchableOpacity>
      ) : null}
      {actions.onEdit ? (
        <TouchableOpacity
          onPress={actions.onEdit}
          style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
        >
          <Ionicons name="create-outline" size={18} color={theme.text} />
          <Text style={[styles.actionBtnText, { color: theme.text }]}>Edit</Text>
        </TouchableOpacity>
      ) : null}
      {actions.onPay ? (
        <TouchableOpacity
          onPress={actions.onPay}
          style={[styles.actionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
        >
          <Ionicons name="wallet-outline" size={18} color="#fff" />
          <Text style={[styles.actionBtnText, { color: '#fff' }]}>Pay</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  avatarWrapper: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
  },
  avatarImg: { width: '100%', height: '100%' },
  imageActionOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderTopLeftRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '900' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.5,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dueText: {
    fontWeight: '800',
    fontSize: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoItem: {
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  paymentBox: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  paymentBody: {
    gap: 8,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  amountTag: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  amountTagText: {
    fontSize: 16,
    fontWeight: '900',
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

