import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { Seat } from '@/types/api';

export type SeatRangePayload = {
  floor: number;
  startSeat: number;
  endSeat: number;
};

export const useSeatsQuery = () =>
  useQuery({
    queryKey: queryKeys.seats,
    queryFn: async () => {
      const { data } = await api.get('/seats/number');
      return data.seats as Seat[];
    },
  });

export const useCreateSeats = () =>
  useMutation({
    mutationFn: async (payload: SeatRangePayload) => {
      const { data } = await api.post('/seats', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats });
    },
  });
