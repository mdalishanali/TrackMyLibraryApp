import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export type Expense = {
  _id: string;
  title: string;
  amount: number;
  category: 'Rent' | 'Electricity' | 'Internet' | 'Salary' | 'Maintenance' | 'Cleaning' | 'Software' | 'Marketing' | 'Other';
  date: string;
  description?: string;
  company: string;
  createdBy: string;
};

export type CreateExpenseInput = {
    title: string;
    amount: number;
    category: string;
    date: string;
    description?: string;
};

export const useExpensesQuery = (params?: { year?: string; month?: string; calculateTotal?: boolean }) =>
  useQuery({
    queryKey: queryKeys.expenses(params),
    queryFn: async () => {
      const { data } = await api.get('/expenses', { params });
      return data;
    },
    select: (data: any) => {
        if (data.total !== undefined) {
             return { totalAmount: data.total, expenses: [], results: 0 };
        }
        return {
            expenses: data.expenses || [],
            results: data.results || 0,
            totalAmount: data.expenses?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
        };
    }
  });

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateExpenseInput) => {
      const { data } = await api.post('/expenses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      // Also potentially invalidate dashboard data if it shows net profit
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue });
    },
  });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/expenses/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.revenue });
      },
    });
  };

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CreateExpenseInput }) => {
      const { data } = await api.put(`/expenses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue });
    },
  });
};
