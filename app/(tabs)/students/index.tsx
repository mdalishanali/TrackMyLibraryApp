import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { SafeScreen } from '@/components/layout/safe-screen';
import { SectionHeader } from '@/components/ui/section-header';
import { gradientFor } from '@/constants/design';

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

import { StudentFormModal } from '@/components/students/student-form-modal';
import StudentSkeletonList from '@/components/students/StudentSkeletonList';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { showToast } from '@/lib/toast';

export default function StudentsScreen() {
  const router = useRouter();
  const color = useColorScheme();
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('recent');

  const [editingStudent, setEditingStudent] = useState(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);

  const [paymentStudent, setPaymentStudent] = useState(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

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

  const seats = useMemo(
    () =>
      (seatsQuery.data ?? []).map(s => ({
        _id: s._id,
        seatNumber: s.seatNumber,
        floor: s.floor
      })),
    [seatsQuery.data]
  );

  const openCreateForm = useCallback(() => {
    setEditingStudent(null);
    setIsStudentFormOpen(true);
  }, []);

  const openEditForm = useCallback((id: string) => {
    const s = students.find(u => u._id === id);
    setEditingStudent(s);
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
  }, [studentsQuery.hasNextPage, studentsQuery.isFetchingNextPage, studentsQuery.fetchNextPage]);

  const handleRefresh = useCallback(() => {
    studentsQuery.refetch();
  }, [studentsQuery.refetch]);

  const mapToForm = s => {
    const d = new Date().toISOString().slice(0, 10);
    if (!s)
      return {
        name: '',
        number: '',
        joiningDate: d,
        seat: undefined,
        shift: 'Morning',
        startTime: '09:00',
        endTime: '18:00',
        status: 'Active',
        fees: undefined,
        gender: 'Male',
        notes: ''
      };
    return {
      name: s.name,
      number: s.number,
      joiningDate: s.joiningDate?.slice(0, 10) || d,
      seat: s.seat ?? undefined,
      shift: s.shift ?? 'Morning',
      startTime: s.time?.[0]?.start ?? '09:00',
      endTime: s.time?.[0]?.end ?? '18:00',
      status: s.status ?? 'Active',
      fees: s.fees,
      gender: s.gender ?? 'Male',
      notes: s.notes ?? ''
    };
  };

  const saveStudent = async values => {
    const payload = {
      name: values.name,
      number: values.number,
      joiningDate: values.joiningDate,
      seat: values.seat,
      shift: values.shift,
      time: [{ start: values.startTime, end: values.endTime }],
      status: values.status,
      fees: values.fees,
      notes: values.notes,
      gender: values.gender
    };

    if (editingStudent) await updateStudent.mutateAsync(payload);
    else await createStudent.mutateAsync(payload);

    setIsStudentFormOpen(false);
    setEditingStudent(null);
    setFilter('recent');
    if (editingStudent) {
      showToast('Student updated', 'success');
    }
  };



  const buildPaymentDefaults = s => {
    const d = new Date().toISOString().slice(0, 10);
    return {
      student: s?._id || '',
      rupees: 0,
      startDate: d,
      endDate: d,
      paymentDate: d,
      paymentMode: 'cash',
      notes: ''
    };
  };

  const savePayment = async values => {
    await createPayment.mutateAsync(values);
    setIsPaymentFormOpen(false);
    setPaymentStudent(null);
    // Success toast handled globally for POST calls
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteStudent.mutateAsync(pendingDelete._id);
    showToast('Student deleted', 'success');
    setPendingDelete(null);
  };

  const initialFormValues = useMemo(
    () => mapToForm(editingStudent),
    [editingStudent, isStudentFormOpen]
  );

  const listHeader = useMemo(() => (
    <View style={styles.heroShadow}>
      <LinearGradient
        colors={gradientFor(color, 'panel')}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderColor: theme.border }]}
      >
        <View style={styles.heroHeader}>
          <SectionHeader>Students</SectionHeader>
          <Text style={[styles.heroSub, { color: theme.muted }]}>Search, filter, and manage students.</Text>
        </View>
        <StudentSearchBar search={search} setSearch={setSearch} onAdd={openCreateForm} theme={theme} />
        <StudentFilters selected={filter} setSelected={setFilter} theme={theme} />
      </LinearGradient>
    </View>
  ), [color, theme, search, filter, openCreateForm]);

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
  heroShadow: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  heroHeader: {
    gap: 4,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    fontWeight: '600',
  },
});
