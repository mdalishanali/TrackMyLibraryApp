import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
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
import { useDashboardQuery } from '@/hooks/use-dashboard';

import { useCreatePayment } from '@/hooks/use-payments';
import { useSeatsQuery } from '@/hooks/use-seats';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useSendTemplate, useWhatsappStatus, useWhatsappTemplates } from '@/hooks/use-whatsapp';
import { TemplateSelectorModal } from '@/components/whatsapp/TemplateSelectorModal';
import { useAuth } from '@/hooks/use-auth';

import StudentSearchBar from '@/components/students/StudentSearchBar';
import StudentFilters from '@/components/students/StudentFilters';
import StudentList from '@/components/students/StudentList';

import { PaymentFormModal } from '@/components/students/payment-form-modal';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { showToast } from '@/lib/toast';
import { formatDate } from '@/utils/format';

const { width } = Dimensions.get('window');

export default function StudentsScreen() {
  const router = useRouter();
  const color = useColorScheme();
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('recent');

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);

  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [reminderTarget, setReminderTarget] = useState<Student | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const studentsQuery = useInfiniteStudentsQuery({
    name: debouncedSearch,
    filter
  });

  const dashboardQuery = useDashboardQuery();
  const seatsQuery = useSeatsQuery();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent(editingStudent?._id);
  const createPayment = useCreatePayment();
  const feeReminder = useSendTemplate();
  const { data: whatsappStatus } = useWhatsappStatus();
  const { data: templates } = useWhatsappTemplates();
  const { user } = useAuth();
  const isWhatsappConnected = whatsappStatus?.status === 'CONNECTED';

  const students = useMemo(() => studentsQuery.data?.pages.flatMap(p => p.students) ?? [], [studentsQuery.data]);
  const totalCount = useMemo(() => {
    return dashboardQuery.data?.totalStudents ?? (studentsQuery.data?.pages[0]?.pagination?.total || students.length);
  }, [dashboardQuery.data, studentsQuery.data, students.length]);

  const seats = useMemo(
    () => (seatsQuery.data ?? []).map(s => ({
      _id: s._id as string,
      seatNumber: String(s.seatNumber),
      floor: s.floor
    })),
    [seatsQuery.data]
  );

  const openCreateForm = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingStudent(null);
    setIsStudentFormOpen(true);
  }, []);

  const openEditForm = useCallback((id: string) => {
    const s = students.find(u => u._id === id);
    setEditingStudent(s ?? null);
    setIsStudentFormOpen(true);
  }, [students]);

  const removeStudent = useCallback((id: string) => {
    const s = students.find(u => u._id === id);
    setPendingDelete(s ?? null);
  }, [students]);

  const openPayment = useCallback((student: any) => {
    setPaymentStudent(student);
    setIsPaymentFormOpen(true);
  }, []);

  const handleSendReminder = useCallback(async (student: any) => {
    if (!isWhatsappConnected) {
      showToast('WhatsApp not connected', 'error');
      return;
    }
    setReminderTarget(student);
    setIsTemplateSelectorOpen(true);
  }, [isWhatsappConnected]);

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    setIsTemplateSelectorOpen(false);
  };

  const executeReminder = async () => {
    if (!reminderTarget || !selectedTemplate) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await feeReminder.mutateAsync({
        studentId: reminderTarget._id,
        templateType: selectedTemplate.type
      });
      showToast('Message sent', 'success');
      setReminderTarget(null);
      setSelectedTemplate(null);
    } catch (e) {
      showToast('Failed to send message', 'error');
    }
  };

  const getReminderPreview = () => {
    if (!reminderTarget || !selectedTemplate) return "";

    return selectedTemplate.body
      .replace('{student_name}', reminderTarget.name)
      .replace('{business_name}', user?.company?.businessName || 'Your Library')
      .replace('{amount}', reminderTarget.lastPayment?.rupees || '0')
      .replace('{start_date}', reminderTarget.lastPayment?.startDate ? formatDate(reminderTarget.lastPayment.startDate) : '—')
      .replace('{end_date}', reminderTarget.lastPayment?.endDate ? formatDate(reminderTarget.lastPayment.endDate) : '—');
  };

  const handleViewStudent = useCallback((id: string) => {
    router.push({ pathname: '/(tabs)/students/[id]', params: { id } });
  }, [router]);

  const handleLoadMore = useCallback(() => {
    if (studentsQuery.hasNextPage && !studentsQuery.isFetchingNextPage) {
      studentsQuery.fetchNextPage();
    }
  }, [studentsQuery.hasNextPage, studentsQuery.isFetchingNextPage]);

  const handleRefresh = useCallback(() => {
    studentsQuery.refetch();
  }, [studentsQuery.refetch]);

  const mapToForm = (s: Student | null): StudentFormValues => {
    const d = new Date().toISOString().slice(0, 10);
    if (!s)
      return {
        name: '',
        number: '',
        joiningDate: d,
        seat: '',
        shift: 'Morning',
        startTime: '09:00',
        endTime: '18:00',
        status: 'Active',
        fees: '',
        gender: 'Male',
        notes: '',
        profilePicture: ''
      };
    return {
      name: s.name,
      number: s.number,
      joiningDate: s.joiningDate?.slice(0, 10) || d,
      seat: s.seat ?? '',
      shift: s.shift ?? 'Morning',
      startTime: s.time?.[0]?.start ?? '09:00',
      endTime: s.time?.[0]?.end ?? '18:00',
      status: s.status ?? 'Active',
      fees: s.fees ? String(s.fees) : '',
      gender: s.gender ?? 'Male',
      notes: s.notes ?? '',
      profilePicture: s.profilePicture || ''
    };
  };

  const saveStudent = async (values: any, onProgress?: (p: number) => void) => {
    const payload = {
      name: values.name,
      number: values.number,
      joiningDate: values.joiningDate,
      seat: values.seat,
      shift: values.shift,
      time: [{ start: values.startTime, end: values.endTime }],
      status: values.status,
      fees: Number(values.fees) || 0,
      notes: values.notes,
      gender: values.gender,
      profilePicture: values.profilePicture,
    };

    if (editingStudent) {
      await updateStudent.mutateAsync({ payload, onProgress });
    } else {
      await createStudent.mutateAsync({ payload, onProgress });
    }

    setIsStudentFormOpen(false);
    setEditingStudent(null);
    setFilter('recent');
    if (editingStudent) {
      showToast('Student updated', 'success');
    }
  };

  const buildPaymentDefaults = (s: Student | null) => {
    const d = new Date().toISOString().slice(0, 10);
    return {
      student: s?._id || '',
      rupees: 0,
      startDate: d,
      endDate: d,
      paymentDate: d,
      paymentMode: 'cash' as const,
      notes: ''
    };
  };

  const savePayment = async (values: any) => {
    await createPayment.mutateAsync(values);
    setIsPaymentFormOpen(false);
    setPaymentStudent(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteStudent.mutateAsync(pendingDelete._id);
    showToast('Student deleted', 'success');
    setPendingDelete(null);
  };

  const queryCount = studentsQuery.data?.pages[0]?.pagination?.total || 0;
  const filteredCount = useMemo(() => {
    if (filter === 'recent' || filter === 'all' || filter === 'active') {
      return dashboardQuery.data?.totalStudents ?? queryCount;
    }
    return queryCount;
  }, [filter, dashboardQuery.data, queryCount]);

  const countLabel = useMemo(() => {
    const labels: Record<string, string> = {
      dues: 'DUES',
      paid: 'PAID',
      trial: 'TRIAL',
      defaulter: 'DEFAULTERS'
    };
    return labels[filter] || 'PROFILES';
  }, [filter]);

  const initialFormValues = useMemo(() => mapToForm(editingStudent), [editingStudent]);

  const listHeader = useMemo(() => (
    <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
      <View style={styles.headerTop}>
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
        <StudentSearchBar search={search} setSearch={setSearch} theme={theme} />
        <View style={styles.filterRow}>
          <StudentFilters selected={filter} setSelected={setFilter} theme={theme} />
        </View>
      </View>
    </Animated.View>
  ), [theme, search, filter, totalCount]);

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
        onClose={() => setIsStudentFormOpen(false)}
        onSubmit={saveStudent}
        initialValues={initialFormValues}
        seats={seats}
        theme={theme}
        isSubmitting={createStudent.isPending || updateStudent.isPending}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
      />

      <PaymentFormModal
        visible={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
        initialValues={buildPaymentDefaults(paymentStudent)}
        theme={theme}
        disabled={!paymentStudent?._id}
        isSubmitting={createPayment.isPending}
        onSubmit={savePayment}
        studentName={paymentStudent?.name}
      />

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="Delete student?"
        description={`Are you sure you want to delete ${pendingDelete?.name || 'this student'}? This cannot be undone.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        destructive
        confirmText="Delete"
        loading={deleteStudent.isPending}
      />

      <ConfirmDialog
        visible={Boolean(reminderTarget && selectedTemplate)}
        title={`Send ${selectedTemplate?.title || 'Reminder'}?`}
        description={getReminderPreview()}
        confirmText="Send Message"
        onCancel={() => {
          setReminderTarget(null);
          setSelectedTemplate(null);
        }}
        onConfirm={executeReminder}
        loading={feeReminder.isPending}
      />

      <TemplateSelectorModal
        visible={isTemplateSelectorOpen}
        templates={Array.isArray(templates) ? templates : []}
        onSelect={handleSelectTemplate}
        onClose={() => {
          setIsTemplateSelectorOpen(false);
          setReminderTarget(null);
        }}
        theme={theme}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: spacing.md,
    gap: spacing.lg,
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
    elevation: 8,
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
});
