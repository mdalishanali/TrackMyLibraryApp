import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';

export function useAddLibrary() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (payload: { businessName: string; businessAddress: string; contactNumber: string }) => {
      const response = await api.post('/user/add-library', payload);
      return response.data;
    },
    onSuccess: async () => {
      // Re-fetch the user profile to get populated accessibleCompanies
      const { data } = await api.get('/user/profile');
      let updatedUser = data?.user || data?.data;
      if (updatedUser) {
        updateUser(updatedUser);
      }
      queryClient.invalidateQueries(); // Clear all caches to start fresh
    },
  });
}

export function useSwitchLibrary() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (companyId: string) => {
      const response = await api.post('/user/switch-library', { companyId });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        updateUser(data.user);
      }
      queryClient.clear(); // Important to clear any library-bound queries!
      queryClient.invalidateQueries(); 
    },
  });
}
