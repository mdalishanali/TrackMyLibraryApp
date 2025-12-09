import { StyleSheet, Text, View } from 'react-native';

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

      <SectionHeader>Theme Tokens</SectionHeader>
      <AppCard>
        <Text style={[styles.meta, { color: theme.muted }]}>
          Colors, font sizes, and radius are centralized in `constants/design.ts`. Reuse those tokens when extending the
          app to keep a consistent look and allow easy theming.
        </Text>
      </AppCard>
    </View>
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
});
