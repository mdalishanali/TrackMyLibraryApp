import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePostHog } from 'posthog-react-native';

import { SafeScreen } from '@/components/layout/safe-screen';
import { ExportListRow } from '@/components/reports/export-list-row';
import { ExportOptionsModal } from '@/components/students/export-options-modal';
import { radius, spacing, typography } from '@/constants/design';
import { StudentAudience } from '@/constants/student-export';
import { useExportStudents } from '@/hooks/use-export-students';
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

type MonthlyRowConfig = {
  dataset: ReportDataset;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  countOf: (summary: MonthlySummary) => number;
};

const MONTHLY_ROWS: MonthlyRowConfig[] = [
  { dataset: 'payments', icon: 'wallet-outline', color: '#10b981', title: 'Payments', countOf: (s) => s.payments.count },
  { dataset: 'expenses', icon: 'receipt-outline', color: '#f59e0b', title: 'Expenses', countOf: (s) => s.expenses.count },
  { dataset: 'admissions', icon: 'person-add-outline', color: '#3b82f6', title: 'New Admissions', countOf: (s) => s.newStudents },
];

export default function Reports() {
  const theme = useTheme();
  const router = useRouter();
  const posthog = usePostHog();
  const [month, setMonth] = useState(currentReportMonth());
  const [showStudentExport, setShowStudentExport] = useState(false);

  useScreenView('Reports');

  const monthParam = toMonthParam(month);
  const { data: summary, isLoading } = useMonthlySummary(monthParam);
  const { exportReport, exportingDataset } = useExportMonthlyReport();
  const { exportStudents, isExporting } = useExportStudents();

  const isCurrentMonth = isSameReportMonth(month, currentReportMonth());

  const changeMonth = (delta: number) => {
    Haptics.selectionAsync();
    setMonth((value) => shiftReportMonth(value, delta));
  };

  const handleStudentExportConfirm = async (options: {
    status: StudentAudience;
    columns: string[];
  }) => {
    posthog?.capture('students_export_started', { source: 'reports', ...options });
    setShowStudentExport(false);
    await exportStudents(options);
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Reports & Exports</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Monthly report */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>MONTHLY REPORT</Text>
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

        <View style={[styles.exportCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {MONTHLY_ROWS.map((row, index) => {
            const count = summary ? row.countOf(summary) : null;

            return (
              <ExportListRow
                key={row.dataset}
                icon={row.icon}
                color={row.color}
                title={row.title}
                subtitle={count === null ? 'Loading…' : `${count} ${count === 1 ? 'row' : 'rows'} this month`}
                onPress={() => exportReport(monthParam, row.dataset)}
                isBusy={exportingDataset === row.dataset}
                disabled={exportingDataset !== null}
                showDivider={index > 0}
              />
            );
          })}
        </View>

        {/* Full data */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>FULL DATA</Text>
        <View style={[styles.exportCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ExportListRow
            icon="people-outline"
            color="#0ea5e9"
            title="All Students"
            subtitle="Complete roster — choose audience & columns"
            onPress={() => setShowStudentExport(true)}
            isBusy={isExporting}
          />
        </View>

        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={15} color={theme.muted} />
          <Text style={[styles.hintText, { color: theme.muted }]}>
            Files open in Excel or Google Sheets. Share them to Drive, WhatsApp or email.
          </Text>
        </View>
      </ScrollView>

      <ExportOptionsModal
        visible={showStudentExport}
        onClose={() => setShowStudentExport(false)}
        onConfirm={handleStudentExportConfirm}
        isExporting={isExporting}
      />
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
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: spacing.xs,
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
  exportCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  hintText: {
    fontSize: typography.size.xs,
    fontWeight: '500',
    flexShrink: 1,
  },
});
