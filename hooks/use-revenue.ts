import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export type RevenueResponse = {
  monthlyRevenue: number;
  annualRevenue: number;
  totalRevenue: number;
  monthChangePercent?: number;
  annualChangePercent?: number;
  totalChangePercent?: number;
  monthlyTrend?: { month: string; revenue: number }[];
};

export const useRevenueDashboard = (year?: number, month?: number) =>
  useQuery({
    queryKey: [...queryKeys.revenue, year, month],
    queryFn: async () => {
      const { data } = await api.get('/revenues/dashboard', { params: { year, month } });
      return data as RevenueResponse;
    },
  });
