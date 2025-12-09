import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing, themeFor, typography } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const { user, logout } = useAuth();

  return (
    <SafeScreen>
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SectionHeader>Profile</SectionHeader>
      <AppCard style={styles.card}>
        <Text style={[styles.title, { color: theme.text }]}>{user?.name ?? 'User'}</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>{user?.email}</Text>
        {user?.contactNumber ? <Text style={[styles.meta, { color: theme.muted }]}>{user.contactNumber}</Text> : null}
        <Text style={[styles.meta, { color: theme.muted }]}>
          Company: {typeof user?.company === 'object' ? (user.company as any)?.businessName : '—'}
        </Text>
        <View style={styles.actions}>
          <AppButton variant="outline" onPress={logout}>
            Logout
          </AppButton>
        </View>
      </AppCard>

      <SectionHeader>More Options</SectionHeader>
      <AppCard style={styles.listCard}>
        <Link href="/analytics" asChild>
          <View style={styles.optionRow}>
            <Text style={[styles.option, { color: theme.text }]}>Analytics</Text>
          </View>
        </Link>
        <Link href="/profile" asChild>
          <View style={styles.optionRow}>
            <Text style={[styles.option, { color: theme.text }]}>Profile</Text>
          </View>
        </Link>
        <Link href="/users" asChild>
          <View style={styles.optionRow}>
            <Text style={[styles.option, { color: theme.text }]}>Users</Text>
          </View>
        </Link>
        <Link href="/payment-dashboard" asChild>
          <View style={styles.optionRow}>
            <Text style={[styles.option, { color: theme.text }]}>Payment Dashboard</Text>
          </View>
        </Link>
        <View style={[styles.optionRow, { justifyContent: 'space-between' }]}>
          <Text style={[styles.option, { color: theme.text }]}>Logout</Text>
          <AppButton variant="outline" onPress={logout}>
            Logout
          </AppButton>
        </View>
      </AppCard>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md },
  card: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  meta: {
    fontSize: typography.size.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  listCard: {
    gap: spacing.md,
  },
  optionRow: {
    paddingVertical: spacing.sm,
  },
  option: {
    fontSize: typography.size.md,
    fontWeight: '600',
  },
});
