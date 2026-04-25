import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { DashboardResponse } from '@/types/api';

export const useDashboardQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data as DashboardResponse;
    },
  });
