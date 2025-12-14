import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { useAuth } from './use-auth';

type ProfilePayload = {
  name?: string;
  email?: string;
  contactNumber?: string;
  businessName?: string;
  businessAddress?: string;
};

export const useUpdateProfile = () => {
  const { setAuth } = useAuth();

  return useMutation({
    mutationFn: async (payload: ProfilePayload) => {
      const { data } = await api.put('/user/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      if (data?.user && data?.token) {
        setAuth({ user: data.user, token: data.token });
      }
      queryClient.invalidateQueries();
    },
  });
};

export const useDeleteAccount = () => {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/user/account');
      return data;
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
};
