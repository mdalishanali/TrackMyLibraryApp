import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/constants/design';
import { formatCurrency, formatDate, formatTimeOfDay } from '@/utils/format';

export interface SubscriptionHistoryItem {
  _id: string;
  planName: string;
  subscriptionStart: string;
  subscriptionEnd?: string;
  revenueCatType?: string;
  planPrice?: number;
  createdAt?: string;
}

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TypeConfig {
  icon: IoniconName;
  label: string;
  tone: 'primary' | 'success' | 'info' | 'danger';
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  MANUAL_CASH: { icon: 'cash-outline', label: 'Manual Cash', tone: 'success' },
  INITIAL_PURCHASE: { icon: 'rocket-outline', label: 'New Purchase', tone: 'primary' },
  RENEWAL: { icon: 'refresh-outline', label: 'Renewal', tone: 'info' },
  EXPIRATION: { icon: 'close-circle-outline', label: 'Expired', tone: 'danger' },
};

const FALLBACK_TYPE: TypeConfig = { icon: 'card-outline', label: 'Subscription', tone: 'info' };

const MAX_STAGGERED_ITEMS = 6;
const STAGGER_DELAY_MS = 70;
const SOFT_TINT_ALPHA = '14';

export const isSubscriptionActive = (item: SubscriptionHistoryItem) => {
  if (!item.subscriptionEnd || item.revenueCatType === 'EXPIRATION') return false;
  return new Date(item.subscriptionEnd).getTime() > Date.now();
};

const toTitleCase = (value: string) =>
  value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

interface SubscriptionHistoryCardProps {
  item: SubscriptionHistoryItem;
  index: number;
}

export function SubscriptionHistoryCard({ item, index }: SubscriptionHistoryCardProps) {
  const theme = useTheme();

  const config = TYPE_CONFIG[item.revenueCatType ?? ''] ?? FALLBACK_TYPE;
  const toneColor = theme[config.tone];
  const isActive = isSubscriptionActive(item);

  const dateRange = item.subscriptionEnd
    ? `${formatDate(item.subscriptionStart)} — ${formatDate(item.subscriptionEnd)}`
    : `Since ${formatDate(item.subscriptionStart)}`;

  const recordedAt = item.createdAt ?? item.subscriptionStart;
  const recordedLabel = `${formatDate(recordedAt)} · ${formatTimeOfDay(recordedAt)}`;

  const enterDelay = Math.min(index, MAX_STAGGERED_ITEMS) * STAGGER_DELAY_MS;

  return (
    <Animated.View entering={FadeInDown.delay(enterDelay).duration(400)}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: isActive ? theme.primary + '55' : theme.border },
        ]}
      >
        <View style={styles.topRow}>
          <View style={[styles.iconTile, { backgroundColor: toneColor + SOFT_TINT_ALPHA }]}>
            <Ionicons name={config.icon} size={22} color={toneColor} />
          </View>

          <View style={styles.titleBlock}>
            <Text style={[styles.planName, { color: theme.text }]} numberOfLines={1}>
              {toTitleCase(item.planName)} Plan
            </Text>
            <View style={[styles.typeChip, { backgroundColor: toneColor + SOFT_TINT_ALPHA }]}>
              <Text style={[styles.typeChipText, { color: toneColor }]}>{config.label}</Text>
            </View>
          </View>

          <View style={styles.rightBlock}>
            {item.planPrice != null && (
              <Text style={[styles.price, { color: theme.text }]}>{formatCurrency(item.planPrice)}</Text>
            )}
            {isActive && (
              <View style={[styles.activePill, { backgroundColor: theme.success + SOFT_TINT_ALPHA }]}>
                <View style={[styles.activeDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.activePillText, { color: theme.success }]}>Active</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={theme.muted} />
            <Text style={[styles.metaText, { color: theme.text }]}>{dateRange}</Text>
          </View>
          <Text style={[styles.recordedText, { color: theme.muted }]}>{recordedLabel}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 5,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  typeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rightBlock: {
    alignItems: 'flex-end',
    gap: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  recordedText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
