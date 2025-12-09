import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { SectionHeader } from '@/components/ui/section-header';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCreatePayment, usePaymentsQuery } from '@/hooks/use-payments';
import { useStudentsQuery } from '@/hooks/use-students';
import { formatCurrency, formatDate } from '@/utils/format';

export default function PaymentsScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  const paymentsQuery = usePaymentsQuery();
  const studentsQuery = useStudentsQuery();
  const createPayment = useCreatePayment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentId, setStudentId] = useState<string>('');
  const [rupees, setRupees] = useState<string>('0');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [notes, setNotes] = useState<string>('');

  const resetForm = () => {
    setStudentId('');
    setRupees('0');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMode('cash');
    setNotes('');
  };

  const onCreatePayment = async () => {
    if (!studentId) return Alert.alert('Choose a student', 'Select a student to record payment.');
    try {
      await createPayment.mutateAsync({
        student: studentId,
        rupees: Number(rupees),
        startDate,
        endDate,
        paymentMode,
        paymentDate,
        notes,
      });
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  if (paymentsQuery.isLoading) {
    return <FullScreenLoader message="Loading payments..." />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SectionHeader>Payments</SectionHeader>
      <View style={styles.actionsRow}>
        <AppButton onPress={() => setIsModalOpen(true)}>Add Payment</AppButton>
      </View>

      <FlatList
        data={paymentsQuery.data ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={paymentsQuery.isRefetching} onRefresh={paymentsQuery.refetch} />}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                {typeof item.student === 'object' ? item.student.name : 'Student'}
              </Text>
              <AppBadge tone="info">{item.paymentMode.toUpperCase()}</AppBadge>
            </View>
            <Text style={[styles.cardMeta, { color: theme.muted }]}>
              Amount: {formatCurrency(item.rupees)} · Paid {formatDate(item.paymentDate)}
            </Text>
            <Text style={[styles.cardMeta, { color: theme.muted }]}>
              Period: {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
            {item.notes ? <Text style={[styles.cardMeta, { color: theme.text }]}>{item.notes}</Text> : null}
          </AppCard>
        )}
        ListEmptyComponent={<Text style={{ color: theme.muted, padding: spacing.lg }}>No payments recorded yet.</Text>}
      />

      <Modal animationType="slide" visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <ScrollView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
          contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Record Payment</Text>
          <Text style={[styles.label, { color: theme.text }]}>Select student</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {studentsQuery.data?.map((student) => (
                <TouchableOpacity
                  key={student._id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: studentId === student._id ? theme.primary : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setStudentId(student._id)}>
                  <Text style={{ color: studentId === student._id ? '#fff' : theme.text }}>{student.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {renderInput('Amount (₹)', rupees, setRupees, theme, 'numeric')}
          {renderInput('Start Date (YYYY-MM-DD)', startDate, setStartDate, theme)}
          {renderInput('End Date (YYYY-MM-DD)', endDate, setEndDate, theme)}
          {renderInput('Payment Date (YYYY-MM-DD)', paymentDate, setPaymentDate, theme)}
          {renderInput('Payment Mode (cash|upi)', paymentMode, (val) => setPaymentMode(val as 'cash' | 'upi'), theme)}
          {renderInput('Notes', notes, setNotes, theme)}

          <View style={styles.modalActions}>
            <AppButton variant="outline" onPress={() => setIsModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton onPress={onCreatePayment} loading={createPayment.isPending}>
              Save
            </AppButton>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

function renderInput(
  label: string,
  value: string,
  onChange: (text: string) => void,
  theme: ReturnType<typeof themeFor>,
  keyboardType: 'default' | 'numeric' = 'default'
) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor={theme.muted}
        keyboardType={keyboardType}
        style={[
          styles.input,
          { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  card: {
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
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
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
