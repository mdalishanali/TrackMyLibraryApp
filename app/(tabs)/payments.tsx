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
} from 'react-native';
import { SafeScreen } from '@/components/layout/safe-screen';

import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { PaymentFormModal, PaymentFormValues } from '@/components/students/payment-form-modal';
import { SectionHeader } from '@/components/ui/section-header';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

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
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

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
    setIsMonthPickerOpen(false);
  };

  const loadMore = () => {
    if (paymentsQuery.hasNextPage && !paymentsQuery.isFetchingNextPage) {
      paymentsQuery.fetchNextPage();
    }
  };

  const isInitialLoading = paymentsQuery.isLoading && payments.length === 0;

  return (
    <SafeScreen>
      <FlatList
        data={payments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SectionHeader>Payments</SectionHeader>
                <Text style={[styles.subtitle, { color: theme.muted }]}>
                  Manage, filter, and review student payments in one place.
                </Text>
              </View>
              <AppButton onPress={() => openPaymentModal()}>Add Payment</AppButton>
            </View>

            <AppCard style={[styles.filterCard, { backgroundColor: theme.surfaceAlt }]}>
              <View style={styles.filterHeader}>
                <View>
                  <Text style={[styles.filterTitle, { color: theme.text }]}>Latest Payments</Text>
                  <Text style={[styles.filterHint, { color: theme.muted }]}>
                    Filter by year, month, mode, or search by student name.
                  </Text>
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: theme.muted }]}>Year</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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
                </ScrollView>
              </View>

              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: theme.muted }]}>Month</Text>
                <TouchableOpacity
                  onPress={() => setIsMonthPickerOpen((prev) => !prev)}
                  style={[
                    styles.dropdownTrigger,
                    { borderColor: theme.border, backgroundColor: theme.surface, shadowColor: theme.text },
                  ]}>
                  <Text style={{ color: theme.text }}>
                    {selectedMonth
                      ? monthOptions.find((m) => m.value === selectedMonth)?.label ?? 'Select'
                      : 'All months'}
                  </Text>
                  <Text style={{ color: theme.muted }}>{isMonthPickerOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {isMonthPickerOpen ? (
                  <View style={[styles.dropdownList, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        { backgroundColor: !selectedMonth ? theme.primary : 'transparent' },
                      ]}
                      onPress={() => {
                        setSelectedMonth(null);
                        setIsMonthPickerOpen(false);
                      }}>
                      <Text style={{ color: !selectedMonth ? '#fff' : theme.text }}>All</Text>
                    </TouchableOpacity>
                    {monthOptions.map((month) => {
                      const isActive = selectedMonth === month.value;
                      return (
                        <TouchableOpacity
                          key={month.value}
                          style={[
                            styles.dropdownItem,
                            { backgroundColor: isActive ? theme.primary : 'transparent' },
                          ]}
                          onPress={() => {
                            setSelectedMonth(month.value);
                            setIsMonthPickerOpen(false);
                          }}>
                          <Text style={{ color: isActive ? '#fff' : theme.text }}>{month.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: theme.muted }]}>Payment mode</Text>
                <View style={styles.chipRow}>
                  <FilterChip label="All" active={!modeFilter} onPress={() => setModeFilter(null)} theme={theme} />
                  <FilterChip
                    label="Cash"
                    active={modeFilter === 'cash'}
                    onPress={() => setModeFilter('cash')}
                    theme={theme}
                  />
                  <FilterChip
                    label="UPI"
                    active={modeFilter === 'upi'}
                    onPress={() => setModeFilter('upi')}
                    theme={theme}
                  />
                </View>
              </View>

              <View style={styles.searchRow}>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by student or notes"
                  placeholderTextColor={theme.muted}
                  style={[
                    styles.searchInput,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.surface,
                    },
                  ]}
                />
              </View>

              <View style={styles.filterSummaryRow}>
                <Text style={[styles.filterHint, { color: theme.muted }]}>
                  Showing {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
                  {paymentsQuery.data?.pages?.[0]?.pagination?.total
                    ? ` of ${paymentsQuery.data.pages[0].pagination?.total}`
                    : ''}
                </Text>
                <View style={styles.filterSummaryActions}>
                  {selectedYear || selectedMonth || modeFilter || debouncedSearch ? (
                    <>
                      <TouchableOpacity onPress={clearFilters} style={styles.clearChip}>
                        <Text style={[styles.clearText, { color: theme.primary }]}>Clear</Text>
                      </TouchableOpacity>
                      <AppBadge tone="info">Filters on</AppBadge>
                    </>
                  ) : null}
                </View>
              </View>
            </AppCard>
          </View>
        }
        refreshControl={<RefreshControl refreshing={paymentsQuery.isRefetching} onRefresh={paymentsQuery.refetch} />}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {typeof item.student === 'object' ? item.student.name : 'Student'}
                </Text>
                <Text style={[styles.cardMeta, { color: theme.muted }]}>Paid on {formatDate(item.paymentDate)}</Text>
              </View>
              <AppBadge tone={item.paymentMode === 'cash' ? 'success' : 'info'}>
                {item.paymentMode.toUpperCase()}
              </AppBadge>
            </View>
            <View style={styles.amountRow}>
              <Text style={[styles.amount, { color: theme.success }]}>{formatCurrency(item.rupees)}</Text>
              <Text style={[styles.cardMeta, { color: theme.muted }]}>
                {formatDate(item.startDate)} → {formatDate(item.endDate)}
              </Text>
            </View>
            {item.notes ? <Text style={[styles.cardMeta, { color: theme.text }]}>{item.notes}</Text> : null}
          </AppCard>
        )}
        ListEmptyComponent={
          isInitialLoading ? (
            <View style={styles.footer}>
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.footerText, { color: theme.muted }]}>Loading payments...</Text>
            </View>
          ) : (
            <Text style={{ color: theme.muted, padding: spacing.lg }}>
              No payments recorded yet. Try adjusting your filters.
            </Text>
          )
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          paymentsQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.footerText, { color: theme.muted }]}>Loading more payments...</Text>
            </View>
          ) : !paymentsQuery.hasNextPage && payments.length ? (
            <Text style={[styles.footerText, { color: theme.muted }]}>You have reached the end.</Text>
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
    </SafeScreen>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof themeFor>;
};

function FilterChip({ label, active, onPress, theme }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}>
      <Text style={{ color: active ? '#fff' : theme.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listHeader: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  subtitle: {
    fontSize: typography.size.sm,
  },
  filterCard: {
    gap: spacing.md,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  filterHint: {
    fontSize: typography.size.sm,
  },
  clearText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  filterGroup: {
    gap: spacing.xs,
  },
  filterLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  dropdownList: {
    marginTop: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  clearChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterSummaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  cardMeta: {
    fontSize: typography.size.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  footerText: {
    textAlign: 'center',
    fontSize: typography.size.sm,
  },
});
