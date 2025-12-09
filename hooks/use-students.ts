import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { Student } from '@/types/api';

export type StudentPayload = {
  name: string;
  number: string;
  joiningDate: string;
  seat?: string;
  shift?: string;
  time: { start: string; end: string }[];
  fees?: number;
  notes?: string;
  status?: string;
};

export const useStudentsQuery = (params?: { name?: string; filter?: string }) =>
  useQuery({
    queryKey: queryKeys.students(params),
    queryFn: async () => {
      const { data } = await api.get('/students', { params });
      return data.students as Student[];
    },
  });

export const useCreateStudent = () =>
  useMutation({
    mutationFn: async (payload: StudentPayload) => {
      const { data } = await api.post('/students', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

export const useUpdateStudent = (id?: string) =>
  useMutation({
    mutationFn: async (payload: Partial<StudentPayload>) => {
      if (!id) throw new Error('Missing student id');
      const { data } = await api.put(`/students/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

export const useDeleteStudent = () =>
  useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/students/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
