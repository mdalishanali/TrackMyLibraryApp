import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export type RevenueMonth = {
  revenue: number;
  monthName: string;
};

export type RevenueBreakdown = {
  name: string;
  cash: number;
  upi: number;
  total: number;
};

export type AnalyticsData = {
  currentMonthRevenue: number;
  annualRevenue: number;
  totalRevenue: number;
  monthWise: RevenueMonth[];
  latestPayments: any[];
  revenueBreakdownByUser: RevenueBreakdown[];
};

export const useAnalyticsQuery = (params?: { year?: string; month?: string }) =>
  useQuery<AnalyticsData>({
    queryKey: [...queryKeys.revenue, params],
    queryFn: async () => {
      const { data } = await api.get('/revenues/dashboard', { params });
      return data as AnalyticsData;
    },
  });
