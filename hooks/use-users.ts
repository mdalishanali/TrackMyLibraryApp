import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';

export type UserRecord = {
  _id: string;
  name: string;
  email: string;
  contactNumber: string;
};

export type UserPayload = {
  name: string;
  email: string;
  contactNumber: string;
  password: string;
};

export const useUsersQuery = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.users as UserRecord[];
    },
  });

export const useCreateUser = () =>
  useMutation({
    mutationFn: async (payload: UserPayload) => {
      const { data } = await api.post('/users', payload, { successToastMessage: 'User created' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

export const useDeleteUser = () =>
  useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/users/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
