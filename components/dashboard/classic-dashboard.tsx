import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SectionHeader } from '@/components/ui/section-header';
import { spacing } from '@/constants/design';
import { formatCurrency } from '@/utils/format';

// ─── Types ────────────────────────────────────────────────────

type GradientAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  onPress: () => void;
};

type GridAction = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

// ─── Reusable Sub-Components (SRP) ────────────────────────────

function GradientActionCard({ action, delay }: { action: GradientAction; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(700)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          action.onPress();
        }}
        style={({ pressed }) => [
          styles.primaryActionCard,
          pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }
        ]}
      >
        <LinearGradient
          colors={action.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryActionGradient}
        >
          <View style={styles.primaryActionIcon}>
            <Ionicons name={action.icon} size={26} color="#fff" />
          </View>
          <View style={styles.primaryActionTextBox}>
            <Text style={styles.primaryActionTitle}>{action.title}</Text>
            <Text style={styles.primaryActionSubtitle}>{action.subtitle}</Text>
          </View>
          <View style={styles.primaryActionDecor}>
            <Ionicons name={action.icon} size={70} color="rgba(255,255,255,0.08)" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function GridActionItem({ action, theme, idx, total }: { action: GridAction; theme: any; idx: number; total: number }) {
  const cols = 3;
  const rows = Math.ceil(total / cols);
  const row = Math.floor(idx / cols);
  const col = idx % cols;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action.onPress();
      }}
      style={({ pressed }) => [
        styles.gridItem,
        pressed && { backgroundColor: theme.surfaceAlt, transform: [{ scale: 0.96 }] },
        row < rows - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border + '40' },
        col < cols - 1 && { borderRightWidth: 1, borderRightColor: theme.border + '40' },
      ]}
    >
      <View style={[styles.gridIcon, { backgroundColor: action.color + '12' }]}>
        <Ionicons name={action.icon} size={24} color={action.color} />
      </View>
      <Text style={[styles.gridTitle, { color: theme.text }]}>{action.title}</Text>
    </Pressable>
  );
}

function ActionGrid({ title, actions, theme, delay }: { title: string; actions: GridAction[]; theme: any; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(700)} style={styles.gridSection}>
      <SectionHeader>{title}</SectionHeader>
      <View style={[styles.gridCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {actions.map((action, idx) => (
          <GridActionItem key={action.title} action={action} theme={theme} idx={idx} total={actions.length} />
        ))}
      </View>
    </Animated.View>
  );
}

function HeroBanner({ theme }: { theme: any }) {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.duration(800)} style={styles.bannerContainer}>
      <LinearGradient
        colors={[theme.primary, '#4338ca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextBox}>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerLabel}>PREMIUM INSIGHTS</Text>
            </View>
            <Text style={styles.bannerTitle}>Grow Your Revenue</Text>
            <Text style={styles.bannerDesc}>See how your library's attendance is trending today.</Text>
          </View>
          <Pressable
            onPress={() => router.push('/analytics')}
            style={({ pressed }) => [styles.bannerCircleBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="arrow-forward" size={20} color={theme.primary} />
          </Pressable>
        </View>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Stats & Alerts Sub-Components ───────────────────────────

function StudentCountBadge({ count, theme }: { count: number; theme: any }) {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(700)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/students');
        }}
        style={({ pressed }) => [
          styles.studentBadge,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        ]}
      >
        <View style={[styles.studentBadgeIcon, { backgroundColor: '#10b981' + '15' }]}>
          <Ionicons name="people" size={20} color="#10b981" />
        </View>
        <View style={styles.studentBadgeText}>
          <Text style={[styles.studentBadgeValue, { color: theme.text }]}>{count}</Text>
          <Text style={[styles.studentBadgeLabel, { color: theme.muted }]}>Active Students</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      </Pressable>
    </Animated.View>
  );
}

function DuesAlert({ duesCount, totalDues, theme }: { duesCount: number; totalDues: number; theme: any }) {
  const router = useRouter();

  if (duesCount === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(600).duration(700)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/students');
        }}
        style={({ pressed }) => [
          styles.duesAlert,
          { backgroundColor: theme.surface, borderColor: '#ef4444' + '30' },
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        ]}
      >
        <View style={styles.duesAlertLeft}>
          <View style={[styles.duesAlertIcon, { backgroundColor: '#ef4444' + '15' }]}>
            <Ionicons name="alert-circle" size={22} color="#ef4444" />
          </View>
          <View style={styles.duesAlertText}>
            <Text style={[styles.duesAlertTitle, { color: theme.text }]}>Pending Dues</Text>
            <Text style={[styles.duesAlertDesc, { color: theme.muted }]}>
              {formatCurrency(totalDues)} from {duesCount} student{duesCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={[styles.duesAlertBtn, { backgroundColor: '#ef4444' }]}>
          <Text style={styles.duesAlertBtnText}>Collect</Text>
          <Ionicons name="chevron-forward" size={14} color="#fff" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TrustBanner({ theme }: { theme: any }) {
  return (
    <Animated.View entering={FadeInDown.delay(700).duration(700)} style={styles.trustSection}>
      <LinearGradient
        colors={[theme.primary + '08', theme.primary + '02']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.trustCard, { borderColor: theme.border }]}
      >
        {/* Logo & Brand */}
        <View style={styles.trustHeader}>
          <View style={[styles.trustLogo, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="library" size={20} color={theme.primary} />
          </View>
          <View style={styles.trustBrandText}>
            <Text style={[styles.trustBrand, { color: theme.text }]}>TrackMyLibrary</Text>
            <Text style={[styles.trustTagline, { color: theme.muted }]}>India's #1 Library Management App</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.trustStats}>
          <View style={styles.trustStat}>
            <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
            <Text style={[styles.trustStatText, { color: theme.text }]}>500+ Libraries</Text>
          </View>
          <View style={[styles.trustDivider, { backgroundColor: theme.border }]} />
          <View style={styles.trustStat}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={[styles.trustStatText, { color: theme.text }]}>4.8 Rating</Text>
          </View>
          <View style={[styles.trustDivider, { backgroundColor: theme.border }]} />
          <View style={styles.trustStat}>
            <Ionicons name="heart" size={16} color="#ef4444" />
            <Text style={[styles.trustStatText, { color: theme.text }]}>Made in India</Text>
          </View>
        </View>

        {/* Platform Badges */}
        <View style={styles.trustPlatforms}>
          <View style={[styles.platformBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="logo-apple" size={14} color={theme.text} />
            <Text style={[styles.platformText, { color: theme.muted }]}>iOS</Text>
          </View>
          <View style={[styles.platformBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="logo-android" size={14} color="#3DDC84" />
            <Text style={[styles.platformText, { color: theme.muted }]}>Android</Text>
          </View>
          <View style={[styles.platformBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="globe" size={14} color="#3b82f6" />
            <Text style={[styles.platformText, { color: theme.muted }]}>Web</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function SupportBanner({ theme }: { theme: any }) {
  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://wa.me/916391417248?text=${encodeURIComponent('Hello TrackMyLibrary Support, I need help with...')}`);
  };

  const handleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:md.alishanali88@gmail.com?subject=${encodeURIComponent('TrackMyLibrary Support Request')}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(800).duration(700)}>
      <View style={[styles.supportCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.supportHeader}>
          <View style={[styles.supportIcon, { backgroundColor: '#25D366' + '15' }]}>
            <Ionicons name="headset" size={22} color="#25D366" />
          </View>
          <View style={styles.supportText}>
            <Text style={[styles.supportTitle, { color: theme.text }]}>Need Help?</Text>
            <Text style={[styles.supportDesc, { color: theme.muted }]}>Our support team is just a message away</Text>
          </View>
        </View>

        <View style={styles.supportActions}>
          <Pressable
            onPress={handleWhatsApp}
            style={({ pressed }) => [
              styles.supportBtn,
              { backgroundColor: '#25D366' },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.supportBtnText}>Chat on WhatsApp</Text>
          </Pressable>

          <Pressable
            onPress={handleEmail}
            style={({ pressed }) => [
              styles.supportBtnOutline,
              { borderColor: theme.border },
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="mail" size={16} color={theme.muted} />
            <Text style={[styles.supportBtnOutlineText, { color: theme.muted }]}>Email</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const DAILY_TIPS = [
  { tip: 'You can bulk import students via CSV from Settings!', icon: 'cloud-upload' as keyof typeof Ionicons.glyphMap },
  { tip: 'Send payment reminders directly via WhatsApp.', icon: 'logo-whatsapp' as keyof typeof Ionicons.glyphMap },
  { tip: 'Use QR codes to let students check-in automatically.', icon: 'qr-code' as keyof typeof Ionicons.glyphMap },
  { tip: 'Set up your library branding for professional invoices.', icon: 'color-wand' as keyof typeof Ionicons.glyphMap },
  { tip: 'Track multiple shifts to manage seat availability.', icon: 'time' as keyof typeof Ionicons.glyphMap },
  { tip: 'Refer a library owner and earn ₹149 bonus!', icon: 'gift' as keyof typeof Ionicons.glyphMap },
  { tip: 'Generate digital Student ID cards from the Students tab.', icon: 'id-card' as keyof typeof Ionicons.glyphMap },
];

function TipOfTheDay({ theme }: { theme: any }) {
  const todayTip = DAILY_TIPS[new Date().getDay()];

  return (
    <Animated.View entering={FadeInDown.delay(450).duration(700)}>
      <View style={[styles.tipCard, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
        <View style={[styles.tipIcon, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name={todayTip.icon} size={18} color={theme.primary} />
        </View>
        <View style={styles.tipContent}>
          <Text style={[styles.tipLabel, { color: theme.primary }]}>💡 Tip of the Day</Text>
          <Text style={[styles.tipText, { color: theme.text }]}>{todayTip.tip}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main Component ──────────────────────────────────────────

interface ClassicDashboardProps {
  theme: any;
  onAddStudent: () => void;
  onAddExpense: () => void;
  activeStudents?: number;
  duesCount?: number;
  duesStudents?: { dueAmount?: number }[];
}

export function ClassicDashboard({ theme, onAddStudent, onAddExpense, activeStudents = 0, duesCount = 0, duesStudents = [] }: ClassicDashboardProps) {
  const router = useRouter();

  const totalDues = duesStudents.reduce((sum, s) => sum + (s.dueAmount || 0), 0);

  const quickActions: GradientAction[] = [
    { title: 'Add Student', subtitle: 'New admission', icon: 'person-add', gradient: ['#10b981', '#059669'], onPress: onAddStudent },
    { title: 'Log Expense', subtitle: 'Track costs', icon: 'receipt', gradient: ['#f59e0b', '#d97706'], onPress: onAddExpense },
    { title: 'Record Payment', subtitle: 'Collect fees', icon: 'wallet', gradient: ['#8b5cf6', '#7c3aed'], onPress: () => router.push('/payments') },
    { title: 'View Reports', subtitle: 'Deep insights', icon: 'bar-chart', gradient: ['#3b82f6', '#2563eb'], onPress: () => router.push('/analytics') },
  ];

  const manageActions: GridAction[] = [
    { title: 'Students', icon: 'people', color: '#3b82f6', onPress: () => router.push('/students') },
    { title: 'Seats', icon: 'grid', color: '#06b6d4', onPress: () => router.push('/seats') },
    { title: 'Payments', icon: 'card', color: '#8b5cf6', onPress: () => router.push('/payments') },
    { title: 'Shifts', icon: 'time', color: '#f97316', onPress: () => router.push('/shifts') },
    { title: 'Analytics', icon: 'stats-chart', color: '#ec4899', onPress: () => router.push('/analytics') },
    { title: 'Student ID', icon: 'id-card', color: '#14b8a6', onPress: () => router.push('/students') },
  ];

  const toolActions: GridAction[] = [
    { title: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', onPress: () => router.push('/whatsapp-settings') },
    { title: 'QR Code', icon: 'qr-code', color: '#7c3aed', onPress: () => router.push('/qr-code') },
    { title: 'Branding', icon: 'color-wand', color: '#e11d48', onPress: () => router.push('/branding') },
    { title: 'Refer & Earn', icon: 'gift', color: '#6366f1', onPress: () => router.push('/referral') },
    { title: 'Community', icon: 'chatbubbles', color: '#0ea5e9', onPress: () => router.push('/community') },
    { title: 'Settings', icon: 'settings', color: '#64748b', onPress: () => router.push('/settings') },
  ];

  return (
    <>
      {/* Hero Banner */}
      <HeroBanner theme={theme} />

      {/* Student Count */}
      <StudentCountBadge count={activeStudents} theme={theme} />

      {/* Primary Actions - Horizontal Scrollable Cards */}
      <View style={styles.primarySection}>
        <SectionHeader>Quick Actions</SectionHeader>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.primaryScroll}
        >
          {quickActions.map((action, idx) => (
            <GradientActionCard key={action.title} action={action} delay={idx * 120} />
          ))}
        </ScrollView>
      </View>

      {/* Pending Dues Alert */}
      <DuesAlert duesCount={duesCount} totalDues={totalDues} theme={theme} />

      {/* Manage Grid */}
      <ActionGrid title="Manage" actions={manageActions} theme={theme} delay={400} />

      {/* Tip of the Day */}
      <TipOfTheDay theme={theme} />

      {/* Tools Grid */}
      <ActionGrid title="Tools & More" actions={toolActions} theme={theme} delay={500} />

      {/* Trust & Social Proof Banner */}
      <TrustBanner theme={theme} />

      {/* Support Banner */}
      <SupportBanner theme={theme} />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Banner
  bannerContainer: {
    marginBottom: -8,
  },
  banner: {
    borderRadius: 30,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  bannerTextBox: {
    flex: 1,
    gap: 4,
  },
  bannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  bannerLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bannerDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 2,
  },
  bannerCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  decorCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Primary Actions (horizontal cards)
  primarySection: {
    gap: spacing.lg,
    marginLeft: -spacing.xl,
    marginRight: -spacing.xl,
  },
  primaryScroll: {
    paddingHorizontal: spacing.xl,
    gap: 14,
  },
  primaryActionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  primaryActionGradient: {
    width: 160,
    height: 170,
    padding: 18,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  primaryActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionTextBox: {
    gap: 2,
  },
  primaryActionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  primaryActionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionDecor: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    opacity: 1,
    transform: [{ rotate: '15deg' }],
  },

  // Action Grid (3×N)
  gridSection: {
    gap: spacing.lg,
  },
  gridCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  gridItem: {
    width: '33.33%',
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },
  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Student Count Badge
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 12,
  },
  studentBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentBadgeText: {
    flex: 1,
    gap: 1,
  },
  studentBadgeValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  studentBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Dues Alert
  duesAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  duesAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  duesAlertIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duesAlertText: {
    flex: 1,
    gap: 2,
  },
  duesAlertTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  duesAlertDesc: {
    fontSize: 12,
    fontWeight: '600',
  },
  duesAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  duesAlertBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Trust Banner
  trustSection: {
    marginTop: 4,
  },
  trustCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustLogo: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustBrandText: {
    flex: 1,
    gap: 2,
  },
  trustBrand: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  trustTagline: {
    fontSize: 11,
    fontWeight: '600',
  },
  trustStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trustStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustStatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trustDivider: {
    width: 1,
    height: 14,
  },
  trustPlatforms: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Support Banner
  supportCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    gap: 16,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportText: {
    flex: 1,
    gap: 2,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  supportDesc: {
    fontSize: 12,
    fontWeight: '600',
  },
  supportActions: {
    flexDirection: 'row',
    gap: 10,
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  supportBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  supportBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  supportBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Tip of the Day
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 12,
  },
  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
    gap: 3,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
