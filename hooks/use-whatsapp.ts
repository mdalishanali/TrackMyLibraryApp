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
    mutationFn: async ({ paymentId, method = 'handset' }: { paymentId: string; method?: 'api' | 'handset' }) => {
      const { data } = await api.post('/whatsapp/payment-confirmation', { paymentId, method });
      return data;
    },
    onSuccess: (data, variables) => {
      posthog?.capture('whatsapp_receipt_sent', {
        payment_id: variables.paymentId,
        method: variables.method || 'handset',
      });
    },
  });
};

export const useSendTemplate = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async ({ studentId, templateType, method = 'handset' }: { studentId: string; templateType: string; method?: 'api' | 'handset' }) => {
      const { data } = await api.post('/whatsapp/send-template', { studentId, templateType, method });
      return data;
    },
    onSuccess: (data, variables) => {
      posthog?.capture('whatsapp_template_sent', {
        student_id: variables.studentId,
        template_type: variables.templateType,
        method: variables.method || 'handset',
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

export type ReminderDaysBefore = {
  threeDays: boolean;
  sameDay: boolean;
  overdue: boolean;
};

export type AutomationSettings = {
  whatsappEnabled: boolean;
  autoReminderEnabled: boolean;
  welcomeMessageEnabled: boolean;
  paymentReceiptEnabled: boolean;
  reminderDaysBefore: ReminderDaysBefore;
  whatsappCredits: number;
  whatsappMessagesSent: number;
};

export const useAutomationSettings = () => {
  return useQuery<AutomationSettings>({
    queryKey: ['whatsapp-automation-settings'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp/automation-settings');
      return data;
    },
  });
};

export const useUpdateAutomationSettings = () => {
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (settings: Partial<AutomationSettings>) => {
      const { data } = await api.patch('/whatsapp/automation-settings', settings, {
        skipSuccessToast: true,
      });
      return data as AutomationSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['whatsapp-automation-settings'], data);
      posthog?.capture('whatsapp_automation_settings_updated');
    },
  });
};

export const useSendBulkReminders = () => {
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (reminderType: 'all' | '3day' | 'today' | 'overdue' = 'all') => {
      const { data } = await api.post('/whatsapp/bulk-reminder', { reminderType });
      return data;
    },
    onSuccess: (data) => {
      posthog?.capture('whatsapp_bulk_reminder_triggered', {
        queued: data?.queued,
      });
    },
  });
};
