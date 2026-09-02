import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import {
  SubscriptionHistoryCard,
  SubscriptionHistoryItem,
} from '@/components/subscription/subscription-history-card';
import { SubscriptionSummaryCard } from '@/components/subscription/subscription-summary-card';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/constants/design';
import { api } from '@/lib/api-client';

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

  const subscriptions = useMemo(() => {
    const items = data?.subscriptions ?? [];
    return [...items].sort(
      (a, b) => new Date(b.subscriptionStart).getTime() - new Date(a.subscriptionStart).getTime()
    );
  }, [data?.subscriptions]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
        <LinearGradient colors={[theme.primary + '10', 'transparent']} style={StyleSheet.absoluteFill} />
        <Stack.Screen options={{ headerShown: false }} />

        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Billing History</Text>
            <View style={styles.headerSpacer} />
          </View>
        </Animated.View>

        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => <SubscriptionHistoryCard item={item} index={index} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <SubscriptionSummaryCard subscriptions={subscriptions} />
              {subscriptions.length > 0 && (
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Transactions</Text>
                  <Text style={[styles.sectionCount, { color: theme.muted }]}>
                    {subscriptions.length} {subscriptions.length === 1 ? 'record' : 'records'}
                  </Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="receipt-outline" size={48} color={theme.muted + '40'} />
              </View>
              <Text style={[styles.emptyText, { color: theme.text }]}>No records found</Text>
              <Text style={[styles.emptySub, { color: theme.muted }]}>
                Your subscription payments will appear here.
              </Text>
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
    paddingBottom: spacing.sm,
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
  headerSpacer: {
    width: 44,
  },
  listContainer: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  listHeader: {
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
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
