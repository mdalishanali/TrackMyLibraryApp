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
      const { data } = await api.get('/seats/students');
      return data.floors as any[];
    },
  });

export const useCreateSeats = () =>
  useMutation({
    mutationFn: async (payload: SeatRangePayload) => {
      const { data } = await api.post('/seats', payload, { successToastMessage: 'Seats created' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats });
    },
  });
