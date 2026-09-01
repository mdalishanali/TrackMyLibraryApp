import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { radius, spacing, typography } from '@/constants/design';
import {
  useExportMonthlyReport,
  useMonthlySummary,
  type MonthlySummary,
  type ReportDataset,
} from '@/hooks/use-monthly-report';
import { useScreenView } from '@/hooks/use-screen-view';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/format';
import {
  currentReportMonth,
  formatMonthLabel,
  isSameReportMonth,
  shiftReportMonth,
  toMonthParam,
} from '@/utils/report-month';

type ExportRowConfig = {
  dataset: ReportDataset;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  countOf: (summary: MonthlySummary) => number;
};

const EXPORT_ROWS: ExportRowConfig[] = [
  {
    dataset: 'payments',
    icon: 'wallet-outline',
    color: '#10b981',
    title: 'Payments',
    countOf: (summary) => summary.payments.count,
  },
  {
    dataset: 'expenses',
    icon: 'receipt-outline',
    color: '#f59e0b',
    title: 'Expenses',
    countOf: (summary) => summary.expenses.count,
  },
  {
    dataset: 'admissions',
    icon: 'person-add-outline',
    color: '#3b82f6',
    title: 'New Admissions',
    countOf: (summary) => summary.newStudents,
  },
];

export default function MonthlyReport() {
  const theme = useTheme();
  const router = useRouter();
  const [month, setMonth] = useState(currentReportMonth());

  useScreenView('MonthlyReport');

  const monthParam = toMonthParam(month);
  const { data: summary, isLoading } = useMonthlySummary(monthParam);
  const { exportReport, exportingDataset } = useExportMonthlyReport();

  const isCurrentMonth = isSameReportMonth(month, currentReportMonth());

  const changeMonth = (delta: number) => {
    Haptics.selectionAsync();
    setMonth((value) => shiftReportMonth(value, delta));
  };

  const summaryCards = summary
    ? [
        { label: 'COLLECTED', value: formatCurrency(summary.payments.total), sub: `${summary.payments.count} payments`, color: theme.success },
        { label: 'EXPENSES', value: formatCurrency(summary.expenses.total), sub: `${summary.expenses.count} entries`, color: theme.warning },
        { label: 'NET', value: formatCurrency(summary.net), sub: summary.net >= 0 ? 'profit' : 'loss', color: summary.net >= 0 ? theme.success : theme.danger },
        { label: 'NEW ADMISSIONS', value: String(summary.newStudents), sub: 'students joined', color: theme.info },
      ]
    : [];

  return (
    <SafeScreen>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Monthly Report</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month stepper */}
        <View style={[styles.monthRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable onPress={() => changeMonth(-1)} hitSlop={8} style={[styles.monthBtn, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{formatMonthLabel(month)}</Text>
          <Pressable
            onPress={() => changeMonth(1)}
            hitSlop={8}
            disabled={isCurrentMonth}
            style={[styles.monthBtn, { backgroundColor: theme.surfaceAlt, opacity: isCurrentMonth ? 0.35 : 1 }]}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Summary */}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={theme.primary} />
        ) : (
          <View style={styles.cardsGrid}>
            {summaryCards.map((card) => (
              <View
                key={card.label}
                style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.cardLabel, { color: theme.muted }]}>{card.label}</Text>
                <Text style={[styles.cardValue, { color: card.color }]} numberOfLines={1} adjustsFontSizeToFit>
                  {card.value}
                </Text>
                <Text style={[styles.cardSub, { color: theme.muted }]}>{card.sub}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Export rows */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>EXPORT AS CSV</Text>
        <View style={[styles.exportCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {EXPORT_ROWS.map((row, index) => {
            const count = summary ? row.countOf(summary) : null;
            const isExportingThis = exportingDataset === row.dataset;

            return (
              <Pressable
                key={row.dataset}
                onPress={() => exportReport(monthParam, row.dataset)}
                disabled={exportingDataset !== null}
                style={({ pressed }) => [
                  styles.exportRow,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.exportIcon, { backgroundColor: row.color + '15' }]}>
                  <Ionicons name={row.icon} size={22} color={row.color} />
                </View>
                <View style={styles.exportText}>
                  <Text style={[styles.exportTitle, { color: theme.text }]}>{row.title}</Text>
                  <Text style={[styles.exportSub, { color: theme.muted }]}>
                    {count === null ? 'Loading…' : `${count} ${count === 1 ? 'row' : 'rows'} this month`}
                  </Text>
                </View>
                {isExportingThis ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="download-outline" size={22} color={theme.primary} />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={15} color={theme.muted} />
          <Text style={[styles.hintText, { color: theme.muted }]}>
            Files open in Excel or Google Sheets. Share them to Drive, WhatsApp or email.
          </Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  monthBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: 2,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  cardSub: {
    fontSize: typography.size.xs,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: spacing.xs,
  },
  exportCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  exportIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportText: {
    flex: 1,
    gap: 2,
  },
  exportTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  exportSub: {
    fontSize: typography.size.xs,
    fontWeight: '500',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  hintText: {
    fontSize: typography.size.xs,
    fontWeight: '500',
    flexShrink: 1,
  },
});
