import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/constants/design';
import { api } from '@/lib/api-client';

const { width } = Dimensions.get('window');

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
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: async () => {
      const response = await api.get<{ subscriptions: SubscriptionHistoryItem[] }>('/subscriptions');
      return response.data;
    },
  });

  const renderItem = ({ item, index }: { item: SubscriptionHistoryItem, index: number }) => {
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
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(500)}
        style={styles.itemWrapper}
      >
        <Pressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={({ pressed }) => [
            styles.historyCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
          ]}
        >
          <View style={[styles.statusIcon, { 
            backgroundColor: isRenewal ? theme.primary + '15' : isExpiration ? theme.danger + '15' : theme.info + '15'
          }]}>
            <Ionicons
              name={isRenewal ? 'arrow-up-circle' : isExpiration ? 'close-circle' : 'refresh-circle'} 
              size={26}
              color={isRenewal ? theme.primary : isExpiration ? theme.danger : theme.info}
            />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.text }]}>
                {item.planName.charAt(0).toUpperCase() + item.planName.slice(1)} Plan
              </Text>
              {item.planPrice ? (
                <Text style={[styles.priceText, { color: theme.primary }]}>
                  ${item.planPrice.toFixed(2)}
                </Text>
              ) : null}
            </View>

            <View style={[styles.typeBadge, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.typeText, { color: theme.muted }]}>
                {item.revenueCatType?.replace(/_/g, ' ') || 'Subscription Update'}
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={theme.muted} />
              <Text style={[styles.dateText, { color: theme.text }]}>
                {dateRange}
              </Text>
            </View>

            <Text style={[styles.timeText, { color: theme.muted }]}>
              {transactionTime}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        <Stack.Screen
          options={{ 
            headerShown: false
          }}
        />

        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Billing History</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Overview of your subscription history</Text>
          </View>
        </Animated.View>

        <FlatList
          data={data?.subscriptions || []}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="receipt-outline" size={48} color={theme.muted + '40'} />
              </View>
              <Text style={[styles.emptyText, { color: theme.text }]}>No records found</Text>
              <Text style={[styles.emptySub, { color: theme.muted }]}>Your subscription payments will appear here.</Text>
            </View>
          }
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerInfo: {
    gap: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  listContainer: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  itemWrapper: {
    marginBottom: spacing.xs,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  statusIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
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
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 40,
  },
});
