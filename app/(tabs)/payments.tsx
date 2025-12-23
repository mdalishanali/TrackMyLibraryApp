import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { PaymentFormModal, PaymentFormValues } from '@/components/students/payment-form-modal';
import { radius, spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { useCreatePayment, useInfinitePaymentsQuery } from '@/hooks/use-payments';
import { useStudentsQuery } from '@/hooks/use-students';
import { formatCurrency, formatDate } from '@/utils/format';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

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
  const colorScheme = useColorScheme();
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
  const [modeFilter, setModeFilter] = useState<'cash' | 'upi' | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filterParams = useMemo(
    () => ({
      year: selectedYear || undefined,
      month: selectedMonth || undefined,
      paymentMode: modeFilter || undefined,
      search: debouncedSearch || undefined,
      limit: 10,
    }),
    [selectedYear, selectedMonth, modeFilter, debouncedSearch]
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
    setModeFilter(null);
    setSearch('');
    setDebouncedSearch('');
  };

  const loadMore = () => {
    if (paymentsQuery.hasNextPage && !paymentsQuery.isFetchingNextPage) {
      paymentsQuery.fetchNextPage();
    }
  };

  const isInitialLoading = paymentsQuery.isLoading && payments.length === 0;

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '08', 'transparent']}
          style={styles.bgGradient}
        />

        <FlatList
          data={payments}
          keyExtractor={(item) => (item._id?.toString() || Math.random().toString())}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Animated.View entering={FadeInUp.duration(600)} style={styles.headerTop}>
                <View>
                  <Text style={[styles.title, { color: theme.text }]}>Revenue</Text>
                  <Text style={[styles.subtitle, { color: theme.muted }]}>Track and manage student fees</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: theme.primary }]}
                  onPress={() => openPaymentModal()}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.filterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color={theme.muted} style={{ marginLeft: 12 }} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search name or notes..."
                    placeholderTextColor={theme.muted}
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                  {search !== '' && (
                    <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 12 }}>
                      <Ionicons name="close-circle" size={18} color={theme.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.filterRows}>
                  <View style={styles.filterGroup}>
                    <Text style={[styles.filterLabel, { color: theme.muted }]}>Year</Text>
                    <View style={styles.chipRow}>
                      <FilterChip label="All" active={!selectedYear} onPress={() => setSelectedYear(null)} theme={theme} />
                      {yearOptions.map((year) => (
                        <FilterChip
                          key={year}
                          label={year}
                          active={selectedYear === year}
                          onPress={() => setSelectedYear(year)}
                          theme={theme}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.filterGroup}>
                    <Text style={[styles.filterLabel, { color: theme.muted }]}>Month</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      <FilterChip label="All" active={!selectedMonth} onPress={() => setSelectedMonth(null)} theme={theme} />
                      {monthOptions.map((m) => (
                        <FilterChip
                          key={m.value}
                          label={m.label}
                          active={selectedMonth === m.value}
                          onPress={() => setSelectedMonth(m.value)}
                          theme={theme}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={[styles.filterFooter, { borderTopColor: theme.border + '50' }]}>
                  <Text style={[styles.paymentCount, { color: theme.muted }]}>
                    {payments.length} Payments found
                  </Text>
                  {(selectedYear || selectedMonth || modeFilter || debouncedSearch) && (
                    <TouchableOpacity onPress={clearFilters}>
                      <Text style={[styles.clearText, { color: theme.primary }]}>Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            </View>
          }
          refreshControl={<RefreshControl refreshing={paymentsQuery.isRefetching} onRefresh={paymentsQuery.refetch} tintColor={theme.primary} />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50 + 400).duration(500)} layout={Layout.springify()}>
              <Pressable style={({ pressed }) => [styles.paymentItem, pressed && styles.itemPressed]}>
                <View style={[styles.paymentInner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.itemMain}>
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>
                        {typeof item.student === 'object' ? item.student.name : 'Student'}
                      </Text>
                      <Text style={[styles.paymentDate, { color: theme.muted }]}>Paid on {formatDate(item.paymentDate)}</Text>
                    </View>
                    <View style={styles.amountInfo}>
                      <Text style={[styles.amountText, { color: theme.primary }]}>{formatCurrency(item.rupees)}</Text>
                      <AppBadge tone={item.paymentMode === 'cash' ? 'success' : 'info'}>
                        {item.paymentMode.toUpperCase()}
                      </AppBadge>
                    </View>
                  </View>
                  <View style={[styles.itemDetail, { backgroundColor: theme.surfaceAlt }]}>
                    <Ionicons name="calendar-outline" size={14} color={theme.muted} />
                    <Text style={[styles.periodText, { color: theme.text }]}>
                      {formatDate(item.startDate)} — {formatDate(item.endDate)}
                    </Text>
                  </View>
                  {item.notes ? (
                    <Text style={[styles.itemNotes, { color: theme.muted }]} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          )}
          ListEmptyComponent={
            isInitialLoading ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={theme.primary} />
                <Text style={{ color: theme.muted, marginTop: 8 }}>Loading payments...</Text>
              </View>
            ) : (
              <View style={[styles.emptyState, { borderColor: theme.border }]}>
                <Ionicons name="receipt-outline" size={48} color={theme.muted + '40'} />
                <Text style={{ color: theme.muted, fontWeight: '600', marginTop: 12 }}>No payments found</Text>
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={{ color: theme.primary, marginTop: 8, fontWeight: '700' }}>Reset filters</Text>
                </TouchableOpacity>
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
            ) : null
          }
        />

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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.primary : theme.surfaceAlt,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}>
      <Text style={[styles.chipText, { color: active ? '#fff' : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGradient: { ...StyleSheet.absoluteFillObject, height: 250 },
  listContent: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: spacing.xl,
    gap: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterCard: {
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  filterRows: { gap: spacing.md },
  filterGroup: { gap: 8 },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
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
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  paymentCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '800',
  },
  // Item Styles
  paymentItem: {
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
    gap: 2,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
  },
  paymentDate: {
    fontSize: 12,
    fontWeight: '600',
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
  itemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  itemPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 20,
  },
});

