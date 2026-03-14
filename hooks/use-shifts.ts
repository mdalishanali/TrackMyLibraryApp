import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Shift } from '@/types/api';

export const useShiftsQuery = () =>
  useQuery({
    queryKey: queryKeys.shifts,
    queryFn: async () => {
      const { data } = await api.get('/shifts');
      return (data.shifts || []) as Shift[];
    },
  });

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (payload: Omit<Shift, '_id'>) => {
      const { data } = await api.post('/shifts', payload);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts });
      posthog?.capture('shift_created', {
        name: variables.name,
      });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Shift> }) => {
      const { data } = await api.put(`/shifts/${id}`, payload);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts });
      posthog?.capture('shift_updated', {
        shift_id: variables.id,
        name: variables.payload.name ?? 'unknown',
      });
    },
  });
};
