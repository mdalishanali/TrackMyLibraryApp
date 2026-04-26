import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export type RevenueMonth = {
  revenue: number;
  expense: number;
  monthName: string;
};

export type RevenueBreakdown = {
  name: string;
  cash: number;
  upi: number;
  total: number;
};

export type AnalyticsData = {
  todayRevenue: number;
  todayCashRevenue: number;
  todayUpiRevenue: number;
  currentMonthRevenue: number;
  currentMonthExpenses: number;
  monthlyNetProfit: number;
  revenueGrowthPercent: number;
  annualRevenue: number;
  annualExpenses: number;
  annualNetProfit: number;
  totalRevenue: number;
  totalDues: number;
  duesCount: number;
  paidCount: number;
  monthWise: RevenueMonth[];
  latestPayments: any[];
  revenueBreakdownByUser: RevenueBreakdown[];
  expenseBreakdownByCategory: { category: string; total: number }[];
};

export const useAnalyticsQuery = (params?: { year?: string; month?: string }) =>
  useQuery<AnalyticsData>({
    queryKey: [...queryKeys.revenue, params],
    queryFn: async () => {
      const { data } = await api.get('/revenues/dashboard', { params });
      return data as AnalyticsData;
    },
  });
