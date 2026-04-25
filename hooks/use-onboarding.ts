import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export const useLibrarySetup = () => {
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  
  return useMutation({
    mutationFn: async ({ totalSeats, monthlyFee }: { totalSeats: number, monthlyFee?: number }) => {
      const { data } = await api.post('/onboarding/setup', { totalSeats, monthlyFee });
      return data;
    },
    onSuccess: async (data, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
          queryClient.invalidateQueries({ queryKey: queryKeys.seats })
        ]);
        // Double safety - refetch active queries to ensure fresh state
        await queryClient.refetchQueries({ queryKey: queryKeys.seats });

      posthog?.capture('library_setup_completed', {
        total_seats: variables.totalSeats,
        monthly_fee: variables.monthlyFee || 0,
      });
    }
  });
};
