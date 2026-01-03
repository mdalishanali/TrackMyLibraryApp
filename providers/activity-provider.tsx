import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

// Ping every 5 minutes when active
const PING_INTERVAL = 5 * 60 * 1000;

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendPing = async () => {
    if (!isAuthenticated) return;
    try {
      await api.get('/user/ping');
    } catch (error) {
      console.warn('Silent ping failed', error);
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, send immediate ping
        sendPing();
        // Resume interval
        startInterval();
      } else {
        // App went to background, stop interval
        stopInterval();
      }
    };

    const startInterval = () => {
      stopInterval();
      intervalRef.current = setInterval(sendPing, PING_INTERVAL) as any;
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (isAuthenticated) {
      sendPing(); // Initial ping
      startInterval();
    }

    return () => {
      subscription.remove();
      stopInterval();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
