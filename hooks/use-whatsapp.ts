import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';
import { api } from '@/lib/api-client';

export const useSendFeeReminder = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const { data } = await api.post('/whatsapp/fee-reminder', { studentId });
      return data;
    },
    onSuccess: (data, studentId) => {
      posthog?.capture('whatsapp_fee_reminder_sent', {
        student_id: studentId,
      });
    },
  });
};

export const useSendPaymentReceipt = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await api.post('/whatsapp/payment-confirmation', { paymentId });
      return data;
    },
    onSuccess: (data, paymentId) => {
      posthog?.capture('whatsapp_receipt_sent', {
        payment_id: paymentId,
      });
    },
  });
};

export const useSendTemplate = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async ({ studentId, templateType }: { studentId: string; templateType: string }) => {
      const { data } = await api.post('/whatsapp/send-template', { studentId, templateType });
      return data;
    },
    onSuccess: (data, variables) => {
      posthog?.capture('whatsapp_template_sent', {
        student_id: variables.studentId,
        template_type: variables.templateType,
      });
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

