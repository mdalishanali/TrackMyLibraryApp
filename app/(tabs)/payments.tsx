import { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { PaymentFormModal, PaymentFormValues } from '@/components/students/payment-form-modal';
import { spacing } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { useCreatePayment, useInfinitePaymentsQuery } from '@/hooks/use-payments';
import { useStudentsQuery } from '@/hooks/use-students';
import { formatCurrency, formatDate } from '@/utils/format';

const monthOptions = [
  { label: 'Jan', value: '1' },
  { label: 'Feb', value: '2' },
  { label: 'Mar', value: '3' },
  { label: 'Apr', value: '4' },
  { label: 'May', value: '5' },
  { label: 'Jun', value: '6' },
  { label: 'Jul', value: '7' },
  { label: 'Aug', value: '8' },
  { label: 'Sep', value: '9' },
  { label: 'Oct', value: '10' },
  { label: 'Nov', value: '11' },
  { label: 'Dec', value: '12' },
];

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear.toString(), (currentYear + 1).toString()];

export default function PaymentsScreen() {
  const theme = useTheme();
  const studentsQuery = useStudentsQuery();
  const createPayment = useCreatePayment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const buildPaymentDefaults = (student?: string): PaymentFormValues => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      student: student ?? '',
      rupees: 0,
      startDate: today,
      endDate: today,
      paymentDate: today,
      paymentMode: 'cash',
      notes: '',
    };
  };
  const [paymentDefaults, setPaymentDefaults] = useState<PaymentFormValues>(buildPaymentDefaults());
  const [selectedYear, setSelectedYear] = useState<string | null>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string | null>((new Date().getMonth() + 1).toString());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const monthListRef = useRef<FlatList>(null);
  const monthsData = useMemo(() => [
    { label: 'All Months', value: null },
    ...monthOptions
  ], []);

  useEffect(() => {
    if (selectedMonth && monthListRef.current) {
      // Small timeout to ensure list is ready if it's the initial render
      setTimeout(() => {
        monthListRef.current?.scrollToIndex({
          index: Number(selectedMonth),
          animated: true,
          viewPosition: 0.5
        });
      }, 500);
    }
  }, []); // Run on mount to scroll to initial selection

  useEffect(() => {
    if (monthListRef.current) {
      const idx = selectedMonth ? Number(selectedMonth) : 0;
      monthListRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }, [selectedMonth]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filterParams = useMemo(
    () => ({
      year: selectedYear || undefined,
      month: selectedMonth || undefined,
      search: debouncedSearch || undefined,
      limit: 10,
    }),
    [selectedYear, selectedMonth, debouncedSearch]
  );

  const paymentsQuery = useInfinitePaymentsQuery(filterParams);
  const payments = paymentsQuery.data?.pages.flatMap((page) => page.payments) ?? [];

  const openPaymentModal = (student?: string) => {
    setPaymentDefaults(buildPaymentDefaults(student));
    setIsModalOpen(true);
  };

  const onCreatePayment = async (values: PaymentFormValues) => {
    if (!values.student) return Alert.alert('Choose a student', 'Select a student to record payment.');
    try {
      await createPayment.mutateAsync({
        student: values.student,
        rupees: Number(values.rupees),
        startDate: values.startDate,
        endDate: values.endDate,
        paymentMode: values.paymentMode,
        paymentDate: values.paymentDate,
        notes: values.notes,
      });
      setIsModalOpen(false);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const clearFilters = () => {
    setSelectedYear(currentYear.toString());
    setSelectedMonth((new Date().getMonth() + 1).toString());
    setSearch('');
    setDebouncedSearch('');
  };

  const loadMore = () => {
    if (paymentsQuery.hasNextPage && !paymentsQuery.isFetchingNextPage) {
      paymentsQuery.fetchNextPage();
    }
  };

  const isInitialLoading = paymentsQuery.isLoading && payments.length === 0;

  const totalRevenue = useMemo(() =>
    payments.reduce((acc, p) => acc + (p.rupees || 0), 0),
    [payments]);

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent', 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        <FlatList
          data={payments}
          keyExtractor={(item) => (item._id?.toString() || Math.random().toString())}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <View style={[styles.stickyHeader, { backgroundColor: theme.background }]}>
              <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Revenue</Text>
                    <View style={styles.headerMeta}>
                      <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                      <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                        {payments.length} Transactions
                      </Text>
                    </View>
                  </View>
                  <View style={styles.revenueTotalBox}>
                    <Text style={[styles.revenueTotalLabel, { color: theme.muted }]}>TOTAL</Text>
                    <Text style={[styles.revenueTotalValue, { color: theme.primary }]}>
                      {formatCurrency(totalRevenue)}
                    </Text>
                  </View>
                </View>

                {/* Glass Search & Filters */}
                <View style={[styles.filterContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color={theme.muted} />
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Search name or notes..."
                      placeholderTextColor={theme.muted}
                      style={[styles.searchInput, { color: theme.text }]}
                    />
                    {search !== '' && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSearch('');
                        }}
                      >
                        <Ionicons name="close-circle" size={18} color={theme.muted} />
                      </Pressable>
                    )}
                  </View>

                  <View style={{ gap: 12 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      <FilterChip label="All Years" active={!selectedYear} onPress={() => setSelectedYear(null)} theme={theme} />
                      {yearOptions.map((year) => (
                        <FilterChip
                          key={year}
                          label={year}
                          active={selectedYear === year}
                          onPress={() => setSelectedYear(year)}
                          theme={theme}
                        />
                      ))}
                    </ScrollView>

                    <FlatList
                      ref={monthListRef}
                      data={monthsData}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipRow}
                      keyExtractor={(item) => item.label}
                      onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                          monthListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                        });
                      }}
                      renderItem={({ item }) => (
                        <FilterChip 
                          label={item.label}
                          active={selectedMonth === item.value}
                          onPress={() => setSelectedMonth(item.value)}
                          theme={theme}
                        />
                      )}
                    />
                  </View>
                </View>
              </Animated.View>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={paymentsQuery.isRefetching}
              onRefresh={paymentsQuery.refetch}
              tintColor={theme.primary}
              progressViewOffset={140}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 50).duration(500)}
              layout={Layout.springify().damping(15)}
            >
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={({ pressed }) => [styles.paymentItem, pressed && styles.itemPressed]}
              >
                <View style={[styles.paymentInner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.itemMain}>
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>
                        {typeof item.student === 'object' ? item.student.name : 'Student'}
                      </Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={12} color={theme.muted} />
                        <Text style={[styles.paymentDate, { color: theme.muted }]}>
                          Paid on {formatDate(item.paymentDate)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.amountInfo}>
                      <Text style={[styles.amountText, { color: theme.primary }]}>
                        {formatCurrency(item.rupees)}
                      </Text>
                      <LinearGradient
                        colors={item.paymentMode === 'cash' ? ['#48BB7820', '#48BB7805'] : ['#4299E120', '#4299E105']}
                        style={styles.modeBadge}
                      >
                        <Text style={[styles.modeText, { color: item.paymentMode === 'cash' ? '#48BB78' : '#4299E1' }]}>
                          {item.paymentMode.toUpperCase()}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>

                  <View style={[styles.itemDetail, { backgroundColor: theme.surfaceAlt }]}>
                    <View style={styles.periodRow}>
                      <Ionicons name="calendar-outline" size={14} color={theme.muted} />
                      <Text style={[styles.periodText, { color: theme.text }]}>
                        {formatDate(item.startDate)} — {formatDate(item.endDate)}
                      </Text>
                    </View>
                    {item.notes ? (
                      <View style={[styles.notesContainer, { borderTopColor: theme.border + '30' }]}>
                        <Text style={[styles.itemNotes, { color: theme.muted }]} numberOfLines={2}>
                          {item.notes}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          )}
          ListEmptyComponent={
            isInitialLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={theme.primary} />
                <Text style={{ color: theme.muted, marginTop: 12, fontWeight: '600' }}>Loading payments...</Text>
              </View>
            ) : (
              <View style={[styles.emptyState, { borderColor: theme.border }]}>
                  <View style={[styles.emptyIconBox, { backgroundColor: theme.surfaceAlt }]}>
                    <Ionicons name="receipt-outline" size={48} color={theme.muted + '40'} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No records found</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.muted }]}>Try adjusting your filters or record a new payment.</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      clearFilters();
                    }}
                    style={({ pressed }) => [
                      styles.resetBtn,
                      { backgroundColor: theme.primary + '10' },
                      pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>Reset Filters</Text>
                  </Pressable>
              </View>
            )
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            paymentsQuery.isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : <View style={{ height: 100 }} />
          }
        />

        {/* Floating Action Button */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.fabContainer}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              openPaymentModal();
            }}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.primary },
              pressed && { transform: [{ scale: 0.9 }], opacity: 0.9 }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="add" size={32} color="#fff" />
          </Pressable>
        </Animated.View>

        <PaymentFormModal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialValues={paymentDefaults}
          theme={theme}
          isSubmitting={createPayment.isPending}
          onSubmit={onCreatePayment}
          studentOptions={(studentsQuery.data ?? []).map((s) => ({ id: s._id, name: s.name }))}
          title="Record Payment"
        />
      </View>
    </SafeScreen>
  );
}

function FilterChip({ label, active, onPress, theme }: { label: string; active: boolean; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          borderColor: active ? theme.primary : theme.border,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }]
        },
      ]}>
      <Text style={[styles.chipText, { color: active ? '#fff' : theme.text, opacity: active ? 1 : 0.8 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingBottom: 40,
  },
  stickyHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  revenueTotalBox: {
    alignItems: 'flex-end',
  },
  revenueTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  revenueTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  filterContainer: {
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1.5,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  filterRows: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Item Styles
  paymentItem: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  paymentInner: {
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  itemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountInfo: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amountText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemDetail: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesContainer: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
  },
  itemNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  itemPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  // Empty State
  emptyState: {
    margin: spacing.xl,
    padding: 40,
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 100,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
