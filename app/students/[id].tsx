import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { InfoRow } from '@/components/ui/info-row';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCreatePayment } from '@/hooks/use-payments';
import { useStudentQuery } from '@/hooks/use-student';
import { useDeleteStudent } from '@/hooks/use-students';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  ActionRow,
  PaymentSummary,
  StudentHeader,
  StudentMeta,
  TimeSlots,
} from '@/components/students/StudentSummary';
import { PaymentFormModal } from '@/components/students/payment-form-modal';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  const studentQuery = useStudentQuery(id);
  const deleteStudent = useDeleteStudent();
  const createPayment = useCreatePayment();

  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (id && studentQuery.data?._id) {
      setPaymentStudentId(studentQuery.data._id);
    }
  }, [id, studentQuery.data]);

  const paymentDefaults = useMemo(() => {
    const d = new Date().toISOString().slice(0, 10);
    return {
      student: paymentStudentId ?? '',
      rupees: 0,
      startDate: d,
      endDate: d,
      paymentDate: d,
      paymentMode: 'cash',
      notes: '',
    };
  }, [paymentStudentId]);

  if (studentQuery.isLoading) {
    return <FullScreenLoader message="Loading student..." />;
  }

  const student = studentQuery.data;
  if (!student) {
    return (
      <SafeScreen>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={{ color: theme.muted }}>Student not found.</Text>
        </View>
      </SafeScreen>
    );
  }

  const handleDelete = async () => {
    await deleteStudent.mutateAsync(student._id);
    router.back();
  };

  return (
    <SafeScreen>
      <Stack.Screen
        options={{
          headerShown: true,
          title: student.name ?? 'Student',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      >
        <SectionHeader>{student.name}</SectionHeader>

        <AppCard style={{ gap: spacing.md }}>
          <StudentHeader student={student} theme={theme} />
          <StudentMeta student={student} theme={theme} />
          <PaymentSummary student={student} theme={theme} />
          <TimeSlots student={student} theme={theme} />

          <ActionRow
            theme={theme}
            actions={{
              onPay: () => setPaymentStudentId(student._id),
              onDelete: handleDelete,
              onView: undefined,
            }}
          />
        </AppCard>

        <AppCard style={{ gap: spacing.xs }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
          <InfoRow label="Phone" value={student.number} />
          <InfoRow label="Seat" value={student.seatNumber ? String(student.seatNumber) : 'Unallocated'} />
          <InfoRow label="Joined" value={formatDate(student.joiningDate)} />
          <InfoRow label="Shift" value={student.shift} />
          <InfoRow label="Payment Status" value={student.paymentStatus} />
        </AppCard>

        <AppCard style={{ gap: spacing.xs }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payments</Text>
          {student.lastPayment ? (
            <View style={styles.paymentRow}>
              <Text style={[styles.meta, { color: theme.text }]}>{formatCurrency(student.lastPayment.rupees)}</Text>
              <Text style={[styles.meta, { color: theme.muted }]}>Period: {formatDate(student.lastPayment.startDate)} - {formatDate(student.lastPayment.endDate)}</Text>
              <Text style={[styles.meta, { color: theme.muted }]}>Paid: {formatDate(student.lastPayment.paymentDate)}</Text>
            </View>
          ) : (
            <Text style={{ color: theme.muted }}>No payments yet.</Text>
          )}
        </AppCard>

        <View style={styles.footerActions}>
          <AppButton variant="outline" onPress={() => router.back()} fullWidth>
            Back to Students
          </AppButton>
          <AppButton onPress={() => setPaymentStudentId(student._id)} fullWidth>
            Collect Payment
          </AppButton>
        </View>
      </ScrollView>

      <PaymentFormModal
        visible={Boolean(paymentStudentId)}
        onClose={() => setPaymentStudentId(null)}
        initialValues={paymentDefaults}
        theme={theme}
        disabled={!paymentStudentId}
        isSubmitting={createPayment.isPending}
        onSubmit={async (values) => {
          await createPayment.mutateAsync(values);
          setPaymentStudentId(null);
        }}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  meta: {
    fontSize: typography.size.sm,
  },
  paymentRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    gap: 2,
  },
  footerActions: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
});
