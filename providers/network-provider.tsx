import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type NetworkStatus = {
  hasCheckedConnection: boolean;
  isConnected: boolean;
  isInternetReachable: boolean;
  isOffline: boolean;
  refreshConnection: () => Promise<void>;
};

const NetworkContext = createContext<NetworkStatus | null>(null);

type ConnectivityState = Omit<NetworkStatus, 'refreshConnection'>;

const DEFAULT_CONNECTIVITY_STATE: ConnectivityState = {
  hasCheckedConnection: false,
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,
};

const mapNetworkState = (state: NetInfoState): ConnectivityState => {
  const isConnected = Boolean(state.isConnected);
  const isInternetReachable = state.isInternetReachable !== false;
  const isOffline = !isConnected || !isInternetReachable;

  return {
    hasCheckedConnection: true,
    isConnected,
    isInternetReachable,
    isOffline,
  };
};

export function NetworkProvider({ children }: PropsWithChildren) {
  const [networkStatus, setNetworkStatus] = useState<ConnectivityState>(DEFAULT_CONNECTIVITY_STATE);

  const updateNetworkStatus = useCallback((state: NetInfoState) => {
    const nextState = mapNetworkState(state);

    setNetworkStatus(nextState);
    onlineManager.setOnline(!nextState.isOffline);
  }, []);

  const refreshConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    updateNetworkStatus(state);
  }, [updateNetworkStatus]);

  useEffect(() => {
    refreshConnection();

    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);
    return () => unsubscribe();
  }, [refreshConnection, updateNetworkStatus]);

  const value = useMemo(
    () => ({
      ...networkStatus,
      refreshConnection,
    }),
    [networkStatus, refreshConnection]
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetworkStatus() {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider');
  }

  return context;
}
