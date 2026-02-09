import React, { useState, useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Dimensions, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import * as StoreReview from 'expo-store-review';
import { STORE_URLS } from '@/constants/config';
import { AppButton } from '@/components/ui/app-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { spacing, radius, typography } from '@/constants/design';
import { BRAND_FOOTER_TEXT } from '@/constants/config';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/providers/subscription-provider';
import { useDeleteAccount } from '@/hooks/use-profile';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useAppearanceStore, AppearanceMode } from '@/hooks/use-appearance';
import { getErrorMessage } from '@/hooks/use-auth-mutations';
import { showToast } from '@/lib/toast';
import { usePostHog } from 'posthog-react-native';
import { useScreenView } from '@/hooks/use-screen-view';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isPro, presentPaywall, restorePurchases, presentCustomerCenter, isExpiringSoon, daysRemainingText } = useSubscription();
  const deleteAccount = useDeleteAccount();
  const { mode } = useAppearanceStore();
  const posthog = usePostHog();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Track screen view
  useScreenView('Settings');

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <SafeScreen edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Immersive Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Manage your account and preferences</Text>
          </View>

          {/* Premium User Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile');
            }}
            style={({ pressed }) => [
              styles.heroContainer,
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
          >
            <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <LinearGradient
                colors={[theme.primary + '15', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <View style={[styles.avatarBox, { backgroundColor: theme.primary + '20', borderColor: theme.border }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {(user?.name ?? 'U').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.heroMeta}>
                  <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                    {user?.name ?? 'Account User'}
                  </Text>
                  <Text style={[styles.userEmail, { color: theme.muted }]} numberOfLines={1}>
                    {user?.email ?? '—'}
                  </Text>
                  <View style={[styles.proBadgeContainer, { backgroundColor: isPro ? '#FFD70020' : theme.surfaceAlt }]}>
                    <Ionicons name={isPro ? "shield-checkmark" : "shield-outline"} size={12} color={isPro ? "#FFA500" : theme.muted} />
                    <Text style={[styles.proBadgeText, { color: isPro ? "#FFA500" : theme.muted }]}>
                      {isPro ? 'PRO MEMBER' : 'FREE ACCOUNT'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.editCircle, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name="chevron-forward" size={20} color={theme.muted} />
                </View>
              </View>
            </View>
          </Pressable>

          {/* Subscription Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Subscription</Text>
          </View>

          {/* Subscription Status Card - Unified */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.upgradeBtnContainer}>
            <Pressable
              onPress={() => {
                if (isExpiringSoon) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                } else {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }
                isPro && !isExpiringSoon ? presentCustomerCenter() : presentPaywall();
              }}
              style={({ pressed }) => [
                styles.upgradeBtn,
                pressed && { transform: [{ scale: 0.98 }] }
              ]}
            >
              <LinearGradient
                colors={
                  isExpiringSoon
                    ? [theme.danger, '#b91c1c']
                    : isPro
                      ? [theme.primary, theme.info || '#4FACFE']
                      : [theme.primary, '#4338ca']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeContent}>
                  <View style={[styles.upgradeIconBox, isExpiringSoon && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons
                      name={isExpiringSoon ? "alert-circle" : isPro ? "sparkles" : "star"}
                      size={22}
                      color="#fff"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upgradeTitle}>
                      {isExpiringSoon
                        ? 'Action Required'
                        : isPro
                          ? 'You are PRO'
                          : 'Upgrade to PRO'}
                    </Text>
                    <Text style={styles.upgradeSubtitle}>
                      {isExpiringSoon
                        ? `Your access expires in ${daysRemainingText}`
                        : isPro
                          ? (daysRemainingText ? `Renews in ${daysRemainingText}` : 'Active Plan')
                          : 'Unlock full access to all features'}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12
                  }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                      {isExpiringSoon ? 'RENEW' : 'VIEW'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {!isPro ? (
              <ActionRow
                icon="star"
                label="Upgrade to Premium"
                description="Unleash all features and limits"
                onPress={presentPaywall}
                themeTint="#FFD700"
              />
            ) : (
              <ActionRow
                  icon="card"
                label="Manage Subscription"
                  description="View your plan or billing history"
                  onPress={presentPaywall}
                  themeTint={theme.primary}
              />
            )}
            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />
            <ActionRow
              icon="receipt"
              label="Billing History"
              description="View transaction statements"
              onPress={() => router.push('/subscription-history')}
              themeTint={theme.info || '#4FD1C5'}
            />
            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />
            <ActionRow
              icon="refresh-circle"
              label="Restore Purchases"
              description="Recover your premium status"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                posthog?.capture('restore_purchases_clicked', { source: 'settings' });
                restorePurchases();
              }}
              themeTint={theme.info || '#63B3ED'}
            />
          </View>

          {/* Appearance Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActionRow
              icon="color-palette"
              label="Theme Mode"
              description={`Currently: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
              onPress={() => router.push('/appearance')}
              themeTint={theme.primary}
            />
          </View>

          {/* Account Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActionRow
              icon="person-circle"
              label="Edit Profile"
              description="Name, email, and contact details"
              onPress={() => router.push('/profile')}
              themeTint={theme.primary}
            />
            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />
            <ActionRow
              icon="log-out"
              label="Sign Out"
              description="Log out from this device"
              onPress={confirmLogout}
              themeTint={theme.danger}
              destructive
            />
          </View>

          {/* Automation Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Automation</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActionRow
              icon="logo-whatsapp"
              label="WhatsApp Notifications"
              description="Manage alerts and connection"
              onPress={() => router.push('/whatsapp-settings')}
              themeTint="#25D366"
            />
            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />
            <ActionRow
              icon="document-text-outline"
              label="Message Templates"
              description="Edit welcome and reminder texts"
              onPress={() => router.push('/whatsapp-templates')}
              themeTint={theme.primary}
            />
          </View>

          {/* Support Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Support & Feedback</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActionRow
              icon="logo-whatsapp"
              label="Contact on WhatsApp"
              description="+91 63914 17248"
              onPress={() => Linking.openURL(`https://wa.me/916391417248?text=${encodeURIComponent('Hello TrackMyLibrary Support, I need help with...')}`)}
              themeTint="#25D366"
            />
            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />
            <ActionRow
              icon="mail"
              label="Email Support"
              description="md.alishanali88@gmail.com"
              onPress={() => Linking.openURL(`mailto:md.alishanali88@gmail.com?subject=${encodeURIComponent('TrackMyLibrary Support Request')}&body=${encodeURIComponent('Hello Team,\n\nI need help with...')}`)}
              themeTint={theme.info || '#4FACFE'}
            />
            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />
            <ActionRow
              icon="star-outline"
              label="Rate App"
              description="Show some love on the store"
              onPress={() => {
                const url = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
                Linking.openURL(url);
              }}
              themeTint="#FFD700"
            />
          </View>

          {/* Privacy Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data & Security</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: spacing.lg }]}>
            <Text style={[styles.dangerHelper, { color: theme.muted }]}>
              Deleting your account will permanently remove all your library data, student records, and subscription history. This action cannot be undone.
            </Text>
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                handleDeleteAccount();
              }}
              style={({ pressed }) => [
                styles.deleteBtn,
                { backgroundColor: theme.danger + '10', borderColor: theme.danger + '30' },
                pressed && { backgroundColor: theme.danger + '20' }
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
              <Text style={[styles.deleteText, { color: theme.danger }]}>Delete Account Permanently</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: theme.muted }]}>Version 2.0.0 (Premium)</Text>
            <Text style={[styles.footerSub, { color: theme.muted }]}>{BRAND_FOOTER_TEXT}</Text>
          </View>
        </ScrollView>
      </View>
      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log out?"
        description="Are you sure you want to sign out on this device?"
        confirmText="Log out"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          posthog?.capture('user_logged_out');
          logout();
          router.replace('/(auth)/login');
        }}
        destructive
      />
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete account?"
        description="This will permanently remove your account and associated data."
        confirmText="Delete Account"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          try {
            await deleteAccount.mutateAsync();
            setShowDeleteConfirm(false);
            showToast('Account deleted', 'success');
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Unable to delete', getErrorMessage(error));
          }
        }}
        destructive
        loading={deleteAccount.isPending}
      />
    </SafeScreen>
  );
}

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  themeTint: string;
  destructive?: boolean;
};

function ActionRow({ icon, label, description, onPress, themeTint, destructive }: ActionRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(destructive ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.surfaceAlt }
      ]}>
      <View style={[styles.rowIconBox, { backgroundColor: themeTint + '15' }]}>
        <Ionicons name={icon} size={22} color={themeTint} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: destructive ? theme.danger : theme.text }]}>{label}</Text>
        {description && <Text style={[styles.rowDesc, { color: theme.muted }]}>{description}</Text>}
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={destructive ? theme.danger + '40' : theme.muted + '40'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  upgradeBtnContainer: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  upgradeBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  upgradeGradient: {
    padding: spacing.lg,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  upgradeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  upgradeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: spacing.md,
    gap: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  heroContainer: {
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.md,
  },
  heroCard: {
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  heroMeta: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  proBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  editCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  card: {
    marginHorizontal: spacing.xl,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  rowIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
  expiryBanner: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xs,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  expiryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiryContent: {
    flex: 1,
    gap: 2,
  },
  expiryTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  expirySubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  dangerHelper: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    marginTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  footerSub: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
