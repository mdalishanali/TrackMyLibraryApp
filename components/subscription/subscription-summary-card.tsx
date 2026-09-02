import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/constants/design';
import { formatDate } from '@/utils/format';
import {
  SubscriptionHistoryItem,
  isSubscriptionActive,
} from '@/components/subscription/subscription-history-card';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface PlanSummary {
  isActive: boolean;
  planName?: string;
  endDate?: string;
  daysLeft?: number;
}

const summarize = (subscriptions: SubscriptionHistoryItem[]): PlanSummary => {
  const withEndDate = subscriptions.filter((sub) => sub.subscriptionEnd);
  if (withEndDate.length === 0) return { isActive: false };

  const latest = withEndDate.reduce((best, sub) =>
    new Date(sub.subscriptionEnd!) > new Date(best.subscriptionEnd!) ? sub : best
  );

  const isActive = isSubscriptionActive(latest);
  const daysLeft = isActive
    ? Math.max(0, Math.ceil((new Date(latest.subscriptionEnd!).getTime() - Date.now()) / MS_PER_DAY))
    : undefined;

  return { isActive, planName: latest.planName, endDate: latest.subscriptionEnd, daysLeft };
};

interface SubscriptionSummaryCardProps {
  subscriptions: SubscriptionHistoryItem[];
}

export function SubscriptionSummaryCard({ subscriptions }: SubscriptionSummaryCardProps) {
  const theme = useTheme();
  const summary = summarize(subscriptions);

  if (!summary.endDate) return null;

  const statusColor = summary.isActive ? theme.success : theme.danger;
  const statusLabel = summary.isActive ? 'Active' : 'Expired';
  const detail = summary.isActive
    ? `${summary.daysLeft} days left · Expires ${formatDate(summary.endDate)}`
    : `Expired on ${formatDate(summary.endDate)}`;

  return (
    <Animated.View entering={FadeInUp.duration(500)}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.iconTile, { backgroundColor: theme.primary + '14' }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.label, { color: theme.muted }]}>CURRENT PLAN</Text>
          <Text style={[styles.planName, { color: theme.text }]} numberOfLines={1}>
            {summary.planName}
          </Text>
          <Text style={[styles.detail, { color: theme.muted }]}>{detail}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusColor + '14' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    textTransform: 'capitalize',
  },
  detail: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
