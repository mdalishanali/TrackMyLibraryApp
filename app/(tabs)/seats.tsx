import { useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Pressable } from 'react-native';
import { SafeScreen } from '@/components/layout/safe-screen';

import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { SectionHeader } from '@/components/ui/section-header';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useCreateSeats, useSeatsQuery } from '@/hooks/use-seats';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCreateStudent, useStudentsQuery } from '@/hooks/use-students';
import { Link, useRouter } from 'expo-router';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';

export default function SeatsScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const seatsQuery = useSeatsQuery();
  const createSeats = useCreateSeats();
  const studentsQuery = useStudentsQuery();
  const router = useRouter();
  const createStudent = useCreateStudent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [floor, setFloor] = useState('1');
  const [startSeat, setStartSeat] = useState('1');
  const [endSeat, setEndSeat] = useState('10');
  const [selectedSeat, setSelectedSeat] = useState<null | { seatNumber: number; floor?: number; _id?: string }>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentDefaults, setStudentDefaults] = useState<StudentFormValues | null>(null);

  const onCreateSeats = async () => {
    try {
      await createSeats.mutateAsync({
        floor: Number(floor),
        startSeat: Number(startSeat),
        endSeat: Number(endSeat),
      });
      setIsModalOpen(false);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  if (seatsQuery.isLoading) {
    return <FullScreenLoader message="Loading seats..." />;
  }

  const seatsByFloor = (seatsQuery.data ?? []).reduce<Record<string, { floor?: number; seats: typeof seatsQuery.data }>>(
    (acc, seat) => {
      const key = String(seat.floor ?? 'Unknown');
      if (!acc[key]) acc[key] = { floor: seat.floor, seats: [] };
      acc[key].seats.push(seat);
      return acc;
    },
    {}
  );

  const sections = Object.entries(seatsByFloor)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([floorKey, payload]) => ({
      title: `Floor ${floorKey}`,
      data: payload.seats?.sort((a, b) => a.seatNumber - b.seatNumber) ?? [],
    }));

  const resolveOccupant = (seat: { seatNumber: number; _id?: string }) => {
    const students = studentsQuery.data ?? [];
    return students.find((s) => s.seatNumber === seat.seatNumber || s.seat === seat._id);
  };

  const onSeatPress = (seat: { seatNumber: number; floor?: number; _id?: string }) => {
    setSelectedSeat(seat);
  };

  const buildStudentDefaults = (seat?: { _id?: string }) => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      name: '',
      number: '',
      joiningDate: today,
      seat: seat?._id,
      shift: 'Morning',
      startTime: '09:00',
      endTime: '18:00',
      status: 'Active',
      fees: undefined,
      gender: 'Male',
      notes: '',
    } as StudentFormValues;
  };

  const openAddStudent = (seat?: { _id?: string }) => {
    setStudentDefaults(buildStudentDefaults(seat));
    setIsStudentModalOpen(true);
    setSelectedSeat(null);
  };

  const saveStudent = async (values: StudentFormValues) => {
    await createStudent.mutateAsync({
      name: values.name,
      number: values.number,
      joiningDate: values.joiningDate,
      seat: values.seat,
      shift: values.shift,
      time: [{ start: values.startTime, end: values.endTime }],
      status: values.status,
      fees: values.fees,
      notes: values.notes,
      gender: values.gender,
    });
    setIsStudentModalOpen(false);
    setStudentDefaults(null);
  };

  return (
    <SafeScreen>
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.floor}-${item.seatNumber}`}
        refreshControl={<RefreshControl refreshing={seatsQuery.isRefetching} onRefresh={seatsQuery.refetch} />}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm }}>
            <SectionHeader>Seats</SectionHeader>
            <View style={styles.actionsRow}>
              <AppButton onPress={() => setIsModalOpen(true)}>Add Seats</AppButton>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.floorLabel, { color: theme.muted, paddingHorizontal: spacing.lg }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const occupant = resolveOccupant(item);
          const available = !occupant && item.seatNumber !== 0;
          const statusTone = item.seatNumber === 0 ? 'warning' : available ? 'success' : 'danger';
          const statusLabel = item.seatNumber === 0 ? 'Unallocated' : available ? 'Available' : 'Occupied';
          return (
            <TouchableOpacity style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }} onPress={() => onSeatPress(item)}>
              <AppCard style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <View style={styles.cardRow}>
                  <View style={{ gap: spacing.xs }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Seat {item.seatNumber}</Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>Floor {item.floor ?? '—'}</Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>ID: {item._id ?? '—'}</Text>
                  </View>
                  <AppBadge tone={statusTone as any}>{statusLabel}</AppBadge>
                </View>
                {occupant ? (
                  <View style={styles.occupantRow}>
                    <Text style={[styles.cardMeta, { color: theme.text }]}>Student: {occupant.name}</Text>
                    <AppBadge style={{ backgroundColor: theme.surfaceAlt }}>{occupant.shift ?? '—'}</AppBadge>
                  </View>
                ) : (
                  <Text style={[styles.cardMeta, { color: theme.muted }]}>Available for assignment</Text>
                )}
              </AppCard>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />

      <Modal animationType="slide" visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <SafeScreen edges={['top', 'bottom']}>
          <ScrollView
            style={[styles.modalContainer, { backgroundColor: theme.background }]}
            contentContainerStyle={{ padding: spacing.lg }}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create seats</Text>
            <Text style={[styles.label, { color: theme.text }]}>Floor</Text>
            <TextInput
              value={floor}
              onChangeText={setFloor}
              keyboardType="numeric"
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
              ]}
            />
            <Text style={[styles.label, { color: theme.text }]}>Start seat</Text>
            <TextInput
              value={startSeat}
              onChangeText={setStartSeat}
              keyboardType="numeric"
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
              ]}
            />
            <Text style={[styles.label, { color: theme.text }]}>End seat</Text>
            <TextInput
              value={endSeat}
              onChangeText={setEndSeat}
              keyboardType="numeric"
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
              ]}
            />
            <View style={styles.modalActions}>
              <AppButton variant="outline" onPress={() => setIsModalOpen(false)}>
                Cancel
              </AppButton>
              <AppButton onPress={onCreateSeats} loading={createSeats.isPending}>
                Save
              </AppButton>
            </View>
          </ScrollView>
        </SafeScreen>
      </Modal>

      <Modal animationType="slide" visible={Boolean(selectedSeat)} transparent onRequestClose={() => setSelectedSeat(null)}>
        <Pressable style={styles.overlay} onPress={() => setSelectedSeat(null)}>
          {selectedSeat ? (
            <Pressable style={[styles.detailSheet, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>Seat {selectedSeat.seatNumber}</Text>
                <AppBadge tone="info">Floor {selectedSeat.floor ?? '—'}</AppBadge>
              </View>
              {(() => {
                const occupant = resolveOccupant(selectedSeat);
                if (!occupant && selectedSeat.seatNumber !== 0) {
                  return (
                    <View style={{ gap: spacing.sm }}>
                      <Text style={{ color: theme.muted }}>This seat is available.</Text>
                      <AppButton onPress={() => openAddStudent(selectedSeat)} fullWidth tone="info">
                        Add Student to Seat
                      </AppButton>
                    </View>
                  );
                }
                if (!occupant && selectedSeat.seatNumber === 0) {
                  return <Text style={{ color: theme.muted }}>This is an unallocated placeholder seat.</Text>;
                }
                if (!occupant) return null;
                return (
                  <View style={{ gap: spacing.xs }}>
                    <Text style={[styles.detailText, { color: theme.text }]}>{occupant.name}</Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>Phone: {occupant.number}</Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>Shift: {occupant.shift ?? '—'}</Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>Joined: {occupant.joiningDate ?? '—'}</Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>Status: {occupant.status ?? '—'}</Text>
                    <Link href={{ pathname: '/(tabs)/students/[id]', params: { id: occupant._id } }} asChild>
                      <AppButton fullWidth>View student</AppButton>
                    </Link>
                  </View>
                );
              })()}
              <AppButton variant="outline" onPress={() => setSelectedSeat(null)}>
                Close
              </AppButton>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>

      {studentDefaults ? (
        <StudentFormModal
          visible={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          onSubmit={saveStudent}
          initialValues={studentDefaults}
          seats={(seatsQuery.data ?? []).map((s) => ({ _id: s._id ?? '', seatNumber: s.seatNumber, floor: s.floor }))}
          theme={theme}
          isSubmitting={createStudent.isPending}
          title="Add Student"
        />
      ) : null}
    </SafeScreen>
  );
}

  const styles = StyleSheet.create({
    screen: { flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  card: {
    flex: 1,
    marginVertical: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 2 },
    }),
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: typography.size.sm,
  },
  modalContainer: { flex: 1 },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  floorLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  detailSheet: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occupantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  detailText: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  studentModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
