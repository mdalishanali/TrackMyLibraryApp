import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { AppBadge } from '@/components/ui/app-badge';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { SafeScreen } from '@/components/layout/safe-screen';
import { SectionHeader } from '@/components/ui/section-header';
import { typography, spacing, radius, gradientFor } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardQuery } from '@/hooks/use-dashboard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { useSubscription } from '@/providers/subscription-provider';

const { width } = Dimensions.get('window');

// Reusable Student Card Component
function StudentCard({ student, theme }: { student: any; theme: any }) {
  return (
    <Animated.View entering={FadeInDown.duration(600)}>
      <Pressable style={({ pressed }) => [styles.studentCard, pressed && styles.cardPressed]}>
        <View style={[styles.cardInner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.studentCardHeader}>
            <View style={styles.studentInfo}>
              <View style={[styles.studentAvatar, { backgroundColor: theme.primary + '15' }]}>
                {student.profilePicture ? (
                  <Animated.Image
                    source={{ uri: student.profilePicture }}
                    style={styles.studentAvatarImage}
                  />
                ) : (
                    <Text style={[styles.studentAvatarText, { color: theme.primary }]}>
                      {student.name?.[0]?.toUpperCase() || 'S'}
                    </Text>
                )}
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

          <View style={[styles.studentMeta, { borderTopColor: theme.border + '50' }]}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.muted }]}>JOINED</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {formatDate(student.joiningDate)}
              </Text>
            </View>
            <View style={[styles.metricDividerVertical, { backgroundColor: theme.border + '50' }]} />
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.muted }]}>SEAT</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {student.seatNumber ? `Seat ${student.seatNumber}` : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Reusable Payment Card Component
function PaymentCard({ payment, theme }: { payment: any; theme: any }) {
  return (
    <Animated.View entering={FadeInDown.duration(600)}>
      <Pressable style={({ pressed }) => [styles.paymentCardWrapper, pressed && styles.cardPressed]}>
        <View style={[styles.paymentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
    </Animated.View>
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
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isPro } = useSubscription();

  const dashboardQuery = useDashboardQuery();

  if (dashboardQuery.isLoading) {
    return <FullScreenLoader message="Preparing your dashboard..." />;
  }

  const metrics = [
    {
      label: 'Active Students',
      value: dashboardQuery.data?.activeStudentsCount ?? 0,
      colors: gradientFor(colorScheme, 'metricGreen'),
      icon: 'people-outline'
    },
    {
      label: 'Total Students',
      value: dashboardQuery.data?.totalStudents ?? 0,
      colors: gradientFor(colorScheme, 'metricBlue'),
      icon: 'stats-chart-outline'
    },
    {
      label: 'New This Month',
      value: dashboardQuery.data?.studentsEnrolledThisMonth ?? 0,
      colors: gradientFor(colorScheme, 'metricPurple'),
      icon: 'trending-up-outline'
    },
    {
      label: 'Monthly Earnings',
      value: formatCurrency(dashboardQuery.data?.earnings ?? 0),
      colors: gradientFor(colorScheme, 'metricAmber'),
      icon: 'wallet-outline'
    },
  ];

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Immersive Background Gradient */}
        <LinearGradient
          colors={[theme.primary + '15', 'transparent']}
          style={styles.bgGradient}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={dashboardQuery.isRefetching}
              onRefresh={dashboardQuery.refetch}
              tintColor={theme.primary}
            />
          }>

          {/* Premium Header */}
          <View style={styles.headerContainer}>
            <Animated.View entering={FadeInUp.delay(200).duration(800)}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={[styles.greeting, { color: theme.muted }]}>
                    {getGreeting()},
                  </Text>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: theme.text }]}>
                      {user?.name?.split(' ')[0] || 'User'}
                    </Text>
                    {isPro && (
                      <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.proBadge}
                      >
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </LinearGradient>
                    )}
                  </View>
                </View>
                <Pressable onPress={() => router.push('/settings')} style={styles.headerAction}>
                  <View style={[styles.avatarLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.avatarLargeText, { color: theme.primary }]}>
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          </View>

          {/* Quick Metrics Carousel/Grid */}
          <View style={styles.metricsSection}>
            <SectionHeader>Overview</SectionHeader>
            <View style={styles.metricsGrid}>
              {metrics.map((item, index) => (
                <Animated.View
                  key={item.label} 
                  entering={FadeInDown.delay(index * 100 + 400).duration(800)}
                  style={styles.metricCardWrapper}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.metricCardInner,
                      pressed && styles.cardPressed
                    ]}>
                    <LinearGradient
                      colors={item.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.metricCard}>
                      <View style={styles.metricIconContainer}>
                        <Ionicons name={item.icon as any} size={24} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.metricValue}>{item.value}</Text>
                        <Text style={styles.metricLabel}>{item.label}</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Recent Students Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader>Recent Enrollments</SectionHeader>
              <Pressable onPress={() => router.push('/students')}>
                <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
              </Pressable>
            </View>
            <View style={styles.cardList}>
              {dashboardQuery.data?.recentStudents?.length ? (
                dashboardQuery.data.recentStudents.slice(0, 3).map((student, idx) => (
                  <StudentCard key={student._id} student={student} theme={theme} />
                ))
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="people-outline" size={48} color={theme.muted + '40'} />
                  <Text style={[styles.emptyText, { color: theme.muted }]}>No recent students</Text>
                </View>
              )}
            </View>
          </View>

          {/* Latest Payments Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader>Latest Payments</SectionHeader>
              <Pressable onPress={() => router.push('/payments')}>
                <Text style={[styles.viewAll, { color: theme.primary }]}>History</Text>
              </Pressable>
            </View>
            <View style={styles.cardList}>
              {dashboardQuery.data?.latestPayments?.length ? (
                dashboardQuery.data.latestPayments.slice(0, 3).map((payment, idx) => (
                  <PaymentCard key={payment._id} payment={payment} theme={theme} />
                ))
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="card-outline" size={48} color={theme.muted + '40'} />
                  <Text style={[styles.emptyText, { color: theme.muted }]}>No payments yet</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 300,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: 32,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  userName: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLargeText: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerAction: {
    padding: 2,
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
    width: (width - spacing.lg * 2 - spacing.md) / 2,
  },
  metricCardInner: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  metricCard: {
    padding: spacing.lg,
    minHeight: 145,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  metricIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    opacity: 0.85,
    marginTop: 2,
  },

  // Section Styles
  section: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -4,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardList: {
    gap: spacing.md,
  },

  // Student Card Styles
  studentCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardInner: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  studentAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 13,
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
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricDividerVertical: {
    width: 1,
    height: 24,
    marginHorizontal: spacing.md,
  },

  // Payment Card Styles
  paymentCardWrapper: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  paymentCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
  },
  paymentInfo: {
    flex: 1,
    gap: 4,
  },
  paymentBadgeWrapper: {
    marginLeft: spacing.sm,
  },
  paymentStudent: {
    fontSize: 18,
    fontWeight: '800',
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  paymentMeta: {
    gap: 8,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMetaLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentMetaValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Interactive States
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

