import { useMutation, useQuery } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';

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
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (payload: ProfilePayload) => {
      const { data } = await api.put('/user/profile', payload);
      return data;
    },
    onSuccess: (data, variables) => {
      if (data?.user) {
        updateUser(data.user);
      }
      queryClient.invalidateQueries();

      posthog?.capture('profile_updated', {
        fields_updated: Object.keys(variables),
      });
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
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/user/account');
      return data;
    },
    onSuccess: () => {
      posthog?.capture('account_deleted');
      posthog?.reset(); // Clear user identity
      logout();
      queryClient.clear();
    },
  });
};
