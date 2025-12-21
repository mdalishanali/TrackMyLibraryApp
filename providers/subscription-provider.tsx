import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import { useAuth } from '@/hooks/use-auth';
import { SubscriptionModal } from '@/components/subscription/subscription-modal';

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  isBlocked: boolean;
  customerInfo: CustomerInfo | null;
  presentPaywall: () => void;
  presentCustomerCenter: () => void;
  restorePurchases: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  refreshBackendStatus: () => Promise<void>;
  daysRemaining: number | null;
  daysRemainingText: string | null;
  isExpiringSoon: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const REVENUECAT_API_KEY = 'test_YsOGAifaRLPPHVKAahfsACYIkSx';
const ENTITLEMENT_ID = 'Library Manager TrackMyLibrary Pro';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const refreshBackendStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { api } = await import('@/lib/api-client');
      const response = await api.get<{ user: any }>('/user/profile');
      if (response.data?.user) {
        updateUser(response.data.user);
      }
    } catch (error) {
      console.warn('Failed to refresh backend status:', error);
    }
  }, [isAuthenticated, updateUser]);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      if (!(await Purchases.isConfigured())) return;
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setIsPro(!!info.entitlements.active[ENTITLEMENT_ID]);

      // Also sync with backend to get manual overrides
      refreshBackendStatus();
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  }, [refreshBackendStatus]);

  useEffect(() => {
    const initPurchases = async () => {
      if (Platform.OS === 'web') {
        setIsLoading(false);
        return;
      }

      try {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        // Only configure if not already done
        const alreadyConfigured = await Purchases.isConfigured();
        if (!alreadyConfigured && (Platform.OS === 'ios' || Platform.OS === 'android')) {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        }

        if (isAuthenticated && user?.company?._id) {
          // If already configured, we can safely logIn
          if (await Purchases.isConfigured()) {
            await Purchases.logIn(user.company._id);
            await checkSubscriptionStatus();
          }
        } else if (await Purchases.isConfigured()) {
          await Purchases.logOut();
          setIsPro(false);
          setCustomerInfo(null);
        }
      } catch (error) {
        // Log error but don't crash
        console.warn('RevenueCat initialization failed (probably offline):', error);
      } finally {
        setIsLoading(false);
      }
    };

    initPurchases();
  }, [isAuthenticated, user?.company?._id, checkSubscriptionStatus]);

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      if (!(await Purchases.isConfigured())) return;
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);
      const active = !!restoredInfo.entitlements.active[ENTITLEMENT_ID];
      setIsPro(active);
      Alert.alert(active ? 'Success' : 'Info', active ? 'Your subscription has been restored.' : 'No active subscriptions found.');
      if (active) setShowPaywall(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsLoading(false);
    }
  };

  const isTrialActive = useMemo(() => {
    if (!user?.company?.trialEnd) return false;
    return new Date(user.company.trialEnd) > new Date();
  }, [user?.company?.trialEnd]);

  const isProActive = useMemo(() => {
    const backendActive = isAuthenticated && user?.company?.subscriptionStatus === 'Active';

    // Strict Date check: even if status is 'Active', check the date
    const endDateStr = user?.company?.subscriptionEndDate;
    if (endDateStr) {
      const end = new Date(endDateStr);
      if (end < new Date()) return false; // Expired by date
    }

    return isPro || backendActive;
  }, [isPro, isAuthenticated, user?.company]);

  const daysRemaining = useMemo(() => {
    if (!isAuthenticated || !user?.company) return null;

    const isActuallyActive = user.company.subscriptionStatus === 'Active';
    const endDateStr = isActuallyActive
      ? user.company.subscriptionEndDate
      : user.company.trialEnd;

    if (!endDateStr) return null;

    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();

    // Return actual days, can be negative if expired
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [isAuthenticated, user?.company]);

  const daysRemainingText = useMemo(() => {
    if (daysRemaining === null) return null;
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Today';
    return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
  }, [daysRemaining]);

  const isExpiringSoon = useMemo(() =>
    daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3,
    [daysRemaining]);

  const isBlocked = isAuthenticated && !isProActive && !isTrialActive;

  const value = useMemo(() => ({
    isPro: isProActive,
    isLoading,
    isBlocked,
    customerInfo,
    presentPaywall: () => setShowPaywall(true),
    presentCustomerCenter: () => {
      const url = Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open subscription management. Please check your system settings.');
      });
    },
    restorePurchases,
    checkSubscriptionStatus,
    refreshBackendStatus,
    daysRemaining,
    daysRemainingText,
    isExpiringSoon,
  }), [isProActive, isLoading, isBlocked, customerInfo, restorePurchases, checkSubscriptionStatus, refreshBackendStatus, daysRemaining, daysRemainingText, isExpiringSoon]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <SubscriptionModal
        visible={showPaywall || isBlocked}
        isBlocked={isBlocked}
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={() => {
          setShowPaywall(false);
          checkSubscriptionStatus();
        }}
      />
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
};
