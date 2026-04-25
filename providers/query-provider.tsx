import { PropsWithChildren, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const handleAppStateChange = (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
