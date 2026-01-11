import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';
import { useAnalyticsQuery } from '@/hooks/use-analytics';
import { useExpensesQuery, useCreateExpense, useDeleteExpense, useUpdateExpense, Expense } from '@/hooks/use-expenses'; // Import expenses hooks
import { ExpenseFormModal } from '@/components/expenses/expense-form-modal';
import { showToast } from '@/lib/toast';
import { formatCurrency, formatDate } from '@/utils/format';

const { width } = Dimensions.get('window');

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

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

const yearOptions = ['2025', currentYear.toString()];

export default function AnalyticsScreen() {
  const theme = useTheme();
  const monthScrollRef = useRef<ScrollView>(null);
  const chartScrollRef = useRef<ScrollView>(null);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [viewMode, setViewMode] = useState<'income' | 'expenses'>('income');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data, isLoading, isRefetching, refetch } = useAnalyticsQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const expensesQuery = useExpensesQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();

  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    // Scroll to the selected month to center it in both selectors and chart
    const timer = setTimeout(() => {
      // 1. Center in Month Selector
      if (monthScrollRef.current) {
        const index = parseInt(selectedMonth) - 1;
        const chipWidth = 75; // Approx chip width + margin
        const offset = (index * chipWidth) - (screenWidth / 2) + (chipWidth / 2);
        monthScrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
      }

      // 2. Center in Chart
      if (chartScrollRef.current) {
        const index = parseInt(selectedMonth) - 1;
        const columnTotalWidth = 56; // Column(40) + Gap(16)
        const offset = (index * columnTotalWidth) - (screenWidth / 2) + (columnTotalWidth / 2) + spacing.xl;
        chartScrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedMonth, screenWidth]);

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.4, { duration: 1500 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const { monthTrend, annualTrend, topCollectorName } = useMemo(() => {
    if (!data?.monthWise) return { monthTrend: 0, annualTrend: 0, topCollectorName: null };

    // Month Trend
    const currentIdx = parseInt(selectedMonth) - 1;
    const prevIdx = currentIdx - 1;
    const currentRev = data.monthWise[currentIdx]?.revenue || 0;
    const prevRev = prevIdx >= 0 ? data.monthWise[prevIdx]?.revenue : null;
    let mTrend = 0;
    if (prevRev !== null && prevRev > 0) {
      mTrend = ((currentRev - prevRev) / prevRev) * 100;
    }

    // Annual Trend (Current Year vs Previous month average if we don't have last year's total)
    // For now, let's keep it 0 or calculate average growth

    // Top Collector
    let topName = null;
    let maxVal = 0;
    data.revenueBreakdownByUser?.forEach((admin: any) => {
      const total = admin.total || admin.value || 0;
      if (total > maxVal) {
        maxVal = total;
        topName = admin.name;
      }
    });

    return { monthTrend: mTrend, annualTrend: 0, topCollectorName: topName };
    return { monthTrend: mTrend, annualTrend: 0, topCollectorName: topName };
  }, [data?.monthWise, data?.revenueBreakdownByUser, selectedMonth]);

  const totalExpenses = expensesQuery.data?.totalAmount || 0;
  const netProfit = (data?.currentMonthRevenue || 0) - totalExpenses;

  const stats = [
    {
      label: 'Monthly Revenue',
      value: data?.currentMonthRevenue || 0,
      icon: 'calendar-outline',
      color: '#4C6EF5',
      trend: monthTrend,
    },
    {
      label: 'Monthly Expenses',
      value: totalExpenses,
      icon: 'trending-down-outline',
      color: '#EF4444',
      trend: 0,
    },
    {
      label: 'Net Profit',
      value: netProfit,
      icon: 'wallet-outline',
      color: netProfit >= 0 ? '#22C55E' : '#EF4444',
      trend: 0,
    },
    {
      label: 'Annual Revenue',
      value: data?.annualRevenue || 0,
      icon: 'stats-chart-outline',
      color: '#EAB308',
      trend: annualTrend,
    }
  ];

  const maxRevenue = useMemo(() => {
    if (!data?.monthWise) return 0;
    return Math.max(...data.monthWise.map(m => m.revenue), 1000);
  }, [data?.monthWise]);

  if (isLoading && !data) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
            <View>
                <Text style={[styles.headerPreTitle, { color: theme.muted }]}>FINANCIAL</Text>
                <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
            <Animated.View style={[styles.pulseDot, { backgroundColor: theme.primary }, pulseStyle]} />
                <Text style={[styles.badgeText, { color: theme.primary }]}>Live Data</Text>
            </View>

          <Pressable
            onPress={() => {
              setSelectedExpense(null);
              setIsExpenseModalOpen(true);
            }}
            style={{
              position: 'absolute',
              top: 10,
              right: 0,
              backgroundColor: theme.surface,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Ionicons name="add-circle" size={16} color={'#EF4444'} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.text }}>Expense</Text>
          </Pressable>
        </Animated.View>

        {/* Year Selector */}
        <View style={styles.selectors}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: 8, gap: 6 }}>
            <Ionicons name="calendar-outline" size={12} color={theme.muted} />
            <Text style={[styles.selectorLabel, { paddingHorizontal: 0, marginBottom: 0, color: theme.muted }]}>SELECT YEAR</Text>
          </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
            {yearOptions.map(y => {
              const isToday = y === new Date().getFullYear().toString();
              const isSelected = selectedYear === y;
              return (
                    <Pressable
                        key={y}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedYear(y);
                        }}
                  style={({ pressed }) => [
                            styles.selectorChip,
                            { 
                              backgroundColor: isSelected ? theme.primary : theme.surfaceAlt,
                              borderColor: isSelected ? theme.primary : theme.border,
                              transform: [{ scale: pressed ? 0.96 : 1 }],
                              overflow: 'hidden'
                            }
                        ]}
                    >
                  {isSelected && (
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.selectorText, { color: isSelected ? '#fff' : theme.text }]}>{y}</Text>
                    {isToday && <View style={[styles.todayDot, { backgroundColor: isSelected ? '#fff' : theme.primary }]} />}
                  </View>
                    </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Month Selector */}
        <View style={[styles.selectors, { marginTop: -spacing.md, marginBottom: spacing.xl }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: 8, gap: 6 }}>
            <Ionicons name="time-outline" size={12} color={theme.muted} />
            <Text style={[styles.selectorLabel, { paddingHorizontal: 0, marginBottom: 0, color: theme.muted }]}>SELECT MONTH</Text>
          </View>
          <ScrollView
            ref={monthScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorRow}
          >
            {monthOptions.map(m => {
              const isToday = m.value === (new Date().getMonth() + 1).toString() && selectedYear === new Date().getFullYear().toString();
              const isSelected = selectedMonth === m.value;
              return (
                    <Pressable
                        key={m.value}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedMonth(m.value);
                        }}
                  style={({ pressed }) => [
                            styles.selectorChip,
                            { 
                              backgroundColor: isSelected ? theme.primary : theme.surfaceAlt,
                              borderColor: isSelected ? theme.primary : theme.border,
                              transform: [{ scale: pressed ? 0.96 : 1 }],
                              overflow: 'hidden'
                            }
                        ]}
                    >
                  {isSelected && (
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.selectorText, { color: isSelected ? '#fff' : theme.text }]}>{m.label}</Text>
                    {isToday && <View style={[styles.todayDot, { backgroundColor: isSelected ? '#fff' : theme.primary }]} />}
                  </View>
                    </Pressable>
              );
            })}
            </ScrollView>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((item, index) => (
            <Animated.View 
              key={item.label}
              entering={FadeInUp.delay(index * 100).duration(600)}
              style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.statIconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[styles.statLabel, { color: theme.muted }]}>{item.label}</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {formatCurrency(item.value)}
              </Text>
              <View style={styles.statFooter}>
                {item.trend !== 0 && (
                  <>
                    <Ionicons
                      name={item.trend > 0 ? "arrow-up" : "arrow-down"}
                      size={12}
                      color={item.trend > 0 ? "#22C55E" : "#EF4444"}
                    />
                    <Text style={[styles.statTrend, { color: item.trend > 0 ? "#22C55E" : "#EF4444" }]}>
                      {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}% vs last month
                    </Text>
                  </>
                )}
                {item.trend === 0 && (
                  <Text style={[styles.statTrend, { color: theme.muted }]}>Stable this period</Text>
                )}
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Monthly Trend Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Monthly Revenue</Text>
              <Text style={[styles.chartSubtitle, { color: theme.muted }]}>Trend for {selectedYear}</Text>
            </View>
            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => [styles.chartBadge, { backgroundColor: theme.primary + '10', opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.primary} />
            </Pressable>
          </View>

          <ScrollView
            ref={chartScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chartScroll}
          >
            <View style={styles.chartWrapper}>
              {/* Subtle Grid Lines */}
              <View style={styles.gridLines}>
                {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                  <View
                    key={p}
                    style={[
                      styles.gridLine,
                      {
                        bottom: p * 120 + 35, // Matches maxBarHeight(120) + offset(35)
                        backgroundColor: theme.border + (p === 0 ? '80' : '30')
                      }
                    ]}
                  />
                ))}
              </View>

              <View style={styles.chartContainer}>
                {data?.monthWise.map((item, idx) => {
                  const maxBarHeight = 120;
                  const height = (item.revenue / maxRevenue) * maxBarHeight;
                  const monthVal = (idx + 1).toString();
                  const isSelected = selectedMonth === monthVal;
                  const displayRevenue = item.revenue >= 1000 ? `₹${(item.revenue / 1000).toFixed(1)}k` : item.revenue > 0 ? `₹${item.revenue}` : '';

                  return (
                    <Pressable
                      key={item.monthName}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedMonth(monthVal);
                      }}
                      style={styles.chartColumn}
                    >
                      <View style={styles.barWrapper}>
                        {item.revenue > 0 && (
                          <View style={[styles.barValueContainer, { backgroundColor: isSelected ? theme.primary : theme.surfaceAlt, borderColor: isSelected ? theme.primary : theme.border }]}>
                            <Text
                              numberOfLines={1}
                              style={[styles.barValueText, { color: isSelected ? '#fff' : theme.text }]}
                            >
                              {displayRevenue}
                            </Text>
                          </View>
                        )}
                        <Animated.View
                          layout={Layout.springify()}
                          style={[
                            styles.bar,
                            { 
                              height: Math.max(height, 6),
                              backgroundColor: isSelected ? theme.primary : theme.primary + '25',
                              borderRadius: 8,
                            }
                          ]}
                        >
                          <LinearGradient
                            colors={['rgba(255,255,255,0.3)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                          />
                        </Animated.View>
                      </View>
                      <Text style={[styles.barLabel, { color: isSelected ? theme.text : theme.muted, fontWeight: isSelected ? '900' : '700' }]}>
                        {item.monthName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* View Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceAlt, padding: 4, borderRadius: 16, marginBottom: spacing.xl, borderColor: theme.border, borderWidth: 1 }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('income');
            }}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: viewMode === 'income' ? theme.background : 'transparent', borderWidth: viewMode === 'income' ? 1 : 0, borderColor: theme.border }}
          >
            <Text style={{ fontWeight: '700', color: viewMode === 'income' ? theme.primary : theme.muted }}>Income</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('expenses');
            }}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: viewMode === 'expenses' ? theme.background : 'transparent', borderWidth: viewMode === 'expenses' ? 1 : 0, borderColor: theme.border }}
          >
            <Text style={{ fontWeight: '700', color: viewMode === 'expenses' ? '#EF4444' : theme.muted }}>Expenses</Text>
          </Pressable>
        </View>

        {viewMode === 'income' ? (
          <>
            {/* Filters & Breakdown (Income) */}
        <Animated.View 
            layout={Layout}
            style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Revenue Breakdown</Text>
            <View style={[styles.badge, { backgroundColor: theme.primary + '10' }]}>
                <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 10 }}>
                    {monthOptions[parseInt(selectedMonth) - 1]?.label} {selectedYear}
                </Text>
            </View>
          </View>
              {/* ... existing code content ... */}
              {/* Note: I will just render the existing content here, but since I replaced the start of this block, I need to check where it ends. */}
              {/* Wait, multi_replace replaces the chunk. I need to keep the content inside the "Filters & Breakdown" if I don't want to rewrite it all. */}
              {/* Ah, I can wrap the existing block in the conditional? But I can't easily reference 'existing code' in replacement. */}
              {/* I will assume I need to REWRITE the breakdown section OR just insert the toggle above it. */}
              {/* Let's try to insert the toggle above 'Filters & Breakdown' and wrap the 'Filters & Breakdown' in a conditionally rendered block? */}
              {/* That's risky with line numbers. */}
              {/* Alternative: Use a smaller chunk to insert the toggle, then a separate replacement to wrap the content? */}
              {/* Best way: Replace the layout to include the toggle and then conditionally render the different lists. */}

          <View style={styles.breakdownList}>
            {(!data?.revenueBreakdownByUser || data.revenueBreakdownByUser.length === 0) ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="pie-chart-outline" size={48} color={theme.muted + '40'} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No transactions recorded</Text>
                </View>
                ) : (<>
                {/* Company Total Row */}
                {(() => {
                  const companyTotal = data.revenueBreakdownByUser.reduce((acc, admin: any) => ({
                    cash: acc.cash + (admin.cash || (admin.paymentMode === 'cash' ? admin.value : 0) || 0),
                    upi: acc.upi + (admin.upi || (admin.paymentMode === 'upi' ? admin.value : 0) || 0),
                    total: acc.total + (admin.total || admin.value || 0)
                  }), { cash: 0, upi: 0, total: 0 });

                  if (companyTotal.total === 0) return null;

                  return (
                    <View style={[styles.breakdownItem, { backgroundColor: theme.primary + '08', borderRadius: 12, marginBottom: spacing.md, padding: spacing.sm }]}>
                      <View style={styles.adminHeader}>
                        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                          <Ionicons name="business" size={16} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.adminName, { color: theme.text, fontWeight: '800' }]}>Total Period Revenue</Text>
                          <Text style={[styles.adminSub, { color: theme.muted }]}>All collectors combined</Text>
                        </View>
                        <Text style={[styles.adminTotal, { color: theme.primary, fontWeight: '800' }]}>{formatCurrency(companyTotal.total)}</Text>
                      </View>
                      <View style={styles.modeRow}>
                        <View style={styles.modeItem}>
                          <View style={[styles.modeDot, { backgroundColor: '#48BB78' }]} />
                          <Text style={[styles.modeLabel, { color: theme.muted }]}>Cash: </Text>
                          <Text style={[styles.modeValue, { color: theme.text, fontWeight: '700' }]}>{formatCurrency(companyTotal.cash)}</Text>
                        </View>
                        <View style={styles.modeItem}>
                          <View style={[styles.modeDot, { backgroundColor: '#4299E1' }]} />
                          <Text style={[styles.modeLabel, { color: theme.muted }]}>UPI: </Text>
                          <Text style={[styles.modeValue, { color: theme.text, fontWeight: '700' }]}>{formatCurrency(companyTotal.upi)}</Text>
                        </View>
                      </View>
                      <View style={[styles.splitBar, { backgroundColor: theme.border + '30', height: 6 }]}>
                        <View style={{ flex: companyTotal.cash || 0.0001, backgroundColor: '#48BB78' }} />
                        <View style={{ flex: companyTotal.upi || 0.0001, backgroundColor: '#4299E1' }} />
                      </View>
                    </View>
                  );
                })()}

                {/* Individual Breakdown List */}
                    {data.revenueBreakdownByUser.map((admin: any, idx: number) => {
                  const totalAmount = admin.total || admin.value || 0;
                  const cashAmount = admin.cash || (admin.paymentMode === 'cash' ? admin.value : 0) || 0;
                  const upiAmount = admin.upi || (admin.paymentMode === 'upi' ? admin.value : 0) || 0;

                  return (
                    <View key={idx} style={[styles.breakdownItem, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.border + '50' }]}>
                      <View style={styles.adminHeader}>
                        <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                          <Text style={{ color: theme.primary, fontWeight: '800' }}>{(admin.name || 'U').charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.adminName, { color: theme.text }]}>{admin.name || 'Unknown'}</Text>
                            {admin.name === topCollectorName && (
                              <View style={[styles.topBadge, { backgroundColor: '#EAB308' }]}>
                                <Ionicons name="trophy" size={10} color="#fff" />
                                <Text style={styles.topBadgeText}>TOP</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.adminSub, { color: theme.muted }]}>{admin.paymentMode ? admin.paymentMode.toUpperCase() : 'Collector'}</Text>
                        </View>
                        <Text style={[styles.adminTotal, { color: theme.primary }]}>{formatCurrency(totalAmount)}</Text>
                      </View>
                      {!admin.total && admin.value ? null : (
                        <View style={styles.modeRow}>
                          <View style={styles.modeItem}>
                            <View style={[styles.modeDot, { backgroundColor: '#48BB78' }]} />
                            <Text style={[styles.modeLabel, { color: theme.muted }]}>Cash: </Text>
                            <Text style={[styles.modeValue, { color: theme.text }]}>{formatCurrency(cashAmount)}</Text>
                          </View>
                          <View style={styles.modeItem}>
                            <View style={[styles.modeDot, { backgroundColor: '#4299E1' }]} />
                            <Text style={[styles.modeLabel, { color: theme.muted }]}>UPI: </Text>
                            <Text style={[styles.modeValue, { color: theme.text }]}>{formatCurrency(upiAmount)}</Text>
                          </View>
                        </View>
                      )}
                      <View style={[styles.splitBar, { backgroundColor: theme.border + '30' }]}>
                        <View style={{ flex: cashAmount || 0.0001, backgroundColor: '#48BB78' }} />
                        <View style={{ flex: upiAmount || 0.0001, backgroundColor: '#4299E1' }} />
                      </View>
                    </View>
                  )
                })}
              </>
                )}

              </View>
            </Animated.View>
          </>
        ) : (
          // Expenses List View
          <Animated.View
            layout={Layout}
            style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Expenses</Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>
                  Recorded expenses for this month
                </Text>
              </View>
              <AppButton
                  onPress={() => {
                    setSelectedExpense(null);
                    setIsExpenseModalOpen(true);
                  }}
                variant="outline"
                style={{ height: 36, paddingVertical: 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>+ Add</Text>
              </AppButton>
            </View>

            <View style={styles.breakdownList}>
              {(!expensesQuery.data?.expenses || expensesQuery.data.expenses.length === 0) ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={48} color={theme.muted + '40'} />
                  <Text style={[styles.emptyText, { color: theme.muted }]}>No expenses recorded</Text>
                </View>
              ) : (
                <>
                      {expensesQuery.data.expenses.map((expense: any, idx: number) => (
                    <View key={expense._id} style={[styles.breakdownItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: theme.border + '50', paddingTop: 16 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={[styles.avatar, { backgroundColor: '#EF444420' }]}>
                          <Ionicons name="pricetag" size={16} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.adminName, { color: theme.text }]}>{expense.title}</Text>
                          <Text style={[styles.adminSub, { color: theme.muted }]}>{formatDate(expense.date)} • {expense.category}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.adminTotal, { color: '#EF4444' }]}>{formatCurrency(expense.amount)}</Text>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                          <Pressable hitSlop={10} onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedExpense(expense as unknown as Expense);
                            setIsExpenseModalOpen(true);
                          }}>
                            <Ionicons name="create-outline" size={14} color={theme.primary} />
                          </Pressable>
                          <Pressable hitSlop={10} onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            deleteExpense.mutate(expense._id);
                          }}>
                            <Ionicons name="trash-outline" size={14} color={theme.muted} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}
              </View>
            </Animated.View>
        )}


        <ExpenseFormModal
          visible={isExpenseModalOpen}
          initialValues={selectedExpense}
          title={selectedExpense ? 'Edit Expense' : 'Add Expense'}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setSelectedExpense(null);
          }}
          onSubmit={async (data) => {
            try {
              if (selectedExpense) {
                await updateExpense.mutateAsync({
                  id: selectedExpense._id,
                  payload: data
                });
                showToast('Expense Updated', 'success');
              } else {
                await createExpense.mutateAsync(data);
                showToast('Expense Added', 'success');
              }
              setIsExpenseModalOpen(false);
              setSelectedExpense(null);
            } catch (err) {
              showToast(selectedExpense ? 'Failed to update expense' : 'Failed to add expense', 'error');
            }
          }}
          theme={theme}
          isSubmitting={createExpense.isPending || updateExpense.isPending}
        />

        {/* Latest Payments */}
        <Animated.View 
            layout={Layout}
            style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest Payments</Text>
            <Ionicons name="receipt-outline" size={20} color={theme.muted} />
          </View>

          <View style={styles.paymentsList}>
            {(!data?.latestPayments || data.latestPayments.length === 0) ? (
                 <Text style={[styles.emptyText, { color: theme.muted, textAlign: 'center' }]}>No recent activity</Text>
            ) : data.latestPayments.map((payment: any) => (
              <View key={payment._id} style={[styles.paymentRow, { borderBottomWidth: 1, borderBottomColor: theme.border + '30' }]}>
                <View style={styles.paymentMain}>
                  <View style={[styles.avatarSmall, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '800' }}>{(payment.student?.name || 'S').charAt(0)}</Text>
                  </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.pStudent, { color: theme.text }]} numberOfLines={1}>{payment.student?.name}</Text>
                        <Text style={[styles.pDate, { color: theme.muted }]}>{formatDate(payment.paymentDate)} • {payment.paymentMode.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.pAmount, { color: theme.primary }]}>{formatCurrency(payment.rupees)}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerPreTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectors: {
    marginBottom: spacing.md,
    marginHorizontal: -spacing.xl,
  },
  selectorLabel: {
    paddingHorizontal: spacing.xl,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  selectorRow: {
    paddingHorizontal: spacing.xl,
    gap: 8,
    alignItems: 'center',
  },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '800',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  vDivider: {
    width: 1.5,
    height: 24,
    marginHorizontal: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statTrend: {
    fontSize: 9,
    fontWeight: '700',
    color: '#22C55E',
  },
  chartCard: {
    padding: spacing.xl,
    borderRadius: 28,
    borderWidth: 1.5,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartBadge: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chartScroll: {
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    gap: 12,
    paddingBottom: 24,
  },
  chartColumn: {
    alignItems: 'center',
    width: 44,
  },
  barWrapper: {
    height: 170,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  barValue: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  bar: {
    width: 16,
    overflow: 'hidden',
  },
  barValueContainer: {
    paddingHorizontal: 2,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    marginBottom: 4,
    minWidth: 46,
    alignItems: 'center',
    zIndex: 10,
  },
  barValueText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  barLabel: {
    fontSize: 10,
    marginTop: 8,
  },
  section: {
    padding: spacing.xl,
    borderRadius: 28,
    borderWidth: 1.5,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  breakdownList: {
    gap: 20,
  },
  breakdownItem: {
    paddingTop: 16,
    gap: 12,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  topBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  adminName: {
    fontSize: 15,
    fontWeight: '800',
  },
  adminSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  adminTotal: {
    fontSize: 16,
    fontWeight: '900',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 20,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  modeValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  splitBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  paymentsList: {
    gap: 0,
  },
  paymentRow: {
    paddingVertical: 14,
  },
  paymentMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pStudent: {
    fontSize: 15,
    fontWeight: '800',
  },
  pDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  pAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  chartWrapper: {
    height: 200,
    paddingTop: 20,
    justifyContent: 'flex-end',
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 25,
    justifyContent: 'space-between',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
