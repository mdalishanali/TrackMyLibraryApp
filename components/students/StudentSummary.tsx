import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { usePostHog } from 'posthog-react-native';

import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';

const formatShift = (shift?: string | null) => {
  if (!shift) return '—';
  // Matches HH:mm and replaces with formatted AM/PM time
  return shift.replace(/(\d{1,2}:\d{2})/g, (match) => formatTime(match));
};

type StudentTime = { start?: string; end?: string };

type Student = {
  _id: string;
  id?: string | number;
  name: string;
  number?: string;
  shift?: string;
  joiningDate?: string;
  seatNumber?: number;
  floor?: number | string;
  floorNumber?: number | string;
  status?: string;
  paymentStatus?: string;
  dueAmount?: number;
  daysOverdue?: number;
  profilePicture?: string;
  aadhaarNumber?: string;
  address?: string;
  fatherName?: string;
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
  onRemind?: () => void;
};

type Theme = ReturnType<typeof themeFor>;

const statusTone = (status?: string, paymentStatus?: string) => {
  if (paymentStatus === 'Paid') return 'success';
  if (paymentStatus === 'Trial') return 'info';
  if (paymentStatus === 'Unpaid') return 'danger';
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
  const isInactive = student.status === 'Inactive';
  const hasDues = typeof student.dueAmount === 'number' && student.dueAmount > 0;

  return (
    <View style={styles.headerRow}>
      <TouchableOpacity
        onPress={onAvatarPress}
        activeOpacity={0.8}
        style={styles.avatarWrapper}
      >
        <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt, borderColor: isInactive ? theme.border : theme.primary + '30' }]}>
          <Image
            source={{ uri: student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=0D8ABC&color=fff&size=200` }}
            style={styles.avatarImg}
            contentFit="cover"
          />
          <View style={[styles.statusDot, { backgroundColor: isInactive ? theme.muted : theme.success, borderColor: theme.surface }]} />
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <View style={styles.nameHeaderRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{student.name}</Text>
          {hasDues && (
            <View style={[styles.dueBadge, { backgroundColor: theme.danger + '10' }]}>
              <Text style={[styles.dueText, { color: theme.danger }]}>₹{student.dueAmount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.metaId, { color: theme.muted }]}>MEMBER ID: #{student.id ?? '—'}</Text>
      </View>
    </View>
  );
}

const InfoItem = ({ icon, label, value, theme, onPress, valueColor }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | number | null; theme: Theme; onPress?: () => void; valueColor?: string }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.infoBox,
        { backgroundColor: theme.surfaceAlt + '50', borderColor: theme.border }
      ]}
    >
      <View style={styles.infoTop}>
        <Ionicons name={icon} size={14} color={theme.primary} />
        <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: valueColor || theme.text }]} numberOfLines={1}>{value ?? '—'}</Text>
    </TouchableOpacity>
  );
};

export function StudentMeta({ student, theme }: { student: Student; theme: Theme }) {
  const floor = (student as any).floor ?? student.floorNumber;
  const sectionStr = !floor || isNaN(Number(floor))
    ? (floor ?? 'Section 1')
    : `Section ${floor}`;

  const seatValue = student.seatNumber
    ? `${sectionStr} • #${student.seatNumber}`
    : 'Unallocated';

  const handleCall = () => {
    if (student.number) {
      Linking.openURL(`tel:${student.number}`);
    }
  };

  return (
    <View style={styles.metaGrid}>
      <View style={styles.metaRow}>
        <InfoItem icon="call-outline" label="Phone" value={student.number} theme={theme} onPress={handleCall} />
        <InfoItem
          icon="information-circle-outline"
          label="Status"
          value={student.status === 'Inactive' ? 'Inactive' : 'Active'}
          valueColor={student.status === 'Inactive' ? theme.warning : theme.success}
          theme={theme} 
        />
      </View>
      <View style={styles.metaRow}>
        <InfoItem icon="calendar-outline" label="Joined" value={student.joiningDate ? formatDate(student.joiningDate) : '—'} theme={theme} />
        <InfoItem icon="location-outline" label="Seat" value={seatValue} theme={theme} />
      </View>
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
  const hasTime = !!student.time?.length;
  const isTrial = student.paymentStatus === 'Trial' || student.status === 'Trial';
  const isDues = student.paymentStatus === 'Unpaid';
  const isPaid = student.paymentStatus === 'Paid';

  if (!hasTime) return null;

  return (
    <View style={styles.badgesSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesWrapper}
      >
        {student.time?.map((slot, idx) => (
          <View key={idx} style={[styles.badge, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Ionicons name="time-outline" size={12} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.text }]}>
              {formatTime(slot.start)} - {formatTime(slot.end)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function ShiftBadges({ student, theme }: { student: Student; theme: Theme }) {
  const shifts = Array.isArray(student.shift)
    ? student.shift
    : (student.shift ? student.shift.split(',').map(s => s.trim()) : []);

  if (shifts.length === 0) return null;

  return (
    <View style={styles.badgesSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesWrapper}
      >
        {shifts.map((s, idx) => (
          <View key={idx} style={[styles.badge, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
            <Ionicons name="sunny-outline" size={12} color={theme.primary} />
            <Text style={[styles.badgeTextBold, { color: theme.primary }]}>{s.toUpperCase()}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function StatusBadges({ student, theme }: { student: Student; theme: Theme }) {
  const isTrial = student.paymentStatus === 'Trial' || student.status === 'Trial';
  const isDues = student.paymentStatus === 'Unpaid';
  const isPaid = student.paymentStatus === 'Paid';
  const overDueDays = student.daysOverdue ?? 0;

  if (!isTrial && !isDues && !isPaid) return null;

  return (
    <View style={styles.badgesRow}>
      {isTrial && (
        <View style={[styles.badge, { backgroundColor: theme.info + '10', borderColor: theme.info + '30' }]}>
          <Text style={[styles.badgeTextBold, { color: theme.info }]}>TRIAL</Text>
          {overDueDays === 0 ? (
            <Text style={[styles.badgeSubText, { color: theme.info }]}>• STARTED TODAY</Text>
          ) : (
            <Text style={[styles.badgeSubText, { color: theme.info }]}>• {overDueDays} DAYS IN</Text>
          )}
        </View>
      )}

      {isDues && (
        <View style={[styles.badge, { backgroundColor: theme.danger + '10', borderColor: theme.danger + '30' }]}>
          <Text style={[styles.badgeTextBold, { color: theme.danger }]}>UNPAID</Text>
          {overDueDays > 0 && <Text style={[styles.badgeSubText, { color: theme.danger }]}>• OVERDUE {overDueDays}D</Text>}
        </View>
      )}

      {isPaid && !isTrial && (
        <View style={[styles.badge, { backgroundColor: theme.success + '10', borderColor: theme.success + '30' }]}>
          <Ionicons name="checkmark-circle" size={12} color={theme.success} />
          <Text style={[styles.badgeTextBold, { color: theme.success }]}>PAID</Text>
        </View>
      )}
    </View>
  );
}

export function ValidityInfo({ student, theme }: { student: Student; theme: Theme }) {
  if (!student.lastPayment?.startDate || !student.lastPayment?.endDate) return null;

  return (
    <View style={[styles.validityContainer, { backgroundColor: theme.surfaceAlt + '50', borderColor: theme.border }]}>
      <View style={styles.validityLabelRow}>
        <Ionicons name="calendar-outline" size={12} color={theme.primary} />
        <Text style={[styles.validityLabel, { color: theme.muted }]}>MEMBERSHIP VALIDITY</Text>
      </View>
      <View style={styles.validityDates}>
        <Text style={[styles.validityDate, { color: theme.text }]}>
          {formatDate(student.lastPayment.startDate)}
        </Text>
        <View style={[styles.validityDivider, { backgroundColor: theme.border }]} />
        <Text style={[styles.validityDate, { color: theme.text }]}>
          {formatDate(student.lastPayment.endDate)}
        </Text>
        <View style={[styles.validityBadge, { backgroundColor: theme.success + '10' }]}>
          <Text style={[styles.validityBadgeText, { color: theme.success }]}>ACTIVE</Text>
        </View>
      </View>
    </View>
  );
}

export function ActionRow({ theme, actions }: { theme: Theme; actions: Actions }) {
  const posthog = usePostHog();

  return (
    <View style={styles.actionsContainer}>
      <View style={styles.actionsRow}>
        {actions.onView ? (
          <TouchableOpacity
            onPress={() => {
              posthog?.capture('student_view_clicked');
              actions.onView?.();
            }}
            style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          >
            <Ionicons name="eye-outline" size={18} color={theme.text} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>View</Text>
          </TouchableOpacity>
        ) : null}
        {actions.onEdit ? (
          <TouchableOpacity
            onPress={() => {
              posthog?.capture('student_edit_clicked');
              actions.onEdit?.();
            }}
            style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          >
            <Ionicons name="create-outline" size={18} color={theme.text} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>Edit</Text>
          </TouchableOpacity>
        ) : null}
        {actions.onPay ? (
          <TouchableOpacity
            onPress={() => {
              posthog?.capture('student_pay_clicked');
              actions.onPay?.();
            }}
            style={[styles.actionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          >
            <Ionicons name="wallet-outline" size={18} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Pay</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        {actions.onRemind ? (
          <TouchableOpacity
            onPress={() => {
              posthog?.capture('student_whatsapp_clicked');
              actions.onRemind?.();
            }}
            style={[styles.actionBtn, { backgroundColor: '#25D366' + '15', borderColor: '#25D366' + '30', flex: 1 }]}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={[styles.actionBtnText, { color: '#25D366' }]}>Send Reminder</Text>
          </TouchableOpacity>
        ) : null}

        {actions.onDelete ? (
          <TouchableOpacity
            onPress={() => {
              posthog?.capture('student_delete_clicked');
              actions.onDelete?.();
            }}
            style={[styles.actionIconBtn, { backgroundColor: theme.danger + '10', borderColor: theme.border }]}
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  avatarWrapper: {},
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 18 },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.5,
  },
  metaId: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueText: {
    fontWeight: '900',
    fontSize: 11,
  },
  metaGrid: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgesSection: {
    marginHorizontal: -spacing.md,
  },
  badgesWrapper: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextBold: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  badgeSubText: {
    fontSize: 9,
    fontWeight: '700',
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    flex: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
  validityContainer: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  validityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validityLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  validityDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  validityDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  validityDivider: {
    width: 20,
    height: 1.5,
  },
  validityBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  validityBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
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
});

