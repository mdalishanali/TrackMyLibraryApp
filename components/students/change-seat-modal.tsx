import React, { useState, useEffect, useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { themeFor } from '@/constants/design';

type SeatOption = {
  _id: string;
  seatNumber: string;
  floor?: number | string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (seatId: string) => Promise<void>;
  currentSeatId?: string;
  seats: SeatOption[];
  theme: ReturnType<typeof themeFor>;
  isSubmitting?: boolean;
  studentName: string;
};

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { typography } from '@/constants/design';

export function ChangeSeatModal({
  visible,
  onClose,
  onConfirm,
  currentSeatId,
  seats,
  theme,
  isSubmitting,
  studentName,
}: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  
  // Group seats by floor
  const floors = useMemo(() => {
    const f = Array.from(new Set(seats.map(s => s.floor).filter(Boolean))) as (number | string)[];
    return f.sort();
  }, [seats]);

  const [selectedFloor, setSelectedFloor] = useState<number | string>(floors[0] || '1');
  const [selectedSeatId, setSelectedSeatId] = useState(currentSeatId || '');

  // Filter seats based on floor and search
  const filteredSeats = useMemo(() => {
    return seats.filter(s => {
      const matchFloor = String(s.floor) === String(selectedFloor);
      const matchSearch = s.seatNumber.toLowerCase().includes(search.toLowerCase());
      return matchFloor && matchSearch;
    });
  }, [seats, selectedFloor, search]);

  // Sync selected floor when currentSeatId changes
  useEffect(() => {
    if (visible && currentSeatId) {
      const seat = seats.find(s => s._id === currentSeatId);
      if (seat && seat.floor) {
        setSelectedFloor(seat.floor);
      }
      setSelectedSeatId(currentSeatId);
      setSearch('');
    }
  }, [visible, currentSeatId, seats]);

  const handleConfirm = async () => {
    await onConfirm(selectedSeatId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={[styles.content, { 
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1,
            maxHeight: '90%',
            paddingBottom: insets.bottom + 20
          }]} onStartShouldSetResponder={() => true}>
            
            {/* Handle Bar */}
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>Change Seat</Text>
                <Text style={[styles.subtitle, { color: theme.muted }]}>Reassign {studentName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scroll} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.body}>
                {/* Search Bar */}
                <View style={[styles.searchBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Ionicons name="search" size={18} color={theme.muted} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search seat number..."
                    placeholderTextColor={theme.muted}
                    value={search}
                    onChangeText={setSearch}
                  />
                  {search !== '' && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={18} color={theme.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Level Tabs */}
                  <View style={styles.section}>
                  <Text style={[styles.label, { color: theme.muted }]}>SELECT SECTION</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.floorScroll}
                    >
                      {floors.map(f => (
                        <TouchableOpacity
                          key={f}
                          onPress={() => setSelectedFloor(f)}
                          style={[
                            styles.floorChip,
                            { 
                              backgroundColor: selectedFloor === f ? theme.primary : theme.surfaceAlt,
                              borderColor: selectedFloor === f ? theme.primary : theme.border
                            }
                          ]}
                        >
                          <Text style={[
                            styles.floorText, 
                            { color: selectedFloor === f ? '#fff' : theme.text }
                          ]}>
                            {f}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                </View>

                {/* Seat Grid */}
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: theme.muted }]}>SEAT GRID</Text>
                    <Text style={[styles.count, { color: theme.muted }]}>{filteredSeats.length} Positions</Text>
                  </View>
                  
                  <View style={styles.seatGrid}>
                    {/* Unallocated option always at top */}
                    {!search && (
                      <TouchableOpacity
                        onPress={() => setSelectedSeatId('')}
                        style={[
                          styles.seatChip,
                          { 
                            backgroundColor: selectedSeatId === '' ? theme.primary + '20' : theme.surfaceAlt,
                            borderColor: selectedSeatId === '' ? theme.primary : theme.border,
                            width: '100%',
                            marginBottom: 8
                          }
                        ]}
                      >
                        <Ionicons 
                          name={selectedSeatId === '' ? "checkmark-circle" : "remove-circle-outline"} 
                          size={18} 
                          color={selectedSeatId === '' ? theme.primary : theme.muted} 
                        />
                        <Text style={[styles.seatText, { color: selectedSeatId === '' ? theme.primary : theme.text, fontWeight: '800' }]}>
                          De-allocate / Clear Seat
                        </Text>
                      </TouchableOpacity>
                    )}

                    {filteredSeats.map(s => (
                      <TouchableOpacity
                        key={s._id}
                        onPress={() => setSelectedSeatId(s._id)}
                        style={[
                          styles.seatChip,
                          { 
                            backgroundColor: selectedSeatId === s._id ? theme.primary : theme.surfaceAlt,
                            borderColor: selectedSeatId === s._id ? theme.primary : theme.border,
                            width: '31%'
                          }
                        ]}
                      >
                        <Text style={[
                          styles.seatText, 
                          { color: selectedSeatId === s._id ? '#fff' : theme.text }
                        ]}>
                          {s.seatNumber}
                        </Text>
                        {selectedSeatId === s._id && (
                          <View style={[styles.check, { borderColor: theme.primary }]}>
                            <Ionicons name="checkmark" size={10} color={theme.primary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {filteredSeats.length === 0 && (
                    <View style={styles.empty}>
                      <Ionicons name="grid-outline" size={32} color={theme.muted + '40'} />
                      <Text style={{ color: theme.muted, marginTop: 8 }}>No seats found</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                onPress={handleConfirm}
                loading={isSubmitting}
                fullWidth
                style={{ height: 56, borderRadius: 18 }}
              >
                Confirm Assignment
              </AppButton>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 50,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  body: {
    gap: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    gap: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    fontSize: 10,
    fontWeight: '700',
  },
  floorScroll: {
    gap: 10,
    paddingRight: 20,
  },
  floorChip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  floorText: {
    fontSize: 14,
    fontWeight: '800',
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  seatChip: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
  },
  seatText: {
    fontSize: 15,
    fontWeight: '700',
  },
  check: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    // borderColor will be set inline to theme.primary
  },
  empty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 24,
  },
});
