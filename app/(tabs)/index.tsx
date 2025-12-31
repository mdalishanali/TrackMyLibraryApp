import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, Layout, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
import { useNotifications } from '@/hooks/use-whatsapp';
import { useSeatsQuery } from '@/hooks/use-seats';

const { width, height } = Dimensions.get('window');
const BLURHASH = 'L9E:C[^+^j0000.8?v~q00?v%MoL';

// Subscription Expiry Banner
function SubscriptionBanner({ theme }: { theme: any }) {
  const { isExpiringSoon, daysRemainingText } = useSubscription();
  const router = useRouter();

  if (!isExpiringSoon) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      style={styles.bannerContainer}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/settings');
        }}
        style={({ pressed }) => [
          styles.bannerInner,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
        ]}
      >
        <LinearGradient
          colors={[theme.danger + '15', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.bannerIconBox, { backgroundColor: theme.danger + '20' }]}>
          <Ionicons name="flash" size={20} color={theme.danger} />
        </View>
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: theme.text }]}>Subscription Status</Text>
          <Text style={[styles.bannerSubtitle, { color: theme.muted }]} numberOfLines={1}>
            Expires in <Text style={{ color: theme.danger, fontWeight: '900' }}>{daysRemainingText}</Text>
          </Text>
        </View>
        <View style={[styles.bannerAction, { backgroundColor: theme.danger + '15' }]}>
          <Text style={[styles.bannerActionText, { color: theme.danger }]}>RENEW</Text>
          <Ionicons name="chevron-forward" size={12} color={theme.danger} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Reusable Student Card Component
function StudentCard({ student, theme, index }: { student: any; theme: any; index: number }) {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.delay(index * 100 + 400).duration(600)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/students',
            params: { search: student.name }
          });
        }}
        style={({ pressed }) => [
          styles.studentCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && styles.cardPressed
        ]}
      >
        <View style={styles.studentCardHeader}>
          <View style={styles.studentInfo}>
            <View style={[styles.studentAvatar, { backgroundColor: theme.primary + '10' }]}>
              {student.profilePicture ? (
                <Image
                  source={{ uri: student.profilePicture }}
                  style={styles.studentAvatarImage}
                  transition={1000}
                  placeholder={BLURHASH}
                  contentFit="cover"
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
              <View style={styles.idRow}>
                <Ionicons name="finger-print-outline" size={12} color={theme.muted} />
                <Text style={[styles.studentId, { color: theme.muted }]}>ID: {student.id ?? '—'}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: student.status === 'Active' ? theme.success + '15' : theme.warning + '15'
          }]}>
            <View style={[styles.statusDot, {
              backgroundColor: student.status === 'Active' ? theme.success : theme.warning
            }]} />
            <Text style={[styles.statusBadgeText, {
              color: student.status === 'Active' ? theme.success : theme.warning
            }]}>
              {student.status || 'Active'}
            </Text>
          </View>
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
            <Text style={[styles.metaLabel, { color: theme.muted }]}>POSITION</Text>
            <Text style={[styles.metaValue, { color: theme.text }]}>
              {student.seatNumber ? `F${student.floor ?? '-'} • S${student.seatNumber}` : 'Unassigned'}
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color={theme.primary + '40'} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Reusable Payment Card Component
function PaymentCard({ payment, theme, index }: { payment: any; theme: any; index: number }) {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.delay(index * 100 + 400).duration(600)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/payments');
        }}
        style={({ pressed }) => [
          styles.paymentCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && styles.cardPressed
        ]}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentMainInfo}>
            <Text style={[styles.paymentStudent, { color: theme.text }]} numberOfLines={1}>
              {typeof payment.student === 'object' ? payment.student.name : 'Student'}
            </Text>
            <View style={styles.amountBadgeRow}>
              <Text style={[styles.paymentAmount, { color: theme.primary }]}>
                {formatCurrency(payment.rupees)}
              </Text>
              <View style={[styles.modePill, { backgroundColor: theme.primary + '10' }]}>
                <Ionicons
                  name={payment.paymentMode === 'cash' ? 'cash' : 'phone-portrait'}
                  size={10}
                  color={theme.primary}
                />
                <Text style={[styles.modePillText, { color: theme.primary }]}>
                  {payment.paymentMode.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.paymentCircle, { backgroundColor: theme.primary + '10' }]}>
            <Ionicons name="receipt-outline" size={20} color={theme.primary} />
          </View>
        </View>

        <View style={[styles.paymentMetaBox, { backgroundColor: theme.surfaceAlt }]}>
          <View style={styles.metaSmallRow}>
            <Ionicons name="calendar-outline" size={12} color={theme.muted} />
            <Text style={[styles.metaSmallText, { color: theme.muted }]}>
              {formatDate(payment.startDate)} — {formatDate(payment.endDate)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Ionicons name="checkmark-circle-outline" size={14} color={theme.primary} />
            <Text style={[styles.metaPaidText, { color: theme.primary }]}>
              Paid on {formatDate(payment.paymentDate)}
            </Text>
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

// Background Decorative Circles for Onboarding
function FloatingDecor({ theme, top, left, size, delay = 0 }: any) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(1000)}
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.primary + '08',
        zIndex: -1,
      }}
    />
  );
}

// Onboarding Overlay for New Users
function OnboardingOverlay({ theme }: { theme: any }) {
  const router = useRouter();

  const steps = [
    { icon: 'grid-outline', text: 'Define your Floors & Sections' },
    { icon: 'layers-outline', text: 'Create Room Layouts' },
    { icon: 'people-outline', text: 'Assign Students to Seats' },
  ];

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, zIndex: 1000, padding: 24, justifyContent: 'center' }]}>
      <LinearGradient
        colors={[theme.primary + '10', 'transparent', theme.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Decor */}
      <FloatingDecor theme={theme} top={100} left={-20} size={150} delay={200} />
      <FloatingDecor theme={theme} top={400} left={width - 100} size={200} delay={400} />
      <FloatingDecor theme={theme} top={height - 200} left={50} size={120} delay={600} />

      <View style={{ gap: 40 }}>
        <View style={{ alignItems: 'center', gap: 20 }}>
          <Animated.View
            entering={FadeInDown.springify().damping(12)}
            style={[styles.onboardingIconBox, { backgroundColor: theme.primary + '10' }]}
          >
            <Ionicons name="location-outline" size={56} color={theme.primary} />
          </Animated.View>

          <View style={{ alignItems: 'center', gap: 8 }}>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(600)}
              style={[styles.onboardingTitle, { color: theme.text }]}
            >
              Setup Required
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(300).duration(600)}
              style={[styles.onboardingSubtitle, { color: theme.muted }]}
            >
              Your library dashboard is almost ready! First, we need to map out your physical space.
            </Animated.Text>
          </View>
        </View>

        {/* Setup Checklist */}
        <View style={{ gap: 16 }}>
          {steps.map((step, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(400 + (i * 150)).duration(600)}
              style={[styles.onboardingStep, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            >
              <View style={[styles.onboardingStepIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name={step.icon as any} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.onboardingStepText, { color: theme.text }]}>{step.text}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(900).springify()}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/seats');
            }}
            style={({ pressed }) => [
              styles.onboardingBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
          >
            <Text style={styles.onboardingBtnText}>Start Library Setup</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isPro } = useSubscription();

  const dashboardQuery = useDashboardQuery();
  const seatsQuery = useSeatsQuery();

  const isLoading = dashboardQuery.isLoading || seatsQuery.isLoading;

  if (isLoading) {
    return <FullScreenLoader message="Preparing your dashboard..." />;
  }

  const hasNoSeats = !seatsQuery.data ||
    seatsQuery.data.filter((f: any) => f.floor !== 0 && f.floor !== '0').length === 0;

  if (hasNoSeats) {
    return (
      <SafeScreen>
        <OnboardingOverlay theme={theme} />
      </SafeScreen>
    );
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
    <SafeScreen edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
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
          <View style={styles.header}>
            <Animated.View entering={FadeInDown.duration(800)}>
              <View style={styles.greetingRow}>
                <View>
                  <Text style={[styles.greetingText, { color: theme.muted }]}>{getGreeting()}</Text>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {user?.name?.split(' ')[0] || 'User'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/settings');
                  }}
                  style={({ pressed }) => [
                    styles.avatarBtn,
                    { borderColor: theme.border, backgroundColor: theme.surface },
                    pressed && { transform: [{ scale: 0.95 }] }
                  ]}
                >
                  <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                  {isPro && (
                    <View style={styles.proIndicator}>
                      <Ionicons name="star" size={10} color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </View>

          {/* Subscription Banner */}
          <SubscriptionBanner theme={theme} />

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
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (index === 0 || index === 1 || index === 2) router.push('/students');
                      if (index === 3) router.push('/payments');
                    }}
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
                      <View style={styles.metricCardDecor}>
                        <Ionicons name={item.icon as any} size={80} color="rgba(255,255,255,0.1)" />
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
              <SectionHeader>Recent Students</SectionHeader>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/students');
                }}
              >
                <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
              </Pressable>
            </View>
            <View style={styles.cardList}>
              {dashboardQuery.data?.recentStudents?.length ? (
                dashboardQuery.data.recentStudents.slice(0, 3).map((student, idx) => (
                  <StudentCard key={student._id} student={student} theme={theme} index={idx} />
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
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/payments');
                }}
              >
                <Text style={[styles.viewAll, { color: theme.primary }]}>History</Text>
              </Pressable>
            </View>
            <View style={styles.cardList}>
              {dashboardQuery.data?.latestPayments?.length ? (
                dashboardQuery.data.latestPayments.slice(0, 3).map((payment, idx) => (
                  <PaymentCard key={payment._id} payment={payment} theme={theme} index={idx} />
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
    height: 400,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 0,
    paddingBottom: 140,
    gap: 32,
  },
  header: {
    marginBottom: spacing.xs,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  avatarBtn: {
    width: 60,
    height: 60,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 24,
  },
  proIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFB800',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Subscription Banner
  bannerContainer: {
    marginBottom: -8,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  bannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  bannerActionText: {
    fontSize: 11,
    fontWeight: '900',
  },

  // Metrics Styles
  metricsSection: {
    gap: spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCardWrapper: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
  },
  metricCardInner: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  metricCard: {
    padding: spacing.lg,
    minHeight: 155,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  metricCardDecor: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    opacity: 0.4,
    transform: [{ rotate: '15deg' }],
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  // Section Styles
  section: {
    gap: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -8,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardList: {
    gap: spacing.md,
  },

  // Student Card Styles
  studentCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: spacing.lg,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  studentAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  studentDetails: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentId: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  metaItem: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    opacity: 0.5,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  metricDividerVertical: {
    width: 1,
    height: 24,
    marginHorizontal: spacing.lg,
    opacity: 0.5,
  },

  // Payment Card Styles
  paymentCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMainInfo: {
    flex: 1,
    gap: 6,
  },
  paymentStudent: {
    fontSize: 18,
    fontWeight: '800',
  },
  amountBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  paymentCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMetaBox: {
    padding: 16,
    borderRadius: 20,
    gap: 8,
  },
  metaSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaSmallText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaPaidText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Empty State
  emptyCard: {
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Interactive States
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  // Onboarding Styles
  onboardingIconBox: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  onboardingSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  onboardingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  onboardingStepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingStepText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  onboardingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
    marginTop: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  onboardingBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});

