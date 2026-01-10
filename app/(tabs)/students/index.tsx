import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
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
import { useSendTemplate, useWhatsappTemplates } from '@/hooks/use-whatsapp';
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
import { openWhatsappWithMessage } from '@/utils/whatsapp';

const { width } = Dimensions.get('window');

export default function StudentsScreen() {
  const router = useRouter();
  const color = useColorScheme();
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('recent');
  const [days, setDays] = useState<number | undefined>(undefined);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);

  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [reminderTarget, setReminderTarget] = useState<Student | null>(null);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const studentsQuery = useInfiniteStudentsQuery({
    name: debouncedSearch,
    filter,
    days
  });

  const dashboardQuery = useDashboardQuery();
  const seatsQuery = useSeatsQuery();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent(editingStudent?._id);
  const createPayment = useCreatePayment();
  const feeReminder = useSendTemplate();
  const { data: templates } = useWhatsappTemplates();
  const { user } = useAuth();

  const students = useMemo(() => studentsQuery.data?.pages.flatMap(p => p.students) ?? [], [studentsQuery.data]);
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
    setReminderTarget(student);
    setIsTemplateSelectorOpen(true);
  }, []);

  const handleSelectTemplate = async (tpl: any) => {
    setIsTemplateSelectorOpen(false);
    if (!reminderTarget) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await feeReminder.mutateAsync({
        studentId: reminderTarget._id,
        templateType: tpl.type
      });
      setReminderTarget(null);

      if (res.phone && res.message) {
        openWhatsappWithMessage(res.phone, res.message);
      }
    } catch (e) {
      showToast('Failed to prepare reminder', 'error');
    }
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
    const d = new Date().toISOString();
    if (!s)
      return {
        name: '',
        number: '',
        joiningDate: d,
        seat: '',
        shift: 'First',
        startTime: '09:00',
        endTime: '18:00',
        status: 'Active',
        fees: '',
        gender: 'Male',
        notes: '',
        profilePicture: '',
        fatherName: '',
        address: '',
        aadharNumber: ''
      };
    return {
      name: s.name,
      number: s.number,
      joiningDate: s.joiningDate || d,
      seat: s.seat ?? '',
      shift: s.shift ?? 'Morning',
      startTime: s.time?.[0]?.start ?? '09:00',
      endTime: s.time?.[0]?.end ?? '18:00',
      status: s.status ?? 'Active',
      fees: s.fees ? String(s.fees) : '',
      gender: s.gender ?? 'Male',
      notes: s.notes ?? '',
      fatherName: s.fatherName ?? '',
      address: s.address ?? '',
      aadharNumber: s.aadhaarNumber ?? '',
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
      fatherName: values.fatherName,
      address: values.address,
      aadhaarNumber: values.aadharNumber,
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
    const d = new Date().toISOString();
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
        <View style={styles.filterRow}>
          <StudentFilters selected={filter} setSelected={(v) => { setFilter(v); setDays(undefined); }} theme={theme} />
        </View>
        {(filter === 'dues') && (
          <Animated.View entering={FadeInDown} style={styles.daysFilterContainer}>
            <View style={styles.px_xl}>
              <Text style={[styles.daysLabel, { color: theme.muted }]}>OVERDUE BY:</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScroll}
            >
              {[3, 7, 15, 30, 45, 60].map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDays(days === d ? undefined : d);
                  }}
                  style={[
                    styles.daysChip,
                    { backgroundColor: days === d ? theme.primary : theme.surfaceAlt, borderColor: days === d ? theme.primary : theme.border }
                  ]}
                >
                  <Text style={[styles.daysText, { color: days === d ? '#fff' : theme.text }]}>{d}+ Days</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  ), [theme, search, filter, filteredCount, countLabel]);

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
  daysFilterContainer: {
    gap: 12,
    marginTop: 4,
  },
  daysLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  daysScroll: {
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingRight: 40,
  },
  daysChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
