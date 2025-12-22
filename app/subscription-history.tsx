import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useTheme } from '@/hooks/use-theme';
import { spacing, typography } from '@/constants/design';
import { api } from '@/lib/api-client';

interface SubscriptionHistoryItem {
  _id: string;
  planName: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  revenueCatType: string;
  planPrice?: number;
}

export default function SubscriptionHistoryScreen() {
  const theme = useTheme();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: async () => {
      const response = await api.get<{ subscriptions: SubscriptionHistoryItem[] }>('/subscriptions');
      return response.data;
    },
  });

  const renderItem = ({ item }: { item: SubscriptionHistoryItem }) => {
    const isExpiration = item.revenueCatType === 'EXPIRATION';
    const isRenewal = item.revenueCatType === 'RENEWAL' || item.revenueCatType === 'INITIAL_PURCHASE';
    
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    const formatTime = (dateString: string) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const dateRange = item.subscriptionEnd
      ? `${formatDate(item.subscriptionStart)} — ${formatDate(item.subscriptionEnd)}`
      : `Since ${formatDate(item.subscriptionStart)}`;

    const transactionTime = `${formatDate(item.subscriptionStart)} at ${formatTime(item.subscriptionStart)}`;

    return (
      <View style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.statusIcon, { 
          backgroundColor: isRenewal ? theme.success + '15' : isExpiration ? theme.danger + '15' : theme.primary + '15' 
        }]}>
          <Ionicons 
            name={isRenewal ? 'arrow-up-circle' : isExpiration ? 'close-circle' : 'refresh-circle'} 
            size={24} 
            color={isRenewal ? theme.success : isExpiration ? theme.danger : theme.primary} 
          />
        </View>
        
        <View style={styles.cardContent}>
          <Text style={[styles.planName, { color: theme.text }]}>
            {item.planName.charAt(0).toUpperCase() + item.planName.slice(1)} Plan
          </Text>
          <Text style={[styles.typeText, { color: theme.muted }]}>
            {item.revenueCatType?.replace(/_/g, ' ') || 'Subscription Update'}
          </Text>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {dateRange}
          </Text>
          <Text style={[styles.timeText, { color: theme.muted }]}>
            {transactionTime}
          </Text>
        </View>

        {item.planPrice ? (
          <Text style={[styles.priceText, { color: theme.text }]}>
            ${item.planPrice.toFixed(2)}
          </Text>
        ) : null}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeScreen backgroundColor={theme.background} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Billing History', headerBackTitle: 'Settings' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen backgroundColor={theme.background} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Billing History', 
          headerBackTitle: 'Settings',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text
        }} 
      />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Overview of your subscription events</Text>
      </View>

      <FlatList
        data={data?.subscriptions || []}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.muted }]}>No transaction history found</Text>
          </View>
        }
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    gap: 4,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: typography.size.md,
  },
  listContainer: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  planName: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  typeText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  dateText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  timeText: {
    fontSize: typography.size.xs,
    opacity: 0.7,
  },
  priceText: {
    fontSize: typography.size.md,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.size.md,
    fontWeight: '600',
  },
});
