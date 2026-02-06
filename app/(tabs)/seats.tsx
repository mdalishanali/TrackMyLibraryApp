import { useState, useMemo, useEffect } from 'react';
import { Image } from 'expo-image';
import {
  Alert,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Linking
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ScrollView,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { radius, spacing } from '@/constants/design';
import { useCreateSeats, useSeatsQuery, useDeleteSeats, useDeleteFloor, useRenameSection } from '@/hooks/use-seats';
import { useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/use-students';
import { useTheme } from '@/hooks/use-theme';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { ChangeSeatModal } from '@/components/students/change-seat-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/utils/format';

const { width, height } = Dimensions.get('window');
const isTablet = width > 500;
const numColumns = isTablet ? 3 : 2;
const gridGap = 12;
const sidePadding = spacing.xl;
const cardWidth = (width - (sidePadding * 2) - (gridGap * (numColumns - 1))) / numColumns;
const BLURHASH = 'L9E:C[^+^j0000.8?v~q00?v%MoL';

export default function SeatsScreen() {
  const theme = useTheme();
  const seatsQuery = useSeatsQuery();
  const createSeats = useCreateSeats();
  const deleteSeats = useDeleteSeats();
  const deleteFloor = useDeleteFloor();
  const renameSection = useRenameSection();
  const router = useRouter();
  const createStudent = useCreateStudent();
  const { setup } = useLocalSearchParams();

  const [studentDefaults, setStudentDefaults] = useState<(StudentFormValues & { _id?: string }) | null>(null);
  const updateStudent = useUpdateStudent(studentDefaults?._id);
  const deleteStudent = useDeleteStudent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionSet, setSelectionSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (setup === 'true') {
      setIsModalOpen(true);
      // Clear the param so it doesn't open again on tab clicks
      router.setParams({ setup: undefined } as any);
    }
  }, [setup]);
  const [floor, setFloor] = useState('');
  const [startSeat, setStartSeat] = useState('');
  const [endSeat, setEndSeat] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<null | any>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isChangeSeatModalOpen, setIsChangeSeatModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [seatChangeTarget, setSeatChangeTarget] = useState<any>(null);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    type: 'create' | 'delete' | 'deleteFloor' | 'deleteStudent';
  }>({
    visible: false,
    title: '',
    description: '',
    onConfirm: () => {},
    type: 'delete',
  });

  const seatsByFloor = useMemo(() => {
    const data = (seatsQuery.data ?? []);
    return data.reduce<Record<string, any[]>>((acc, floorObj) => {
      const key = String(floorObj.floor ?? '1');
      if (!acc[key]) acc[key] = [];
      // Assign the seats from the floor object
      acc[key] = floorObj.seats || [];
      return acc;
    }, {});
  }, [seatsQuery.data]);

  const floors = useMemo(() =>
    Object.keys(seatsByFloor)
      .filter(f => f !== '0')
      .sort((a, b) => Number(a) - Number(b)),
    [seatsByFloor]);

  useEffect(() => {
    if (floors.length > 0 && !activeFloor) {
      // Prioritize Floor 1 or first real floor over Floor 0
      const defaultFloor = floors.find(f => f !== '0') || floors[0];
      setActiveFloor(defaultFloor);
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

  const handleRenameSection = async () => {
    if (!renamingSection || !newSectionName.trim()) return;
    
    try {
      await renameSection.mutateAsync({
        oldFloor: renamingSection,
        newFloor: newSectionName.trim()
      });
      setActiveFloor(newSectionName.trim());
      setIsRenameModalOpen(false);
      setRenamingSection(null);
      setNewSectionName('');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const onCreateSeats = () => {
    setIsModalOpen(false);

    setConfirmConfig({
      visible: true,
      title: 'Create Seats',
      description: `Are you sure you want to create seats on floor ${floor} starting from seat ${startSeat} to ${endSeat}?`,
      type: 'create',
      onConfirm: async () => {
        try {
          await createSeats.mutateAsync({
            floor: floor,
            startSeat: Number(startSeat),
            endSeat: Number(endSeat),
          });
          setConfirmConfig(prev => ({ ...prev, visible: false }));
        } catch (error) {
          Alert.alert('Error', (error as Error).message);
        }
      }
    });
  };

  const saveStudent = async (values: any) => {
    const payload = {
      ...values,
      fees: values.fees ? Number(values.fees) : undefined,
      time: [{ start: values.startTime, end: values.endTime }]
    };

    if (studentDefaults?._id) {
      await updateStudent.mutateAsync({ payload });
    } else {
      await createStudent.mutateAsync({ payload });
    }
    setIsStudentModalOpen(false);
    setStudentDefaults(null);
  };



  const handleEditOccupant = (occupant: any) => {
    // Capture the current seat context before closing the modal
    const currentSeatId = selectedSeat?._id;
    
    setStudentDefaults({
      _id: occupant._id,
      name: occupant.name,
      number: occupant.number,
      joiningDate: occupant.joiningDate,
      seat: currentSeatId,
      shift: occupant.shift || 'First',
      startTime: occupant.time?.[0]?.start || '09:00',
      endTime: occupant.time?.[0]?.end || '18:00',
      status: occupant.status || 'Active',
      fees: occupant.fees ? String(occupant.fees) : '',
      gender: occupant.gender || 'Male',
      notes: occupant.notes || '',
      profilePicture: occupant.profilePicture || ''
    });

    // Close the seat detail modal first
    setSelectedSeat(null);
    
    // Small delay to allow detail modal anim to finish before opening the form
    setTimeout(() => {
      setIsStudentModalOpen(true);
    }, 450);
  };

  const handleDeleteOccupant = (occupant: any) => {
    setSelectedSeat(null);
    setTimeout(() => {
      setConfirmConfig({
        visible: true,
        title: 'Delete Member',
        description: `Are you sure you want to delete ${occupant.name}? This cannot be undone.`,
        type: 'deleteStudent',
        onConfirm: async () => {
          try {
            await deleteStudent.mutateAsync(occupant._id);
            setConfirmConfig(prev => ({ ...prev, visible: false }));
          } catch (error) {
            console.error('Delete failed:', error);
          }
        }
      });
    }, 400);
  };

  const handleChangeSeat = (occupant: any) => {
    setSeatChangeTarget(occupant);
    setSelectedSeat(null);
    setTimeout(() => {
      setIsChangeSeatModalOpen(true);
    }, 450);
  };

  const handleSeatUpdate = async (newSeatId: string) => {
    if (!seatChangeTarget) return;
    try {
      await updateStudent.mutateAsync({
        id: seatChangeTarget._id,
        payload: { seat: newSeatId }
      });
      setIsChangeSeatModalOpen(false);
      setSeatChangeTarget(null);
      seatsQuery.refetch();
    } catch (error) {
      console.error('Seat update failed:', error);
    }
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
  const toggleSeatSelection = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectionSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectionSet.size === 0) return;
    
    setConfirmConfig({
      visible: true,
      title: 'Delete Seats',
      description: `Are you sure you want to delete ${selectionSet.size} selected seat(s)? This will also remove any student assignments.`,
      type: 'delete',
      onConfirm: async () => {
        try {
          await deleteSeats.mutateAsync(Array.from(selectionSet));
          setSelectionSet(new Set());
          setIsSelectionMode(false);
          setConfirmConfig(prev => ({ ...prev, visible: false }));
        } catch (error) {
          console.error('Bulk delete failed:', error);
        }
      }
    });
  };

  const handleSingleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSeat(null); 
    
    // Tiny delay to let the detail modal close before opening confirmation
    setTimeout(() => {
      setConfirmConfig({
        visible: true,
        title: 'Delete Seat',
        description: 'Are you sure you want to delete this seat? This will also remove any student assignments.',
        type: 'delete',
        onConfirm: async () => {
          try {
            await deleteSeats.mutateAsync([id]);
            setConfirmConfig(prev => ({ ...prev, visible: false }));
          } catch (error) {
            console.error('Delete failed:', error);
          }
        }
      });
    }, 350);
  };

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
              <View style={styles.headerActions}>
                {isSelectionMode ? (
                  <>
                    <Pressable
                      onPress={() => {
                        setIsSelectionMode(false);
                        setSelectionSet(new Set());
                      }}
                      style={[styles.headerIconBtn, { backgroundColor: theme.surfaceAlt }]}
                    >
                      <Ionicons name="close" size={20} color={theme.text} />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const allIds = currentSeats.map(s => s._id);
                        const isAllSelected = allIds.every(id => selectionSet.has(id));

                        if (isAllSelected) {
                          setSelectionSet(new Set());
                        } else {
                          setSelectionSet(new Set(allIds));
                        }
                      }}
                      style={[styles.headerIconBtn, { backgroundColor: theme.surfaceAlt }]}
                    >
                      <Ionicons name="checkmark-done-outline" size={20} color={theme.primary} />
                    </Pressable>
                    <Pressable
                      onPress={handleBulkDelete}
                      disabled={selectionSet.size === 0}
                      style={[
                        styles.headerIconBtn, 
                        { backgroundColor: theme.danger + '15' },
                        selectionSet.size === 0 && { opacity: 0.5 }
                      ]}
                    >
                      <Ionicons name="trash" size={20} color={theme.danger} />
                      {selectionSet.size > 0 && (
                        <View style={[styles.selectionBadge, { backgroundColor: theme.danger }]}>
                          <Text style={styles.selectionBadgeText}>{selectionSet.size}</Text>
                        </View>
                      )}
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => setIsSelectionMode(true)}
                      style={[styles.headerIconBtn, { backgroundColor: theme.surfaceAlt }]}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.text} />
                    </Pressable>
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
                  </>
                )}
              </View>
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
                  onLongPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    Alert.alert(
                      `Section: ${f}`,
                      "Manage this section's name or layout.",
                      [
                        { 
                          text: "Rename Section", 
                          onPress: () => {
                            setRenamingSection(f);
                            setNewSectionName(f);
                            setIsRenameModalOpen(true);
                          }
                        },
                        { 
                          text: "Delete Section", 
                          style: "destructive", 
                          onPress: () => {
                            setConfirmConfig({
                              visible: true,
                              title: `Delete Section ${f}?`,
                              description: `Are you sure you want to delete Section ${f}? All seats and student assignments in this section will be permanently removed.`,
                              type: 'deleteFloor',
                              onConfirm: async () => {
                                try {
                                  await deleteFloor.mutateAsync(f);
                                  setConfirmConfig(prev => ({ ...prev, visible: false }));
                                  const remaining = floors.filter(fl => fl !== f);
                                  if (remaining.length > 0) setActiveFloor(remaining[0]);
                                  else setActiveFloor(null);
                                } catch (error) {
                                  Alert.alert('Error', (error as Error).message);
                                }
                              }
                            });
                          }
                        },
                        { text: "Cancel", style: "cancel" }
                      ]
                    );
                  }}
                  style={({ pressed }) => [
                    styles.floorTab,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                      opacity: pressed ? 0.8 : 1,
                      flexDirection: 'row',
                      gap: 6
                    },
                    active && styles.floorTabActive
                  ]}
                >
                  <Text style={[styles.floorTabText, { color: active ? '#fff' : theme.text }]}>
                    {f === '0' ? 'OTHERS' : f.toString().toUpperCase()}
                  </Text>
                  {active && f !== '0' && (
                    <Ionicons name="pencil" size={10} color="#fff" style={{ opacity: 0.8 }} />
                  )}
                </Pressable>
              );
            })}

            {/* Manage Sections Gear */}
            {floors.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // Open a quick menu for the current active floor
                  if (activeFloor) {
                    Alert.alert(
                      `Manage Section: ${activeFloor}`,
                      "What would you like to do?",
                      [
                        {
                          text: "Rename Section",
                          onPress: () => {
                            setRenamingSection(activeFloor);
                            setNewSectionName(activeFloor);
                            setIsRenameModalOpen(true);
                          }
                        },
                        { text: "Cancel", style: "cancel" }
                      ]
                    );
                  }
                }}
                style={[styles.floorTab, {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  width: 48,
                  paddingHorizontal: 0
                }]}
              >
                <Ionicons name="settings-outline" size={18} color={theme.muted} />
              </TouchableOpacity>
            )}
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
            {floors.filter(f => f !== '0').length === 0 && !seatsQuery.isLoading ? (
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
                  <Text style={styles.emptyBtnText}>Setup Section 1</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </Pressable>
              </View>
            ) : (
              currentSeats.map((item, sIdx) => {
                const occupant = resolveOccupant(item);
                const available = !occupant;
                const statusColor = available ? theme.success : theme.danger;

                const isSelected = selectionSet.has(item._id);

                return (
                  <Animated.View
                    key={item._id || `${activeFloor}-${item.seatNumber}`}
                    entering={FadeInDown.delay(sIdx * 20).duration(400)}
                    style={{ width: cardWidth, marginBottom: gridGap }}
                  >
                    <Pressable
                      onPress={() => {
                        if (isSelectionMode) {
                          toggleSeatSelection(item._id);
                        } else {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedSeat(item);
                        }
                      }}
                      onLongPress={() => {
                        if (!isSelectionMode) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setIsSelectionMode(true);
                          toggleSeatSelection(item._id);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.seatCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: isSelected ? theme.primary : (selectedSeat?._id === item._id ? theme.primary : theme.border),
                        },
                        isSelected && styles.seatCardSelected,
                        pressed && styles.cardPressed
                      ]}
                    >
                      {isSelectionMode && (
                        <View style={[styles.seatSelectedIndicator, { backgroundColor: isSelected ? theme.primary : theme.surfaceAlt, borderColor: isSelected ? theme.primary : theme.border }]}>
                          <Ionicons name={isSelected ? "checkmark" : "add"} size={14} color={isSelected ? "#fff" : theme.muted} />
                        </View>
                      )}
                      
                      <View style={styles.seatCardHeader}>
                        <View style={[styles.seatStatusBadge, { backgroundColor: statusColor + '15' }]}>
                          <View style={[styles.statusMiniDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.seatNumber, { color: theme.text }]}>{item.seatNumber}</Text>
                        </View>

                        {occupant && (
                          <Image
                            source={{ uri: occupant.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(occupant.name)}&background=0D8ABC&color=fff` }}
                            style={styles.miniAvatar}
                            contentFit="cover"
                            transition={500}
                            placeholder={BLURHASH}
                          />
                        )}
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
                                  : Array.from(new Set(item.students.map((s: any) => s.shift))).join(', ')
                                }
                              </Text>
                            </View>
                          </>
                        ) : (
                            <Text style={[styles.seatOccupantName, { color: theme.muted, opacity: 0.5 }]}>VACANT</Text>
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Setup Section</Text>
                <Pressable onPress={() => setIsModalOpen(false)}>
                  <Ionicons name="close" size={24} color={theme.muted} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.muted }]}>Section Name / #</Text>
                    <TextInput
                      value={floor}
                      onChangeText={setFloor}
                      keyboardType="default"
                      placeholder="e.g. Ground A, Hall 1"
                      placeholderTextColor={theme.muted + '80'}
                      style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
                    />
                  </View>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: theme.muted }]}>Start ID (Max 500)</Text>
                      <TextInput
                        value={startSeat}
                        onChangeText={text => {
                          const num = parseInt(text);
                          if (!text || (num >= 0 && num <= 500)) setStartSeat(text);
                        }}
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor={theme.muted + '80'}
                        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: theme.muted }]}>End ID (Max 500)</Text>
                      <TextInput
                        value={endSeat}
                        onChangeText={text => {
                          const num = parseInt(text);
                          if (!text || (num >= 0 && num <= 500)) setEndSeat(text);
                        }}
                        keyboardType="numeric"
                        placeholder="10"
                        placeholderTextColor={theme.muted + '80'}
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
          <View style={styles.sheetOverlay}>
            <Pressable
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={() => setSelectedSeat(null)}
            />
            <Animated.View
              entering={FadeInDown}
              style={[styles.sheetContent, { backgroundColor: theme.surface, maxHeight: height * 0.85 }]}
            >
              <View style={styles.sheetHandle} />
              {selectedSeat && (
                <View style={styles.sheetInner}>
                  <View style={styles.sheetHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetTitle, { color: theme.text }]}>Seat {selectedSeat.seatNumber}</Text>
                      <Text style={[styles.sheetSubtitle, { color: theme.muted }]}>Section {selectedSeat.floor}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {(() => {
                        const count = selectedSeat.students?.filter((s: any) => s.status === 'Active').length || 0;
                        return <AppBadge tone={count > 0 ? 'danger' : 'success'}>{count > 0 ? `${count} OCCUPIED` : 'VACANT'}</AppBadge>
                      })()}
                      <TouchableOpacity 
                        onPress={() => handleSingleDelete(selectedSeat._id)}
                        style={[
                          styles.miniDeleteBtn,
                          { backgroundColor: theme.danger + '10' }
                        ]}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
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
                        <>
                          <ScrollView
                            style={{ maxHeight: 500 }}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ paddingBottom: 24 }}
                          >
                            {selectedSeat.students.map((occupant: any, idx: number) => (
                              <View key={occupant._id} style={[styles.occupantItem, idx !== 0 && { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: theme.border + '40' }]}>
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

                                    <View style={styles.sheetSmallActions}>
                                      <TouchableOpacity
                                        onPress={() => {
                                          setSelectedSeat(null);
                                          // Small delay ensures navigation starts after modal is dismissed
                                          setTimeout(() => {
                                            router.push(`/student-detail/${occupant._id}?backTo=seats`);
                                          }, 400);
                                        }}
                                        style={[styles.smallBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                                      >
                                        <Ionicons name="eye-outline" size={14} color={theme.text} />
                                        <Text style={[styles.smallBtnText, { color: theme.text }]}>View</Text>
                                      </TouchableOpacity>

                                      <TouchableOpacity
                                        onPress={() => handleEditOccupant(occupant)}
                                        style={[styles.smallBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                                      >
                                        <Ionicons name="create-outline" size={14} color={theme.text} />
                                        <Text style={[styles.smallBtnText, { color: theme.text }]}>Edit</Text>
                                      </TouchableOpacity>

                                      <TouchableOpacity
                                        onPress={() => handleChangeSeat(occupant)}
                                        style={[styles.smallBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                                      >
                                        <Ionicons name="swap-horizontal-outline" size={14} color={theme.text} />
                                        <Text style={[styles.smallBtnText, { color: theme.text }]}>Seat</Text>
                                      </TouchableOpacity>

                                      <View style={{ flex: 1 }} />



                                      <TouchableOpacity
                                        onPress={() => handleDeleteOccupant(occupant)}
                                        style={[styles.smallIconBtn, { backgroundColor: theme.danger + '10', borderColor: theme.border }]}
                                      >
                                        <Ionicons name="trash-outline" size={16} color={theme.danger} />
                                      </TouchableOpacity>
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
                      </>
                    )}
                  </View>
                </View>
              )}
            </Animated.View>
          </View>
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
            isSubmitting={createStudent.isPending || updateStudent.isPending}
            title={studentDefaults._id ? 'Edit Member' : 'Add Member'}
          />
        )}

        <ChangeSeatModal
          visible={isChangeSeatModalOpen}
          onClose={() => {
            setIsChangeSeatModalOpen(false);
            setSeatChangeTarget(null);
          }}
          onConfirm={handleSeatUpdate}
          currentSeatId={seatChangeTarget?.seat}
          seats={(seatsQuery.data ?? []).flatMap((f: any) =>
            (f.seats || []).map((s: any) => ({
              _id: s._id,
              seatNumber: String(s.seatNumber),
              floor: f.floor
            }))
          )}
          theme={theme}
          isSubmitting={updateStudent.isPending}
          studentName={seatChangeTarget?.name || ''}
        />

        <Modal
          visible={isRenameModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsRenameModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.surface, width: '90%' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Rename Section</Text>
                <Pressable onPress={() => setIsRenameModalOpen(false)}>
                  <Ionicons name="close" size={24} color={theme.muted} />
                </Pressable>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.muted }]}>New Section Name</Text>
                  <TextInput
                    value={newSectionName}
                    onChangeText={setNewSectionName}
                    autoFocus
                    autoCapitalize="words"
                    placeholder="e.g. Ground A, Hall 1"
                    placeholderTextColor={theme.muted}
                    style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <AppButton
                    variant="outline"
                    onPress={() => setIsRenameModalOpen(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    onPress={handleRenameSection}
                    loading={renameSection.isPending}
                    style={{ flex: 1 }}
                    disabled={!newSectionName.trim() || newSectionName === renamingSection}
                  >
                    Rename
                  </AppButton>
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>

        <ConfirmDialog
          visible={confirmConfig.visible}
          title={confirmConfig.title}
          description={confirmConfig.description}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(prev => ({ ...prev, visible: false }))}
          destructive={confirmConfig.type === 'delete' || confirmConfig.type === 'deleteFloor' || confirmConfig.type === 'deleteStudent'}
          loading={
            confirmConfig.type === 'delete' ? deleteSeats.isPending : 
            confirmConfig.type === 'deleteFloor' ? deleteFloor.isPending : 
            confirmConfig.type === 'deleteStudent' ? deleteStudent.isPending :
            createSeats.isPending
          }
        />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectionBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  seatCardSelected: {
    borderWidth: 2,
  },
  seatSelectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  miniDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: gridGap,
  },
  seatCard: {
    borderRadius: 24,
    padding: 14,
    borderWidth: 1.5,
    height: 135,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  seatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  seatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seatStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
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
  occupantDetails: {
    gap: 24,
  },
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
  sheetActions: { marginTop: 12 },
  sheetSmallActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  smallIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
