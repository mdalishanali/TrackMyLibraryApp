import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { Student } from '@/types/api';
import { uploadImageToCloud } from '@/utils/image';

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
  gender?: string;
  profilePicture?: string;
};

type StudentsPage = {
  students: Student[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
};

export const useStudentsQuery = (params?: { name?: string; filter?: string }) =>
  useQuery({
    queryKey: queryKeys.students(params),
    queryFn: async () => {
      const { data } = await api.get('/students', { params });
      return data.students as Student[];
    },
  });

export const useInfiniteStudentsQuery = (params?: { name?: string; filter?: string; limit?: number }) =>
  useInfiniteQuery<StudentsPage>({
    queryKey: queryKeys.students(params),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage.pagination?.page ?? 1;
      const limit = lastPage.pagination?.limit ?? params?.limit ?? 10;
      const total = lastPage.pagination?.total ?? 0;
      const nextPage = current + 1;
      return (current - 1) * limit + lastPage.students.length < total ? nextPage : undefined;
    },
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get('/students', {
        params: { ...params, page: pageParam, limit: params?.limit ?? 10 },
      });
      return data as StudentsPage;
    },
  });

export const useCreateStudent = () =>
  useMutation({
    mutationFn: async ({ payload, onProgress }: { payload: StudentPayload; onProgress?: (p: number) => void }) => {
      let finalProfilePicture = payload.profilePicture;

      // If we have a local URI, we need to upload it first
      if (payload.profilePicture && (payload.profilePicture.startsWith('file://') || payload.profilePicture.startsWith('content://'))) {
        finalProfilePicture = await uploadImageToCloud(payload.profilePicture, onProgress);
      }

      const { data } = await api.post('/students', { ...payload, profilePicture: finalProfilePicture }, { successToastMessage: 'Student created' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

export const useUpdateStudent = (id?: string) =>
  useMutation({
    mutationFn: async ({ payload, onProgress }: { payload: Partial<StudentPayload>; onProgress?: (p: number) => void }) => {
      if (!id) throw new Error('Missing student id');

      let finalProfilePicture = payload.profilePicture;

      // If we have a local URI, we need to upload it first
      if (payload.profilePicture && (payload.profilePicture.startsWith('file://') || payload.profilePicture.startsWith('content://'))) {
        finalProfilePicture = await uploadImageToCloud(payload.profilePicture, onProgress);
      }

      const { data } = await api.put(`/students/${id}`, { ...payload, profilePicture: finalProfilePicture });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
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
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
