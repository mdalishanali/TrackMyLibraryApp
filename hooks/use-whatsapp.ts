import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const useSendFeeReminder = () => {
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { data } = await api.post('/whatsapp/fee-reminder', { studentId });
      return data;
    },
  });
};

export const useSendPaymentReceipt = () => {
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await api.post('/whatsapp/payment-confirmation', { paymentId });
      return data;
    },
  });
};

export const useSendTemplate = () => {
  return useMutation({
    mutationFn: async ({ studentId, templateType }: { studentId: string; templateType: string }) => {
      const { data } = await api.post('/whatsapp/send-template', { studentId, templateType });
      return data;
    },
  });
};

export const useWhatsappTemplates = () => {
  return useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp/templates');
      return data;
    },
  });
};

export const useUpdateTemplates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templates: any) => {
      const { data } = await api.post('/whatsapp/templates', { templates });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    },
  });
};

