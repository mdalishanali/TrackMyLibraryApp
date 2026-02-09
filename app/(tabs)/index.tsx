import { useState, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useSeatsQuery } from '@/hooks/use-seats';
import { StudentFormModal, StudentFormValues } from '@/components/students/student-form-modal';
import { useCreateStudent } from '@/hooks/use-students';
import { showToast } from '@/lib/toast';
import { useScreenView } from '@/hooks/use-screen-view';
import { Skeleton, SkeletonCard, SkeletonMetricCard, SkeletonList } from '@/components/ui/skeleton';

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
              <Image
                source={{ uri: student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=0D8ABC&color=fff&size=200` }}
                style={styles.studentAvatarImage}
                transition={1000}
                placeholder={BLURHASH}
                contentFit="cover"
              />
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
            backgroundColor: theme.success + '15'
          }]}>
            <View style={[styles.statusDot, {
              backgroundColor: theme.success
            }]} />
            <Text style={[styles.statusBadgeText, {
              color: theme.success
            }]}>
              Active
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
              {student.seatNumber ? `${!student.floor || isNaN(Number(student.floor)) ? (student.floor ?? 'Section 1') : `Section ${student.floor}`} • Seat ${student.seatNumber}` : 'Unassigned'}
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
              {payment.student?.name || 'Deleted Student'}
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

function TrialTimer({ theme }: { theme: any }) {
  const { expiresAt, isTrial } = useSubscription();

  // Force re-render every second
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isTrial || !expiresAt) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isTrial, expiresAt]);

  if (!isTrial || !expiresAt) return null;

  const diff = new Date(expiresAt).getTime() - now.getTime();

  // Don't show if more than 24h (safeguard) or expired
  if (diff <= 0) {
    return (
      <View style={[styles.trialBadge, { backgroundColor: theme.danger }]}>
        <Text style={styles.trialText}>EXPIRED</Text>
      </View>
    );
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return (
    <Animated.View entering={FadeInDown.duration(600)} style={[styles.trialBadge, { backgroundColor: theme.danger }]}>
      <Ionicons name="time" size={12} color="#fff" style={{ marginRight: 4 }} />
      <Text style={styles.trialText}>
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Text>
    </Animated.View>
  );
}

// Day 1 Goal Widget - Revamped for High Engagement
function Day1GoalWidget({ theme, onAddStudent }: { theme: any; onAddStudent: () => void }) {
  // Calculate progress (Library Setup is done, so 1/2 = 50%)
  const progress = 0.5;

  return (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={[
        styles.day1Goal,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          overflow: 'hidden'
        },
      ]}
    >
      {/* Decorative Background Gradient */}
      <LinearGradient
        colors={[theme.primary + '10', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: '100%' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.goalHeader}>
        <View style={styles.goalTitleRow}>
          <View style={[styles.goalIconBox, { backgroundColor: '#FFF9C4' }]}>
            <Text style={{ fontSize: 24 }}>🎯</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.goalTitle, { color: theme.text }]}>Daily Target</Text>
            <Text style={[styles.goalDesc, { color: theme.muted }]}>
              Complete setup to maximize efficiency
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressText, { color: theme.primary }]}>50% Completed</Text>
            <Text style={[styles.progressText, { color: theme.muted }]}>1/2 Steps</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceAlt }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: theme.primary, width: '50%' }
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.checklist}>
        <View style={[styles.checkItem, { opacity: 0.6 }]}>
          <Ionicons name="checkmark-circle" size={22} color={theme.success} />
          <Text style={[styles.checkText, { color: theme.text, textDecorationLine: 'line-through' }]}>
            Library Created
          </Text>
        </View>
        <View style={styles.checkItem}>
          <View style={[styles.pendingCircle, { borderColor: theme.primary }]}>
            <View style={[styles.pendingDot, { backgroundColor: theme.primary }]} />
          </View>
          <Text style={[styles.checkText, { color: theme.text, fontWeight: '700' }]}>
            Add First Student
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onAddStudent();
        }}
        style={({ pressed }) => [
          styles.goalBtn,
          { backgroundColor: theme.primary },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={styles.goalBtnText}>Add Student Now</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isPro } = useSubscription();

  // Track screen view
  useScreenView('Dashboard');

  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);

  const dashboardQuery = useDashboardQuery();
  const seatsQuery = useSeatsQuery();
  const createStudent = useCreateStudent();

  const isLoading = dashboardQuery.isLoading || seatsQuery.isLoading;

  const seats = (seatsQuery.data ?? []).flatMap((f: any) =>
    (f.seats || []).map((s: any) => ({
      _id: s._id as string,
      seatNumber: String(s.seatNumber),
      floor: f.floor,
    }))
  );

  const saveStudent = async (data: StudentFormValues) => {
    try {
      const payload: any = {
        name: data.name,
        number: data.number,
        joiningDate: data.joiningDate,
        seat: data.seat,
        shift: data.shift,
        time: [{ start: data.startTime, end: data.endTime }],
        fees: data.fees ? Number(data.fees) : 0,
        notes: data.notes,
        profilePicture: data.profilePicture, // Pass the URI or base64
        fatherName: data.fatherName,
        address: data.address,
        aadharNumber: data.aadharNumber,
        gender: data.gender,
      };

      await createStudent.mutateAsync({ payload });
      setIsStudentFormOpen(false);
      showToast('Student Added', 'success');
    } catch (error: any) {
      console.error(error);
      showToast('Failed to save student', 'error');
    }
  };

  const renderSkeletonDashboard = () => (
    <SafeScreen edges={['left', 'right']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View style={styles.greetingRow}>
              <View style={{ flex: 1 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="60%" height={34} style={{ marginTop: 8 }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Skeleton width={50} height={50} borderRadius={18} />
                <Skeleton width={60} height={60} borderRadius={22} />
              </View>
            </View>
          </View>

          {/* Metrics Skeleton */}
          <View style={styles.metricsSection}>
            <Skeleton width="30%" height={20} style={{ marginBottom: 16 }} />
            <View style={styles.metricsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.metricCardWrapper}>
                  <SkeletonMetricCard theme={theme} />
                </View>
              ))}
            </View>
          </View>

          {/* Recent Students Skeleton */}
          <View style={styles.section}>
            <Skeleton width="40%" height={20} style={{ marginBottom: 16 }} />
            <SkeletonList count={3} theme={theme} />
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );

  if (isLoading) {
    return renderSkeletonDashboard();
  }

  const hasNoSeats =
    !seatsQuery.data ||
    seatsQuery.data.filter((f: any) => f.floor !== 0 && f.floor !== '0').length === 0;

  useEffect(() => {
    if (hasNoSeats && !isLoading) {
      router.replace('/onboarding/setup');
    }
  }, [hasNoSeats, isLoading, router]);

  if (isLoading || hasNoSeats) {
    return renderSkeletonDashboard();
  }

  const activeStudents = dashboardQuery.data?.activeStudentsCount ?? 0;

  const metrics = [
    {
      label: 'Active Students',
      value: activeStudents,
      colors: gradientFor(colorScheme, 'metricGreen'),
      icon: 'people-outline',
    },
    {
      label: 'Total Students',
      value: dashboardQuery.data?.totalStudents ?? 0,
      colors: gradientFor(colorScheme, 'metricBlue'),
      icon: 'stats-chart-outline',
    },
    {
      label: 'New This Month',
      value: dashboardQuery.data?.studentsEnrolledThisMonth ?? 0,
      colors: gradientFor(colorScheme, 'metricPurple'),
      icon: 'trending-up-outline',
    },
    {
      label: 'Monthly Earnings',
      value: formatCurrency(dashboardQuery.data?.earnings ?? 0),
      colors: gradientFor(colorScheme, 'metricAmber'),
      icon: 'wallet-outline',
    },
  ];

  return (
    <SafeScreen edges={['left', 'right']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '15', 'transparent']}
          style={styles.bgGradient}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={dashboardQuery.isRefetching}
              onRefresh={dashboardQuery.refetch}
              tintColor={theme.primary}
              progressViewOffset={insets.top}
            />
          }
        >
          {/* Premium Header */}
          <View style={styles.header}>
            <Animated.View entering={FadeInDown.duration(800)}>
              <View style={styles.greetingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.greetingText, { color: theme.muted }]}>{getGreeting()}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                      {user?.name?.split(' ')[0] || 'User'}
                    </Text>
                    <TrialTimer theme={theme} />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setIsStudentFormOpen(true);
                    }}
                    style={({ pressed }) => [
                      styles.headerActionBtn,
                      { borderColor: theme.border, backgroundColor: theme.surface },
                      pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 },
                    ]}
                  >
                    <Ionicons name="add" size={26} color={theme.primary} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/settings');
                    }}
                    style={({ pressed }) => [
                      styles.avatarBtn,
                      { borderColor: theme.border, backgroundColor: theme.surface },
                      pressed && { transform: [{ scale: 0.95 }] },
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
              </View>
            </Animated.View>
          </View>

          {/* Day 1 Goal Widget OR Subscription Banner */}
          {activeStudents === 0 ? (
            <Day1GoalWidget theme={theme} onAddStudent={() => setIsStudentFormOpen(true)} />
          ) : (
            <SubscriptionBanner theme={theme} />
          )}

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

        <StudentFormModal
          visible={isStudentFormOpen}
          onClose={() => setIsStudentFormOpen(false)}
          onSubmit={saveStudent}
          theme={theme}
          isSubmitting={createStudent.isPending}
          seats={seats}
          initialValues={{
            name: '',
            number: '',
            joiningDate: new Date().toISOString(),
            startTime: '06:00',
            endTime: '18:00',
            gender: 'Male',
            fees: '0',
          } as any}
        />

        <Animated.View
          entering={FadeInDown.delay(1000).duration(800)}
          style={[styles.fabContainer, { bottom: 24 + insets.bottom }]}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsStudentFormOpen(true);
            }}
            style={({ pressed }) => [
              styles.fabButton,
              { backgroundColor: theme.primary },
              pressed && { transform: [{ scale: 0.95 }] }
            ]}
          >
            <View style={styles.fabIcon}>
              <Ionicons name="add" size={32} color="#fff" />
            </View>
            <Text style={styles.fabText}>New Member</Text>
          </Pressable>
        </Animated.View>
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
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    transform: [{ translateY: 2 }], // optical alignment
  },
  trialText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  headerActionBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    position: 'relative',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 100,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    gap: 8,
  },
  fabIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
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
  },
  onboardingBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  // Day 1 Goal Widget Styles
  day1Goal: {
    padding: 2,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  goalHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  goalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  goalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressSection: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  checklist: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pendingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalBtn: {
    margin: 20,
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  goalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

