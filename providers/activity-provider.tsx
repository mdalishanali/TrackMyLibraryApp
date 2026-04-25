import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

const storage = new MMKV();
const LAST_PING_KEY = 'last_activity_ping_date';

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const sendPing = async () => {
    if (!isAuthenticated) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastPing = storage.getString(LAST_PING_KEY);

    // Only ping if we haven't pinged today
    if (lastPing === today) return;

    try {
      await api.get('/user/ping');
      storage.set(LAST_PING_KEY, today);
    } catch (error) {
      console.warn('Silent activity update failed', error);
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        sendPing();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (isAuthenticated) {
      sendPing();
    }

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
