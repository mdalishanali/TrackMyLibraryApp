import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { PaymentFormModal, PaymentFormValues } from '@/components/students/payment-form-modal';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { spacing } from '@/constants/design';
import { useDeleteStudent } from '@/hooks/use-students';
import { useStudentQuery } from '@/hooks/use-student';
import { useCreatePayment, useDeletePayment as useDeletePaymentMutation, useInfinitePaymentsQuery, useUpdatePayment } from '@/hooks/use-payments';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePaymentMutation = useDeletePaymentMutation();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDefaults, setPaymentDefaults] = useState<PaymentFormValues | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const isPaymentSaving = createPayment.isPending || updatePayment.isPending;
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [confirmStudentDelete, setConfirmStudentDelete] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const studentQuery = useStudentQuery(id);
  const paymentsQuery = useInfinitePaymentsQuery({ student: id, limit: 10 });
  const deleteStudent = useDeleteStudent();

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!paymentsQuery.hasNextPage || paymentsQuery.isFetchingNextPage) return;
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (distanceFromBottom < 160) {
        paymentsQuery.fetchNextPage();
      }
    },
    [paymentsQuery],
  );

  if (studentQuery.isLoading) {
    return <FullScreenLoader message="Loading member profile..." />;
  }

  const student = studentQuery.data;
  if (!student) {
    return (
      <SafeScreen>
        <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.muted} />
          <Text style={{ color: theme.muted, fontSize: 18, fontWeight: '600', marginTop: 16 }}>Student not found.</Text>
          <AppButton onPress={() => router.back()} style={{ marginTop: 24 }}>Go Back</AppButton>
        </View>
      </SafeScreen>
    );
  }

  const confirmDeleteStudent = async () => {
    if (deleteStudent.isPending) return;
    await deleteStudent.mutateAsync(student._id);
    setConfirmStudentDelete(false);
    router.back();
  };

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const basePaymentValues = useMemo<PaymentFormValues>(
    () => ({
      student: student._id,
      rupees: 0,
      startDate: todayIso,
      endDate: todayIso,
      paymentDate: todayIso,
      paymentMode: 'cash',
      notes: '',
    }),
    [student._id, todayIso],
  );

  const openPayment = () => {
    setPaymentDefaults({ ...basePaymentValues, rupees: student.fees ?? 0 });
    setEditingPaymentId(null);
    setIsPaymentOpen(true);
  };

  const startEditPayment = (payment: any) => {
    setPaymentDefaults({
      student: student._id,
      rupees: payment.rupees,
      startDate: payment.startDate?.slice(0, 10) ?? todayIso,
      endDate: payment.endDate?.slice(0, 10) ?? todayIso,
      paymentDate: payment.paymentDate?.slice(0, 10) ?? todayIso,
      paymentMode: payment.paymentMode ?? 'cash',
      notes: payment.notes ?? '',
    });
    setEditingPaymentId(payment._id);
    setIsPaymentOpen(true);
  };

  const submitPayment = async (values: PaymentFormValues) => {
    if (editingPaymentId) {
      await updatePayment.mutateAsync({ id: editingPaymentId, ...values });
    } else {
      await createPayment.mutateAsync(values);
    }
    setPaymentDefaults(basePaymentValues);
    setEditingPaymentId(null);
    setIsPaymentOpen(false);
  };

  return (
    <SafeScreen edges={['bottom']}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <LinearGradient
          colors={[theme.primary + '15', 'transparent']}
          style={styles.bgGradient}
        />

        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/students', params: { search: student.name } })}
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="search" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: spacing.xl + insets.bottom }
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(600)}>
            <AppCard style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.profileMain}>
                <TouchableOpacity
                  onPress={() => student.profilePicture && setPreviewVisible(true)}
                  activeOpacity={0.8}
                  style={[styles.avatarContainer, { shadowColor: theme.primary }]}
                >
                  <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    {student.profilePicture ? (
                      <>
                        <Image source={{ uri: student.profilePicture }} style={styles.avatarImg} contentFit="cover" />
                        <View style={[styles.expandOverlay, { backgroundColor: theme.primary }]}>
                          <Ionicons name="expand" size={12} color="#fff" />
                        </View>
                      </>
                    ) : (
                      <Text style={[styles.avatarText, { color: theme.primary }]}>
                        {student.name?.[0]?.toUpperCase() || 'S'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: theme.text }]}>{student.name}</Text>
                  <View style={styles.idBadge}>
                    <Text style={[styles.idText, { color: theme.muted }]}>MEMBER ID: {student.id || '—'}</Text>
                  </View>
                  <View style={styles.statusRow}>
                    <AppBadge tone={student.status === 'Active' ? 'success' : 'warning'}>
                      {student.status?.toUpperCase() || 'ACTIVE'}
                    </AppBadge>
                    <View style={[styles.miniPill, { backgroundColor: theme.surfaceAlt }]}>
                      <Ionicons name="time-outline" size={12} color={theme.primary} />
                      <Text style={[styles.miniPillText, { color: theme.text }]}>{student.shift || '—'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>SEAT</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {student.seatNumber ? `#${student.seatNumber}` : '—'}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>JOINED</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {formatDate(student.joiningDate)}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>FEES</Text>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {formatCurrency(student.fees || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.profileActions}>
                <TouchableOpacity
                  onPress={openPayment}
                  style={[styles.primaryAction, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                >
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.primaryActionText}>Record Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setConfirmStudentDelete(true)}
                  style={[styles.secondaryAction, { backgroundColor: theme.danger + '10' }]}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </AppCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Details</Text>
            </View>
            <AppCard style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <DetailRow icon="call-outline" label="Phone Number" value={student.number} theme={theme} />
              <DetailRow icon="home-outline" label="Library Seat" value={student.seatNumber ? `Floor ${student.floor || '—'} / Seat ${student.seatNumber}` : 'Not Allocated'} theme={theme} />
              <DetailRow icon="calendar-outline" label="Enrollment Date" value={formatDate(student.joiningDate)} theme={theme} />
              <DetailRow icon="card-outline" label="Current Status" value={student.paymentStatus || 'Up-to-date'} theme={theme} last />
            </AppCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment History</Text>
                <View style={[styles.countBadge, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.countText, { color: theme.primary }]}>
                    {paymentsQuery.data?.pages?.[0]?.pagination?.total || 0}
                  </Text>
                </View>
              </View>
            </View>

            {paymentsQuery.data?.pages?.flatMap(p => p.payments).length ? (
              paymentsQuery.data.pages.flatMap(p => p.payments).map((payment, idx) => (
                <View
                  key={payment._id} 
                  style={[styles.historyItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={[styles.historyAmount, { color: theme.text }]}>{formatCurrency(payment.rupees)}</Text>
                      <Text style={[styles.historyDate, { color: theme.muted }]}>{formatDate(payment.paymentDate)}</Text>
                    </View>
                    <AppBadge tone="success" style={{ borderRadius: 6 }}>{payment.paymentMode?.toUpperCase() || 'CASH'}</AppBadge>
                  </View>
                  <View style={[styles.historyPeriod, { backgroundColor: theme.surfaceAlt }]}>
                    <Ionicons name="calendar-outline" size={14} color={theme.muted} />
                    <Text style={[styles.periodText, { color: theme.text }]}>
                      {formatDate(payment.startDate)} — {formatDate(payment.endDate)}
                    </Text>
                  </View>
                  <View style={styles.historyActions}>
                    <TouchableOpacity onPress={() => startEditPayment(payment)} style={styles.histBtn}>
                      <Ionicons name="create-outline" size={18} color={theme.primary} />
                      <Text style={[styles.histBtnText, { color: theme.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <View style={[styles.histDivider, { backgroundColor: theme.border }]} />
                    <TouchableOpacity onPress={() => setDeleteTarget(payment._id)} style={styles.histBtn}>
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      <Text style={[styles.histBtnText, { color: theme.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.emptyHistory, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Ionicons name="receipt-outline" size={48} color={theme.muted + '40'} />
                <Text style={{ color: theme.muted, fontWeight: '600', marginTop: 12 }}>No payment records found.</Text>
              </View>
            )}

            {paymentsQuery.isFetchingNextPage && (
              <View style={{ padding: 20 }}>
                <ActivityIndicator color={theme.primary} />
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>

      <PaymentFormModal
        visible={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        initialValues={paymentDefaults || basePaymentValues}
        resetValues={basePaymentValues}
        theme={theme}
        isSubmitting={isPaymentSaving}
        onSubmit={submitPayment}
        studentName={student.name}
        title={editingPaymentId ? "Edit Payment" : "Record Payment"}
      />

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="Delete payment?"
        description="Are you sure you want to remove this record? This cannot be undone."
        confirmText="Delete Record"
        destructive
        loading={deletePaymentMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deletePaymentMutation.mutateAsync(deleteTarget);
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        visible={confirmStudentDelete}
        title="Delete Student?"
        description={`Permanently remove ${student.name} and all their history from the library database?`}
        confirmText="Delete Student"
        destructive
        loading={deleteStudent.isPending}
        onCancel={() => setConfirmStudentDelete(false)}
        onConfirm={confirmDeleteStudent}
      />

      <ImageViewing
        images={student.profilePicture ? [{ uri: student.profilePicture }] : []}
        imageIndex={0}
        visible={previewVisible}
        onRequestClose={() => setPreviewVisible(false)}
        swipeToCloseEnabled
      />
    </SafeScreen>
  );
}

function DetailRow({ icon, label, value, theme, last }: any) {
  return (
    <View style={[styles.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.border + '50' }]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.primary + '10' }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, { color: theme.muted }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.text }]}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: 24,
  },
  profileCard: {
    borderRadius: 32,
    padding: spacing.xl,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopLeftRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  idBadge: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  idText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryAction: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  detailsCard: {
    borderRadius: 24,
    padding: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
  },
  historyItem: {
    borderRadius: 24,
    padding: spacing.lg,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyAmount: {
    fontSize: 20,
    fontWeight: '900',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  historyPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    paddingTop: 8,
  },
  histBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  histBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  histDivider: {
    width: 1,
    height: 20,
    opacity: 0.1,
  },
  emptyHistory: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
