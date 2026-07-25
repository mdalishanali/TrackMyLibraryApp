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
import { useSendTemplate, useWhatsappTemplates, useSendPaymentReceipt, useAutomationSettings } from '@/hooks/use-whatsapp';
import { useSaveContacts } from '@/hooks/use-save-contacts';
import { useShiftsQuery } from '@/hooks/use-shifts';
import { TemplateSelectorModal } from '@/components/whatsapp/TemplateSelectorModal';
import { useAuth } from '@/hooks/use-auth';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { ChangeSeatModal } from '@/components/students/change-seat-modal';
import { ActionRow, ShiftBadges, StatusBadges, StudentHeader, StudentMeta, TimeSlots, ValidityInfo } from '@/components/students/StudentSummary';
import { StatusTimeline } from '@/components/students/StatusTimeline';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import { transformFormToPayload, mapStudentToForm } from '@/utils/student-transform';
import { showToast } from '@/lib/toast';
import { Image } from 'expo-image';
import { openWhatsappWithMessage } from '@/utils/whatsapp';
import ImageViewing from 'react-native-image-viewing';
const BLURHASH = 'L9E:C[^+^j0000.8?v~q00?v%MoL';

export default function StudentDetailScreen() {
  const { id, backTo } = useLocalSearchParams<{ id: string; backTo?: string }>();
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
  const [confirmReactivate, setConfirmReactivate] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isChangeSeatOpen, setIsChangeSeatOpen] = useState(false);

  const feeReminderMutation = useSendTemplate();
  const { data: templates } = useWhatsappTemplates();
  const { data: automationSettings } = useAutomationSettings();
  const { user } = useAuth();
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'sms' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const sendReceiptMutation = useSendPaymentReceipt();
  const { saveOne, isSaving: isSavingContact } = useSaveContacts();
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
  const { data: shiftsData } = useShiftsQuery();


  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const basePaymentValues = useMemo<PaymentFormValues>(
    () => ({
      student: id,
      rupees: 0,
      startDate: todayIso,
      endDate: todayIso,
      paymentDate: todayIso,
      paymentMode: 'upi',
      notes: '',
      dueAmount: 0,
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
    try {
      await deleteStudent.mutateAsync(student._id);
      setConfirmStudentDelete(false);
      showToast('Student deleted permanently', 'success');
      router.back();
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to delete student';
      showToast(errorMessage, 'error');
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      await updateStudent.mutateAsync({
        id,
        payload: { status: 'Active' }
      });
      setConfirmReactivate(false);
      showToast('Student reactivated successfully 🎉', 'success');
      studentQuery.refetch();
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to reactivate student';
      showToast(errorMessage, 'error');
    } finally {
      setIsReactivating(false);
    }
  };


  const openPayment = () => {
    const allPayments = paymentsQuery.data?.pages?.flatMap(p => p.payments) || [];
    const lastPayment = allPayments[0];

    // If no payment exists, use joining date
    // If payment exists, use the endDate of the last payment
    let startStr = student.joiningDate?.slice(0, 10) || todayIso;
    if (lastPayment && lastPayment.endDate) {
      startStr = lastPayment.endDate.slice(0, 10);
    }

    const d = new Date(startStr);
    const startDate = d.toISOString().slice(0, 10);

    // Add 1 month for end date
    d.setMonth(d.getMonth() + 1);
    const endDate = d.toISOString().slice(0, 10);

    setPaymentDefaults({
      ...basePaymentValues,
      rupees: student.fees ?? 0,
      startDate,
      endDate,
      paymentDate: todayIso,
      dueAmount: 0,
    });
    setEditingPaymentId(null);
    setIsPaymentOpen(true);
  };


  const handleUpdateStudent = async (values: any) => {
    try {
      const payload = transformFormToPayload(values, shiftsData || []);

      await updateStudent.mutateAsync({ id, payload });

      setIsEditStudentOpen(false);
      showToast('Student updated', 'success');
    } catch (error: any) {
      console.error('handleUpdateStudent (Detail) FAILED:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update student';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const handleSeatUpdate = async (newSeatId: string) => {
    try {
      await updateStudent.mutateAsync({
        id: id,
        payload: { seat: newSeatId }
      });
      setIsChangeSeatOpen(false);
      studentQuery.refetch();
    } catch (error) {
      console.error('Seat update failed:', error);
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
      dueAmount: payment.dueAmount ?? 0,
    });
    setEditingPaymentId(payment._id);
    setIsPaymentOpen(true);
  };

  const handleSendReminder = async () => {
    setReminderChannel('whatsapp');
    setIsTemplateSelectorOpen(true);
  };

  const handleSendSmsReminder = async () => {
    setReminderChannel('sms');
    setIsTemplateSelectorOpen(true);
  };

  const handleSelectTemplate = async (tpl: any, method: 'api' | 'handset') => {
    setIsTemplateSelectorOpen(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await feeReminderMutation.mutateAsync({
        studentId: student._id,
        templateType: tpl.type,
        method
      });

      if (method === 'api' && res.success) {
        showToast('Message sent automatically!', 'success');
        return;
      }

      if (res.phone && res.message) {
        if (reminderChannel === 'sms') {
          Linking.openURL(`sms:${res.phone}?body=${encodeURIComponent(res.message)}`);
        } else {
          openWhatsappWithMessage(res.phone, res.message);
        }
      }
      setReminderChannel(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to prepare reminder';
      showToast(msg, 'error');
    }
  };

  const handleSendReceipt = async (paymentId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Handset mode for single receipt (default)
      const res = await sendReceiptMutation.mutateAsync({ paymentId, method: 'handset' });
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
            if (backTo === 'seats') {
              router.navigate('/(tabs)/seats');
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/students');
            }
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
                <Text style={[styles.heroName, { color: theme.text }]} numberOfLines={1}>{student.name}</Text>
                <View style={styles.heroRow}>
                  <View style={[styles.statusTag, { backgroundColor: (student.status === 'Active' ? theme.success : theme.danger) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: student.status === 'Active' ? theme.success : theme.danger }]} />
                    <Text style={[styles.statusText, { color: student.status === 'Active' ? theme.success : theme.danger }]}>
                      {student.status === 'Active' ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                  {student.gender && (
                    <View style={[styles.statusTag, { backgroundColor: (student.gender === 'male' ? '#3b82f6' : '#ec4899') + '15' }]}>
                      <Ionicons
                        name={student.gender === 'male' ? 'male' : 'female'}
                        size={10}
                        color={student.gender === 'male' ? '#3b82f6' : '#ec4899'}
                      />
                      <Text style={[styles.statusText, { color: student.gender === 'male' ? '#3b82f6' : '#ec4899', textTransform: 'uppercase' }]}>
                        {student.gender}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.statusTag, { backgroundColor: theme.primary + '10' }]}>
                    <Text style={[styles.statusText, { color: theme.primary, letterSpacing: 0.5 }]}>ID: {student.id || '—'}</Text>
                  </View>
                </View>

                {/* Status Badges (Trial/Dues) */}
                <View style={{ marginTop: 8 }}>
                  <StatusBadges student={student as any} theme={theme} />
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.heroStatsContainer}
            >
              <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {(student.seatNumber !== undefined && student.seatNumber !== null) ? `#${student.seatNumber}` : '—'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.muted }]}>SEAT</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
                  {Array.isArray(student.shift) ? student.shift.join(', ') : (student.shift || '—')}
                </Text>
                <Text style={[styles.statLabel, { color: theme.muted }]}>SHIFT</Text>
              </View>

              {student.lastPayment?.endDate && (
                <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={(() => {
                        const days = Math.ceil((new Date(student.lastPayment!.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return days < 3 ? 'alert-circle' : 'time';
                      })()}
                      size={14}
                      color={(() => {
                        const days = Math.ceil((new Date(student.lastPayment!.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return days < 0 ? theme.danger : days < 5 ? theme.warning : theme.success;
                      })()}
                    />
                    <Text style={[styles.statValue, {
                      color: (() => {
                        const days = Math.ceil((new Date(student.lastPayment!.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return days < 0 ? theme.danger : days < 5 ? theme.warning : theme.success;
                      })()
                    }]}>
                      {(() => {
                        const days = Math.ceil((new Date(student.lastPayment!.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return days < 0 ? 'EXPIRED' : `${days} DAYS`;
                      })()}
                    </Text>
                  </View>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>REMIND IN</Text>
                </View>
              )}

              <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {(() => {
                    const joined = new Date(student.joiningDate || '');
                    const diff = Math.floor((new Date().getTime() - joined.getTime()) / (1000 * 60 * 60 * 24));
                    return diff < 0 ? '0' : String(diff);
                  })()}
                </Text>
                <Text style={[styles.statLabel, { color: theme.muted }]}>DAYS ACTIVE</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: theme.primary }]}>
                <Text style={[styles.statValue, { color: '#fff' }]} numberOfLines={1}>
                  {formatCurrency(student.fees || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: '#fff' }]}>MONTHLY FEE</Text>
              </View>
            </ScrollView>

            <View style={styles.heroActions}>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openPayment();
                  }}
                  style={({ pressed }) => [
                    styles.payBtn,
                    { backgroundColor: theme.primary, width: '100%' },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.payBtnText}>Collect Payment</Text>
                </Pressable>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleSendReminder();
                  }}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    { backgroundColor: '#25D366' + '15', flex: 1, height: 50 },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text style={[styles.payBtnText, { color: '#25D366', fontSize: 13 }]}>WhatsApp</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleSendSmsReminder();
                  }}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    { backgroundColor: theme.info + '15', flex: 1, height: 50 },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={theme.info} />
                  <Text style={[styles.payBtnText, { color: theme.info, fontSize: 13 }]}>SMS</Text>
                </Pressable>
              </View>

              <View style={[styles.actionRow, { gap: spacing.md }]}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/student-id/${id}`);
                  }}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    { backgroundColor: theme.primary + '10', flex: 1, flexDirection: 'row', gap: 8, height: 48, borderRadius: 12 },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Ionicons name="id-card-outline" size={20} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>ID Card</Text>
                </Pressable>

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Pressable
                    onPress={() => setIsEditStudentOpen(true)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, width: 48, height: 48, borderRadius: 12 },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.text} />
                  </Pressable>

                  <Pressable
                    onPress={() => setIsChangeSeatOpen(true)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, width: 48, height: 48, borderRadius: 12 },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <Ionicons name="swap-horizontal-outline" size={20} color={theme.text} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setConfirmStudentDelete(true);
                    }}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: theme.danger + '10', width: 48, height: 48, borderRadius: 12 },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <Ionicons name="trash-outline" size={22} color={theme.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ gap: 24 }}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 4 }]}>Library Membership</Text>
            <View style={[styles.detailsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <DetailRow
                icon="business"
                label="Workspace"
                value={(student.seatNumber !== undefined && student.seatNumber !== null) ? `${student.floor ?? 'Section 1'} • Pos ${student.seatNumber}` : 'Unallocated'}
                theme={theme}
              />

              <View style={[styles.detailRow, { paddingBottom: 0 }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.primary + '10' }]}>
                  <Ionicons name="time" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: theme.muted }]}>Schedule</Text>
                  <View style={{ gap: 10, marginTop: 6 }}>
                    {(() => {
                      let shifts: string[] = [];
                      if (Array.isArray(student.shift)) {
                        shifts = student.shift;
                      } else if (typeof student.shift === 'string') {
                        shifts = student.shift.split(',').map(s => s.trim()).filter(Boolean);
                      }

                      const times = student.time || [];

                      if (shifts.length === 0 && times.length === 0) {
                        return <Text style={[styles.detailValue, { color: theme.text }]}>—</Text>;
                      }

                      // Map them together - if we have shifts but no times, show shifts. 
                      // If we have more times than shifts, show times.
                      const maxLength = Math.max(shifts.length, times.length);
                      const rows = [];
                      for (let i = 0; i < maxLength; i++) {
                        rows.push(
                          <View key={i} style={styles.scheduleMiniRow}>
                            {shifts[i] && (
                              <View style={[styles.schedulePill, { backgroundColor: theme.primary + '10' }]}>
                                <Text style={[styles.schedulePillText, { color: theme.primary }]}>{shifts[i]}</Text>
                              </View>
                            )}
                            <Text style={[styles.detailValue, { color: theme.text, marginTop: 0, flex: 1 }]}>
                              {times[i] ? `${formatTime(times[i].start)} - ${formatTime(times[i].end)}` : (shifts[i] ? 'Time N/A' : '')}
                            </Text>
                          </View>
                        );
                      }
                      return rows;
                    })()}
                  </View>
                </View>
              </View>

              <DetailRow
                icon="wallet"
                label="Monthly Fee"
                value={`${formatCurrency(student.fees || 0)}`}
                theme={theme}
              />
              <DetailRow
                icon="shield-checkmark"
                label="Membership Validity"
                value={student.lastPayment?.endDate ? `${formatDate(student.lastPayment.startDate)} — ${formatDate(student.lastPayment.endDate)}` : 'No active payment'}
                theme={theme}
                last
              />
            </View>

              {/* Reactivate Button — only for Inactive students */}
              {student.status === 'Inactive' && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setConfirmReactivate(true);
                  }}
                  style={({ pressed }) => [{
                    backgroundColor: theme.success,
                    borderRadius: 24,
                    height: 56,
                    flexDirection: 'row' as const,
                    alignItems: 'center' as const,
                    justifyContent: 'center' as const,
                    gap: 10,
                    marginTop: 16,
                    shadowColor: theme.success,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 4,
                  }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
                >
                  {isReactivating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="arrow-up-circle" size={20} color="#fff" />
                  )}
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 }}>MAKE ACTIVE</Text>
                </Pressable>
              )}
          </View>

          <View>
            <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 4 }]}>Personal Information</Text>
            <View style={[styles.detailsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <DetailRow
                icon="call"
                label="Phone"
                value={student.number}
                theme={theme}
                onSaveContact={() => saveOne(student)}
                isSavingContact={isSavingContact}
              />
              {student.fatherName && <DetailRow icon="people" label="Father Name" value={student.fatherName} theme={theme} />}
              {student.address && <DetailRow icon="home" label="Address" value={student.address} theme={theme} />}
              {student.aadhaarNumber && <DetailRow icon="card" label="Aadhaar Number" value={student.aadhaarNumber} theme={theme} />}
              {student.preparationFor && <DetailRow icon="school" label="Preparation For" value={student.preparationFor} theme={theme} />}
              <DetailRow icon="calendar-outline" label="Enrolled On" value={formatDate(student.joiningDate)} theme={theme} last={!student.notes} />
              {student.notes && (
                <View style={[styles.detailRow, { borderTopWidth: 1.5, borderTopColor: theme.border + '30' }]}>
                  <View style={[styles.detailIcon, { backgroundColor: theme.warning + '10' }]}>
                    <Ionicons name="document-text" size={20} color={theme.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.muted }]}>Member Remarks</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: 13, lineHeight: 18, marginTop: 4 }]}>{student.notes}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

          {student.statusHistory && student.statusHistory.length > 0 && (
            <StatusTimeline history={student.statusHistory} theme={theme} />
          )}

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
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.payAmount, { color: theme.text }]}>{formatCurrency(payment.rupees)}</Text>
                        <View style={[styles.payModePill, { backgroundColor: theme.primary + '10' }]}>
                          <Ionicons name={payment.paymentMode === 'cash' ? 'cash' : 'phone-portrait'} size={10} color={theme.primary} />
                          <Text style={[styles.payModeText, { color: theme.primary }]}>{payment.paymentMode?.toUpperCase() || 'CASH'}</Text>
                        </View>
                      </View>
                      
                      {payment.dueAmount > 0 && (
                        <View style={[styles.payModePill, { backgroundColor: theme.danger + '10', alignSelf: 'flex-start', paddingVertical: 2 }]}>
                          <Text style={[styles.payModeText, { color: theme.danger, fontWeight: '900', fontSize: 9 }]}>
                            REMAINS: {formatCurrency(payment.dueAmount)}
                          </Text>
                        </View>
                      )}
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
                  {payment.notes && (
                    <View style={[styles.payNotes, { borderTopWidth: 1, borderTopColor: theme.border + '20' }]}>
                      <Ionicons name="chatbox-ellipses-outline" size={12} color={theme.muted} />
                      <Text style={[styles.payNotesText, { color: theme.muted }]}>{payment.notes}</Text>
                    </View>
                  )}
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
        monthlyFee={student.fees}
        previousDueAmount={student.dueAmount}
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
        onClose={() => {
          setIsTemplateSelectorOpen(false);
          setReminderChannel(null);
        }}
        theme={theme}
        hasCredits={(automationSettings?.whatsappCredits || 0) > 0}
      />

      <ConfirmDialog
        visible={confirmStudentDelete}
        title={student.status === 'Inactive' ? 'Delete Permanently?' : 'Mark as Inactive?'}
        description={student.status === 'Inactive'
          ? `Are you sure you want to permanently delete ${student.name}? This action cannot be undone.`
          : `Are you sure you want to deactivate ${student.name}? Their seat will be freed up, but their record and payment history will be kept.`
        }
        confirmText={student.status === 'Inactive' ? 'DELETE' : 'MARK INACTIVE'}
        destructive
        loading={deleteStudent.isPending}
        onCancel={() => setConfirmStudentDelete(false)}
        onConfirm={async () => {
          await deleteStudent.mutateAsync(id);
          setConfirmStudentDelete(false);
          router.back();
        }}
      />

      <ConfirmDialog
        visible={confirmReactivate}
        title="Reactivate Student?"
        description={`This will mark ${student.name} as Active again. Their joining date will be reset to today and previous payment records will be cleared. Proceed?`}
        confirmText="REACTIVATE"
        loading={isReactivating}
        onCancel={() => setConfirmReactivate(false)}
        onConfirm={handleReactivate}
      />

      {student && (
        <StudentFormModal
          visible={isEditStudentOpen}
          onClose={() => setIsEditStudentOpen(false)}
          onSubmit={handleUpdateStudent}
          initialValues={mapStudentToForm(student)}
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

      <ChangeSeatModal
        visible={isChangeSeatOpen}
        onClose={() => setIsChangeSeatOpen(false)}
        onConfirm={handleSeatUpdate}
        currentSeatId={student.seat}
        seats={(seatsQuery.data ?? []).flatMap((f: any) =>
          (f.seats || []).map((s: any) => ({
            _id: s._id,
            seatNumber: String(s.seatNumber),
            floor: f.floor
          }))
        )}
        theme={theme}
        isSubmitting={updateStudent.isPending}
        studentName={student.name || ''}
      />
    </View >
  );
}

function DetailRow({ icon, label, value, theme, last, onSaveContact, isSavingContact }: any) {
  const isPhone = label === 'Phone';
  const isWorkspace = label === 'Workspace';

  const handleCopy = async (text: string) => {
    // We would use Clipboard here if needed, but for now just Haptics
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Copied to clipboard');
  };

  // Phone actions live on their OWN row: four inline buttons squeezed the number
  // into three wrapped lines ("7388 43714 3"), and a phone number must stay readable.
  const phoneActions = [
    { key: 'copy', icon: 'copy-outline', label: 'Copy', tint: theme.muted, onPress: () => handleCopy(value) },
    { key: 'whatsapp', icon: 'logo-whatsapp', label: 'Chat', tint: '#25D366', onPress: () => Linking.openURL(`https://wa.me/91${value}`) },
    { key: 'call', icon: 'call', label: 'Call', tint: theme.primary, onPress: () => Linking.openURL(`tel:${value}`) },
    ...(onSaveContact
      ? [{
        key: 'save',
        icon: isSavingContact ? 'hourglass-outline' : 'person-add',
        label: isSavingContact ? 'Saving…' : 'Save',
        tint: theme.info,
        onPress: onSaveContact,
      }]
      : []),
  ];

  const content = (
    <View style={[
      styles.detailRow,
      isPhone && value && styles.detailRowStacked,
      !last && { borderBottomWidth: 1.5, borderBottomColor: theme.border + '30' }
    ]}>
      <View style={styles.detailRowMain}>
        <View style={[styles.detailIcon, { backgroundColor: theme.primary + '08' }]}>
          <Ionicons name={icon} size={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.detailLabel, { color: theme.muted }]}>{label}</Text>
          <Text style={[styles.detailValue, { color: isPhone ? theme.primary : theme.text }]}>{value || '—'}</Text>
        </View>
        {isWorkspace && value !== 'Unallocated' && (
          <View style={[styles.smallActionBtn, { backgroundColor: theme.primary + '10' }]}>
            <Ionicons name="map-outline" size={18} color={theme.primary} />
          </View>
        )}
      </View>

      {isPhone && value && (
        <View style={styles.phoneActions}>
          {phoneActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              onPress={action.onPress}
              disabled={isSavingContact}
              style={[
                styles.phoneActionBtn,
                { backgroundColor: action.tint + '12', borderColor: action.tint + '25' },
              ]}
            >
              <Ionicons name={action.icon as any} size={17} color={action.tint} />
              <Text style={[styles.phoneActionText, { color: action.tint }]} numberOfLines={1}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return content;
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
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroId: {
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.6,
  },
  heroStatsContainer: {
    gap: 12,
    paddingRight: 20, // push and breathe
  },
  statBox: {
    minWidth: 130,
    padding: 16,
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
    textTransform: 'uppercase',
  },
  heroActions: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  payBtn: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  editBtn: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 60,
    height: 60,
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  scheduleMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schedulePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  schedulePillText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  smallActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The phone row stacks: value above, actions below. Keeps a 10-digit number on one
  // line instead of wrapping it around inline buttons.
  detailRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  detailRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  // Full width, not indented under the value: four labelled buttons need every pixel
  // (~63px each on a 375pt screen), and indenting by the icon column truncated them.
  phoneActions: {
    flexDirection: 'row',
    gap: 6,
  },
  phoneActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
  },
  phoneActionText: {
    fontSize: 10,
    fontWeight: '700',
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
    fontSize: 20,
    fontWeight: '900',
  },
  payModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  payNotes: {
    paddingTop: 10,
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  payNotesText: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    flex: 1,
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
