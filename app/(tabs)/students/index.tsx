import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Linking, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { spacing } from '@/constants/design';
import { Student } from '@/types/api';

import {
  useCreateStudent,
  useDeleteStudent,
  useUpdateStudent,
  useInfiniteStudentsQuery
} from '@/hooks/use-students';
import { useShiftsQuery } from '@/hooks/use-shifts';
import { useDashboardQuery } from '@/hooks/use-dashboard';

import { useCreatePayment } from '@/hooks/use-payments';
import { useSeatsQuery } from '@/hooks/use-seats';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useSendTemplate, useWhatsappTemplates, useAutomationSettings } from '@/hooks/use-whatsapp';
import { TemplateSelectorModal } from '@/components/whatsapp/TemplateSelectorModal';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/providers/subscription-provider';
import { useQuickRating } from '@/hooks/use-quick-rating';

import StudentSearchBar from '@/components/students/StudentSearchBar';
import StudentFilters from '@/components/students/StudentFilters';
import ShiftFilters from '@/components/students/ShiftFilters';
import QuickDateFilters from '@/components/students/QuickDateFilters';
import StudentList from '@/components/students/StudentList';

import { PaymentFormModal } from '@/components/students/payment-form-modal';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { showToast } from '@/lib/toast';
import { formatDate } from '@/utils/format';
import { transformFormToPayload, mapStudentToForm } from '@/utils/student-transform';
import { openWhatsappWithMessage } from '@/utils/whatsapp';
import { useScreenView } from '@/hooks/use-screen-view';
import { usePostHog } from 'posthog-react-native';

const { width } = Dimensions.get('window');

export default function StudentsScreen() {
  const router = useRouter();
  const color = useColorScheme();
  const { data: shifts = [] } = useShiftsQuery();
  const theme = useTheme();
  const posthog = usePostHog();

  // Track screen view
  useScreenView('Students');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('recent');
  const [days, setDays] = useState<number | undefined>(undefined);
  const [quickFilter, setQuickFilter] = useState<string | undefined>(undefined);
  const [customAgo, setCustomAgo] = useState('');
  const [customIn, setCustomIn] = useState('');
  const [shiftId, setShiftId] = useState<string | undefined>(undefined);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);

  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [reminderTarget, setReminderTarget] = useState<Student | null>(null);
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'sms' | null>(null);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const studentsQuery = useInfiniteStudentsQuery({
    name: debouncedSearch,
    filter,
    days,
    quickFilter,
    shiftId
  });

  const dashboardQuery = useDashboardQuery();
  const seatsQuery = useSeatsQuery();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent(editingStudent?._id);
  const createPayment = useCreatePayment();
  const feeReminder = useSendTemplate();
  const { data: templates } = useWhatsappTemplates();
  const { data: automationSettings } = useAutomationSettings();
  const { user } = useAuth();
  const { isPro, presentPaywall } = useSubscription();
  const { triggerRating } = useQuickRating();

  const students = useMemo(() => studentsQuery.data?.pages.flatMap(p => p.students) ?? [], [studentsQuery.data]);
  const activeStudentsCount = dashboardQuery.data?.activeStudentsCount ?? 0;
  const totalCount = useMemo(() => {
    return dashboardQuery.data?.totalStudents ?? (studentsQuery.data?.pages[0]?.pagination?.total || students.length);
  }, [dashboardQuery.data, studentsQuery.data, students.length]);

  const seats = useMemo(
    () => (seatsQuery.data ?? []).flatMap((f: any) =>
      (f.seats || []).map((s: any) => ({
        _id: s._id as string,
        seatNumber: String(s.seatNumber),
        floor: f.floor
      }))
    ),
    [seatsQuery.data]
  );

  const openCreateForm = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog?.capture('add_student_button_clicked');

    // Check Free Tier Limit
    if (!isPro && activeStudentsCount >= 20) {
      posthog?.capture('student_limit_paywall_shown', { count: activeStudentsCount });
      presentPaywall();
      return;
    }

    setEditingStudent(null);
    setIsStudentFormOpen(true);
  }, [posthog, isPro, activeStudentsCount, presentPaywall]);

  const openEditForm = useCallback((id: string) => {
    posthog?.capture('edit_student_form_opened');
    const s = students.find(u => u._id === id);
    setEditingStudent(s ?? null);
    setIsStudentFormOpen(true);
  }, [students, posthog]);

  const removeStudent = useCallback((id: string) => {
    const s = students.find(u => u._id === id);
    setPendingDelete(s ?? null);
  }, [students]);

  const openPayment = useCallback((student: any) => {
    posthog?.capture('payment_form_modal_opened');
    setPaymentStudent(student);
    setIsPaymentFormOpen(true);
  }, [posthog]);

  const handleSendReminder = useCallback(async (student: any) => {
    setReminderTarget(student);
    setReminderChannel('whatsapp');
    setIsTemplateSelectorOpen(true);
  }, []);

  const handleSendSmsReminder = useCallback(async (student: any) => {
    setReminderTarget(student);
    setReminderChannel('sms');
    setIsTemplateSelectorOpen(true);
  }, []);

  const handleSelectTemplate = async (tpl: any, method: 'api' | 'handset') => {
    setIsTemplateSelectorOpen(false);
    if (!reminderTarget) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await feeReminder.mutateAsync({
        studentId: reminderTarget._id,
        templateType: tpl.type,
        method
      });
      
      const targetPhone = reminderTarget.number;
      setReminderTarget(null);

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
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to prepare reminder';
      showToast(msg, 'error');
    }
  };



  const handleViewStudent = useCallback((id: string) => {
    router.push(`/student-detail/${id}`);
  }, [router]);

  const handleLoadMore = useCallback(() => {
    if (studentsQuery.hasNextPage && !studentsQuery.isFetchingNextPage) {
      studentsQuery.fetchNextPage();
    }
  }, [studentsQuery.hasNextPage, studentsQuery.isFetchingNextPage]);

  const handleRefresh = useCallback(() => {
    posthog?.capture('students_pull_to_refresh');
    studentsQuery.refetch();
  }, [studentsQuery.refetch, posthog]);

  const saveStudent = async (values: any, onProgress?: (p: number) => void) => {
    const payload = transformFormToPayload(values, shifts);

    try {
      if (editingStudent) {
        await updateStudent.mutateAsync({ id: editingStudent._id, payload, onProgress });
        showToast('Student updated', 'success');
      } else {
        await createStudent.mutateAsync({ payload, onProgress });
        // Trigger rating prompt for new creations occasionally
        setTimeout(() => triggerRating(), 1000);
      }

      setIsStudentFormOpen(false);
      setEditingStudent(null);
      setFilter('recent');
    } catch (error: any) {
      console.error('saveStudent (Directory) FAILED:', error);
      // Handle Student Limit Paywall
      if (error?.response?.status === 402) {
        setIsStudentFormOpen(false);
        presentPaywall();
      }
      // RE-THROW so the modal knows it failed and doesn't close/reset
      throw error;
    }
  };

  const buildPaymentDefaults = (s: Student | null) => {
    const d = new Date().toISOString();
    const today = d.slice(0, 10);

    // Default to today if anything is missing
    let startStr = today;

    if (s) {
      if (s.lastPayment && s.lastPayment.endDate) {
        startStr = s.lastPayment.endDate.slice(0, 10);
      } else if (s.joiningDate) {
        startStr = s.joiningDate.slice(0, 10);
      }
    }

    const start = new Date(startStr);
    const startDate = start.toISOString().slice(0, 10);

    // Add 1 month for end date
    start.setMonth(start.getMonth() + 1);
    const endDate = start.toISOString().slice(0, 10);

    return {
      student: s?._id || '',
      rupees: s?.fees || 0,
      startDate: startDate,
      endDate: endDate,
      paymentDate: today,
      paymentMode: 'upi' as const,
      notes: '',
      dueAmount: 0
    };
  };

  const savePayment = async (values: any) => {

    await createPayment.mutateAsync(values);
    setIsPaymentFormOpen(false);
    setPaymentStudent(null);
    // Success milestone - good for rating
    setTimeout(() => triggerRating(), 1500);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteStudent.mutateAsync(pendingDelete._id);
    showToast('Student deleted', 'success');
    setPendingDelete(null);
  };

  const queryCount = studentsQuery.data?.pages[0]?.pagination?.total || 0;
  const filteredCount = useMemo(() => {
    const isFiltering = debouncedSearch || shiftId || quickFilter || days;
    if (!isFiltering && (filter === 'recent' || filter === 'all' || filter === 'active')) {
      return dashboardQuery.data?.totalStudents ?? queryCount;
    }
    return queryCount;
  }, [filter, dashboardQuery.data, queryCount, debouncedSearch, shiftId, quickFilter, days]);

  const countLabel = useMemo(() => {
    const labels: Record<string, string> = {
      dues: 'DUES',
      paid: 'PAID',
      trial: 'TRIAL',
      defaulter: 'DEFAULTERS'
    };
    return labels[filter] || 'PROFILES';
  }, [filter]);

  const initialFormValues = useMemo(() => mapStudentToForm(editingStudent), [editingStudent]);

  const listHeader = useMemo(() => (
    <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
      <View style={[styles.headerTop, styles.px_xl]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerPreTitle, { color: theme.muted }]}>MANAGEMENT</Text>
          <Text style={[styles.title, { color: theme.text }]}>Directory</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: theme.primary + '15' }]}>
          <Text style={[styles.countVal, { color: theme.primary }]}>{filteredCount}</Text>
          <Text style={[styles.countUnit, { color: theme.primary }]}>{countLabel}</Text>
        </View>
      </View>

      <View style={styles.searchLayer}>
        <View style={styles.px_xl}>
          <StudentSearchBar search={search} setSearch={setSearch} theme={theme} />
        </View>
        <ShiftFilters 
          shifts={shifts} 
          selectedId={shiftId} 
          onSelect={setShiftId} 
          theme={theme} 
        />
        <View style={styles.filterRow}>
          <StudentFilters selected={filter} setSelected={(v) => { 
            setFilter(v); 
            setDays(undefined); 
            setQuickFilter(undefined); 
            setCustomAgo('');
            setCustomIn('');
          }} theme={theme} />
        </View>
        {(filter === 'dues') && (
          <QuickDateFilters 
            theme={theme}
            quickFilter={quickFilter}
            onSelect={(val) => {
              setQuickFilter(val);
              setDays(undefined);
            }}
            customAgo={customAgo}
            setCustomAgo={setCustomAgo}
            customIn={customIn}
            setCustomIn={setCustomIn}
            onClear={() => {
              setQuickFilter(undefined);
              setCustomAgo('');
              setCustomIn('');
            }}
          />
        )}
      </View>
    </Animated.View>
  ), [theme, search, filter, filteredCount, countLabel, quickFilter, days, customAgo, customIn, shiftId, shifts]);

  return (
    <SafeScreen edges={['top']}>
      <StudentList
        students={students}
        theme={theme}
        onView={handleViewStudent}
        onEdit={openEditForm}
        onDelete={removeStudent}
        onPay={openPayment}
        onRemind={handleSendReminder}
        onSmsRemind={handleSendSmsReminder}
        headerComponent={listHeader}
        onLoadMore={handleLoadMore}
        refreshing={studentsQuery.isRefetching}
        onRefresh={handleRefresh}
        loadingMore={studentsQuery.isFetchingNextPage}
        isLoading={studentsQuery.isFetching && students.length === 0}
      />

      <Animated.View
        entering={FadeInUp.delay(1000).duration(800)}
        style={styles.fabContainer}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openCreateForm}
          style={styles.fabTouch}
        >
          <LinearGradient
            colors={[theme.primary, theme.primary + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={30} color="#fff" />
            <Text style={styles.fabText}>New Member</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <StudentFormModal
        visible={isStudentFormOpen}
        onClose={() => {
          posthog?.capture('student_form_modal_closed');
          setIsStudentFormOpen(false);
        }}
        onSubmit={saveStudent}
        initialValues={initialFormValues}
        seats={seats}
        theme={theme}
        isSubmitting={createStudent.isPending || updateStudent.isPending}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
      />

      <PaymentFormModal
        visible={isPaymentFormOpen}
        onClose={() => {
          posthog?.capture('payment_form_modal_closed');
          setIsPaymentFormOpen(false);
        }}
        initialValues={buildPaymentDefaults(paymentStudent)}
        theme={theme}
        disabled={!paymentStudent?._id}
        isSubmitting={createPayment.isPending}
        onSubmit={savePayment}
        studentName={paymentStudent?.name}
        previousDueAmount={paymentStudent?.dueAmount}
      />

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="Mark as Inactive?"
        description={`Are you sure you want to deactivate ${pendingDelete?.name || 'this student'}? Their seat will be freed up, but their data will be kept.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        destructive
        confirmText="Mark Inactive"
        loading={deleteStudent.isPending}
      />



      <TemplateSelectorModal
        visible={isTemplateSelectorOpen}
        templates={Array.isArray(templates) ? templates : []}
        onSelect={handleSelectTemplate}
        onClose={() => {
          setIsTemplateSelectorOpen(false);
          setReminderTarget(null);
          setReminderChannel(null);
        }}
        theme={theme}
        hasCredits={(automationSettings?.whatsappCredits || 0) > 0}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  px_xl: {
    paddingHorizontal: spacing.xl,
  },
  headerPreTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    gap: 2,
  },
  countVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  countUnit: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  searchLayer: {
    gap: spacing.md,
  },
  filterRow: {
    marginTop: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    zIndex: 100,
  },
  fabTouch: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    height: 64,
    gap: 10,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  daysLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
