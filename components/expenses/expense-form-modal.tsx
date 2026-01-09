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
import Animated, { FadeInDown } from 'react-native-reanimated';

import { themeFor, radius, spacing, typography } from '@/constants/design';
import { AppButton } from '@/components/ui/app-button';
import { formatDate } from '@/utils/format';

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.coerce.number().min(1, 'Enter valid amount'),
  category: z.string().min(1, 'Select category'),
  date: z.string().min(1),
  description: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

const CATEGORIES = [
  { label: 'Rent', value: 'Rent' },
  { label: 'Electricity', value: 'Electricity' },
  { label: 'Internet', value: 'Internet' },
  { label: 'Salary', value: 'Salary' },
  { label: 'Maintenance', value: 'Maintenance' },
  { label: 'Cleaning', value: 'Cleaning' },
  { label: 'Software', value: 'Software' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Other', value: 'Other' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => void | Promise<void>;
  theme: ReturnType<typeof themeFor>;
  isSubmitting: boolean;
};

export function ExpenseFormModal({ visible, onClose, onSubmit, theme, isSubmitting }: Props) {
  const insets = useSafeAreaInsets();
  
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      title: '',
      amount: 0,
      category: 'Other',
      date: new Date().toISOString(),
      description: '',
    },
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateValue = watch('date');

  useEffect(() => {
    if (visible) {
      reset({
        title: '',
        amount: 0,
        category: 'Other',
        date: new Date().toISOString(),
        description: '',
      });
    }
  }, [visible, reset]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('date', selectedDate.toISOString());
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            <Animated.View 
              style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}
            >
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View>
                   <Text style={[styles.title, { color: theme.text }]}>Add Expense</Text>
                   <Text style={[styles.subtitle, { color: theme.muted }]}>Track where your money is going</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
                 
                 {/* Title */}
                 <View style={styles.formGroup}>
                   <Text style={[styles.label, { color: theme.text }]}>Expense Title</Text>
                   <Controller
                     control={control}
                     name="title"
                     render={({ field: { onChange, value } }) => (
                       <TextInput
                         style={[styles.input, { borderColor: errors.title ? theme.danger : theme.border, color: theme.text, backgroundColor: theme.surface }]}
                         placeholder="e.g. Office Rent"
                         placeholderTextColor={theme.muted}
                         value={value}
                         onChangeText={onChange}
                       />
                     )}
                   />
                   {errors.title && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.title.message}</Text>}
                 </View>

                 {/* Amount & Category Row */}
                 <View style={styles.row}>
                   <View style={[styles.formGroup, { flex: 1 }]}>
                     <Text style={[styles.label, { color: theme.text }]}>Amount (₹)</Text>
                     <Controller
                       control={control}
                       name="amount"
                       render={({ field: { onChange, value } }) => (
                         <TextInput
                           style={[styles.input, { borderColor: errors.amount ? theme.danger : theme.border, color: theme.text, backgroundColor: theme.surface }]}
                           placeholder="0"
                           placeholderTextColor={theme.muted}
                           keyboardType="numeric"
                           value={value ? value.toString() : ''}
                           onChangeText={onChange}
                         />
                       )}
                     />
                     {errors.amount && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.amount.message}</Text>}
                   </View>

                   <View style={[styles.formGroup, { flex: 1 }]}>
                     <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                     <Controller
                       control={control}
                       name="category"
                       render={({ field: { onChange, value } }) => (
                         <Dropdown
                            style={[styles.dropdown, { borderColor: errors.category ? theme.danger : theme.border, backgroundColor: theme.surface }]}
                            placeholderStyle={[styles.placeholderStyle, { color: theme.muted }]}
                            selectedTextStyle={[styles.selectedTextStyle, { color: theme.text }]}
                            data={CATEGORIES}
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select"
                            value={value}
                            onChange={item => onChange(item.value)}
                         />
                       )}
                     />
                     {errors.category && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.category.message}</Text>}
                   </View>
                 </View>

                 {/* Date */}
                 <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateButton, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                        <Text style={{ color: theme.text }}>{formatDate(dateValue)}</Text>
                        <Ionicons name="calendar-outline" size={20} color={theme.muted} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date(dateValue)}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                        />
                    )}
                 </View>

                 {/* Description */}
                 <View style={styles.formGroup}>
                   <Text style={[styles.label, { color: theme.text }]}>Description (Optional)</Text>
                   <Controller
                     control={control}
                     name="description"
                     render={({ field: { onChange, value } }) => (
                       <TextInput
                         style={[styles.textArea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
                         placeholder="Add any additional notes..."
                         placeholderTextColor={theme.muted}
                         value={value}
                         onChangeText={onChange}
                         multiline
                         numberOfLines={3}
                       />
                     )}
                   />
                 </View>

              </ScrollView>

              {/* Footer */}
              <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <AppButton
                  onPress={handleSubmit(onSubmit as any)}
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Expense'}
                </AppButton>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  formGroup: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  dropdown: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 8,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
  },
});
