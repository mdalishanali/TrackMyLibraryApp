import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { SectionHeader } from '@/components/ui/section-header';
import { spacing } from '@/constants/design';
import { formatCurrency } from '@/utils/format';

const { width } = Dimensions.get('window');

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
    <View>
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
    </View>
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
    <View style={styles.gridSection}>
      <SectionHeader>{title}</SectionHeader>
      <View style={[styles.gridCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {actions.map((action, idx) => (
          <GridActionItem key={action.title} action={action} theme={theme} idx={idx} total={actions.length} />
        ))}
      </View>
    </View>
  );
}

function HeroBanner({ theme, activeStudents, todayRevenue }: { theme: any; activeStudents: number; todayRevenue: number }) {
  const router = useRouter();

  return (
    <View style={styles.bannerContainer}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/analytics');
        }}
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
      >
        <LinearGradient
          colors={[theme.primary, '#4338ca', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextBox}>
              <View style={[styles.bannerBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="pulse" size={10} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.bannerLabel}>LIVE STATUS</Text>
              </View>
              <Text style={styles.bannerTitle}>Library Today</Text>
              <Text style={styles.bannerDesc}>
                {activeStudents} active • ₹{todayRevenue.toLocaleString()} earned today
              </Text>
            </View>
            <View style={styles.bannerActionArea}>
              <View style={styles.bannerCircleBtn}>
                <Ionicons name="arrow-forward" size={20} color={theme.primary} />
              </View>
            </View>
          </View>
          
          {/* Subtle Premium Decoration */}
          <View style={styles.bannerMeshGradient}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Stats & Alerts Sub-Components ───────────────────────────

function MetricCard({ 
  label, 
  value, 
  icon, 
  color, 
  theme, 
  delay,
  onPress 
}: { 
  label: string; 
  value: string | number; 
  icon: keyof typeof Ionicons.glyphMap; 
  color: string; 
  theme: any; 
  delay: number;
  onPress?: () => void;
}) {
  return (
    <View style={styles.metricCardWrapper}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={({ pressed }) => [
          styles.metricCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        ]}
      >
        <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.metricText}>
          <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={2}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function EngagementCarousel({ theme }: { theme: any }) {
  const router = useRouter();

  const handleWhatsAppJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/community');
  };

  const handleReferralClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/referral');
  };

  const carouselItems = [
    {
      title: 'Refer & Earn ₹149',
      desc: 'Get bonus on every successful referral',
      icon: 'gift',
      colors: ['#6366F1', '#8B5CF6'],
      onPress: handleReferralClick,
    },
    {
      title: 'Join Community',
      desc: 'Connect with 500+ library owners',
      icon: 'logo-whatsapp',
      colors: ['#25D366', '#128C7E'],
      onPress: handleWhatsAppJoin,
    },
    {
      title: 'Cloud Backup',
      desc: 'Your data is synced & safe',
      icon: 'cloud-done',
      colors: ['#0ea5e9', '#2563eb'],
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.carouselSection}>
      <SectionHeader>Recommended for You</SectionHeader>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width - 52}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselScroll}
      >
        {carouselItems.map((item, idx) => (
          <View key={item.title}>
            <Pressable
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.carouselCard,
                pressed && { transform: [{ scale: 0.98 }] }
              ]}
            >
              <LinearGradient
                colors={item.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.carouselGradient}
              >
                <View style={styles.carouselContent}>
                  <View style={styles.carouselIconBox}>
                    <Ionicons name={item.icon as any} size={24} color="#fff" />
                  </View>
                  <View style={styles.carouselTextContent}>
                    <Text style={styles.carouselTitle}>{item.title}</Text>
                    <Text style={styles.carouselDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function MetricsSection({ 
  theme, 
  activeStudents, 
  totalStudents, 
  todayRevenue, 
  monthlyRevenue 
}: { 
  theme: any; 
  activeStudents: number; 
  totalStudents: number; 
  todayRevenue: number; 
  monthlyRevenue: number;
}) {
  const router = useRouter();

  return (
    <View style={styles.metricsSection}>
      <SectionHeader>Library Overview</SectionHeader>
      <View style={styles.metricsGrid}>
        <MetricCard
          label="Active"
          value={activeStudents}
          icon="people"
          color="#10b981"
          theme={theme}
          delay={100}
          onPress={() => router.push('/students')}
        />
        <MetricCard
          label="Today"
          value={formatCurrency(todayRevenue)}
          icon="today"
          color="#8b5cf6"
          theme={theme}
          delay={200}
          onPress={() => router.push('/payments')}
        />
        <MetricCard
          label="Monthly"
          value={formatCurrency(monthlyRevenue)}
          icon="wallet"
          color="#f59e0b"
          theme={theme}
          delay={300}
          onPress={() => router.push('/payments')}
        />
        <MetricCard
          label="Total"
          value={totalStudents}
          icon="stats-chart"
          color="#3b82f6"
          theme={theme}
          delay={400}
          onPress={() => router.push('/students')}
        />
      </View>
    </View>
  );
}

function DuesAlert({ duesCount, totalDues, theme }: { duesCount: number; totalDues: number; theme: any }) {
  const router = useRouter();

  if (duesCount === 0) return null;

  return (
    <View>
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
    </View>
  );
}

/**
 * ShareCard - Triggers native sharing functionality to invite other library owners.
 */
function ShareCard({ theme }: { theme: any }) {
  const onShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: 'Check out TrackMyLibrary! 📚 The best app to manage your library. \n\nGet it here:\nAndroid: https://play.google.com/store/apps/details?id=com.trackmylibrary\niOS: https://apps.apple.com/app/library-manager-trackmylibrary/id6737525389',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const isDark = theme.isDark;
  const cardColors = isDark ? ['#1E1B2E', '#161424'] : ['#EEF2FF', '#E0E7FF'];
  const titleColor = isDark ? '#A5B4FC' : '#3730A3';
  const subtitleColor = isDark ? '#818CF8' : '#4338CA';
  const borderColor = isDark ? '#312E81' : '#C7D2FE';

  return (
    <View>
      <Pressable onPress={onShare} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
        <LinearGradient
          colors={cardColors as [string, string]}
          style={[styles.shareCard, { borderColor }]}
        >
          <View style={[styles.shareIconBox, isDark && { backgroundColor: '#1F2937' }]}>
            <Ionicons name="share-social" size={24} color={isDark ? '#A5B4FC' : '#4F46E5'} />
          </View>
          <View style={styles.shareTextContent}>
            <Text style={[styles.shareTitle, { color: titleColor }]}>Invite a Friend!</Text>
            <Text style={[styles.shareSubtitle, { color: subtitleColor }]}>Help other library owners simplify their work.</Text>
          </View>
          <View style={styles.shareArrow}>
            <Ionicons name="paper-plane" size={18} color={subtitleColor} />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

/**
 * RatingCard - Platform-aware component that directs users to 
 * the appropriate store (App Store for iOS, Play Store for Android).
 */
function RatingCard({ theme }: { theme: any }) {
  const isDark = theme.isDark;
  const isIOS = Platform.OS === 'ios';
  const storeName = isIOS ? 'App Store' : 'Play Store';
  const storeUrl = isIOS 
    ? 'https://apps.apple.com/app/library-manager-trackmylibrary/id6737525389'
    : 'https://play.google.com/store/apps/details?id=com.trackmylibrary';

  const cardColors = isDark ? ['#2D1B10', '#1F120A'] : ['#FFF7ED', '#FFEDD5'];
  const titleColor = isDark ? '#FDBA74' : '#9A3412';
  const subtitleColor = isDark ? '#FB923C' : '#C2410C';
  const borderColor = isDark ? '#431407' : '#FED7AA';

  return (
    <View>
      <LinearGradient
        colors={cardColors as [string, string]}
        style={[styles.ratingCard, { borderColor }]}
      >
        <View style={styles.ratingContent}>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons key={s} name="star" size={18} color="#F59E0B" style={{ marginRight: 2 }} />
            ))}
          </View>
          <View style={styles.ratingTextBox}>
            <Text style={[styles.ratingTitle, { color: titleColor }]}>Enjoying the App?</Text>
            <Text style={[styles.ratingSubtitle, { color: subtitleColor }]}>Your 5-star rating helps us grow!</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Linking.openURL(storeUrl);
            }}
            style={({ pressed }) => [
              styles.ratingBtn,
              isDark && { backgroundColor: '#431407' },
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
          >
            <Text style={styles.ratingBtnText}>Rate on {storeName}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </View>
        <View style={[styles.ratingDecorCircle, isDark && { backgroundColor: 'rgba(245, 158, 11, 0.05)' }]} />
      </LinearGradient>
    </View>
  );
}

/**
 * MadeInIndiaFooter - Professional branding at the bottom of the dashboard.
 */
function MadeInIndiaFooter({ theme }: { theme: any }) {
  return (
    <View style={styles.footerContainer}>
      <Text style={[styles.footerMainText, { color: theme.muted }]}>
        Made with <Ionicons name="heart" size={14} color="#ef4444" /> in India
      </Text>
      <Text style={[styles.footerVersionText, { color: theme.muted + '80' }]}>Version 4.0.1 (Premium)</Text>
    </View>
  );
}

function TrustBanner({ theme }: { theme: any }) {
  return (
    <View style={styles.trustSection}>
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
            <Text style={[styles.trustTagline, { color: theme.muted }]}>India&apos;s #1 Library Management App</Text>
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
        </View>

        {/* Platform Badges */}
        <View style={styles.trustPlatforms}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL('https://apps.apple.com/app/library-manager-trackmylibrary/id6737525389');
            }}
            style={({ pressed }) => [
              styles.platformBadge,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { transform: [{ scale: 0.96 }], opacity: 0.8 }
            ]}
          >
            <Ionicons name="logo-apple" size={14} color={theme.text} />
            <Text style={[styles.platformText, { color: theme.muted }]}>iOS</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL('https://play.google.com/store/apps/details?id=com.trackmylibrary');
            }}
            style={({ pressed }) => [
              styles.platformBadge,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { transform: [{ scale: 0.96 }], opacity: 0.8 }
            ]}
          >
            <Ionicons name="logo-android" size={14} color="#3DDC84" />
            <Text style={[styles.platformText, { color: theme.muted }]}>Android</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL('https://trackmylibrary.com');
            }}
            style={({ pressed }) => [
              styles.platformBadge,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { transform: [{ scale: 0.96 }], opacity: 0.8 }
            ]}
          >
            <Ionicons name="globe" size={14} color="#3b82f6" />
            <Text style={[styles.platformText, { color: theme.muted }]}>Web</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

function SupportBanner({ theme }: { theme: any }) {
  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://wa.me/917348335273?text=${encodeURIComponent('Hello TrackMyLibrary Support, I need help with...')}`);
  };

  const handleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:md.alishanali88@gmail.com?subject=${encodeURIComponent('TrackMyLibrary Support Request')}`);
  };

  return (
    <View>
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
    </View>
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
    <View>
      <View style={[styles.tipCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.tipIcon, { backgroundColor: theme.primary + '12' }]}>
          <Ionicons name="bulb-outline" size={20} color={theme.primary} />
        </View>
        <View style={styles.tipContent}>
          <View style={styles.tipHeader}>
            <Text style={[styles.tipLabel, { color: theme.primary }]}>PRO TIP</Text>
            <View style={[styles.tipDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.tipLabel, { color: theme.muted }]}>Today</Text>
          </View>
          <Text style={[styles.tipText, { color: theme.text }]}>{todayTip.tip}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── DASHBOARD CORE ──────────────────────────────────────────

interface ClassicDashboardProps {
  theme: any;
  onAddStudent: () => void;
  onAddExpense: () => void;
  activeStudents?: number;
  totalStudents?: number;
  todayRevenue?: number;
  monthlyRevenue?: number;
  totalCapacity?: number;
  duesCount?: number;
  duesStudents?: { dueAmount?: number }[];
}

export function ClassicDashboard({ 
  theme, 
  onAddStudent, 
  onAddExpense, 
  activeStudents = 0, 
  totalStudents = 0,
  todayRevenue = 0,
  monthlyRevenue = 0,
  totalCapacity = 0,
  duesCount = 0, 
  duesStudents = [] 
}: ClassicDashboardProps) {
  const router = useRouter();
  const totalDues = duesStudents.reduce((sum, s) => sum + (s.dueAmount || 0), 0);

  const quickActions: GradientAction[] = [
    { title: 'Add Student', subtitle: 'New admission', icon: 'person-add', gradient: ['#10b981', '#059669'], onPress: onAddStudent },
    { title: 'Send Reminders', subtitle: duesCount > 0 ? `${duesCount} students due` : 'WhatsApp dues', icon: 'logo-whatsapp', gradient: ['#25D366', '#128C7E'], onPress: () => router.push('/whatsapp-student-select') },
    { title: 'Log Expense', subtitle: 'Track costs', icon: 'receipt', gradient: ['#f59e0b', '#d97706'], onPress: onAddExpense },
    // { title: 'Record Payment', subtitle: 'Collect fees', icon: 'wallet', gradient: ['#8b5cf6', '#7c3aed'], onPress: () => router.push('/payments') },
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
  ];

  return (
    <>
      {/* Hero Banner */}
      <HeroBanner theme={theme} activeStudents={activeStudents} todayRevenue={todayRevenue} />

      {/* Metrics Section */}
      <MetricsSection 
        theme={theme}
        activeStudents={activeStudents}
        totalStudents={totalStudents}
        todayRevenue={todayRevenue}
        monthlyRevenue={monthlyRevenue}
      />

      {/* Library Health Insight - Temporarily Hidden */}
      {/* 
      <OccupancyCard 
        activeStudents={activeStudents}
        totalCapacity={totalCapacity}
        theme={theme}
      /> 
      */}

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

      {/* Engagement Banners Carousel */}
      <EngagementCarousel theme={theme} />

      {/* Pending Dues Alert */}
      <DuesAlert duesCount={duesCount} totalDues={totalDues} theme={theme} />

      {/* Action Grid (3×N) */}
      <ActionGrid title="Manage" actions={manageActions} theme={theme} delay={400} />

      {/* Tip of the Day */}
      <TipOfTheDay theme={theme} />

      {/* Tools Grid */}
      <ActionGrid title="Tools & More" actions={toolActions} theme={theme} delay={500} />

      {/* Trust & Social Proof Banner */}
      <TrustBanner theme={theme} />

      {/* Support Banner */}
      <SupportBanner theme={theme} />

      {/* Sharing & Feedback */}
      <ShareCard theme={theme} />
      <RatingCard theme={theme} />

      {/* Footer */}
      <MadeInIndiaFooter theme={theme} />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Banner
  bannerContainer: {
    marginBottom: spacing.md,
  },
  banner: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  bannerTextBox: {
    flex: 1,
    gap: 6,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bannerLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  bannerDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 2,
  },
  bannerActionArea: {
    marginLeft: 16,
  },
  bannerCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  bannerMeshGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
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

  // Metrics Section
  metricsSection: {
    marginTop: 0,
    gap: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCardWrapper: {
    width: '48.2%',
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricText: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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

  // Occupancy Card
  occupancyContainer: {
    marginTop: spacing.sm,
  },
  occupancyCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  occupancyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  occupancyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occupancyHeaderText: {
    flex: 1,
    gap: 2,
  },
  occupancyTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  occupancySubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  occupancyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  occupancyBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressContainer: {
    gap: 8,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  occupancyFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Engagement Carousel
  carouselSection: {
    marginTop: 0,
    marginLeft: -spacing.xl,
    marginRight: -spacing.xl,
  },
  carouselScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 4,
    gap: 16,
  },
  carouselCard: {
    width: width - 52,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  carouselGradient: {
    padding: 18,
    paddingVertical: 22,
  },
  carouselContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  carouselIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTextContent: {
    flex: 1,
    gap: 2,
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  carouselDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Trust Banner
  trustSection: {
    marginTop: spacing.sm,
  },
  trustCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustBrandText: {
    flex: 1,
    gap: 2,
  },
  trustBrand: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  trustTagline: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  trustStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  trustStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustStatText: {
    fontSize: 12,
    fontWeight: '800',
  },
  trustDivider: {
    width: 1,
    height: 14,
  },
  trustPlatforms: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '800',
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
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tipDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.3,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  // Rating Card
  ratingCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  ratingContent: {
    zIndex: 2,
    alignItems: 'center',
    gap: 12,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  ratingTextBox: {
    alignItems: 'center',
    gap: 2,
  },
  ratingTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  ratingSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  ratingBtn: {
    backgroundColor: '#9A3412',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    shadowColor: '#9A3412',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  ratingBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  ratingDecorCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  footerMainText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerVersionText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Share Card
  shareCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  shareIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  shareTextContent: {
    flex: 1,
    gap: 2,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  shareSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  shareArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
