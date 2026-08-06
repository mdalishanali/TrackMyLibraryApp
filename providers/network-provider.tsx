import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { API_BASE_URL } from '@/constants/config';

type NetworkStatus = {
  hasCheckedConnection: boolean;
  isConnected: boolean;
  isInternetReachable: boolean;
  isOffline: boolean;
  isServerUnreachable: boolean;
  refreshConnection: () => Promise<void>;
};

const NetworkContext = createContext<NetworkStatus | null>(null);

type ConnectivityState = Omit<NetworkStatus, 'refreshConnection'>;

const DEFAULT_CONNECTIVITY_STATE: ConnectivityState = {
  hasCheckedConnection: false,
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,
  isServerUnreachable: false,
};

// How long the connection must STAY unreachable before we show a blocking screen.
// Absorbs the transient "unknown" state NetInfo reports on every
// background -> foreground resume, so the app never flashes a false offline screen.
const OFFLINE_DEBOUNCE_MS = 3000;

// Reachability probe: NetInfo pings this to confirm the internet actually works
// (not just that WiFi/mobile-data is attached). We hit our own /health endpoint so
// the result reflects whether THIS app's backend is reachable.
const REACHABILITY_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/health`;
const REACHABILITY_TIMEOUT_MS = 8000;
const REACHABILITY_INTERVAL_MS = 30000;

// Neutral always-up endpoint (Google's captive-portal check, returns 204).
// If our backend probe fails but this succeeds, the internet is fine and it is
// OUR server that is down — a different problem needing a different screen.
const NEUTRAL_PROBE_URL = 'https://www.gstatic.com/generate_204';
const NEUTRAL_PROBE_TIMEOUT_MS = 5000;

// Configure once. Guarded so Fast Refresh (dev) doesn't re-run it repeatedly.
let isNetInfoConfigured = false;

const configureNetInfo = () => {
  if (isNetInfoConfigured) return;
  isNetInfoConfigured = true;

  NetInfo.configure({
    reachabilityUrl: REACHABILITY_URL,
    reachabilityRequestTimeout: REACHABILITY_TIMEOUT_MS,
    reachabilityLongTimeout: REACHABILITY_INTERVAL_MS,
    reachabilityShortTimeout: REACHABILITY_INTERVAL_MS,
    // Any HTTP reply proves the request reached the server, so even a 503
    // (server up, DB down) counts as reachable. Only a thrown/timed-out
    // request — i.e. no reply at all — means the backend is unreachable.
    reachabilityTest: async (response) => response.status >= 200 && response.status < 600,
  });
};

// NetInfo reports `null` for isConnected / isInternetReachable while it is still
// probing (which happens on every resume). Treat "unknown" as online; only an
// EXPLICIT `false` counts as unreachable.
const mapNetworkState = (state: NetInfoState): ConnectivityState => {
  const isConnected = state.isConnected !== false;
  const isInternetReachable = state.isInternetReachable !== false;
  const isOffline = !isConnected || !isInternetReachable;

  return {
    hasCheckedConnection: true,
    isConnected,
    isInternetReachable,
    isOffline,
    isServerUnreachable: false,
  };
};

const probeNeutralInternet = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NEUTRAL_PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(NEUTRAL_PROBE_URL, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

// The NetInfo reachability URL is OUR backend, so "unreachable" alone cannot
// tell device-offline apart from server-down. Disambiguate with the neutral
// probe: internet works but backend doesn't → the server is down.
const classifyOutage = async (state: NetInfoState): Promise<ConnectivityState> => {
  const base = mapNetworkState(state);

  if (state.isConnected === false) return base;

  const hasInternet = await probeNeutralInternet();
  if (!hasInternet) return base;

  return { ...base, isOffline: false, isServerUnreachable: true };
};

export function NetworkProvider({ children }: PropsWithChildren) {
  const [networkStatus, setNetworkStatus] = useState<ConnectivityState>(DEFAULT_CONNECTIVITY_STATE);
  const offlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isShowingOutage = useRef(false);
  const classifyToken = useRef(0);

  const clearOfflineTimer = useCallback(() => {
    if (offlineTimer.current) {
      clearTimeout(offlineTimer.current);
      offlineTimer.current = null;
    }
  }, []);

  const applyOutage = useCallback(async (state: NetInfoState) => {
    const token = ++classifyToken.current;
    const outage = await classifyOutage(state);

    // A newer network event superseded this classification while it was in flight.
    if (token !== classifyToken.current) return;

    isShowingOutage.current = true;
    setNetworkStatus(outage);
  }, []);

  const updateNetworkStatus = useCallback(
    (state: NetInfoState) => {
      const nextState = mapNetworkState(state);

      // React-Query should switch to offline queueing immediately, without debounce.
      onlineManager.setOnline(!nextState.isOffline);

      if (!nextState.isOffline) {
        // Online (or recovered): cancel any pending outage flip and update instantly.
        classifyToken.current += 1;
        clearOfflineTimer();
        isShowingOutage.current = false;
        setNetworkStatus(nextState);
        return;
      }

      // Already blocking: reclassify immediately so a retry can flip between
      // the offline and server-down screens without waiting out the debounce.
      if (isShowingOutage.current) {
        void applyOutage(state);
        return;
      }

      // Unreachable: only surface a blocking screen if it PERSISTS past the
      // debounce window. A brief blip on resume clears before the timer fires.
      if (offlineTimer.current) return;

      offlineTimer.current = setTimeout(() => {
        offlineTimer.current = null;
        void applyOutage(state);
      }, OFFLINE_DEBOUNCE_MS);
    },
    [applyOutage, clearOfflineTimer]
  );

  const refreshConnection = useCallback(async () => {
    const state = await NetInfo.refresh();
    updateNetworkStatus(state);
  }, [updateNetworkStatus]);

  useEffect(() => {
    configureNetInfo();

    // Live connectivity stream (fires an immediate event with current state).
    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);

    // On resume, force an immediate re-probe instead of waiting for the next
    // interval — this is what makes a stale offline state correct itself instantly.
    const handleAppStateChange = (status: AppStateStatus) => {
      if (status === 'active') {
        void refreshConnection();
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribe();
      appStateSub.remove();
      clearOfflineTimer();
    };
  }, [updateNetworkStatus, refreshConnection, clearOfflineTimer]);

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
