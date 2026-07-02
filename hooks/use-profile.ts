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
  libraryLogo?: string;
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

export type LeaveReason =
  | 'too_expensive'
  | 'just_testing'
  | 'missing_feature'
  | 'too_complicated'
  | 'found_another_app'
  | 'other';

type LeavePayload = {
  reason?: LeaveReason;
  feedback?: string;
};

// Drop undefined keys so they never reach the request body's JSON type.
const buildLeaveBody = ({ reason, feedback }: LeavePayload): Record<string, string> => {
  const body: Record<string, string> = {};
  if (reason) body.reason = reason;
  if (feedback) body.feedback = feedback;
  return body;
};

export const useDeleteAccount = () => {
  const { logout } = useAuth();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (payload: LeavePayload = {}) => {
      const { data } = await api.delete('/user/account', { data: buildLeaveBody(payload) });
      return data;
    },
    onSuccess: (_data, variables) => {
      posthog?.capture('account_deleted', { reason: variables?.reason ?? 'not_provided' });
      posthog?.reset(); // Clear user identity
      logout();
      queryClient.clear();
    },
  });
};

export const useDeactivateAccount = () => {
  const { logout } = useAuth();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (payload: LeavePayload = {}) => {
      const { data } = await api.post('/user/deactivate', buildLeaveBody(payload));
      return data;
    },
    onSuccess: (_data, variables) => {
      posthog?.capture('account_deactivated', { reason: variables?.reason ?? 'not_provided' });
      posthog?.reset();
      logout();
      queryClient.clear();
    },
  });
};
