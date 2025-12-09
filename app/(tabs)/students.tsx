import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeScreen } from '@/components/layout/safe-screen';
import { z } from 'zod';

import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { SectionHeader } from '@/components/ui/section-header';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import {
  useCreateStudent,
  useDeleteStudent,
  useUpdateStudent,
  StudentPayload,
  useInfiniteStudentsQuery,
} from '@/hooks/use-students';
import { useCreatePayment } from '@/hooks/use-payments';
import { useSeatsQuery } from '@/hooks/use-seats';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency, formatDate } from '@/utils/format';

const studentSchema = z.object({
  name: z.string().min(1),
  number: z.string().min(8),
  joiningDate: z.string().min(1),
  seat: z.string().optional(),
  shift: z.string().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  fees: z.preprocess((val) => Number(val), z.number().optional()),
  notes: z.string().optional(),
  status: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

const paymentSchema = z.object({
  student: z.string().min(1),
  rupees: z.preprocess((val) => Number(val), z.number().min(1)),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  paymentMode: z.enum(['cash', 'upi']),
  paymentDate: z.string().min(1),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function StudentsScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('recent');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const studentsQuery = useInfiniteStudentsQuery({ name: search || undefined, filter, limit: 10 });
  const seatsQuery = useSeatsQuery();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent(editingId ?? undefined);
  const deleteStudent = useDeleteStudent();
  const createPayment = useCreatePayment();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      number: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      seat: undefined,
      shift: 'Morning',
      startTime: '09:00',
      endTime: '18:00',
      fees: undefined,
      notes: '',
      status: 'Active',
    },
  });

  const {
    control: paymentControl,
    handleSubmit: handlePaymentSubmit,
    reset: resetPaymentForm,
    getValues: getPaymentValues,
    formState: { errors: paymentErrors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      student: '',
      rupees: 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      paymentMode: 'cash',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    reset();
  };

  const openCreateForm = () => {
    reset();
    setEditingId(null);
    setIsFormOpen(true);
  };

  const onSubmitStudent = async (values: StudentFormValues) => {
    const payload: StudentPayload = {
      name: values.name,
      number: values.number,
      joiningDate: values.joiningDate,
      seat: values.seat,
      shift: values.shift,
      time: [{ start: values.startTime, end: values.endTime }],
      fees: values.fees,
      notes: values.notes,
      status: values.status,
    };

    try {
      if (editingId) {
        await updateStudent.mutateAsync(payload);
      } else {
        await createStudent.mutateAsync(payload);
      }
      closeForm();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete student', 'Are you sure you want to delete this student?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStudent.mutateAsync(id);
          } catch (error) {
            Alert.alert('Error', (error as Error).message);
          }
        },
      },
    ]);
  };

  const openEdit = (id: string) => {
    const target = studentsQuery.data?.find((s) => s._id === id);
    if (!target) return;
    setEditingId(id);
    setValue('name', target.name);
    setValue('number', target.number);
    setValue('joiningDate', target.joiningDate?.slice(0, 10) || '');
    setValue('seat', target.seat ?? undefined);
    setValue('shift', target.shift ?? 'Morning');
    setValue('startTime', target.time?.[0]?.start ?? '09:00');
    setValue('endTime', target.time?.[0]?.end ?? '18:00');
    setValue('fees', target.fees);
    setValue('notes', target.notes ?? '');
    setValue('status', target.status ?? 'Active');
    setIsFormOpen(true);
  };

  const openPayment = (studentId: string) => {
    setPaymentStudentId(studentId);
    const current = getPaymentValues();
    resetPaymentForm({
      ...current,
      student: studentId,
      paymentDate: new Date().toISOString().slice(0, 10),
    });
    setIsPaymentOpen(true);
  };

  const onSubmitPayment = async (values: PaymentFormValues) => {
    try {
      await createPayment.mutateAsync(values);
      setIsPaymentOpen(false);
      setPaymentStudentId(null);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  if (studentsQuery.isLoading) {
    return <FullScreenLoader message="Loading students..." />;
  }

  const students = studentsQuery.data?.pages.flatMap((page) => page.students) ?? [];

  const renderStudent = ({ item }: { item: any }) => (
    <AppCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.studentRow}>
          <View style={[styles.studentAvatar, { backgroundColor: theme.surfaceAlt }]}>
            {item.profilePicture ? (
              <Image source={{ uri: item.profilePicture }} style={styles.studentAvatarImage} contentFit="cover" />
            ) : (
              <Text style={[styles.studentAvatarText, { color: theme.text }]}>{item.name?.[0]?.toUpperCase() || 'S'}</Text>
            )}
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.cardMeta, { color: theme.muted }]}>ID: {item.id ?? '—'}</Text>
          </View>
        </View>
        <AppBadge tone={item.status === 'Active' ? 'success' : 'warning'}>{item.status ?? 'Active'}</AppBadge>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>Phone: {item.number}</Text>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>Shift: {item.shift ?? '—'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>Joined: {formatDate(item.joiningDate)}</Text>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>Seat: {item.seatNumber ?? 'Unallocated'}</Text>
      </View>

      <View style={styles.paymentCard}>
        <Text style={[styles.paymentTitle, { color: theme.text }]}>Payment Info</Text>
        <Text style={[styles.paymentMeta, { color: theme.muted }]}>
          Last Payment: {item.lastPayment?.paymentDate ? formatDate(item.lastPayment.paymentDate) : 'No payment yet'}
        </Text>
        <Text style={[styles.paymentMeta, { color: theme.muted }]}>
          Period:{' '}
          {item.lastPayment?.startDate
            ? `${formatDate(item.lastPayment.startDate)} - ${formatDate(item.lastPayment.endDate)}`
            : '—'}
        </Text>
        <Text style={[styles.paymentMeta, { color: theme.muted }]}>
          Status: {item.paymentStatus ?? 'Unknown'}
        </Text>
        {item.lastPayment?.rupees ? (
          <Text style={[styles.paymentMeta, { color: theme.text }]}>{formatCurrency(item.lastPayment.rupees)}</Text>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <AppButton variant="outline" onPress={() => router.push(`/(tabs)/students/${item._id}`)}>
          View
        </AppButton>
        <AppButton variant="outline" onPress={() => openEdit(item._id)}>
          Edit
        </AppButton>
        <AppButton variant="outline" onPress={() => onDelete(item._id)}>
          Delete
        </AppButton>
        <AppButton onPress={() => openPayment(item._id)}>Pay</AppButton>
      </View>
    </AppCard>
  );

  return (
    <SafeScreen>
      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={renderStudent}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={studentsQuery.isRefetching} onRefresh={studentsQuery.refetch} />}
        onEndReached={() => {
          if (studentsQuery.hasNextPage && !studentsQuery.isFetchingNextPage) {
            studentsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<Text style={{ color: theme.muted, padding: spacing.lg }}>No students yet.</Text>}
        ListFooterComponent={
          studentsQuery.isFetchingNextPage ? (
            <Text style={{ color: theme.muted, padding: spacing.sm }}>Loading more...</Text>
          ) : null
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <SectionHeader>Students</SectionHeader>

            <View style={styles.searchRow}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name"
                placeholderTextColor={theme.muted}
                style={[
                  styles.searchInput,
                  { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
                ]}
              />
              <AppButton onPress={openCreateForm}>Add</AppButton>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              {[
                { key: 'recent', label: 'Recent' },
                { key: 'paid', label: 'Paid' },
                { key: 'dues', label: 'Due' },
                { key: 'trial', label: 'Trial' },
                { key: 'defaulter', label: 'Defaulter' },
                { key: 'active', label: 'Active' },
                { key: 'inactive', label: 'Inactive' },
                { key: 'unallocated', label: 'Unallocated' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: filter === item.key ? theme.primary : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setFilter(item.key)}>
                  <Text style={{ color: filter === item.key ? '#fff' : theme.text, fontWeight: '600' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
      />

      <Modal animationType="slide" visible={isFormOpen} onRequestClose={closeForm}>
        <SafeScreen>
          <ScrollView
            style={[styles.modalContainer, { backgroundColor: theme.background }]}
            contentContainerStyle={{ padding: spacing.lg }}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingId ? 'Edit Student' : 'Add Student'}
            </Text>

            {renderInput('Name', 'name', control, errors, theme)}
            {renderInput('Phone', 'number', control, errors, theme)}
            {renderInput('Joining Date (YYYY-MM-DD)', 'joiningDate', control, errors, theme)}
            {renderInput('Start Time (HH:mm)', 'startTime', control, errors, theme)}
            {renderInput('End Time (HH:mm)', 'endTime', control, errors, theme)}
            {renderInput('Fees (₹)', 'fees', control, errors, theme, 'numeric')}
            {renderInput('Notes', 'notes', control, errors, theme)}

            <Text style={[styles.label, { color: theme.text }]}>Seat</Text>
            <Controller
              control={control}
              name="seat"
              render={({ field: { onChange, value } }) => (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        {
                          backgroundColor: !value ? theme.primarySoft : theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => onChange(undefined)}>
                      <Text style={{ color: theme.text }}>Unallocated</Text>
                    </TouchableOpacity>
                    {seatsQuery.data?.map((seat) => (
                      <TouchableOpacity
                        key={seat._id ?? seat.seatNumber}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: value === seat._id ? theme.primary : theme.surface,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => onChange(seat._id)}>
                        <Text style={{ color: value === seat._id ? '#fff' : theme.text }}>
                          Floor {seat.floor ?? '?'} · Seat {seat.seatNumber}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            />

            <View style={styles.modalActions}>
              <AppButton variant="outline" onPress={closeForm}>
                Cancel
              </AppButton>
              <AppButton onPress={handleSubmit(onSubmitStudent)} loading={createStudent.isPending || updateStudent.isPending}>
                Save
              </AppButton>
            </View>
          </ScrollView>
        </SafeScreen>
      </Modal>

      <Modal animationType="slide" visible={isPaymentOpen} onRequestClose={() => setIsPaymentOpen(false)}>
        <SafeScreen>
          <ScrollView
            style={[styles.modalContainer, { backgroundColor: theme.background }]}
            contentContainerStyle={{ padding: spacing.lg }}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Record Payment</Text>
            {renderPaymentInput('Student ID', 'student', paymentControl, paymentErrors, theme, 'default', true)}
            {renderPaymentInput('Amount (₹)', 'rupees', paymentControl, paymentErrors, theme, 'numeric')}
            {renderPaymentInput('Start Date (YYYY-MM-DD)', 'startDate', paymentControl, paymentErrors, theme)}
            {renderPaymentInput('End Date (YYYY-MM-DD)', 'endDate', paymentControl, paymentErrors, theme)}
            {renderPaymentInput('Payment Mode (cash|upi)', 'paymentMode', paymentControl, paymentErrors, theme)}
            {renderPaymentInput('Payment Date (YYYY-MM-DD)', 'paymentDate', paymentControl, paymentErrors, theme)}
            {renderPaymentInput('Notes', 'notes', paymentControl, paymentErrors, theme)}

            <View style={styles.modalActions}>
              <AppButton variant="outline" onPress={() => setIsPaymentOpen(false)}>
                Cancel
              </AppButton>
              <AppButton
                onPress={handlePaymentSubmit(onSubmitPayment)}
                loading={createPayment.isPending}
                disabled={!paymentStudentId}>
                Save Payment
              </AppButton>
            </View>
          </ScrollView>
        </SafeScreen>
      </Modal>
    </SafeScreen>
  );
}

function renderInput(
  label: string,
  name: keyof StudentFormValues,
  control: any,
  errors: any,
  theme: ReturnType<typeof themeFor>,
  keyboardType: 'default' | 'numeric' = 'default'
) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value as any}
            onChangeText={onChange}
            placeholder={label}
            placeholderTextColor={theme.muted}
            keyboardType={keyboardType}
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
            ]}
          />
        )}
      />
      {errors[name]?.message ? <Text style={styles.errorText}>{errors[name].message}</Text> : null}
    </View>
  );
}

function renderPaymentInput(
  label: string,
  name: keyof PaymentFormValues,
  control: any,
  errors: any,
  theme: ReturnType<typeof themeFor>,
  keyboardType: 'default' | 'numeric' = 'default',
  readOnly = false
) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={String(value ?? '')}
            onChangeText={onChange}
            placeholder={label}
            placeholderTextColor={theme.muted}
            keyboardType={keyboardType}
            editable={!readOnly}
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
              readOnly && { opacity: 0.6 },
            ]}
          />
        )}
      />
      {errors[name]?.message ? <Text style={styles.errorText}>{errors[name].message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  card: {
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: typography.size.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.md,
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  filterChips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  studentAvatarText: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  studentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentCard: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  paymentTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  paymentMeta: {
    fontSize: typography.size.sm,
    marginBottom: 2,
  },
});
