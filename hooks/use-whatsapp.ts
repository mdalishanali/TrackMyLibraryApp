import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export type WhatsappStatus = {
  status: 'DISCONNECTED' | 'WAITING_FOR_SCAN' | 'AUTHENTICATED' | 'CONNECTED' | 'BUSY';
  qr?: string;
  pairingCode?: string;
  message?: string;
};

export const useWhatsappStatus = () => {
  return useQuery<WhatsappStatus>({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp/status');
      return data;
    },
    refetchInterval: (query) => {
      // Refetch frequently if waiting for scan or authenticating
      const status = query.state.data?.status;
      if (status === 'WAITING_FOR_SCAN' || status === 'AUTHENTICATED') return 3000;
      if (status === 'BUSY') return 5000;
      return 10000;
    },
  });
};

export const usePairingCode = () => {
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const { data } = await api.post('/whatsapp/pairing-code', { phoneNumber });
      return data.pairingCode as string;
    },
  });
};

export const useSendTestMessage = () => {
  return useMutation({
    mutationFn: async (payload: { phone: string; message: string }) => {
      const { data } = await api.post('/whatsapp/send-test', payload);
      return data;
    },
  });
};

export const useDisconnect = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/whatsapp/disconnect');
      return data;
    },
  });
};

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

export const useWhatsappAutomation = () => {
  return useQuery({
    queryKey: ['whatsapp-automation'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp/automation');
      return data;
    },
  });
};

export const useUpdateWhatsappAutomation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (automation: any) => {
      const { data } = await api.post('/whatsapp/automation', { automation });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-automation'] });
    },
  });
};
