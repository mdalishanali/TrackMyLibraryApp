import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { usePostHog } from 'posthog-react-native';

import { api } from '@/lib/api-client';
import { isSharingAvailable, readCsvFilename, shareCsv } from '@/lib/share-csv';
import { showToast } from '@/lib/toast';

export type ReportDataset = 'payments' | 'expenses' | 'admissions';

export type MonthlySummary = {
  month: string;
  payments: { count: number; total: number };
  expenses: { count: number; total: number };
  newStudents: number;
  net: number;
};

export const useMonthlySummary = (month: string) => {
  return useQuery<MonthlySummary>({
    queryKey: ['monthly-report-summary', month],
    queryFn: async () => {
      const { data } = await api.get('/reports/monthly-summary', { params: { month } });
      return data;
    },
  });
};

/**
 * Downloads one month of one dataset as CSV and hands it to the share sheet.
 * Non-throwing: exporting is a convenience — failures surface a toast, never
 * break the screen.
 */
export const useExportMonthlyReport = () => {
  const posthog = usePostHog();
  const [exportingDataset, setExportingDataset] = useState<ReportDataset | null>(null);

  const exportReport = useCallback(
    async (month: string, dataset: ReportDataset) => {
      if (exportingDataset) return;

      try {
        setExportingDataset(dataset);

        if (!(await isSharingAvailable())) {
          showToast('Sharing is not available on this device', 'error');
          return;
        }

        const response = await api.get('/reports/monthly-export', {
          params: { month, type: dataset },
          // Without this axios parses the CSV as JSON and mangles it.
          responseType: 'text',
          transformResponse: (data: unknown) => data,
        });

        const csv = typeof response.data === 'string' ? response.data : '';

        if (!csv) {
          showToast('Nothing to export for this month', 'info');
          return;
        }

        const filename = readCsvFilename(
          response.headers?.['content-disposition'],
          `${dataset}-${month}.csv`
        );

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        posthog?.capture('monthly_report_exported', { month, dataset });

        await shareCsv(filename, csv, 'Export monthly report');
      } catch (error) {
        console.error('[useExportMonthlyReport] Export failed:', error);
        showToast('Could not export the report', 'error', 'Please try again');
      } finally {
        setExportingDataset(null);
      }
    },
    [exportingDataset, posthog]
  );

  return { exportReport, exportingDataset };
};
