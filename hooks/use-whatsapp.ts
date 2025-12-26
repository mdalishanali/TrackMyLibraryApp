import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export type WhatsappStatus = {
  status: 'DISCONNECTED' | 'WAITING_FOR_SCAN' | 'AUTHENTICATED' | 'CONNECTED';
  qr?: string;
  pairingCode?: string;
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
      return status === 'WAITING_FOR_SCAN' || status === 'AUTHENTICATED' ? 3000 : 10000;
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
