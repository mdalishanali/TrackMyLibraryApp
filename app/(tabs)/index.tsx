import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/components/ui/app-badge';
import { AppCard } from '@/components/ui/app-card';
import { AppButton } from '@/components/ui/app-button';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { SectionHeader } from '@/components/ui/section-header';
import { typography, spacing, themeFor } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardQuery } from '@/hooks/use-dashboard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency, formatDate } from '@/utils/format';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const { logout } = useAuth();

  const dashboardQuery = useDashboardQuery();

  if (dashboardQuery.isLoading) {
    return <FullScreenLoader message="Loading dashboard..." />;
  }

  const metrics = [
    { label: 'Active Students', value: dashboardQuery.data?.activeStudentsCount ?? 0 },
    { label: 'Total Students', value: dashboardQuery.data?.totalStudents ?? 0 },
    { label: 'This Month', value: dashboardQuery.data?.studentsEnrolledThisMonth ?? 0 },
    { label: 'Earnings (MoM)', value: formatCurrency(dashboardQuery.data?.earnings ?? 0) },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={dashboardQuery.isRefetching} onRefresh={dashboardQuery.refetch} />}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Track students, seats, and payments in one view.
          </Text>
        </View>
        <AppButton variant="outline" onPress={logout}>
          Logout
        </AppButton>
      </View>

      <SectionHeader>Metrics</SectionHeader>
      <View style={styles.metricsGrid}>
        {metrics.map((item) => (
          <AppCard key={item.label} style={styles.metricCard} padded>
            <Text style={[styles.metricLabel, { color: theme.muted }]}>{item.label}</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{item.value}</Text>
          </AppCard>
        ))}
      </View>

      <SectionHeader>Recent Students</SectionHeader>
      <View style={styles.list}>
        {dashboardQuery.data?.recentStudents?.length ? (
          dashboardQuery.data.recentStudents.map((student) => (
            <AppCard key={student._id} style={styles.listCard}>
              <View style={styles.listHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{student.name}</Text>
                <AppBadge tone={student.status === 'Active' ? 'success' : 'warning'}>
                  {student.status ?? 'Active'}
                </AppBadge>
              </View>
              <Text style={[styles.cardMeta, { color: theme.muted }]}>ID: {student.id ?? '—'}</Text>
              <Text style={[styles.cardMeta, { color: theme.muted }]}>Joined {formatDate(student.joiningDate)}</Text>
              <Text style={[styles.cardMeta, { color: theme.muted }]}>
                Seat: {student.seatNumber ?? 'Unallocated'}
              </Text>
            </AppCard>
          ))
        ) : (
          <Text style={{ color: theme.muted }}>No recent students</Text>
        )}
      </View>

      <SectionHeader>Latest Payments</SectionHeader>
      <View style={styles.list}>
        {dashboardQuery.data?.latestPayments?.length ? (
          dashboardQuery.data.latestPayments.map((payment) => (
            <AppCard key={payment._id} style={styles.listCard}>
              <View style={styles.listHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {typeof payment.student === 'object' ? payment.student.name : 'Student'}
                </Text>
                <AppBadge tone="info">{payment.paymentMode.toUpperCase()}</AppBadge>
              </View>
              <Text style={[styles.cardMeta, { color: theme.muted }]}>
                Amount: {formatCurrency(payment.rupees)}
              </Text>
              <Text style={[styles.cardMeta, { color: theme.muted }]}>
                Period: {formatDate(payment.startDate)} - {formatDate(payment.endDate)}
              </Text>
              <Text style={[styles.cardMeta, { color: theme.muted }]}>Paid on {formatDate(payment.paymentDate)}</Text>
            </AppCard>
          ))
        ) : (
          <Text style={{ color: theme.muted }}>No payments yet</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.size.md,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '46%',
  },
  metricLabel: {
    fontSize: typography.size.sm,
  },
  metricValue: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  listCard: {
    gap: spacing.xs,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: typography.size.sm,
  },
});
