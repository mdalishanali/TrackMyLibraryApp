import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppCard } from '@/components/ui/app-card';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { MiniBarChart } from '@/components/ui/mini-bar-chart';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing, typography } from '@/constants/design';
import { useRevenueDashboard } from '@/hooks/use-revenue';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/format';

export default function PaymentDashboardScreen() {
  const theme = useTheme();
  const revenueQuery = useRevenueDashboard();

  if (revenueQuery.isLoading) {
    return <FullScreenLoader message="Loading revenue..." />;
  }

  const cards = [
    {
      label: 'Monthly Revenue',
      value: revenueQuery.data?.monthlyRevenue ?? 0,
      change: revenueQuery.data?.monthChangePercent ?? 0,
    },
    {
      label: 'Annual Revenue',
      value: revenueQuery.data?.annualRevenue ?? 0,
      change: revenueQuery.data?.annualChangePercent ?? 0,
    },
    {
      label: 'Total Revenue',
      value: revenueQuery.data?.totalRevenue ?? 0,
      change: revenueQuery.data?.totalChangePercent ?? 0,
    },
  ];

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Payment Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Track your revenue and performance with ease</Text>

        <View style={styles.cards}>
          {cards.map((card) => (
            <AppCard key={card.label} padded style={styles.card}>
              <Text style={[styles.cardLabel, { color: theme.muted }]}>{card.label}</Text>
              <Text style={[styles.cardValue, { color: theme.text }]}>{formatCurrency(card.value)}</Text>
              <Text style={[styles.cardChange, { color: card.change >= 0 ? theme.success : theme.danger }]}>
                {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}% from last period
              </Text>
            </AppCard>
          ))}
        </View>

        <SectionHeader>Monthly Revenue</SectionHeader>
        <AppCard padded>
          {revenueQuery.data?.monthlyTrend?.length ? (
            <View style={{ gap: spacing.sm }}>
              <MiniBarChart
                data={revenueQuery.data.monthlyTrend.map((item) => ({
                  label: item.month.slice(0, 3),
                  value: item.revenue,
                }))}
              />
              {revenueQuery.data.monthlyTrend.map((item) => (
                <View key={`${item.month}-row`} style={[styles.trendRow, { borderColor: theme.border }]}>
                  <Text style={[styles.trendLabel, { color: theme.text }]}>{item.month}</Text>
                  <Text style={[styles.trendValue, { color: theme.text }]}>{formatCurrency(item.revenue)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: theme.muted }}>No trend data yet.</Text>
          )}
        </AppCard>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: typography.size.md,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  cardChange: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: 'transparent',
    paddingVertical: spacing.xs,
  },
  trendLabel: {
    fontSize: typography.size.md,
  },
  trendValue: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
});
