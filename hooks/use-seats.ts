import { useMutation, useQuery } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';

import { api } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { Seat } from '@/types/api';

export type SeatRangePayload = {
  floor: string | number;
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

export const useCreateSeats = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (payload: SeatRangePayload) => {
      const { data } = await api.post('/seats', payload, { successToastMessage: 'Seats created' });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats });

      posthog?.capture('seats_created', {
        floor: variables.floor,
        seat_count: variables.endSeat - variables.startSeat + 1,
      });
    },
  });
};

export const useDeleteSeats = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (seatIds: string[]) => {
      const { data } = await api.delete('/seats/bulk', {
        data: { seatIds },
        successToastMessage: 'Seats deleted successfully'
      });
      return data;
    },
    onSuccess: (data, seatIds) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats });

      posthog?.capture('seats_deleted', {
        seat_count: seatIds.length,
      });
    },
  });
};

export const useDeleteFloor = () =>
  useMutation({
    mutationFn: async (floor: string | number) => {
      const { data } = await api.delete('/seats/floor', {
        data: { floor },
        successToastMessage: 'Floor deleted successfully'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats });
    },
  });

export const useRenameSection = () =>
  useMutation({
    mutationFn: async ({ oldFloor, newFloor }: { oldFloor: string; newFloor: string }) => {
      const { data } = await api.put('/seats/floor/rename', { oldFloor, newFloor }, {
        successToastMessage: 'Section renamed successfully'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats });
    },
  });
