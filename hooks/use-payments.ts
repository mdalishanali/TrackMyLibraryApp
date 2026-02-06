import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';

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

type PaymentsPage = {
  payments: Payment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
};

export type PaymentFilters = {
  student?: string;
  year?: string;
  month?: string;
  paymentMode?: 'cash' | 'upi' | 'online';
  search?: string;
  limit?: number;
};

export const usePaymentsQuery = (params?: { student?: string }) =>
  useQuery({
    queryKey: queryKeys.payments(params),
    queryFn: async () => {
      const { data } = await api.get('/payments', { params });
      return (data.payments ?? data) as Payment[];
    },
  });

export const useInfinitePaymentsQuery = (params?: PaymentFilters) =>
  useInfiniteQuery<PaymentsPage>({
    queryKey: queryKeys.payments(params),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get('/payments', {
        params: { ...params, page: pageParam, limit: params?.limit ?? 10 },
      });
      return data as PaymentsPage;
    },
    getNextPageParam: (lastPage) => {
      const current = lastPage.pagination?.page ?? 1;
      const limit = lastPage.pagination?.limit ?? params?.limit ?? 10;
      const total = lastPage.pagination?.total;
      const nextPage = current + 1;
      if (typeof total === 'number') {
        return (current - 1) * limit + lastPage.payments.length < total ? nextPage : undefined;
      }
      return lastPage.payments.length >= limit ? nextPage : undefined;
    },
  });

const invalidatePaymentRelatedQueries = () => {
  queryClient.invalidateQueries({ queryKey: ['payments'] });
  queryClient.invalidateQueries({ queryKey: ['students'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  queryClient.invalidateQueries({ queryKey: queryKeys.revenue });
};

export const useCreatePayment = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      const { data } = await api.post('/payments', payload, { successToastMessage: 'Payment recorded' });
      return data;
    },
    onSuccess: (data, variables) => {
      invalidatePaymentRelatedQueries();

      posthog?.capture('payment_recorded', {
        amount: variables.rupees,
        payment_mode: variables.paymentMode,
        student_id: variables.student,
      });
    },
  });
};

export const useUpdatePayment = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<PaymentPayload>) => {
      const { data } = await api.put(`/payments/${id}`, payload);
      return data;
    },
    onSuccess: (data, variables) => {
      invalidatePaymentRelatedQueries();

      posthog?.capture('payment_updated', {
        payment_id: variables.id,
        fields_updated: Object.keys(variables).filter(k => k !== 'id'),
      });
    },
  });
};

export const useDeletePayment = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/payments/${id}`);
      return data;
    },
    onSuccess: (data, id) => {
      invalidatePaymentRelatedQueries();

      posthog?.capture('payment_deleted', {
        payment_id: id,
      });
    },
  });
};
