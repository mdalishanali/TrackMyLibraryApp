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

import { useCreatePayment } from '@/hooks/use-payments';
import { useSeatsQuery } from '@/hooks/use-seats';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

import StudentSearchBar from '@/components/students/StudentSearchBar';
import StudentFilters from '@/components/students/StudentFilters';
import StudentList from '@/components/students/StudentList';

import { PaymentFormModal } from '@/components/students/payment-form-modal';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { showToast } from '@/lib/toast';

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

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const studentsQuery = useInfiniteStudentsQuery({
    name: debouncedSearch,
    filter
  });

  const seatsQuery = useSeatsQuery();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent(editingStudent?._id);
  const createPayment = useCreatePayment();

  const students = useMemo(() => studentsQuery.data?.pages.flatMap(p => p.students) ?? [], [studentsQuery.data]);
  const totalCount = useMemo(() => {
    const firstPage: any = studentsQuery.data?.pages[0];
    return firstPage?.totalCount ?? firstPage?.total ?? students.length;
  }, [studentsQuery.data, students.length]);

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

  const initialFormValues = useMemo(() => mapToForm(editingStudent), [editingStudent]);

  const listHeader = useMemo(() => (
    <Animated.View entering={FadeInDown.duration(800)} style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>Directory</Text>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryPill, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.summaryText, { color: theme.primary }]}>{totalCount} Members</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Manage your library database</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchLayer}>
        <StudentSearchBar search={search} setSearch={setSearch} theme={theme} />
        <View style={{ marginTop: 12 }}>
          <StudentFilters selected={filter} setSelected={setFilter} theme={theme} />
        </View>
      </View>
    </Animated.View>
  ), [theme, search, filter, totalCount]);

  return (
    <SafeScreen>
      <StudentList
        students={students}
        theme={theme}
        onView={handleViewStudent}
        onEdit={openEditForm}
        onDelete={removeStudent}
        onPay={openPayment}
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
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  summaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchLayer: {
    marginBottom: 12,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  fabTouch: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    height: 60,
    gap: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
