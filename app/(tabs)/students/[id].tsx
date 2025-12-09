import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { InfoRow } from '@/components/ui/info-row';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing, themeFor, typography } from '@/constants/design';
import { useDeleteStudent } from '@/hooks/use-students';
import { useStudentQuery } from '@/hooks/use-student';
import { usePaymentsQuery } from '@/hooks/use-payments';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency, formatDate } from '@/utils/format';
import { Image } from 'expo-image';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const router = useRouter();

  const studentQuery = useStudentQuery(id);
  const paymentsQuery = usePaymentsQuery({ student: id });
  const deleteStudent = useDeleteStudent();

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

  const onDelete = async () => {
    await deleteStudent.mutateAsync(student._id);
    router.back();
  };

  return (
    <SafeScreen>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <SectionHeader>{student.name}</SectionHeader>
        <AppCard style={styles.headerCard}>
          <View style={styles.heroRow}>
            <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt }]}>
              {student.profilePicture ? (
                <Image source={{ uri: student.profilePicture }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: theme.text }]}>
                  {student.name?.[0]?.toUpperCase() || 'S'}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {student.name}
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>ID: {student.id ?? '—'}</Text>
              <AppBadge tone={student.status === 'Active' ? 'success' : 'warning'} style={{ marginTop: spacing.xs }}>
                {student.status ?? 'Active'}
              </AppBadge>
            </View>
          </View>
          <View style={styles.actionRow}>
            <AppButton onPress={() => router.push(`/(tabs)/students/${student._id}?pay=1`)}>Pay</AppButton>
            <AppButton variant="outline" onPress={() => router.push('/(tabs)/students')}>
              Back
            </AppButton>
            <AppButton variant="danger" onPress={onDelete} loading={deleteStudent.isPending}>
              Delete
            </AppButton>
          </View>
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
          {paymentsQuery.data?.length ? (
            paymentsQuery.data.map((payment) => (
              <View key={payment._id} style={styles.paymentRow}>
                <Text style={[styles.meta, { color: theme.text }]}>{formatCurrency(payment.rupees)}</Text>
                <Text style={[styles.meta, { color: theme.muted }]}>
                  {formatDate(payment.startDate)} - {formatDate(payment.endDate)}
                </Text>
                <Text style={[styles.meta, { color: theme.muted }]}>Paid: {formatDate(payment.paymentDate)}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.muted }}>No payments yet.</Text>
          )}
        </AppCard>

        <View style={styles.linkRow}>
          <Link href="/(tabs)/payments" asChild>
            <Text style={[styles.link, { color: theme.primary }]}>View all payments</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerCard: {
    gap: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  meta: {
    fontSize: typography.size.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  paymentRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  linkRow: {
    alignItems: 'flex-start',
  },
  link: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
});
