import { StyleSheet, Text, View } from 'react-native';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppCard } from '@/components/ui/app-card';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing, themeFor, typography } from '@/constants/design';
import { useDashboardQuery } from '@/hooks/use-dashboard';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const dashboardQuery = useDashboardQuery();

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SectionHeader>Analytics</SectionHeader>
        <AppCard padded style={{ gap: spacing.sm }}>
          <Text style={[styles.label, { color: theme.muted }]}>Active Students</Text>
          <Text style={[styles.value, { color: theme.text }]}>{dashboardQuery.data?.activeStudentsCount ?? 0}</Text>
          <Text style={[styles.label, { color: theme.muted }]}>Students This Month</Text>
          <Text style={[styles.value, { color: theme.text }]}>{dashboardQuery.data?.studentsEnrolledThisMonth ?? 0}</Text>
        </AppCard>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
  },
  value: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
});
