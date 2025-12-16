import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { AppBadge } from '@/components/ui/app-badge';
import { AppCard } from '@/components/ui/app-card';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { SafeScreen } from '@/components/layout/safe-screen';
import { SectionHeader } from '@/components/ui/section-header';
import { typography, spacing, themeFor, gradientFor } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardQuery } from '@/hooks/use-dashboard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency, formatDate } from '@/utils/format';
import { LinearGradient } from 'expo-linear-gradient';

// Reusable Student Card Component
function StudentCard({ student, theme }: { student: any; theme: any }) {
  return (
    <Pressable style={({ pressed }) => [styles.studentCard, pressed && styles.cardPressed]}>
      <View style={[styles.cardInner, { backgroundColor: theme.surface }]}>
        <View style={styles.studentCardHeader}>
          <View style={styles.studentInfo}>
            <View style={[styles.studentAvatar, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.studentAvatarText, { color: theme.primary }]}>
                {student.name?.[0]?.toUpperCase() || 'S'}
              </Text>
            </View>
            <View style={styles.studentDetails}>
              <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>
                {student.name}
              </Text>
              <Text style={[styles.studentId, { color: theme.muted }]}>ID: {student.id ?? '—'}</Text>
            </View>
          </View>
          <AppBadge tone={student.status === 'Active' ? 'success' : 'warning'}>
            {student.status ?? 'Active'}
          </AppBadge>
        </View>

        <View style={[styles.studentMeta, { borderTopColor: theme.border }]}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: theme.muted }]}>JOINED</Text>
            <Text style={[styles.metaValue, { color: theme.text }]}>
              {formatDate(student.joiningDate)}
            </Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: theme.muted }]}>SEAT</Text>
            <Text style={[styles.metaValue, { color: theme.text }]}>
              {student.seatNumber ?? 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// Reusable Payment Card Component
function PaymentCard({ payment, theme }: { payment: any; theme: any }) {
  return (
    <Pressable style={({ pressed }) => [styles.paymentCardWrapper, pressed && styles.cardPressed]}>
      <View style={[styles.paymentCard, { backgroundColor: theme.surface }]}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text style={[styles.paymentStudent, { color: theme.text }]} numberOfLines={1}>
              {typeof payment.student === 'object' ? payment.student.name : 'Student'}
            </Text>
            <Text style={[styles.paymentAmount, { color: theme.primary }]}>
              {formatCurrency(payment.rupees)}
            </Text>
          </View>
          <View style={styles.paymentBadgeWrapper}>
            <AppBadge tone="info">{payment.paymentMode.toUpperCase()}</AppBadge>
          </View>
        </View>

        <View style={[styles.paymentMeta, { backgroundColor: theme.surfaceAlt }]}>
          <View style={styles.paymentMetaRow}>
            <Text style={[styles.paymentMetaLabel, { color: theme.muted }]}>Period</Text>
            <Text style={[styles.paymentMetaValue, { color: theme.text }]}>
              {formatDate(payment.startDate)} → {formatDate(payment.endDate)}
            </Text>
          </View>
          <View style={styles.paymentMetaRow}>
            <Text style={[styles.paymentMetaLabel, { color: theme.muted }]}>Paid on</Text>
            <Text style={[styles.paymentMetaValue, { color: theme.text }]}>
              {formatDate(payment.paymentDate)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// Greeting Helper
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const { user } = useAuth();

  const dashboardQuery = useDashboardQuery();

  if (dashboardQuery.isLoading) {
    return <FullScreenLoader message="Loading dashboard..." />;
  }

  const metrics = [
    {
      label: 'Active Students',
      value: dashboardQuery.data?.activeStudentsCount ?? 0,
      colors: gradientFor(colorScheme, 'metricGreen'),
      icon: '👥'
    },
    {
      label: 'Total Students',
      value: dashboardQuery.data?.totalStudents ?? 0,
      colors: gradientFor(colorScheme, 'metricBlue'),
      icon: '📊'
    },
    {
      label: 'This Month',
      value: dashboardQuery.data?.studentsEnrolledThisMonth ?? 0,
      colors: gradientFor(colorScheme, 'metricPurple'),
      icon: '📈'
    },
    {
      label: 'Earnings',
      value: formatCurrency(dashboardQuery.data?.earnings ?? 0),
      colors: gradientFor(colorScheme, 'metricAmber'),
      icon: '💰'
    },
  ];

  return (
    <SafeScreen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={dashboardQuery.isRefetching} onRefresh={dashboardQuery.refetch} />
        }>

        {/* Modern Header with Gradient */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={gradientFor(colorScheme, 'header')}
            style={[styles.header, { borderColor: theme.border }]}>
            <View style={styles.greetingSection}>
              <Text style={[styles.greeting, { color: theme.muted }]}>
                {getGreeting()} 👋
              </Text>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user?.name || 'User'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Here's what's happening today
              </Text>
            </View>
            <View style={[styles.avatarLarge, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '30' }]}>
              <Text style={[styles.avatarLargeText, { color: theme.primary }]}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Metrics Grid with Gradient Cards */}
        <View style={styles.metricsSection}>
          <SectionHeader>Overview</SectionHeader>
          <View style={styles.metricsGrid}>
            {metrics.map((item, index) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.metricCardWrapper,
                  pressed && styles.cardPressed
                ]}>
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.metricCard}>
                  <Text style={styles.metricIcon}>{item.icon}</Text>
                  <Text style={styles.metricValue}>{item.value}</Text>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Students */}
        <View style={styles.section}>
          <SectionHeader>Recent Students</SectionHeader>
          <View style={styles.cardList}>
            {dashboardQuery.data?.recentStudents?.length ? (
              dashboardQuery.data.recentStudents.map((student) => (
                <StudentCard key={student._id} student={student} theme={theme} />
              ))
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={[styles.emptyText, { color: theme.muted }]}>No recent students</Text>
              </View>
            )}
          </View>
        </View>

        {/* Latest Payments */}
        <View style={styles.section}>
          <SectionHeader>Latest Payments</SectionHeader>
          <View style={styles.cardList}>
            {dashboardQuery.data?.latestPayments?.length ? (
              dashboardQuery.data.latestPayments.map((payment) => (
                <PaymentCard key={payment._id} payment={payment} theme={theme} />
              ))
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                <Text style={styles.emptyIcon}>💳</Text>
                <Text style={[styles.emptyText, { color: theme.muted }]}>No payments yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: 28,
    paddingBottom: 40,
  },

  // Header Styles
  headerWrapper: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.size.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontWeight: '500',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '800',
  },

  // Metrics Styles
  metricsSection: {
    gap: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCardWrapper: {
    width: '47%',
  },
  metricCard: {
    borderRadius: 24,
    padding: spacing.lg,
    gap: 8,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  metricIcon: {
    fontSize: 32,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.9,
  },

  // Section Styles
  section: {
    gap: spacing.md,
  },
  cardList: {
    gap: spacing.md,
  },

  // Empty State
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.md,
    fontWeight: '600',
  },

  // Student Card Styles
  studentCard: {
    borderRadius: 20,
  },
  cardInner: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  studentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 22,
    fontWeight: '800',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: typography.size.lg + 2,
    fontWeight: '800',
    marginBottom: 2,
  },
  studentId: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  metaItem: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  metaDivider: {
    width: 1,
    height: 32,
    marginHorizontal: spacing.sm,
  },

  // Payment Card Styles
  paymentCardWrapper: {
    borderRadius: 20,
  },
  paymentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  paymentInfo: {
    flex: 1,
    gap: 6,
  },
  paymentBadgeWrapper: {
    marginLeft: spacing.sm,
  },
  paymentStudent: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  paymentAmount: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  paymentMeta: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMetaLabel: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  paymentMetaValue: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },

  // Interactive States
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
