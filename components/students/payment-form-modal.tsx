import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { formatDate } from '@/utils/format';

const paymentSchema = z.object({
  student: z.string().min(1, 'Pick a student'),
  rupees: z.coerce.number().min(1, 'Enter amount'),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  paymentMode: z.enum(['cash', 'upi']),
  paymentDate: z.string().min(1),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

type PaymentStudent = { id: string; name: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => void | Promise<void>;
  initialValues: PaymentFormValues;
  resetValues?: PaymentFormValues;
  theme: ReturnType<typeof themeFor>;
  isSubmitting: boolean;
  disabled?: boolean;
  studentName?: string;
  studentOptions?: PaymentStudent[];
  title?: string;
};

export function PaymentFormModal({
  visible,
  onClose,
  onSubmit,
  initialValues,
  resetValues,
  theme,
  isSubmitting,
  disabled,
  studentName,
  studentOptions,
  title = 'Record Payment',
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialValues,
  });

  const [datePicker, setDatePicker] = useState<null | { field: keyof PaymentFormValues; value: Date }>(null);
  const paymentMode = watch('paymentMode');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      reset(initialValues);
      setDatePicker(null);
    }
  }, [visible, initialValues, reset]);

  const openDatePicker = (field: keyof PaymentFormValues, value: string) => {
    const parsed = new Date(value);
    setDatePicker({ field, value: Number.isNaN(parsed.getTime()) ? new Date() : parsed });
  };

  const handleDateChange = (_: any, selected?: Date) => {
    if (!datePicker) return;
    const chosen = selected ?? datePicker.value;
    setValue(datePicker.field, toIsoDate(chosen));
    if (Platform.OS === 'android') setDatePicker(null);
  };

  const clearedValues: PaymentFormValues =
    resetValues ?? {
      ...initialValues,
      rupees: 0,
      notes: '',
      startDate: toIsoDate(new Date()),
      endDate: toIsoDate(new Date()),
      paymentDate: toIsoDate(new Date()),
    };

  const submitForm = handleSubmit(async (vals) => {
    await onSubmit(vals);
    reset(clearedValues);
    setDatePicker(null);
  });

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <Animated.View
          entering={FadeInUp.duration(400)}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            }
          ]}
        >
          <LinearGradient
            colors={[theme.primary + '10', 'transparent']}
            style={styles.sheetGradient}
          />

          <View style={styles.sheetHandleContainer}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: theme.muted }]}>
                  Track and record fee processing
                </Text>
              </View>
              {studentName && (
                <View style={[styles.studentPill, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
                  <Ionicons name="person" size={12} color={theme.primary} />
                  <Text style={[styles.studentPillText, { color: theme.primary }]}>{studentName}</Text>
                </View>
              )}
            </View>

            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <AppCard style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {studentOptions?.length ? (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Member</Text>
                    <Controller
                      control={control}
                      name="student"
                      render={({ field: { onChange, value } }) => (
                        <Dropdown
                          data={studentOptions.map((s) => ({ label: s.name, value: s.id }))}
                          search
                          searchPlaceholder="Search student"
                          labelField="label"
                          valueField="value"
                                        placeholder="Select student"
                                        value={value}
                                        onChange={(item) => onChange(item.value)}
                                        placeholderStyle={{ color: theme.muted }}
                                        selectedTextStyle={{ color: theme.text }}
                                        inputSearchStyle={{ color: theme.text }}
                                        itemTextStyle={{ color: theme.text }}
                                        style={[
                                          styles.dropdown,
                                          {
                                            backgroundColor: theme.surfaceAlt,
                                            borderColor: errors.student ? theme.danger : theme.border,
                                          },
                                        ]}
                                        containerStyle={{ backgroundColor: theme.surface }}
                          activeColor={theme.primary + '10'}
                        />
                      )}
                    />
                    {errors.student?.message && <Text style={styles.errorText}>{String(errors.student.message)}</Text>}
                  </View>
                ) : null}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Amount (₹)</Text>
                  <Controller
                    control={control}
                    name="rupees"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value === 0 ? '' : String(value)}
                        onChangeText={onChange}
                        placeholder="0.00"
                        placeholderTextColor={theme.muted}
                        keyboardType="numeric"
                                    style={[
                                      styles.input,
                                      {
                                        borderColor: errors.rupees ? theme.danger : theme.border,
                                        color: theme.text,
                                        backgroundColor: theme.surfaceAlt,
                                      },
                                    ]}
                                  />
                    )}
                  />
                  {errors.rupees?.message && <Text style={styles.errorText}>{String(errors.rupees.message)}</Text>}
                </View>

                <View style={styles.dateGrid}>
                  <DateField label="From" name="startDate" control={control} errors={errors} theme={theme} onOpen={openDatePicker} />
                  <DateField label="Until" name="endDate" control={control} errors={errors} theme={theme} onOpen={openDatePicker} />
                </View>

                <DateField label="Payment Date" name="paymentDate" control={control} errors={errors} theme={theme} onOpen={openDatePicker} />

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Payment Method</Text>
                  <View style={styles.modeGrid}>
                    {(['cash', 'upi'] as const).map((mode) => {
                      const active = paymentMode === mode;
                      return (
                        <TouchableOpacity
                          key={mode}
                          onPress={() => setValue('paymentMode', mode)}
                          style={[
                                              styles.modeBtn,
                                              {
                                            backgroundColor: active ? theme.primary : theme.surfaceAlt,
                                            borderColor: active ? theme.primary : theme.border,
                                          },
                                        ]}
                                      >
                                      <Ionicons
                                        name={mode === 'cash' ? 'cash-outline' : 'phone-portrait-outline'}
                                        size={18}
                                        color={active ? '#fff' : theme.muted}
                                      />
                                      <Text style={[styles.modeBtnText, { color: active ? '#fff' : theme.text }]}>
                                        {mode.toUpperCase()}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Notes (Optional)</Text>
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Add remark..."
                        placeholderTextColor={theme.muted}
                        multiline
                        numberOfLines={3}
                        style={[
                          styles.input,
                          styles.textArea,
                          {
                            borderColor: theme.border,
                            color: theme.text,
                            backgroundColor: theme.surfaceAlt,
                          },
                        ]}
                      />
                    )}
                  />
                </View>
              </AppCard>
            </Animated.View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.muted }]}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitForm}
                disabled={isSubmitting || disabled}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: isSubmitting || disabled ? 0.6 : 1,
                    shadowColor: theme.primary
                  }
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Payment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {datePicker && (
            <Modal transparent visible animationType="fade">
              <View style={styles.overlay}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setDatePicker(null)} />
                <Animated.View
                  entering={FadeInUp}
                  style={[styles.pickerBox, { backgroundColor: theme.surface }]}
                >
                  <View style={styles.pickerHeader}>
                    <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Date</Text>
                  </View>
                  <DateTimePicker
                    value={datePicker.value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    textColor={theme.text}
                  />
                  <AppButton onPress={() => setDatePicker(null)}>Confirm</AppButton>
                </Animated.View>
              </View>
            </Modal>
          )}
        </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function DateField({ label, name, control, errors, theme, onOpen }: any) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value } }) => (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <TouchableOpacity
              onPress={() => onOpen(name, value)}
              style={[styles.input, { borderColor: errors[name] ? theme.danger : theme.border, backgroundColor: theme.surfaceAlt }]}
            >
              <View style={styles.dateInputContent}>
                <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(value)}</Text>
                <Ionicons name="calendar-outline" size={16} color={theme.muted} />
              </View>
            </TouchableOpacity>
            {errors[name]?.message && <Text style={styles.errorText}>{String(errors[name].message)}</Text>}
          </View>
        )}
      />
    );
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  sheetGradient: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  studentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  studentPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formCard: {
    borderRadius: 24,
    padding: spacing.lg,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  dateGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  modeBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerBox: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    gap: 20,
  },
  pickerHeader: {
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  dropdown: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
});
