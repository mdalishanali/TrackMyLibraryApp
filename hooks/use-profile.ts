import { useMutation, useQuery } from '@tanstack/react-query';

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
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: async (payload: ProfilePayload) => {
      const { data } = await api.put('/user/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        updateUser(data.user);
      }
      queryClient.invalidateQueries();
    },
  });
};

export const useProfileQuery = (options?: { enabled?: boolean }) => {
  const { updateUser, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/user/profile');
      if (data?.user) {
        updateUser(data.user);
      }
      return data.user;
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 0,
    refetchOnWindowFocus: true,
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
