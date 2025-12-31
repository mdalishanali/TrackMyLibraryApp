import { useState, useMemo, useEffect } from 'react';
import { Image } from 'expo-image';
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
  ActivityIndicator
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { radius, spacing } from '@/constants/design';
import { useCreateSeats, useSeatsQuery } from '@/hooks/use-seats';
import { useCreateStudent } from '@/hooks/use-students';
import { useTheme } from '@/hooks/use-theme';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { formatDate } from '@/utils/format';

const { width } = Dimensions.get('window');
const BLURHASH = 'L9E:C[^+^j0000.8?v~q00?v%MoL';

export default function SeatsScreen() {
  const theme = useTheme();
  const seatsQuery = useSeatsQuery();
  const createSeats = useCreateSeats();
  const router = useRouter();
  const createStudent = useCreateStudent();
  const { setup } = useLocalSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (setup === 'true') {
      setIsModalOpen(true);
    }
  }, [setup]);
  const [floor, setFloor] = useState('1');
  const [startSeat, setStartSeat] = useState('1');
  const [endSeat, setEndSeat] = useState('10');
  const [selectedSeat, setSelectedSeat] = useState<null | any>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentDefaults, setStudentDefaults] = useState<StudentFormValues | null>(null);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);

  const seatsByFloor = useMemo(() => {
    const data = (seatsQuery.data ?? []).filter((f: any) => f.floor !== 0 && f.floor !== '0');
    return data.reduce<Record<string, any[]>>((acc, floorObj) => {
      const key = String(floorObj.floor ?? '1');
      if (!acc[key]) acc[key] = [];
      // Assign the seats from the floor object
      acc[key] = floorObj.seats || [];
      return acc;
    }, {});
  }, [seatsQuery.data]);

  const floors = useMemo(() =>
    Object.keys(seatsByFloor).sort((a, b) => Number(a) - Number(b)),
    [seatsByFloor]);

  useEffect(() => {
    if (floors.length > 0 && !activeFloor) {
      setActiveFloor(floors[0]);
    }
  }, [floors, activeFloor]);

  const currentSeats = useMemo(() => {
    if (!activeFloor) return [];
    return (seatsByFloor[activeFloor] || []).sort((a, b) => a.seatNumber - b.seatNumber);
  }, [seatsByFloor, activeFloor]);

  const occupancyStats = useMemo(() => {
    const total = currentSeats.length;
    const occupied = currentSeats.filter(seat => seat.students && seat.students.length > 0).length;
    return { total, occupied, vacant: total - occupied };
  }, [currentSeats]);

  const resolveOccupant = (seat: any) => {
    return seat.students?.[0] || null;
  };

  const handleFloorSelect = (f: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFloor(f);
  };

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

  const saveStudent = async (values: any) => {
    await createStudent.mutateAsync({
      payload: {
        ...values,
        fees: values.fees ? Number(values.fees) : undefined,
        time: [{ start: values.startTime, end: values.endTime }]
      }
    });
    setIsStudentModalOpen(false);
    setStudentDefaults(null);
  };

  if (seatsQuery.isLoading) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={[styles.headerPreTitle, { color: theme.muted }]}>MANAGEMENT</Text>
                <Text style={[styles.title, { color: theme.text }]}>Space Grid</Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsModalOpen(true);
                }}
                style={({ pressed }) => [
                  styles.addBtn,
                  { backgroundColor: theme.primary, shadowColor: theme.primary },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
                ]}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.summaryVal, { color: theme.primary }]}>{occupancyStats.occupied}</Text>
                <Text style={[styles.summaryLab, { color: theme.muted }]}>FILLED</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.summaryVal, { color: theme.success }]}>{occupancyStats.vacant}</Text>
                <Text style={[styles.summaryLab, { color: theme.muted }]}>VACANT</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.summaryVal, { color: theme.text }]}>{occupancyStats.total}</Text>
                <Text style={[styles.summaryLab, { color: theme.muted }]}>TOTAL</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.floorNavContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.floorNavScroll}
          >
            {floors.map((f) => {
              const active = activeFloor === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => handleFloorSelect(f)}
                  style={({ pressed }) => [
                    styles.floorTab,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                    active && styles.floorTabActive
                  ]}
                >
                  <Text style={[styles.floorTabText, { color: active ? '#fff' : theme.text }]}>LEVEL {f}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={seatsQuery.isRefetching} onRefresh={seatsQuery.refetch} tintColor={theme.primary} />}
        >
          <Animated.View
            key={activeFloor}
            entering={FadeIn.duration(400)}
            style={styles.seatsGrid}
          >
            {floors.length === 0 && !seatsQuery.isLoading ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '10' }]}>
                  <Ionicons name="grid-outline" size={48} color={theme.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Library Layout Found</Text>
                <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
                  Tap the "+" button above to create your first floor and setup your seats.
                </Text>

                <Pressable
                  onPress={() => setIsModalOpen(true)}
                  style={({ pressed }) => [
                    styles.emptyBtn,
                    { backgroundColor: theme.primary },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                  ]}
                >
                  <Text style={styles.emptyBtnText}>Setup Floor 1</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </Pressable>
              </View>
            ) : (
              currentSeats.map((item, sIdx) => {
                const occupant = resolveOccupant(item);
                const available = !occupant;
                const statusColor = available ? theme.success : theme.danger;

                return (
                  <Animated.View
                    key={item._id || `${activeFloor}-${item.seatNumber}`}
                    entering={FadeInDown.delay(sIdx * 20).duration(400)}
                    style={styles.seatWrapper}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedSeat(item);
                      }}
                      style={({ pressed }) => [
                        styles.seatCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: selectedSeat?._id === item._id ? theme.primary : theme.border,
                        },
                        pressed && styles.cardPressed
                      ]}
                    >
                      <View style={styles.seatTop}>
                        <View style={[styles.seatStatusBadge, { backgroundColor: statusColor + '15' }]}>
                          <View style={[styles.statusMiniDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.seatNumber, { color: theme.text }]}>{item.seatNumber}</Text>
                        </View>
                      </View>

                      <View style={styles.seatBodyInfo}>
                        {item.students && item.students.length > 0 ? (
                          <>
                            <Text style={[styles.seatOccupantName, { color: theme.text }]} numberOfLines={1}>
                              {item.students.length === 1
                                ? item.students[0].name
                                : `${item.students[0].name.split(' ')[0]} +${item.students.length - 1}`
                              }
                            </Text>
                            <View style={styles.shiftRow}>
                              <Ionicons name="time-outline" size={10} color={theme.primary} />
                              <Text style={[styles.seatShiftText, { color: theme.primary }]} numberOfLines={1}>
                                {item.students.length === 1
                                  ? item.students[0].shift
                                  : item.students.map((s: any) => s.shift?.[0]).join(', ')
                                }
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text style={[styles.seatOccupantName, { color: theme.muted }]}>VACANT</Text>
                        )}
                      </View>

                      <View style={[styles.indicatorLine, { backgroundColor: statusColor }]} />
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>
        </ScrollView>


        {/* Configure Seats Modal */}
        <Modal animationType="fade" transparent visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Setup Floor</Text>
                <Pressable onPress={() => setIsModalOpen(false)}>
                  <Ionicons name="close" size={24} color={theme.muted} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.muted }]}>Floor Level</Text>
                    <TextInput
                      value={floor}
                      onChangeText={setFloor}
                      keyboardType="numeric"
                      style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
                    />
                  </View>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: theme.muted }]}>Start ID</Text>
                      <TextInput
                        value={startSeat}
                        onChangeText={setStartSeat}
                        keyboardType="numeric"
                        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: theme.muted }]}>End ID</Text>
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
                    style={{ marginTop: spacing.md, height: 56, borderRadius: 16 }}
                  >
                    Generate Layout
                  </AppButton>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Seat Detail Modal */}
        <Modal animationType="slide" transparent visible={Boolean(selectedSeat)} onRequestClose={() => setSelectedSeat(null)}>
          <Pressable style={styles.sheetOverlay} onPress={() => setSelectedSeat(null)}>
            <Animated.View entering={FadeInDown} style={[styles.sheetContent, { backgroundColor: theme.surface }]}>
              <View style={styles.sheetHandle} />
              {selectedSeat && (
                <View style={styles.sheetInner}>
                  <View style={styles.sheetHeaderRow}>
                    <View>
                      <Text style={[styles.sheetTitle, { color: theme.text }]}>Seat {selectedSeat.seatNumber}</Text>
                      <Text style={[styles.sheetSubtitle, { color: theme.muted }]}>Floor {selectedSeat.floor}</Text>
                    </View>
                    {(() => {
                      const count = selectedSeat.students?.length || 0;
                      return <AppBadge tone={count > 0 ? 'danger' : 'success'}>{count > 0 ? `${count} OCCUPIED` : 'VACANT'}</AppBadge>
                    })()}
                  </View>

                  <View style={[styles.sheetBody, { borderTopColor: theme.border + '50' }]}>
                    {(!selectedSeat.students || selectedSeat.students.length === 0) ? (
                      <View style={styles.vacantState}>
                        <Text style={[styles.vacantText, { color: theme.muted }]}>This seat is currently empty.</Text>
                        <AppButton
                          onPress={() => {
                            setStudentDefaults({
                              name: '',
                              number: '',
                              joiningDate: new Date().toISOString().slice(0, 10),
                              seat: selectedSeat._id ?? '',
                              shift: 'Morning',
                              startTime: '09:00',
                              endTime: '18:00',
                              status: 'Active',
                              fees: '',
                              gender: 'Male',
                              notes: '',
                              profilePicture: ''
                            });
                            setIsStudentModalOpen(true);
                            setSelectedSeat(null);
                          }}
                          fullWidth
                          style={{ height: 56, borderRadius: 16 }}
                        >
                          Assign Member
                        </AppButton>
                      </View>
                    ) : (
                      <View style={styles.occupantDetails}>
                          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                            {selectedSeat.students.map((occupant: any, idx: number) => (
                              <View key={occupant._id} style={[styles.occupantItem, idx !== 0 && { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.border + '40' }]}>
                                <View style={styles.occupantMain}>
                                  <View style={[styles.occupantAvatar, { backgroundColor: theme.primary + '10', overflow: 'hidden' }]}>
                                    {occupant.profilePicture ? (
                                      <Image
                                        source={{ uri: occupant.profilePicture }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        transition={1000}
                                        placeholder={BLURHASH}
                                      />
                                    ) : (
                                      <Text style={[styles.avatarText, { color: theme.primary }]}>{occupant.name[0].toUpperCase()}</Text>
                                    )}
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.occupantName, { color: theme.text }]} numberOfLines={1}>{occupant.name}</Text>
                                    <Text style={[styles.occupantPhone, { color: theme.muted }]}>{occupant.number}</Text>
                                  </View>
                                  <TouchableOpacity
                                    onPress={() => {
                                      setSelectedSeat(null);
                                      router.push({ pathname: '/(tabs)/students/[id]', params: { id: occupant._id } });
                                    }}
                                    style={[styles.miniActionBtn, { backgroundColor: theme.primary + '10' }]}
                                  >
                                    <Ionicons name="chevron-forward" size={18} color={theme.primary} />
                                  </TouchableOpacity>
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
                              </View>
                            ))}
                          </ScrollView>

                          <View style={styles.sheetActions}>
                            <AppButton
                              fullWidth
                              variant="primary"
                              style={{ height: 54, borderRadius: 16 }}
                              onPress={() => {
                                setStudentDefaults({
                                  name: '',
                                  number: '',
                                  joiningDate: new Date().toISOString().slice(0, 10),
                                  seat: selectedSeat._id ?? '',
                                  shift: 'Morning',
                                  startTime: '09:00',
                                  endTime: '18:00',
                                  status: 'Active',
                                  fees: '',
                                  gender: 'Male',
                                  notes: '',
                                  profilePicture: ''
                                });
                                setIsStudentModalOpen(true);
                                setSelectedSeat(null);
                              }}
                            >
                              Assign Another Shift
                            </AppButton>
                          </View>
                        </View>
                    )}
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
            seats={(seatsQuery.data ?? []).flatMap((f: any) =>
              (f.seats || []).map((s: any) => ({
                _id: s._id,
                seatNumber: String(s.seatNumber),
                floor: f.floor
              }))
            )}
            theme={theme}
            isSubmitting={createStudent.isPending}
            title="Add Member"
          />
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLab: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  floorNavContainer: {
    paddingVertical: spacing.md,
  },
  floorNavScroll: {
    paddingHorizontal: spacing.xl,
    gap: 10,
  },
  floorTab: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  floorTabText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
  },
  seatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  seatWrapper: {
    width: (width - spacing.xl * 2 - 24) / 3,
  },
  seatCard: {
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    height: 110,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  seatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seatStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  seatNumber: {
    fontSize: 13,
    fontWeight: '900',
  },
  seatBodyInfo: {
    gap: 2,
  },
  seatOccupantName: {
    fontSize: 12,
    fontWeight: '800',
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatShiftText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  indicatorLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', gap: 12 },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  sheetInner: {
    paddingHorizontal: 24,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.6,
  },
  sheetBody: {
    paddingTop: 24,
    borderTopWidth: 1,
  },
  vacantState: {
    paddingVertical: 24,
    gap: 24,
  },
  vacantText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.5,
  },
  occupantDetails: { gap: 24 },
  occupantMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  occupantAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  occupantItem: {
    gap: 12,
  },
  miniActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  occupantName: {
    fontSize: 22,
    fontWeight: '900',
  },
  occupantPhone: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.6,
  },
  occupantGrid: {
    flexDirection: 'row',
    gap: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 24,
    borderRadius: 24,
  },
  gridItem: { gap: 6 },
  gridLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    opacity: 0.5,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  sheetActions: { marginTop: 8 },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 12,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
