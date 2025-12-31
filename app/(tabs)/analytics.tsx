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
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';
import { useAnalyticsQuery } from '@/hooks/use-analytics';
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

const yearOptions = [(currentYear - 1).toString(), currentYear.toString(), (currentYear + 1).toString()];

export default function AnalyticsScreen() {
  const theme = useTheme();
  const monthScrollRef = useRef<ScrollView>(null);
  const chartScrollRef = useRef<ScrollView>(null);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const { data, isLoading, isRefetching, refetch } = useAnalyticsQuery({
    year: selectedYear,
    month: selectedMonth,
  });

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

  const stats = [
    {
      label: 'Monthly Revenue',
      value: data?.currentMonthRevenue || 0,
      icon: 'calendar-outline',
      color: '#4C6EF5',
    },
    {
      label: 'Annual Revenue',
      value: data?.annualRevenue || 0,
      icon: 'stats-chart-outline',
      color: '#22C55E',
    },
    {
      label: 'Total Revenue',
      value: data?.totalRevenue || 0,
      icon: 'wallet-outline',
      color: '#EAB308',
    },
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
                <Ionicons name="trending-up" size={16} color={theme.primary} />
                <Text style={[styles.badgeText, { color: theme.primary }]}>Live Data</Text>
            </View>
        </Animated.View>

        {/* Year Selector */}
        <View style={styles.selectors}>
          <Text style={[styles.selectorLabel, { color: theme.muted }]}>SELECT YEAR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                {yearOptions.map(y => (
                    <Pressable
                        key={y}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedYear(y);
                        }}
                        style={[
                            styles.selectorChip,
                            { 
                                backgroundColor: selectedYear === y ? theme.primary : theme.surfaceAlt,
                                borderColor: selectedYear === y ? theme.primary : theme.border 
                            }
                        ]}
                    >
                        <Text style={[styles.selectorText, { color: selectedYear === y ? '#fff' : theme.text }]}>{y}</Text>
                    </Pressable>
                ))}
          </ScrollView>
        </View>

        {/* Month Selector */}
        <View style={[styles.selectors, { marginTop: -spacing.md, marginBottom: spacing.xl }]}>
          <Text style={[styles.selectorLabel, { color: theme.muted }]}>SELECT MONTH</Text>
          <ScrollView
            ref={monthScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorRow}
          >
                {monthOptions.map(m => (
                    <Pressable
                        key={m.value}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedMonth(m.value);
                        }}
                        style={[
                            styles.selectorChip,
                            { 
                                backgroundColor: selectedMonth === m.value ? theme.primary : theme.surfaceAlt,
                                borderColor: selectedMonth === m.value ? theme.primary : theme.border 
                            }
                        ]}
                    >
                        <Text style={[styles.selectorText, { color: selectedMonth === m.value ? '#fff' : theme.text }]}>{m.label}</Text>
                    </Pressable>
                ))}
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
                <Ionicons name="arrow-up" size={12} color="#22C55E" />
                <Text style={styles.statTrend}>0% from last period</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Monthly Trend Chart */}
        <View style={[styles.chartSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Monthly Revenue</Text>
              <Text style={[styles.chartSubtitle, { color: theme.muted }]}>Trend for {selectedYear}</Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: theme.primary + '10' }]}>
              <Ionicons name="bar-chart" size={12} color={theme.primary} />
            </View>
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
                  const isSelected = item.monthName === monthOptions[parseInt(selectedMonth) - 1]?.label;
                  const displayRevenue = item.revenue >= 1000 ? `₹${(item.revenue / 1000).toFixed(1)}k` : item.revenue > 0 ? `₹${item.revenue}` : '';

                  return (
                    <View key={item.monthName} style={styles.chartColumn}>
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
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Filters & Breakdown */}
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

          <View style={styles.breakdownList}>
            {(!data?.revenueBreakdownByUser || data.revenueBreakdownByUser.length === 0) ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="pie-chart-outline" size={48} color={theme.muted + '40'} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No transactions recorded</Text>
                </View>
            ) : (
              <>
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
                {data.revenueBreakdownByUser.map((admin: any, idx) => {
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
                          <Text style={[styles.adminName, { color: theme.text }]}>{admin.name || 'Unknown'}</Text>
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
            {data?.latestPayments.length === 0 ? (
                 <Text style={[styles.emptyText, { color: theme.muted, textAlign: 'center' }]}>No recent activity</Text>
            ) : data?.latestPayments.slice(0, 5).map((payment, idx) => (
              <View key={payment._id} style={[styles.paymentRow, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.border + '50' }]}>
                <View style={styles.paymentMain}>
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
  chartSection: {
    padding: spacing.xl,
    borderRadius: 28,
    borderWidth: 1.5,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
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
