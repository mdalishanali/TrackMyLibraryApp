import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { spacing, radius, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useShiftsQuery, useCreateShift, useUpdateShift } from '@/hooks/use-shifts';
import { showToast } from '@/lib/toast';

const PRESETS = [
  { label: "24 Hours", startTime: "00:00", endTime: "23:59", name: "24 Hours" },
  { label: "Full Day", startTime: "06:00", endTime: "22:00", name: "Full Day" },
  { label: "Morning", startTime: "06:00", endTime: "12:00", name: "Morning" },
  { label: "Afternoon", startTime: "12:00", endTime: "18:00", name: "Afternoon" },
  { label: "Evening", startTime: "14:00", endTime: "22:00", name: "Evening" },
  { label: "Night", startTime: "20:00", endTime: "06:00", name: "Night" },
];

export default function ShiftsScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { data: shifts = [], isLoading } = useShiftsQuery({ includeInactive: true });
  const activeShifts = useMemo(() => shifts.filter(s => s.isActive !== false), [shifts]);
  const inactiveShifts = useMemo(() => shifts.filter(s => s.isActive === false), [shifts]);
  const availablePresets = useMemo(() => PRESETS.filter(p => !shifts.some(s => s.name.toLowerCase() === p.name.toLowerCase())), [shifts]);
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shiftToToggle, setShiftToToggle] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    price: '',
  });

  const [timePickerOpen, setTimePickerOpen] = useState<'start' | 'end' | null>(null);

  const handleCreate = async () => {
    if (!form.name || !form.price) {
      showToast('Please fill all fields', 'error');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createShift.mutateAsync({
        ...form,
        price: Number(form.price),
      });
      setIsAdding(false);
      resetForm();
      showToast('Shift created', 'success');
    } catch (e) {
      showToast('Failed to create shift', 'error');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!form.name || !form.price) {
      showToast('Please fill all fields', 'error');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateShift.mutateAsync({
        id,
        payload: {
          ...form,
          price: Number(form.price),
        },
      });
      setEditingId(null);
      resetForm();
      showToast('Shift updated', 'success');
    } catch (e) {
      showToast('Failed to update shift', 'error');
    }
  };

  const resetForm = () => {
    setForm({ name: '', startTime: '09:00', endTime: '18:00', price: '' });
  };

  const startEditing = (shift: any) => {
    setEditingId(shift._id);
    setForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      price: String(shift.price),
    });
  };

  const toggleActive = (shift: any) => {
    setShiftToToggle(shift);
  };

  const confirmToggleActive = async () => {
    if (!shiftToToggle) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateShift.mutateAsync({
        id: shiftToToggle._id,
        payload: { isActive: shiftToToggle.isActive === false ? true : false },
      });
      showToast(shiftToToggle.isActive === false ? 'Shift activated' : 'Shift deactivated', 'success');
    } catch (e) {
      showToast('Failed to update shift status', 'error');
    } finally {
      setShiftToToggle(null);
    }
  };

  const toDisplayTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h12 = ((hour + 11) % 12) + 1;
    return `${String(h12).padStart(2, '0')}:${m} ${suffix}`;
  };

  const parseTime = (t: string) => {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(Number(h), Number(m), 0, 0);
    return d;
  };

  return (
    <SafeScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Shift System</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Configure timings and slot fees</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.promoContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoCard}
            >
              <View style={styles.promoContent}>
                <View style={styles.promoIconBox}>
                  <Ionicons name="sparkles" size={24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoTitle}>Smart Scheduling</Text>
                  <Text style={styles.promoDesc}>Shifts help in auto-calculating fees and managing seat occupancy efficiently.</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Shifts ({activeShifts.length})</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAdding(true);
                resetForm();
              }}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: theme.primary },
                pressed && { opacity: 0.8 }
              ]}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>New Slot</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.grid}>
              {activeShifts.map((shift, idx) => (
                <Animated.View
                  key={shift._id}
                  entering={FadeInDown.delay(idx * 100)}
                  layout={Layout.springify()}
                  style={[styles.shiftCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                      <Ionicons name="time" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.priceTag}>
                      <Text style={[styles.priceLabel, { color: theme.muted }]}>MONTHLY</Text>
                      <Text style={[styles.priceValue, { color: theme.text }]}>₹{shift.price}</Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.shiftName, { color: theme.text }]}>{shift.name.toUpperCase()}</Text>
                  <Text style={[styles.shiftTime, { color: theme.muted }]}>
                    {toDisplayTime(shift.startTime)} – {toDisplayTime(shift.endTime)}
                  </Text>

                  <View style={[styles.cardFooter, { borderTopColor: theme.border + '50' }]}>
                    <View style={[styles.typeBadge, { backgroundColor: theme.primary + '10' }]}>
                      <Text style={[styles.typeText, { color: theme.primary }]}>SYSTEM SLOT</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => toggleActive(shift)}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="eye-off-outline" size={18} color={theme.danger} />
                      </Pressable>
                      <Pressable
                        onPress={() => startEditing(shift)}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="pencil" size={18} color={theme.muted} />
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              ))}

              {inactiveShifts.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
                    <Text style={[styles.sectionTitle, { color: theme.muted }]}>Inactive Shifts ({inactiveShifts.length})</Text>
                  </View>
                  {inactiveShifts.map((shift, idx) => (
                    <Animated.View
                      key={shift._id}
                      entering={FadeInDown.delay(idx * 100)}
                      layout={Layout.springify()}
                      style={[styles.shiftCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, opacity: 0.6 }]}
                    >
                      <View style={styles.cardTop}>
                        <View style={[styles.iconBox, { backgroundColor: theme.muted + '15' }]}>
                          <Ionicons name="time" size={24} color={theme.muted} />
                        </View>
                        <View style={styles.priceTag}>
                          <Text style={[styles.priceLabel, { color: theme.muted }]}>MONTHLY</Text>
                          <Text style={[styles.priceValue, { color: theme.muted, textDecorationLine: 'line-through' }]}>₹{shift.price}</Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.shiftName, { color: theme.muted }]}>{shift.name.toUpperCase()}</Text>
                      <Text style={[styles.shiftTime, { color: theme.muted }]}>
                        {toDisplayTime(shift.startTime)} – {toDisplayTime(shift.endTime)}
                      </Text>

                      <View style={[styles.cardFooter, { borderTopColor: theme.border + '50' }]}>
                        <View style={[styles.typeBadge, { backgroundColor: theme.muted + '10' }]}>
                          <Text style={[styles.typeText, { color: theme.muted }]}>INACTIVE</Text>
                        </View>
                        <View style={styles.actionRow}>
                          <Pressable
                            onPress={() => toggleActive(shift)}
                            style={styles.actionBtn}
                          >
                            <Ionicons name="eye-outline" size={18} color={theme.primary} />
                          </Pressable>
                          <Pressable
                            onPress={() => startEditing(shift)}
                            style={styles.actionBtn}
                          >
                            <Ionicons name="pencil" size={18} color={theme.muted} />
                          </Pressable>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </>
              )}

              {/* Preset Cards */}
              {availablePresets.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
                    <Text style={[styles.sectionTitle, { color: theme.muted }]}>Suggested Presets ({availablePresets.length})</Text>
                  </View>
                  {availablePresets.map((preset, idx) => (
                    <Pressable
                      key={preset.label}
                       onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIsAdding(true);
                        setForm({ ...preset, price: '' });
                      }}
                      style={({ pressed }) => [
                        styles.shiftCard,
                        styles.presetCard,
                        { borderColor: theme.border, backgroundColor: theme.surface + '50' },
                        pressed && { scale: 0.98 }
                      ]}
                    >
                       <View style={styles.cardTop}>
                        <View style={[styles.iconBox, { backgroundColor: theme.muted + '15' }]}>
                          <Ionicons name="add" size={24} color={theme.muted} />
                        </View>
                        <View style={[styles.typeBadge, { backgroundColor: theme.surfaceAlt }]}>
                           <Text style={[styles.typeText, { color: theme.muted }]}>PRESET</Text>
                        </View>
                      </View>
                      <Text style={[styles.shiftName, { color: theme.muted }]}>{preset.name.toUpperCase()}</Text>
                       <Text style={[styles.shiftTime, { color: theme.muted }]}>
                        {toDisplayTime(preset.startTime)} – {toDisplayTime(preset.endTime)}
                      </Text>
                       <View style={[styles.cardFooter, { borderTopColor: theme.border + '50' }]}>
                         <Text style={[styles.presetAction, { color: theme.primary }]}>+ Click to configure</Text>
                       </View>
                    </Pressable>
                  ))}
                </>
              )}

            </View>
          )}
        </ScrollView>

        {/* Modal for Add / Edit */}
        <Modal
          visible={isAdding || editingId !== null}
          animationType="slide"
          transparent
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {editingId ? 'Edit Shift' : 'Create New Shift'}
                </Text>
                <Pressable
                  onPress={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalForm}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.muted }]}>SHIFT NAME</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder="e.g. Morning, Evening"
                    placeholderTextColor={theme.muted}
                    value={form.name}
                    onChangeText={(t) => setForm(f => ({ ...f, name: t }))}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.label, { color: theme.muted }]}>START TIME</Text>
                    <Pressable
                      onPress={() => setTimePickerOpen('start')}
                      style={[styles.input, styles.timeInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <Text style={{ color: theme.text, fontWeight: '700' }}>{toDisplayTime(form.startTime)}</Text>
                      <Ionicons name="time-outline" size={18} color={theme.primary} />
                    </Pressable>
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                     <Text style={[styles.label, { color: theme.muted }]}>END TIME</Text>
                    <Pressable
                       onPress={() => setTimePickerOpen('end')}
                      style={[styles.input, styles.timeInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <Text style={{ color: theme.text, fontWeight: '700' }}>{toDisplayTime(form.endTime)}</Text>
                      <Ionicons name="time-outline" size={18} color={theme.primary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.muted }]}>MONTHLY FEES (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder="800"
                    placeholderTextColor={theme.muted}
                    keyboardType="numeric"
                    value={form.price}
                    onChangeText={(t) => setForm(f => ({ ...f, price: t }))}
                  />
                </View>

                <View style={{ marginTop: 20 }}>
                  <AppButton
                    onPress={() => editingId ? handleUpdate(editingId) : handleCreate()}
                    loading={createShift.isPending || updateShift.isPending}
                  >
                    {editingId ? 'Update Shift' : 'Create Shift'}
                  </AppButton>
                </View>
              </ScrollView>
            </View>
          </View>

          {timePickerOpen && (
            <Modal transparent visible animationType="fade">
              <View style={styles.overlay}>
                <Pressable style={{ flex: 1 }} onPress={() => setTimePickerOpen(null)} />
                <View style={[styles.pickerBox, { backgroundColor: theme.surface }]}>
                  <DateTimePicker
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant={isDark ? 'dark' : 'light'}
                    value={parseTime(timePickerOpen === 'start' ? form.startTime : form.endTime)}
                    onChange={(e, d) => {
                      if (d) {
                        const h = String(d.getHours()).padStart(2, '0');
                        const m = String(d.getMinutes()).padStart(2, '0');
                        const time = `${h}:${m}`;
                        setForm(f => ({
                          ...f,
                          [timePickerOpen === 'start' ? 'startTime' : 'endTime']: time
                        }));
                      }
                      if (Platform.OS === 'android') setTimePickerOpen(null);
                    }}
                  />
                  <AppButton onPress={() => setTimePickerOpen(null)}>Confirm Time</AppButton>
                </View>
              </View>
            </Modal>
          )}
        </Modal>

        <ConfirmDialog
          visible={!!shiftToToggle}
          title={`${shiftToToggle?.isActive === false ? 'Activate' : 'Deactivate'} Shift`}
          description={`Are you sure you want to ${shiftToToggle?.isActive === false ? 'activate' : 'deactivate'} this shift?`}
          onCancel={() => setShiftToToggle(null)}
          onConfirm={confirmToggleActive}
          loading={updateShift.isPending}
          destructive={shiftToToggle?.isActive !== false}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  promoContainer: {
    marginBottom: spacing.xl,
  },
  promoCard: {
    borderRadius: 28,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  promoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  promoDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  grid: {
    gap: spacing.lg,
  },
  shiftCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: 8,
  },
  presetCard: {
    borderStyle: 'dashed',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  shiftName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  shiftTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetAction: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    gap: 24,
    paddingBottom: 40,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerBox: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 20,
  }
});
