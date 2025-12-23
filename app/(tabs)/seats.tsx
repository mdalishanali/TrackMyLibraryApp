import { useState, useMemo } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { SectionHeader } from '@/components/ui/section-header';
import { radius, spacing, typography } from '@/constants/design';
import { useCreateSeats, useSeatsQuery } from '@/hooks/use-seats';
import { useCreateStudent, useStudentsQuery } from '@/hooks/use-students';
import { useTheme } from '@/hooks/use-theme';
import { Link, useRouter } from 'expo-router';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { formatDate } from '@/utils/format';

const { width } = Dimensions.get('window');

export default function SeatsScreen() {
  const theme = useTheme();
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

  const seatsByFloor = useMemo(() => {
    const data = seatsQuery.data ?? [];
    return data.reduce<Record<string, any[]>>((acc, seat) => {
      const key = String(seat.floor ?? '1');
      if (!acc[key]) acc[key] = [];
      acc[key].push(seat);
      return acc;
    }, {});
  }, [seatsQuery.data]);

  const floors = useMemo(() =>
    Object.keys(seatsByFloor).sort((a, b) => Number(a) - Number(b)),
    [seatsByFloor]);

  const resolveOccupant = (seat: { seatNumber: number; _id?: string }) => {
    const students = studentsQuery.data ?? [];
    return students.find((s) => s.seatNumber === seat.seatNumber || s.seat === seat._id);
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
      payload: {
        name: values.name,
        number: values.number,
        joiningDate: values.joiningDate,
        seat: values.seat,
        shift: values.shift,
        time: [{ start: values.startTime, end: values.endTime }],
        status: values.status,
        fees: values.fees ? Number(values.fees) : undefined,
        notes: values.notes,
        gender: values.gender,
        profilePicture: values.profilePicture
      }
    });
    setIsStudentModalOpen(false);
    setStudentDefaults(null);
  };

  if (seatsQuery.isLoading) {
    return <FullScreenLoader message="Mapping your workspace..." />;
  }

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={styles.bgGradient}
        />

        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Seats Layout</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Manage your floor plan and occupancy</Text>
            </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => setIsModalOpen(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={seatsQuery.isRefetching} onRefresh={seatsQuery.refetch} tintColor={theme.primary} />}
        >
          {floors.map((floorNum, fIdx) => (
            <View key={floorNum} style={styles.floorSection}>
              <Animated.View entering={FadeInUp.delay(fIdx * 100).duration(600)}>
                <SectionHeader>Floor {floorNum}</SectionHeader>
              </Animated.View>

              <View style={styles.seatsGrid}>
                {seatsByFloor[floorNum].sort((a, b) => a.seatNumber - b.seatNumber).map((item, sIdx) => {
                  const occupant = resolveOccupant(item);
                  const available = !occupant && item.seatNumber !== 0;
                  const statusColor = item.seatNumber === 0 ? theme.warning : available ? theme.success : theme.danger;

                  return (
                    <Animated.View
                      key={item._id || `${floorNum}-${item.seatNumber}`}
                      entering={FadeInDown.delay(fIdx * 50 + sIdx * 30 + 300).duration(500)}
                      layout={Layout.springify()}
                      style={styles.seatWrapper}
                    >
                      <Pressable
                        onPress={() => setSelectedSeat(item)}
                        style={({ pressed }) => [
                          styles.seatCard,
                          {
                            backgroundColor: theme.surface,
                            borderColor: selectedSeat?._id === item._id ? theme.primary : theme.border,
                            borderLeftColor: statusColor,
                          },
                          pressed && styles.cardPressed
                        ]}
                      >
                        <View style={styles.seatHeader}>
                          <Text style={[styles.seatNumber, { color: theme.text }]}>#{item.seatNumber}</Text>
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        </View>
                        <Text style={[styles.seatOccupant, { color: occupant ? theme.text : theme.muted }]} numberOfLines={1}>
                          {occupant?.name || 'Available'}
                        </Text>
                        {occupant && (
                          <Text style={[styles.seatShift, { color: theme.primary }]}>{occupant.shift}</Text>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Create Seats Modal */}
        <Modal animationType="fade" transparent visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Configure Seats</Text>
                <Pressable onPress={() => setIsModalOpen(false)}>
                  <Ionicons name="close" size={24} color={theme.muted} />
                </Pressable>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.muted }]}>Floor Number</Text>
                  <TextInput
                    value={floor}
                    onChangeText={setFloor}
                    keyboardType="numeric"
                    style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
                  />
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: theme.muted }]}>Start #</Text>
                    <TextInput
                      value={startSeat}
                      onChangeText={setStartSeat}
                      keyboardType="numeric"
                      style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: theme.muted }]}>End #</Text>
                    <TextInput
                      value={endSeat}
                      onChangeText={setEndSeat}
                      keyboardType="numeric"
                      style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
                    />
                  </View>
                </View>

                <AppButton
                  onPress={onCreateSeats}
                  loading={createSeats.isPending}
                  fullWidth
                  style={{ marginTop: spacing.md }}
                >
                  Generate Seats
                </AppButton>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* Seat Detail Modal (Bottom Sheet style) */}
        <Modal animationType="slide" transparent visible={Boolean(selectedSeat)} onRequestClose={() => setSelectedSeat(null)}>
          <Pressable style={styles.sheetOverlay} onPress={() => setSelectedSeat(null)}>
            <Animated.View
              entering={FadeInDown}
              style={[styles.sheetContent, { backgroundColor: theme.surface }]}
            >
              <View style={styles.sheetHandle} />
              {selectedSeat && (
                <View style={styles.sheetInner}>
                  <View style={styles.sheetHeaderRow}>
                    <View>
                      <Text style={[styles.sheetTitle, { color: theme.text }]}>Seat {selectedSeat.seatNumber}</Text>
                      <Text style={[styles.sheetSubtitle, { color: theme.muted }]}>Floor {selectedSeat.floor}</Text>
                    </View>
                    {(() => {
                      const occupant = resolveOccupant(selectedSeat);
                      return <AppBadge tone={occupant ? 'danger' : 'success'}>{occupant ? 'OCCUPIED' : 'VACANT'}</AppBadge>
                    })()}
                  </View>

                  <View style={[styles.sheetBody, { borderTopColor: theme.border + '50' }]}>
                    {(() => {
                      const occupant = resolveOccupant(selectedSeat);
                      if (!occupant) {
                        return (
                          <View style={styles.vacantState}>
                            <Text style={[styles.vacantText, { color: theme.muted }]}>
                              This seat is currently empty and ready for a student.
                            </Text>
                            <AppButton
                              onPress={() => openAddStudent(selectedSeat)}
                              fullWidth
                              style={{ height: 56, borderRadius: 16 }}
                            >
                              Assign Student
                            </AppButton>
                          </View>
                        );
                      }
                      return (
                        <View style={styles.occupantDetails}>
                          <View style={styles.occupantMain}>
                            <View style={[styles.occupantAvatar, { backgroundColor: theme.primary + '10' }]}>
                              <Text style={[styles.avatarText, { color: theme.primary }]}>
                                {occupant.name[0].toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <Text style={[styles.occupantName, { color: theme.text }]}>{occupant.name}</Text>
                              <Text style={[styles.occupantPhone, { color: theme.muted }]}>{occupant.number}</Text>
                            </View>
                          </View>

                          <View style={styles.occupantGrid}>
                            <View style={styles.gridItem}>
                              <Text style={[styles.gridLabel, { color: theme.muted }]}>SHIFT</Text>
                              <Text style={[styles.gridValue, { color: theme.text }]}>{occupant.shift}</Text>
                            </View>
                            <View style={styles.gridItem}>
                              <Text style={[styles.gridLabel, { color: theme.muted }]}>JOINED</Text>
                              <Text style={[styles.gridValue, { color: theme.text }]}>{formatDate(occupant.joiningDate)}</Text>
                            </View>
                          </View>

                          <View style={styles.sheetActions}>
                            <Link href={{ pathname: '/(tabs)/students/[id]', params: { id: occupant._id } }} asChild>
                              <AppButton fullWidth variant="outline" style={{ height: 54, borderRadius: 16 }}>
                                View Full Profile
                              </AppButton>
                            </Link>
                            <AppButton variant="outline" onPress={() => setSelectedSeat(null)} style={{ height: 54, borderRadius: 16 }}>
                              Close
                            </AppButton>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              )}
            </Animated.View>
          </Pressable>
        </Modal>

        {studentDefaults && (
          <StudentFormModal
            visible={isStudentModalOpen}
            onClose={() => setIsStudentModalOpen(false)}
            onSubmit={saveStudent}
            initialValues={studentDefaults}
            seats={(seatsQuery.data ?? []).map((s) => ({ _id: s._id ?? '', seatNumber: String(s.seatNumber), floor: s.floor }))}
            theme={theme}
            isSubmitting={createStudent.isPending}
            title="Add Student"
          />
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGradient: { ...StyleSheet.absoluteFillObject, height: 200 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  floorSection: {
    marginBottom: spacing.xxl,
  },
  seatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  seatWrapper: {
    width: (width - spacing.xl * 2 - spacing.md * 2) / 3,
  },
  seatCard: {
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1.5,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  seatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seatNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  seatOccupant: {
    fontSize: 12,
    fontWeight: '700',
  },
  seatShift: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    borderRadius: 28,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  form: { gap: spacing.md },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', gap: spacing.md },

  // Sheet Styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  sheetInner: {
    paddingHorizontal: spacing.xl,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  sheetBody: {
    paddingTop: 24,
    borderTopWidth: 1,
  },
  vacantState: {
    gap: 24,
    alignItems: 'center',
    paddingVertical: 10,
  },
  vacantText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  occupantDetails: {
    gap: 24,
  },
  occupantMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  occupantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  occupantName: {
    fontSize: 20,
    fontWeight: '800',
  },
  occupantPhone: {
    fontSize: 15,
    fontWeight: '600',
  },
  occupantGrid: {
    flexDirection: 'row',
    gap: 32,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 20,
    borderRadius: 20,
  },
  gridItem: { gap: 4 },
  gridLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  sheetActions: {
    gap: 12,
  },
});
