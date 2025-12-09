import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Student } from '@/types/api';

export const useStudentQuery = (id?: string) =>
  useQuery({
    queryKey: [...queryKeys.students(), id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('Missing id');
      const { data } = await api.get(`/students/${id}`);
      return data.student as Student;
    },
  });
