import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { Payment } from '@/types/api';

export type PaymentPayload = {
  student: string;
  rupees: number;
  startDate: string;
  endDate: string;
  paymentMode: 'cash' | 'upi';
  paymentDate: string;
  notes?: string;
};

export const usePaymentsQuery = (params?: { student?: string }) =>
  useQuery({
    queryKey: queryKeys.payments(params),
    queryFn: async () => {
      const { data } = await api.get('/payments', { params });
      return data.payments as Payment[];
    },
  });

export const useCreatePayment = () =>
  useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      const { data } = await api.post('/payments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
