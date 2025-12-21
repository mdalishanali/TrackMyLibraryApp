import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { gradientFor, spacing, typography } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/providers/subscription-provider';
import { useDeleteAccount } from '@/hooks/use-profile';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/hooks/use-auth-mutations';
import { showToast } from '@/lib/toast';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isPro, presentPaywall, restorePurchases, presentCustomerCenter, isExpiringSoon, daysRemainingText } = useSubscription();
  const deleteAccount = useDeleteAccount();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const gradientColors = gradientFor(colorScheme);

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <SafeScreen>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <AppCard
            style={[
              styles.card,
              styles.heroCard,
              { backgroundColor: colorScheme === 'dark' ? theme.surfaceAlt : '#ffffffee', borderColor: theme.border },
            ]}>
            <View style={styles.heroRow}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '14', borderColor: theme.border }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {(user?.name ?? 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
                  {user?.name ?? 'User'}
                </Text>
                <Text style={[styles.subtle, { color: theme.muted }]} numberOfLines={1}>
                  {user?.email ?? '—'}
                </Text>
                {user?.contactNumber ? (
                  <Text style={[styles.subtle, { color: theme.muted }]} numberOfLines={1}>
                    {user.contactNumber}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/profile')}
                style={[styles.iconPill, { backgroundColor: theme.primary + '15', borderColor: theme.border }]}>
                <Ionicons name="pencil" size={18} color={theme.primary} />
              </Pressable>
            </View>
          </AppCard>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Subscription</Text>
            <Text style={[styles.sectionSub, { color: theme.muted }]}>Manage your premium features</Text>
          </View>

          {isExpiringSoon && (
            <Pressable
              onPress={isPro ? presentCustomerCenter : presentPaywall}
              style={[styles.smallExpiryBanner, { backgroundColor: theme.danger + '10', borderColor: theme.danger + '20' }]}>
              <Ionicons name="alert-circle" size={18} color={theme.danger} />
              <Text style={[styles.smallExpiryText, { color: theme.danger }]}>
                {isPro ? 'Subscription' : 'Trial'} expires {daysRemainingText === 'Today' ? 'TODAY' : `in ${daysRemainingText}`}. Renew soon!
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.danger} />
            </Pressable>
          )}

          <AppCard style={[styles.card, styles.rowCard]}>
            {!isPro ? (
              <ActionRow
                icon="star-outline"
                label="Upgrade to PRO"
                description="Get full access to all features"
                onPress={presentPaywall}
                themeTint={theme.primary}
                toneBackground
              />
            ) : (
              <ActionRow
                icon="settings-outline"
                label="Manage Subscription"
                description="View plans or cancel"
                onPress={presentCustomerCenter}
                themeTint={theme.primary}
                toneBackground
              />
            )}
            <ActionRow
              icon="receipt-outline"
              label="Billing History"
              description="View transaction and plan updates"
              onPress={() => router.push('/subscription-history')}
              themeTint={theme.info || theme.primary}
              toneBackground
            />
            <ActionRow
              icon="refresh"
              label="Restore Purchases"
              description="Already paid? Restore here"
              onPress={restorePurchases}
              themeTint={theme.info || theme.primary}
              toneBackground
            />
          </AppCard>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
            <Text style={[styles.sectionSub, { color: theme.muted }]}>Manage access and identity</Text>
          </View>
          <AppCard style={[styles.card, styles.rowCard]}>
            <ActionRow
              icon="person-circle-outline"
              label="Profile"
              description="Update your info"
              onPress={() => router.push('/profile')}
              themeTint={theme.primary}
              toneBackground
            />
            <ActionRow
              icon="log-out-outline"
              label="Log out"
              description="Sign out on this device"
              onPress={confirmLogout}
              themeTint={theme.danger}
              trailing={<Ionicons name="arrow-forward" size={16} color={theme.danger} />}
              toneBackground
            />
          </AppCard>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy & Safety</Text>
            <Text style={[styles.sectionSub, { color: theme.muted }]}>You can leave anytime</Text>
          </View>
          <AppCard
            style={[
              styles.card,
              styles.deleteCard,
              {
                borderColor: theme.danger + '40',
                backgroundColor: colorScheme === 'dark' ? theme.danger + '12' : theme.danger + '10',
              },
            ]}
            padded>
            <Text style={[styles.helper, { color: theme.text }]}>
              Remove your account and associated data at any time to meet platform requirements.
            </Text>
            <AppButton
              fullWidth
              variant="danger"
              tone="danger"
              onPress={handleDeleteAccount}
              loading={deleteAccount.isPending}>
              Delete Account
            </AppButton>
          </AppCard>
        </ScrollView>
      </LinearGradient>
      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log out?"
        description="Are you sure you want to sign out on this device?"
        confirmText="Log out"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
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
  trailing?: React.ReactNode;
  themeTint: string;
  toneBackground?: boolean;
};

function ActionRow({ icon, label, description, onPress, trailing, themeTint, toneBackground }: ActionRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: toneBackground ? themeTint + '10' : pressed ? theme.surfaceAlt : theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.rowIcon, { backgroundColor: themeTint + '18', borderColor: theme.border }]}>
        <Ionicons name={icon} size={20} color={themeTint} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        {description ? <Text style={[styles.rowDesc, { color: theme.muted }]}>{description}</Text> : null}
      </View>
      {trailing ?? <Ionicons name="chevron-forward" size={18} color={theme.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra padding for bottom tabs and clear space
    gap: spacing.md,
  },
  card: {
    gap: spacing.xs,
  },
  rowCard: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  deleteCard: {
    gap: spacing.md,
  },
  heroCard: {
    padding: spacing.md,
  },
  heroGradient: {
    borderRadius: spacing.xl,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  heroMeta: {
    flex: 1,
    gap: 2,
  },
  subtle: {
    fontSize: typography.size.md,
  },
  iconPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  value: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  helper: {
    fontSize: typography.size.md,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: typography.size.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: typography.size.sm,
  },
  smallExpiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  smallExpiryText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
});
