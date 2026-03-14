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
import { useCreateSeats, useSeatsQuery, useDeleteSeats, useDeleteFloor, useRenameSection, useUpdateSeat } from '@/hooks/use-seats';
import { useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/use-students';
import { useShiftsQuery } from '@/hooks/use-shifts';
import { useTheme } from '@/hooks/use-theme';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { StatusBadges } from '@/components/students/StudentSummary';
import { ChangeSeatModal } from '@/components/students/change-seat-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { showToast } from '@/lib/toast';
import { useScreenView } from '@/hooks/use-screen-view';
import { formatDate } from '@/utils/format';

const { width, height } = Dimensions.get('window');
const isTablet = width > 500;
const numColumns = isTablet ? 3 : 2;
const gridGap = 8;
const sidePadding = 14;
const cardWidth = (width - (sidePadding * 2) - (gridGap * (numColumns - 1))) / numColumns;
const BLURHASH = 'L9E:C[^+^j0000.8?v~q00?v%MoL';

export default function SeatsScreen() {
  const theme = useTheme();

  // Track screen view
  useScreenView('Seats');

  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const seatsQuery = useSeatsQuery(selectedShift);
  const createSeats = useCreateSeats();
  const deleteSeats = useDeleteSeats();
  const deleteFloor = useDeleteFloor();
  const renameSection = useRenameSection();
  const updateSeat = useUpdateSeat();
  const { data: shifts = [] } = useShiftsQuery();
  const router = useRouter();
  const createStudent = useCreateStudent();
  const { setup } = useLocalSearchParams();

  const [studentDefaults, setStudentDefaults] = useState<(StudentFormValues & { _id?: string }) | null>(null);
  const updateStudent = useUpdateStudent(studentDefaults?._id);
  const deleteStudent = useDeleteStudent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionSet, setSelectionSet] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [seatNotes, setSeatNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  useEffect(() => {
    if (setup === 'true') {
      handleOpenAddSeats();
      // Clear the param so it doesn't open again on tab clicks
      router.setParams({ setup: undefined } as any);
    }
  }, [setup]);
  const [floor, setFloor] = useState('Section 1');
  const [startSeat, setStartSeat] = useState('1');
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

  const paymentFilters = [
    { label: 'Paid', value: 'Paid', color: theme.success },
    { label: 'Unpaid', value: 'Unpaid', color: theme.danger },
    { label: 'Trial', value: 'Trial', color: theme.warning },
  ];

  const getFilteredStudents = (students: any[]) => {
    if (!students) return [];

    // Find current shift info to match backend logic
    const currentShiftObj = shifts.find(s => s.name === selectedShift);
    const fStart = currentShiftObj?.startTime;
    const fEnd = currentShiftObj?.endTime;
    const isFullDay = fStart === '00:00' && fEnd === '23:59';

    return students.filter((s: any) => {
      let matchesShift = !selectedShift;

      if (selectedShift) {
        if (isFullDay) {
          // Exact match on name for full day shifts
          matchesShift = s.shift?.toLowerCase().includes(selectedShift.toLowerCase()) ||
            s.shiftNames?.some((sn: string) => sn.toLowerCase().includes(selectedShift.toLowerCase()));
        } else if (fStart && fEnd) {
          // Time overlap logic for partial shifts (e.g. Full Day student covers Morning slot)
          matchesShift = s.shiftTimes?.some((st: any) => {
            return fStart < st.endTime && st.startTime < fEnd;
          }) || s.shift?.toLowerCase().includes(selectedShift.toLowerCase());
        } else {
          matchesShift = s.shift?.toLowerCase().includes(selectedShift.toLowerCase());
        }
      }

      let matchesPayment = true;
      if (selectedPayment) {
        if (selectedPayment === 'Unpaid') {
          matchesPayment = s.paymentStatus === 'Unpaid' || s.paymentStatus === 'Trial';
        } else {
          matchesPayment = s.paymentStatus === selectedPayment;
        }
      }

      const matchesSearch = !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.number.includes(searchQuery);

      return matchesShift && matchesPayment && matchesSearch;
    });
  };

  const currentSeats = useMemo(() => {
    if (!activeFloor) return [];
    let baseSeats = (seatsByFloor[activeFloor] || [])
      // Guard: skip any seat that has no valid _id or seatNumber (data integrity)
      .filter((s: any) => s._id && s.seatNumber != null)
      .sort((a, b) => a.seatNumber - b.seatNumber);

    // Filter by payment status
    if (selectedPayment) {
      baseSeats = baseSeats.filter(seat => {
        const filtered = getFilteredStudents(seat.students || []);
        if (filtered.length === 0 && (!seat.students || seat.students.length === 0)) return true; // Vacant seats stay
        return filtered.length > 0;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      baseSeats = baseSeats.filter(seat => {
        // Always show seat if number matches
        if (String(seat.seatNumber).includes(query)) return true;

        // Otherwise, checking if ANY student matching OTHER filters also matches search
        const filtered = getFilteredStudents(seat.students || []);
        return filtered.length > 0; // getFilteredStudents already checks matchesSearch
      });
    }

    return baseSeats;
  }, [seatsByFloor, activeFloor, selectedPayment, searchQuery]);

  useEffect(() => {
    if (selectedSeat) {
      setSeatNotes(selectedSeat.notes || '');
    }
  }, [selectedSeat]);

  const handleUpdateSeatDetails = async () => {
    if (!selectedSeat) return;
    setIsUpdatingNotes(true);
    try {
      await updateSeat.mutateAsync({
        id: selectedSeat._id,
        notes: seatNotes,
        status: selectedSeat.status
      });
      setSelectedSeat({ ...selectedSeat, notes: seatNotes });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Seat notes updated successfully', 'success');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast((error as Error).message, 'error');
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const occupancyStats = useMemo(() => {
    const total = currentSeats.length;
    const occupied = currentSeats.filter(seat => {
      const filtered = getFilteredStudents(seat.students || []);
      return filtered.length > 0;
    }).length;
    return { total, occupied, vacant: total - occupied };
  }, [currentSeats, selectedShift, selectedPayment, searchQuery]);




  const resolveOccupant = (seat: any) => {
    const filtered = getFilteredStudents(seat.students || []);
    const student = filtered[0];
    if (!student) return null;

    // Enrich with daysOverdue for dashboard display
    if (student.daysOverdue === undefined) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (student.paymentStatus === 'Trial') {
        const joined = new Date(student.joiningDate || today);
        joined.setHours(0, 0, 0, 0);
        student.daysOverdue = Math.max(0, Math.floor((today.getTime() - joined.getTime()) / 86400000));
      } else if (student.paymentStatus === 'Unpaid' && (student.lastPayment?.endDate || student.endDate)) {
        const end = new Date(student.lastPayment?.endDate || student.endDate);
        end.setHours(0, 0, 0, 0);
        student.daysOverdue = Math.max(0, Math.floor((today.getTime() - end.getTime()) / 86400000));
      }
    }

    return student;
  };

  const handleFloorSelect = (f: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFloor(f);
  };

  const handleOpenAddSeats = () => {
    const floorToUse = activeFloor || 'Section 1';
    const seats = currentSeats;
    const lastSeatNumber = (seats && seats.length > 0)
      ? Math.max(...seats.map(s => Number(s.seatNumber || 0)))
      : 0;

    setFloor(floorToUse);
    setStartSeat(String(lastSeatNumber + 1));
    setEndSeat('');
    setIsModalOpen(true);
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
    const selectedShifts = shifts.filter(s => values.shift?.includes(s._id));
    const payload = {
      ...values,
      allocations: values.shift,
      shift: selectedShifts.map(s => s.name).join(', ') || 'Custom',
      fees: values.fees ? Number(values.fees) : undefined,
      time: selectedShifts.map(s => ({ start: s.startTime, end: s.endTime }))
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
      shift: (() => {
        if (occupant.allocations && occupant.allocations.length > 0) {
          return occupant.allocations.map((a: any) => typeof a === 'string' ? a : a._id);
        }
        // Fallback for old data: match by shift name or take first shift
        const matched = shifts.filter(s => s.name === occupant.shift).map(s => s._id);
        return matched.length > 0 ? matched : (shifts[0] ? [shifts[0]._id] : []);
      })(),
      startTime: occupant.time?.[0]?.start || (shifts[0]?.startTime || '09:00'),
      endTime: occupant.time?.[0]?.end || (shifts[0]?.endTime || '18:00'),
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={seatsQuery.isRefetching} onRefresh={seatsQuery.refetch} tintColor={theme.primary} />}
        >
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
                            handleOpenAddSeats();
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

              <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Ionicons name="search" size={18} color={theme.muted} />
                  <TextInput
                    placeholder="Find student or seat..."
                    placeholderTextColor={theme.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color={theme.muted} />
                    </TouchableOpacity>
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
                        gap: 8,
                        paddingHorizontal: 16,
                        height: 44,
                      },
                      active && styles.floorTabActive
                    ]}
                  >
                    <Text style={[styles.floorTabText, { color: active ? '#fff' : theme.text, fontSize: 13, fontWeight: '900' }]}>
                      {f === '0' ? 'OTHERS' : f.toString().toUpperCase()}
                    </Text>
                    {active && f !== '0' && (
                      <Ionicons name="pencil" size={12} color="#fff" style={{ opacity: 0.8 }} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={[styles.filterContainer, { marginTop: -8 }]}>
            {/* SHIFT ROW */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: theme.muted }]}>SHIFT</Text>
                <TouchableOpacity
                  onPress={() => setSelectedShift(null)}
                  style={[styles.filterChip, !selectedShift && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                >
                  <Text style={[styles.filterChipText, { color: !selectedShift ? '#fff' : theme.text }]}>ALL</Text>
                </TouchableOpacity>
                {shifts.map(shift => (
                  <TouchableOpacity
                    key={shift._id}
                    onPress={() => setSelectedShift(shift.name === selectedShift ? null : shift.name)}
                    style={[styles.filterChip, selectedShift === shift.name && { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}
                  >
                    <Text style={[styles.filterChipText, { color: selectedShift === shift.name ? theme.primary : theme.text }]}>{shift.name.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* DUES ROW */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterScroll, { marginTop: 8 }]}>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: theme.muted }]}>DUES</Text>
                <TouchableOpacity
                  onPress={() => setSelectedPayment(null)}
                  style={[styles.filterChip, !selectedPayment && { backgroundColor: theme.text, borderColor: theme.text }]}
                >
                  <Text style={[styles.filterChipText, { color: !selectedPayment ? '#fff' : theme.text }]}>ALL</Text>
                </TouchableOpacity>
                {paymentFilters.map(pf => (
                  <TouchableOpacity
                    key={pf.value}
                    onPress={() => setSelectedPayment(pf.value === selectedPayment ? null : pf.value)}
                    style={[styles.filterChip, selectedPayment === pf.value && { backgroundColor: pf.color + '15', borderColor: pf.color }]}
                  >
                    <Text style={[styles.filterChipText, { color: selectedPayment === pf.value ? pf.color : theme.text }]}>{pf.label.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.floorNavHint, { paddingHorizontal: sidePadding, marginBottom: 10, marginTop: -4 }]}>
            <Ionicons name="information-circle-outline" size={12} color={theme.muted} />
            <Text style={[styles.floorNavHintText, { color: theme.muted }]}>
              Long press section to rename or delete
            </Text>
          </View>

          <View style={{ position: 'relative' }}>
            {/* Filter loading overlay */}
            {seatsQuery.isFetching && !seatsQuery.isLoading && (
              <Animated.View
                entering={FadeIn.duration(150)}
                style={[
                  styles.filterLoadingOverlay,
                  { backgroundColor: theme.background + 'CC' }
                ]}
              >
                <View style={[styles.filterLoadingPill, { backgroundColor: theme.surface, shadowColor: theme.primary }]}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.filterLoadingText, { color: theme.text }]}>Applying filter…</Text>
                </View>
              </Animated.View>
            )}

            <Animated.View
              key={activeFloor}
              entering={FadeIn.duration(400)}
              style={[styles.seatsGrid, seatsQuery.isFetching && !seatsQuery.isLoading && { opacity: 0.4 }]}
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
                    onPress={handleOpenAddSeats}
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
                  <>
                    {/* "Add More Seats" Card */}
                    {!isSelectionMode && (
                      <Animated.View
                        entering={FadeInDown.duration(400)}
                        style={{ width: cardWidth, marginBottom: gridGap }}
                      >
                        <Pressable
                          onPress={handleOpenAddSeats}
                          style={({ pressed }) => [
                            styles.addMoreCard,
                            {
                              backgroundColor: theme.surfaceAlt + '40',
                              borderColor: theme.border,
                              borderStyle: 'dashed',
                            },
                            pressed && styles.cardPressed
                          ]}
                        >
                          <View style={[styles.addMoreIconWrap, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="add" size={24} color={theme.primary} />
                          </View>
                          <Text style={[styles.addMoreText, { color: theme.text }]}>ADD MORE SEATS TO {activeFloor}</Text>
                        </Pressable>
                      </Animated.View>
                  )}

                  {currentSeats.map((item, sIdx) => {
                    const occupant = resolveOccupant(item);
                    const available = !occupant;
                    const statusColor = available ? theme.success : theme.primary;
                    const isMaintenance = item.status === 'maintenance';
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
                              borderColor: isSelected
                                ? theme.primary
                                : isMaintenance
                                  ? theme.warning + '60'
                                  : available
                                    ? theme.border
                                    : theme.primary + '30',
                            },
                            isSelected && styles.seatCardSelected,
                            pressed && styles.cardPressed
                          ]}
                        >
                          {/* Center Content */}
                          <View style={styles.seatCardInner}>
                            {/* Top Left: seat number + indicator */}
                            <View style={styles.seatCardTopLeft}>
                              <View style={[styles.seatDot, { backgroundColor: isMaintenance ? theme.warning : available ? theme.success : theme.primary }]} />
                              <Text style={[styles.seatNumber, { color: theme.text }]}>{item.seatNumber}</Text>
                              {item.notes && <Ionicons name="document-text" size={11} color={theme.warning} style={{ marginLeft: 2 }} />}
                              {isMaintenance && <Ionicons name="construct" size={11} color={theme.warning} style={{ marginLeft: 2 }} />}
                            </View>

                            <View style={styles.seatCardTopRight}>
                              {occupant?.paymentStatus === 'Trial' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons name="flask" size={11} color={theme.info} />
                                  <Text style={{ fontSize: 9, fontWeight: '700', color: theme.info, marginLeft: 2 }}>
                                    {occupant.daysOverdue ?? 0}d
                                  </Text>
                                </View>
                              )}
                              {occupant?.paymentStatus === 'Unpaid' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons name="alert-circle" size={11} color={theme.danger} />
                                  <Text style={{ fontSize: 9, fontWeight: '700', color: theme.danger, marginLeft: 2 }}>
                                    {occupant.daysOverdue ?? 0}d
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Center avatar/icon */}
                            <View style={styles.seatAvatarRow}>
                              {occupant ? (
                                <Image
                                  source={{ uri: occupant.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(occupant.name)}&background=0D8ABC&color=fff&bold=true` }}
                                  style={styles.seatAvatarLarge}
                                  contentFit="cover"
                                  transition={400}
                                  placeholder={BLURHASH}
                                />
                              ) : (
                                <View style={[styles.seatEmptyIconLarge, { borderColor: theme.border }]}>
                                  <Ionicons name={isMaintenance ? "construct-outline" : "add"} size={22} color={theme.muted + '80'} />
                                </View>
                              )}
                            </View>

                            {/* Bottom: name + shift OR vacant label */}
                            <View style={styles.seatCardFooter}>
                              {occupant ? (
                                <>
                                  <Text style={[styles.seatOccupantNameCenter, { color: theme.text }]} numberOfLines={1}>
                                    {getFilteredStudents(item.students!).length === 1
                                      ? occupant.name.split(' ')[0]
                                      : `${occupant.name.split(' ')[0]} +${getFilteredStudents(item.students!).length - 1}`
                                    }
                                  </Text>
                                  <View style={styles.seatShiftRowCenter}>
                                    <Text style={[styles.seatShiftChipOutlined, { color: theme.primary, borderColor: theme.primary + '40' }]} numberOfLines={1}>
                                      {occupant.shift?.split(' ')[0] ?? '—'}
                                    </Text>
                                  </View>
                                </>
                              ) : (
                                <Text style={[styles.seatVacantLabelCenter, { color: isMaintenance ? theme.warning : theme.muted + '80' }]}>
                                  {isMaintenance ? 'REPAIR' : 'AVAILABLE'}
                                </Text>
                              )}
                            </View>
                          </View>

                          {/* absolute positioned selection tick over the card */}
                          {isSelectionMode && (
                            <View style={[styles.seatSelectedIndicator, { backgroundColor: isSelected ? theme.primary : theme.surfaceAlt, borderColor: isSelected ? theme.primary : theme.border }]}>
                              <Ionicons name={isSelected ? "checkmark" : "add"} size={14} color={isSelected ? "#fff" : theme.muted} />
                            </View>
                          )}
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </>
            )}
            </Animated.View>
          </View>
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
                      <Text style={[styles.label, { color: theme.muted }]}>Start Seat No.</Text>
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
                      <Text style={[styles.label, { color: theme.muted }]}>End Seat No.</Text>
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
                    Generate Seats
                  </AppButton>
                  <View style={styles.modalNote}>
                    <Ionicons name="bulb-outline" size={14} color={theme.warning} />
                    <Text style={[styles.modalNoteText, { color: theme.muted }]}>
                      Seats will be created from {startSeat || '1'} to {endSeat || '10'} in {floor || 'new section'}. Max limit is 500 seats.
                    </Text>
                  </View>
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
                        const filtered = getFilteredStudents(selectedSeat.students || []);
                        const count = filtered.filter((s: any) => s.status === 'Active').length;
                        return <AppBadge tone={count > 0 ? 'danger' : 'success'}>
                          {count > 0 ? `${count} ${selectedShift ? selectedShift.toUpperCase() + ' ' : ''}OCCUPIED` : 'VACANT'}
                        </AppBadge>
                      })()}

                    </View>
                  </View>

                  <ScrollView
                    style={{ maxHeight: height * 0.7 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                  >
                    <View style={[styles.conditionCard, { backgroundColor: theme.surfaceAlt + '80', borderColor: theme.border }]}>
                      <View style={styles.conditionHeader}>
                        <View style={styles.conditionTitleRow}>
                          <Ionicons name="construct-outline" size={16} color={theme.warning} />
                          <Text style={[styles.conditionTitle, { color: theme.text }]}>SEAT CONDITION & MAINTENANCE</Text>
                        </View>
                        <TouchableOpacity
                          onPress={handleUpdateSeatDetails}
                          disabled={isUpdatingNotes || seatNotes === (selectedSeat.notes || '')}
                          style={[
                            styles.saveNotesBtn,
                            {
                              backgroundColor: isUpdatingNotes
                                ? theme.primary + '20'
                                : seatNotes !== (selectedSeat.notes || '')
                                  ? theme.primary
                                  : theme.primary + '10'
                            }
                          ]}
                        >
                          {isUpdatingNotes ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                          ) : (
                            <Text style={[
                              styles.saveNotesText,
                              {
                                color: seatNotes !== (selectedSeat.notes || '') ? '#fff' : theme.primary
                              }
                            ]}>
                              {seatNotes !== (selectedSeat.notes || '') ? 'SAVE' : 'SAVED'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        placeholder="Enter seat condition (e.g. Broken charger, table damp...)"
                        placeholderTextColor={theme.muted + '80'}
                        value={seatNotes}
                        onChangeText={setSeatNotes}
                        multiline
                        style={[styles.notesInput, { color: theme.text, backgroundColor: theme.surface }]}
                      />
                    </View>

                    <View style={[styles.sheetBody, { borderTopColor: theme.border + '50', marginTop: 24 }]}>
                      {(!getFilteredStudents(selectedSeat.students).length) ? (
                        <View style={styles.vacantState}>
                          <Text style={[styles.vacantText, { color: theme.muted, marginBottom: 12 }]}>
                            {selectedShift ? `No members found for ${selectedShift} shift.` : 'This seat is currently empty.'}
                          </Text>
                        </View>
                      ) : (
                          <View style={{ marginBottom: 32 }}>
                            {getFilteredStudents(selectedSeat.students).map((occupant: any, idx: number) => (
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
                                      <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={[styles.avatarText, { color: theme.primary }]}>{occupant.name[0].toUpperCase()}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Text style={[styles.occupantName, { color: theme.text, flex: 1 }]} numberOfLines={1}>{occupant.name}</Text>
                                      <StatusBadges student={occupant as any} theme={theme} />
                                    </View>
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

                                <TouchableOpacity
                                  onPress={() => Linking.openURL(`tel:${occupant.number}`)}
                                  style={[styles.smallBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                                >
                                  <Ionicons name="call-outline" size={14} color={theme.text} />
                                  <Text style={[styles.smallBtnText, { color: theme.text }]}>Call</Text>
                                  </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      <AppButton
                        onPress={() => {
                          setStudentDefaults({
                            name: '',
                            number: '',
                            joiningDate: new Date().toISOString().slice(0, 10),
                            seat: selectedSeat._id ?? '',
                            shift: shifts[0] ? [shifts[0]._id] : [],
                            startTime: shifts[0]?.startTime || '09:00',
                            endTime: shifts[0]?.endTime || '18:00',
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
                  </ScrollView>
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
            initialValues={studentDefaults!}
            seats={(seatsQuery.data ?? []).flatMap((f: any) =>
              (f.seats || []).map((s: any) => ({
                _id: s._id,
                seatNumber: String(s.seatNumber),
                floor: f.floor
              }))
            )}
            theme={theme}
            isSubmitting={createStudent.isPending || updateStudent.isPending}
            title={studentDefaults!._id ? 'Edit Member' : 'Add Member'}
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
    paddingHorizontal: sidePadding,
    paddingTop: 0,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
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
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
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
    gap: 8,
    marginTop: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  searchContainer: {
    paddingHorizontal: 0,
    marginBottom: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  conditionCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  saveNotesBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNotesText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notesInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    fontWeight: '600',
    minHeight: 80,
    textAlignVertical: 'top',
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
    paddingTop: spacing.sm,
    paddingBottom: 2,
  },
  floorNavHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: sidePadding,
    marginTop: 6,
    opacity: 0.6,
  },
  floorNavHintText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalNote: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255,165,0,0.05)',
    borderRadius: 12,
  },
  modalNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  floorNavScroll: {
    paddingHorizontal: sidePadding,
    gap: 8,
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
    paddingHorizontal: 0,
    paddingBottom: 140,
  },
  seatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gridGap,
    paddingHorizontal: sidePadding,
  },
  seatCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    height: 130,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  seatCardInner: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  seatCardTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatCardTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  seatNumber: {
    fontSize: 12,
    fontWeight: '900',
  },
  seatAvatarRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  seatAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFC107', // yellow colored ring like web
  },
  seatEmptyIconLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatCardFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  seatOccupantNameCenter: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  seatShiftRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatShiftChipOutlined: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  seatVacantLabelCenter: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  addMoreCard: {
    borderRadius: 20,
    borderWidth: 2,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
  },
  addMoreIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
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
  addMoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: sidePadding,
    gap: 10,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 4,
    width: 45,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  filterLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLoadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  filterLoadingText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
