import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export const useLibrarySetup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ totalSeats, monthlyFee }: { totalSeats: number, monthlyFee?: number }) => {
      const { data } = await api.post('/onboarding/setup', { totalSeats, monthlyFee });
      return data;
    },
    onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
          queryClient.invalidateQueries({ queryKey: queryKeys.seats })
        ]);
        // Double safety - refetch active queries to ensure fresh state
        await queryClient.refetchQueries({ queryKey: queryKeys.seats });
    }
  });
};
