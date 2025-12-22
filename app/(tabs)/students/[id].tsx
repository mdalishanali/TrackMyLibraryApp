import { useCallback, useMemo, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { PaymentFormModal, PaymentFormValues } from '@/components/students/payment-form-modal';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { InfoRow } from '@/components/ui/info-row';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { spacing, typography } from '@/constants/design';
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
  const paymentsQuery = useInfinitePaymentsQuery({ student: id, limit: 4 });
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
    return <FullScreenLoader message="Loading student..." />;
  }

  const student = studentQuery.data;
  if (!student) {
    return (
      <SafeScreen>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={{ color: theme.muted }}>Student not found.</Text>
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
    [student._id, student.fees, todayIso],
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
    <SafeScreen>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingBottom: spacing.lg + insets.bottom,
            paddingTop: spacing.md,
            paddingHorizontal: spacing.lg,
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              {
                borderColor: theme.border,
                backgroundColor: theme.surface,
                shadowColor: theme.shadow,
                shadowOpacity: 0.12,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <AppBadge tone="info">Student</AppBadge>
        </View>

        <AppCard style={[styles.headerCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={styles.heroRow}>
            <TouchableOpacity
              onPress={() => student.profilePicture && setPreviewVisible(true)}
              activeOpacity={student.profilePicture ? 0.8 : 1}
              style={[styles.avatar, { backgroundColor: theme.surface }]}
            >
              {student.profilePicture ? (
                <>
                  <Image source={{ uri: student.profilePicture }} style={styles.avatarImg} contentFit="cover" />
                  <View style={[styles.imageActionOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                    <Ionicons name="expand" size={16} color="#fff" />
                  </View>
                </>
              ) : (
                <Text style={[styles.avatarText, { color: theme.text }]}>{student.name?.[0]?.toUpperCase() || 'S'}</Text>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {student.name}
              </Text>
              <View style={styles.inlineMeta}>
                <Text style={[styles.meta, { color: theme.muted }]}>ID</Text>
                <Text style={[styles.metaStrong, { color: theme.text }]}>{student.id ?? '—'}</Text>
              </View>
              <View style={styles.badgeRow}>
                <AppBadge tone={student.status === 'Active' ? 'success' : 'warning'}>
                  {student.status ?? 'Active'}
                </AppBadge>
                <View style={[styles.pill, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <Text style={[styles.pillLabel, { color: theme.muted }]}>Shift</Text>
                  <Text style={[styles.pillValue, { color: theme.text }]}>{student.shift || '—'}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.idBlock, { borderColor: theme.border }]}>
              <Text style={[styles.pillLabel, { color: theme.muted }]}>Seat</Text>
              <Text style={[styles.metaStrong, { color: theme.text }]}>
                {student.seatNumber ? String(student.seatNumber) : 'Unallocated'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.pill, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={[styles.pillLabel, { color: theme.muted }]}>Joined</Text>
              <Text style={[styles.pillValue, { color: theme.text }]}>{formatDate(student.joiningDate)}</Text>
            </View>
            <View style={[styles.pill, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={[styles.pillLabel, { color: theme.muted }]}>Payment</Text>
              <Text style={[styles.pillValue, { color: theme.text }]}>{student.paymentStatus || '—'}</Text>
            </View>
          </View>

          <View style={styles.actionColumn}>
            <AppButton onPress={openPayment} fullWidth tone="neutral">
              Pay
            </AppButton>
            <AppButton
              variant="danger"
              onPress={() => setConfirmStudentDelete(true)}
              loading={deleteStudent.isPending}
              fullWidth
            >
              Delete
            </AppButton>
          </View>
        </AppCard>

        <AppCard style={{ gap: spacing.xs }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
          <InfoRow label="Phone" value={student.number} />
          <InfoRow label="Seat" value={student.seatNumber ? String(student.seatNumber) : 'Unallocated'} />
          <InfoRow label="Joined" value={formatDate(student.joiningDate)} />
          <InfoRow label="Shift" value={student.shift} />
          <InfoRow label="Payment Status" value={student.paymentStatus || '—'} />
        </AppCard>

        <AppCard style={{ gap: spacing.sm }}>
          <View style={styles.paymentsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Payments</Text>
            <AppBadge style={{ backgroundColor: theme.surfaceAlt }}>
              {paymentsQuery.data?.pages?.[0]?.pagination?.total
                ? `${paymentsQuery.data.pages[0].pagination?.total} record(s)`
                : paymentsQuery.data?.pages?.[0]?.payments?.length
                  ? `${paymentsQuery.data.pages[0].payments.length} record(s)`
                  : 'No records'}
            </AppBadge>
          </View>
          {paymentsQuery.data?.pages?.length ? (
            paymentsQuery.data.pages.flatMap((page) => page.payments).map((payment) => (
              <View
                key={payment._id}
                style={[styles.paymentRow, { borderColor: theme.border, backgroundColor: theme.surface }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.paymentAmount, { color: theme.text }]}>{formatCurrency(payment.rupees)}</Text>
                  <AppBadge tone="success">Paid</AppBadge>
                </View>
                <Text style={[styles.meta, { color: theme.muted }]}>
                  {formatDate(payment.startDate)} - {formatDate(payment.endDate)}
                </Text>
                <Text style={[styles.meta, { color: theme.muted }]}>On {formatDate(payment.paymentDate)}</Text>
                <Text style={[styles.meta, { color: theme.muted }]}>Mode: {payment.paymentMode?.toUpperCase() ?? '—'}</Text>
                <View style={styles.paymentActions}>
                  <View style={styles.paymentActionItem}>
                    <AppButton variant="outline" tone="info" onPress={() => startEditPayment(payment)} fullWidth>
                      Edit
                    </AppButton>
                  </View>
                  <View style={styles.paymentActionItem}>
                    <AppButton
                      variant="outline"
                      tone="danger"
                      onPress={() => setDeleteTarget(payment._id)}
                      loading={deletePaymentMutation.isPending && deleteTarget === payment._id}
                      fullWidth
                    >
                      Delete
                    </AppButton>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.muted }}>No payments yet.</Text>
          )}
          {paymentsQuery.isFetchingNextPage ? (
            <Text style={{ color: theme.muted, textAlign: 'center' }}>Loading more payments…</Text>
          ) : null}
        </AppCard>
      </ScrollView>

      {paymentDefaults ? (
        <PaymentFormModal
          visible={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          initialValues={paymentDefaults}
          resetValues={basePaymentValues}
          theme={theme}
          isSubmitting={isPaymentSaving}
          onSubmit={submitPayment}
          studentName={student.name}
          title="Record Payment"
        />
      ) : null}
      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="Delete payment?"
        description="Are you sure you want to delete this payment?"
        confirmText="Delete"
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
        title="Delete student?"
        description="This will remove the student and related records."
        confirmText="Delete"
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    gap: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  imageActionOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  meta: {
    fontSize: typography.size.sm,
  },
  metaStrong: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  actionColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  paymentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentRow: {
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
    gap: spacing.xs / 2,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  paymentActionItem: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  linkRow: {
    alignItems: 'flex-start',
  },
  link: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pillLabel: {
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pillValue: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  idBlock: {
    borderWidth: 1,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'flex-start',
    gap: spacing.xs / 2,
  },
});
