import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity, Platform, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Pressable } from 'react-native';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { PaymentFormModal, PaymentFormValues } from '@/components/students/payment-form-modal';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { spacing } from '@/constants/design';
import { useDeleteStudent, useUpdateStudent } from '@/hooks/use-students';
import { useStudentQuery } from '@/hooks/use-student';
import { useCreatePayment, useDeletePayment as useDeletePaymentMutation, useInfinitePaymentsQuery, useUpdatePayment } from '@/hooks/use-payments';
import { useSeatsQuery } from '@/hooks/use-seats';
import { useTheme } from '@/hooks/use-theme';
import { useSendTemplate, useWhatsappTemplates, useSendPaymentReceipt } from '@/hooks/use-whatsapp';
import { TemplateSelectorModal } from '@/components/whatsapp/TemplateSelectorModal';
import { useAuth } from '@/hooks/use-auth';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { formatCurrency, formatDate } from '@/utils/format';
import { showToast } from '@/lib/toast';
import { Image } from 'expo-image';
import { openWhatsappWithMessage } from '@/utils/whatsapp';
import ImageViewing from 'react-native-image-viewing';
const BLURHASH = 'L9E:C[^+^j0000.8?v~q00?v%MoL';

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
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);

  const feeReminderMutation = useSendTemplate();
  const { data: templates } = useWhatsappTemplates();
  const { user } = useAuth();
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const sendReceiptMutation = useSendPaymentReceipt();
  const [sharingPaymentId, setSharingPaymentId] = useState<string | null>(null);


  const handleSharePdf = async (paymentId: string) => {
    try {
      setSharingPaymentId(paymentId);

      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      const url = `${baseUrl}/public/invoice/${paymentId}`;

      const fileUri = `${FileSystem.cacheDirectory}invoice_${paymentId}.pdf`;
      const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
        });
      }
    } catch (e) {
      console.error(e);
      showToast('Could not share PDF', 'error');
    } finally {
      setSharingPaymentId(null);
    }
  };


  const studentQuery = useStudentQuery(id);
  const paymentsQuery = useInfinitePaymentsQuery({ student: id, limit: 10 });
  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent(id);
  const seatsQuery = useSeatsQuery();


  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const basePaymentValues = useMemo<PaymentFormValues>(
    () => ({
      student: id,
      rupees: 0,
      startDate: todayIso,
      endDate: todayIso,
      paymentDate: todayIso,
      paymentMode: 'cash',
      notes: '',
    }),
    [id, todayIso],
  );

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


  const openPayment = () => {
    const allPayments = paymentsQuery.data?.pages?.flatMap(p => p.payments) || [];
    const lastPayment = allPayments[0];

    let startDate = todayIso;
    let endDate = todayIso;

    if (lastPayment && lastPayment.endDate) {
      startDate = lastPayment.endDate.slice(0, 10);

      const d = new Date(startDate);
      d.setMonth(d.getMonth() + 1);
      endDate = d.toISOString().slice(0, 10);
    }

    setPaymentDefaults({
      ...basePaymentValues,
      rupees: student.fees ?? 0,
      startDate,
      endDate
    });
    setEditingPaymentId(null);
    setIsPaymentOpen(true);
  };

  const handleUpdateStudent = async (values: any) => {
    try {
      await updateStudent.mutateAsync({
        payload: {
          ...values,
          fees: values.fees ? Number(values.fees) : undefined,
          time: [{ start: values.startTime, end: values.endTime }]
        }
      });
      setIsEditStudentOpen(false);
      studentQuery.refetch();
    } catch (error) {
      // handled by mutation success/error toast usually
    }
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

  const handleSendReminder = async () => {
    setIsTemplateSelectorOpen(true);
  };

  const handleSelectTemplate = async (tpl: any) => {
    setIsTemplateSelectorOpen(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await feeReminderMutation.mutateAsync({
        studentId: student._id,
        templateType: tpl.type
      });

      if (res.phone && res.message) {
        openWhatsappWithMessage(res.phone, res.message);
      }
    } catch (error) {
      showToast('Failed to prepare reminder', 'error');
    }
  };

  const handleSendReceipt = async (paymentId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await sendReceiptMutation.mutateAsync(paymentId);
      showToast('Prepared!', 'success');

      if (res.phone && res.message) {
        openWhatsappWithMessage(res.phone, res.message);
      }
    } catch (e) {
      showToast('Failed to prepare receipt', 'error');
    }
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
    <View style={{ flex: 1, backgroundColor: theme.background }}>
        <LinearGradient
          colors={[theme.primary + '15', 'transparent']}
          style={styles.bgGradient}
        />

        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Member Profile</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/(tabs)/students', params: { search: student.name } });
            }}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="search" size={20} color={theme.text} />
          </Pressable>
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
          <Animated.View entering={FadeInDown.duration(800)}>
            <LinearGradient
              colors={[theme.surface, theme.surface]}
              style={[styles.heroCard, { borderColor: theme.border }]}
            >
              <View style={styles.heroMain}>
                <Pressable
                  onPress={() => student.profilePicture && setPreviewVisible(true)}
                  style={({ pressed }) => [
                    styles.avatarWrapper,
                    { shadowColor: theme.primary },
                    pressed && { transform: [{ scale: 0.95 }] }
                  ]}
                >
                <View style={[styles.heroAvatar, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '20' }]}>
                  <Image
                    source={{ uri: student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=0D8ABC&color=fff&size=200` }}
                    style={styles.fullImg}
                    contentFit="cover"
                    transition={1000}
                    placeholder={BLURHASH}
                  />
                  </View>
                  <View style={[styles.avatarBadge, { backgroundColor: theme.primary }]}>
                    <Ionicons name="camera" size={10} color="#fff" />
                  </View>
                </Pressable>

                <View style={styles.heroMeta}>
                  <Text style={[styles.heroName, { color: theme.text }]}>{student.name}</Text>
                  <View style={styles.heroRow}>
                  <View style={[styles.statusTag, { backgroundColor: (student.status === 'Active' ? theme.success : theme.danger) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: student.status === 'Active' ? theme.success : theme.danger }]} />
                    <Text style={[styles.statusText, { color: student.status === 'Active' ? theme.success : theme.danger }]}>
                      {student.status === 'Active' ? 'ACTIVE' : 'DELETED'}
                      </Text>
                    </View>
                    <Text style={[styles.heroId, { color: theme.muted }]}>ID: {student.id || '—'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroStats}>
                <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.statValue, { color: theme.text }]}>{(student.seatNumber !== undefined && student.seatNumber !== null) ? `#${student.seatNumber}` : '—'}</Text>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>SEAT</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{student.shift || '—'}</Text>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>SHIFT</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>{formatCurrency(student.fees || 0)}</Text>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>MONTHLY</Text>
                </View>
              </View>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditStudentOpen(true);
                }}
                style={({ pressed }) => [
                  styles.editBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Ionicons name="create-outline" size={20} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openPayment();
                  }}
                  style={({ pressed }) => [
                    styles.payBtn,
                    { backgroundColor: theme.primary },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                <Text style={styles.payBtnText}>Payment</Text>
                </Pressable>
                <Pressable
                onPress={handleSendReminder}
                disabled={feeReminderMutation.isPending}
                style={({ pressed }) => [
                  styles.remindBtn,
                  { backgroundColor: theme.primary + '10' },
                  pressed && { opacity: 0.7 }
                ]}
              >
                <Ionicons
                  name={feeReminderMutation.isPending ? "sync" : "logo-whatsapp"}
                  size={20}
                  color={theme.primary}
                />
              </Pressable>
              <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setConfirmStudentDelete(true);
                  }}
                  style={({ pressed }) => [
                    styles.delBtn,
                    { backgroundColor: theme.danger + '10' },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.danger} />
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 4 }]}>Bio & Space</Text>
            <View style={[styles.detailsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <DetailRow icon="call" label="Phone" value={student.number} theme={theme} />
            {student.fatherName && <DetailRow icon="person" label="Father Name" value={student.fatherName} theme={theme} />}
            {student.address && <DetailRow icon="home" label="Address" value={student.address} theme={theme} />}
            {student.aadhaarNumber && <DetailRow icon="card" label="Aadhaar Number" value={student.aadhaarNumber} theme={theme} />}
            <DetailRow icon="business" label="Workspace" value={(student.seatNumber !== undefined && student.seatNumber !== null) ? `Level ${student.floor ?? '1'} / Pos ${student.seatNumber}` : 'Unallocated'} theme={theme} />
              <DetailRow icon="time" label="Schedule" value={student.shift || 'Morning Shift'} theme={theme} />
              <DetailRow icon="calendar" label="Enrolled On" value={formatDate(student.joiningDate)} theme={theme} last />
            </View>
          </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ gap: 16 }}>
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
                  style={[styles.paymentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.paymentCardHeader}>
                    <View style={styles.payMain}>
                      <Text style={[styles.payAmount, { color: theme.text }]}>{formatCurrency(payment.rupees)}</Text>
                      <View style={[styles.payModePill, { backgroundColor: theme.primary + '10' }]}>
                        <Ionicons name={payment.paymentMode === 'cash' ? 'cash' : 'phone-portrait'} size={10} color={theme.primary} />
                        <Text style={[styles.payModeText, { color: theme.primary }]}>{payment.paymentMode?.toUpperCase() || 'CASH'}</Text>
                      </View>
                    </View>
                    <View style={styles.payActions}>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          startEditPayment(payment);
                        }}
                        style={({ pressed }) => [styles.payIconBtn, pressed && { opacity: 0.6 }]}
                      >
                        <Ionicons name="create-outline" size={18} color={theme.primary} />
                      </Pressable>
                      <Pressable
                        onPress={() => setDeleteTarget(payment._id)}
                        style={({ pressed }) => [styles.payIconBtn, pressed && { opacity: 0.6 }]}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleSendReceipt(payment._id)}
                        disabled={sendReceiptMutation.isPending}
                        style={({ pressed }) => [styles.payIconBtn, pressed && { opacity: 0.6 }]}
                      >
                        <Ionicons
                          name="logo-whatsapp"
                          size={18}
                          color="#25D366"
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleSharePdf(payment._id)}
                        disabled={sharingPaymentId === payment._id}
                        style={({ pressed }) => [styles.payIconBtn, pressed && { opacity: 0.6 }]}
                      >
                        {sharingPaymentId === payment._id ? (
                          <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                          <Ionicons
                            name="share-outline"
                            size={18}
                            color={theme.primary}
                          />
                        )}
                      </Pressable>
                    </View>
                  </View>
                  <View style={[styles.payBody, { backgroundColor: theme.surfaceAlt }]}>
                    <View style={styles.payRow}>
                      <Ionicons name="calendar-outline" size={14} color={theme.muted} />
                      <Text style={[styles.payDateText, { color: theme.text }]}>
                        {formatDate(payment.startDate)} — {formatDate(payment.endDate)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={theme.primary} />
                      <Text style={[styles.payStatusText, { color: theme.text }]}>Paid on {formatDate(payment.paymentDate)}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="receipt-outline" size={48} color={theme.muted + '20'} />
                  <Text style={[styles.emptyText, { color: theme.muted }]}>No transaction history</Text>
              </View>
            )}
        </Animated.View>

            {paymentsQuery.isFetchingNextPage && (
              <View style={{ padding: 20 }}>
                <ActivityIndicator color={theme.primary} />
              </View>
        )}
      </ScrollView>


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



      <TemplateSelectorModal
        visible={isTemplateSelectorOpen}
        templates={Array.isArray(templates) ? templates : []}
        onSelect={handleSelectTemplate}
        onClose={() => setIsTemplateSelectorOpen(false)}
        theme={theme}
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

      {student && (
        <StudentFormModal
          visible={isEditStudentOpen}
          onClose={() => setIsEditStudentOpen(false)}
          onSubmit={handleUpdateStudent}
          initialValues={{
            name: student.name || '',
            number: student.number || '',
            joiningDate: student.joiningDate?.slice(0, 10) || todayIso,
            seat: student.seat || '',
            shift: student.shift || '',
            startTime: student.time?.[0]?.start || '09:00',
            endTime: student.time?.[0]?.end || '18:00',
            status: student.status || 'Active',
            fees: String(student.fees || ''),
            gender: student.gender || 'Male',
            notes: student.notes || '',
            fatherName: student.fatherName || '',
            address: student.address || '',
            aadharNumber: student.aadhaarNumber || '',
            profilePicture: student.profilePicture || ''
          }}
          seats={(seatsQuery.data ?? []).flatMap((f: any) =>
            (f.seats || []).map((s: any) => ({
              _id: s._id,
              seatNumber: String(s.seatNumber),
              floor: f.floor
            }))
          )}
          theme={theme}
          isSubmitting={updateStudent.isPending}
          title="Edit Member"
        />
      )}

      <ImageViewing
        images={student.profilePicture ? [{ uri: student.profilePicture }] : []}
        imageIndex={0}
        visible={previewVisible}
        onRequestClose={() => setPreviewVisible(false)}
        swipeToCloseEnabled
      />
    </View >
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
  container: { flex: 1 },
  sectionHeader: { marginBottom: 16 },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: 32,
  },
  heroCard: {
    borderRadius: 36,
    borderWidth: 1.5,
    padding: spacing.xl,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '900',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroMeta: {
    flex: 1,
    gap: 6,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroId: {
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.6,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  payBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  editBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delBtn: {
    width: 48,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remindBtn: {
    width: 48,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  detailsContainer: {
    borderRadius: 32,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: 16,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    opacity: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '900',
  },
  paymentCard: {
    borderRadius: 32,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  payModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  payModeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  payActions: {
    flexDirection: 'row',
    gap: 4,
  },
  payIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBody: {
    padding: 16,
    borderRadius: 20,
    gap: 8,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payDateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  payStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    padding: 60,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
