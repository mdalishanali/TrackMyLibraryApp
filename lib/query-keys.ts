export const queryKeys = {
  dashboard: ['dashboard'] as const,
  students: (params?: Record<string, unknown>) => ['students', params] as const,
  seats: ['seats'] as const,
  payments: (params?: Record<string, unknown>) => ['payments', params] as const,
};
