import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Enable network mode for offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
      networkMode: 'offlineFirst',
    },
  },
});
