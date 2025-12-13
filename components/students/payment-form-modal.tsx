import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { formatDate } from '@/utils/format';

const paymentSchema = z.object({
  student: z.string().min(1, 'Pick a student'),
  rupees: z.preprocess((val) => Number(val), z.number().min(1, 'Enter amount')),
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
  const [studentSearch, setStudentSearch] = useState('');
  const paymentMode = watch('paymentMode');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      reset(initialValues);
      setDatePicker(null);
      setStudentSearch('');
    }
  }, [visible, initialValues, reset]);

  const openDatePicker = (field: keyof PaymentFormValues, value: string) => {
    const parsed = new Date(value);
    setDatePicker({ field, value: Number.isNaN(parsed.getTime()) ? new Date() : parsed });
  };

  const handleDateChange = (_: any, selected?: Date) => {
    if (!datePicker) return setDatePicker(null);
    const chosen = selected ?? datePicker.value;
    setValue(datePicker.field, toIsoDate(chosen));
    setDatePicker(null);
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
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeScreen edges={['top', 'bottom']}>
        <ScrollView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.lg + insets.top, gap: spacing.md }}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Fill period, amount, and payment mode. Dates auto-format to dd-MMM-yyyy.
              </Text>
            </View>
            {studentName ? <AppBadge tone="info">{studentName}</AppBadge> : null}
          </View>

          <AppCard style={{ gap: spacing.sm, backgroundColor: theme.surfaceAlt, borderColor: theme.border }}>
            {studentOptions?.length ? (
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.label, { color: theme.text }]}>Student</Text>
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
                      placeholder="Search student"
                      value={value}
                      onChange={(item) => onChange(item.value)}
                      placeholderStyle={{ color: theme.muted }}
                      selectedTextStyle={{ color: theme.text }}
                      inputSearchStyle={{ color: theme.text }}
                      itemTextStyle={{ color: theme.text }}
                      style={[
                        styles.dropdown,
                        {
                          backgroundColor: theme.surface,
                          borderColor: errors.student ? '#ef4444' : theme.border,
                        },
                      ]}
                      containerStyle={{ backgroundColor: theme.surface }}
                      activeColor={theme.primarySoft}
                    />
                  )}
                />
                {errors.student?.message ? <Text style={styles.errorText}>{String(errors.student.message)}</Text> : null}
              </View>
            ) : (
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.label, { color: theme.muted }]}>Student</Text>
                <Text style={[styles.studentName, { color: theme.text }]}>{studentName ?? '—'}</Text>
              </View>
            )}

            <FormField
              label="Amount (₹)"
              name="rupees"
              control={control}
              errors={errors}
              theme={theme}
              keyboardType="numeric"
            />

            <DateField
              label="Start Date"
              name="startDate"
              control={control}
              errors={errors}
              theme={theme}
              onOpen={openDatePicker}
            />
            <DateField
              label="End Date"
              name="endDate"
              control={control}
              errors={errors}
              theme={theme}
              onOpen={openDatePicker}
            />
            <DateField
              label="Payment Date"
              name="paymentDate"
              control={control}
              errors={errors}
              theme={theme}
              onOpen={openDatePicker}
            />

            <View style={{ gap: spacing.xs }}>
              <Text style={[styles.label, { color: theme.text }]}>Payment Mode</Text>
              <View style={styles.chipRow}>
                {(['cash', 'upi'] as const).map((mode) => {
                  const active = paymentMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setValue('paymentMode', mode)}
                      style={[
                        styles.modeChip,
                        {
                          backgroundColor: active ? theme.text : theme.surface,
                          borderColor: active ? theme.text : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? theme.surface : theme.text, fontWeight: '700' }}>
                        {mode.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <FormField label="Notes" name="notes" control={control} errors={errors} theme={theme} multiline />
          </AppCard>

          <View style={styles.modalActions}>
            <AppButton variant="outline" onPress={onClose}>
              Cancel
            </AppButton>
            <AppButton onPress={submitForm} loading={isSubmitting} disabled={disabled}>
              Save Payment
            </AppButton>
          </View>
        </ScrollView>

        {datePicker ? (
          <Modal transparent visible animationType="fade">
            <View style={styles.overlay}>
              <View style={[styles.pickerBox, { backgroundColor: theme.surface }]}>
                <DateTimePicker
                  value={datePicker.value}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
                <AppButton variant="outline" onPress={() => setDatePicker(null)}>
                  Done
                </AppButton>
              </View>
            </View>
          </Modal>
        ) : null}
      </SafeScreen>
    </Modal>
  );
}

type FormFieldProps = {
  label: string;
  name: keyof PaymentFormValues;
  control: any;
  errors: any;
  theme: ReturnType<typeof themeFor>;
  keyboardType?: 'default' | 'numeric';
  readOnly?: boolean;
  multiline?: boolean;
};

function FormField({
  label,
  name,
  control,
  errors,
  theme,
  keyboardType = 'default',
  readOnly = false,
  multiline = false,
}: FormFieldProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value === undefined || value === null ? '' : String(value)}
            onChangeText={onChange}
            placeholder={label}
            placeholderTextColor={theme.muted}
            keyboardType={keyboardType}
            editable={!readOnly}
            multiline={multiline}
            style={[
              styles.input,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.surface,
                opacity: readOnly ? 0.6 : 1,
                minHeight: multiline ? 80 : undefined,
                textAlignVertical: multiline ? 'top' : 'center',
              },
            ]}
          />
        )}
      />
      {errors[name]?.message ? <Text style={styles.errorText}>{String(errors[name].message)}</Text> : null}
    </View>
  );
}

type DateFieldProps = {
  label: string;
  name: keyof PaymentFormValues;
  control: any;
  errors: any;
  theme: ReturnType<typeof themeFor>;
  onOpen: (field: keyof PaymentFormValues, value: string) => void;
};

function DateField({ label, name, control, errors, theme, onOpen }: DateFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value } }) => (
        <View style={{ gap: spacing.xs }}>
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
          <TouchableOpacity
            onPress={() => onOpen(name, value)}
            style={[styles.dateInput, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(value)}</Text>
          </TouchableOpacity>
          {errors[name]?.message ? <Text style={styles.errorText}>{String(errors[name].message)}</Text> : null}
        </View>
      )}
    />
  );
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.size.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.md,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dateText: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.md,
  },
  modeChip: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 2,
    fontSize: typography.size.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  studentName: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerBox: {
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
