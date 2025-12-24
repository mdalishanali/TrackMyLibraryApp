import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { useAuth } from '@/hooks/use-auth';
import { SubscriptionModal } from '@/components/subscription/subscription-modal';

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  isBlocked: boolean;
  customerInfo: CustomerInfo | null;
  presentPaywall: () => void;
  restorePurchases: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  daysRemainingText: string | null;
  isExpiringSoon: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const API_KEYS = {
  ios: 'appl_fKJxVnsqhCzpfTTKOvXnAdqPgfU',
  android: 'goog_acnKwMqitQTdKOvrzsNPRpHJvpT',
};

const ENTITLEMENT_ID = 'Library Manager TrackMyLibrary Pro';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const isConfigured = await Purchases.isConfigured();
      if (!isConfigured) return;

      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setIsPro(!!info.entitlements.active[ENTITLEMENT_ID]);
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'web') {
        setIsLoading(false);
        return;
      }

      try {
        const apiKey = Platform.select(API_KEYS);
        if (apiKey) {
          const isConfigured = await Purchases.isConfigured();
          if (!isConfigured) {
            Purchases.configure({ apiKey });
          }

          if (isAuthenticated && user?.company?._id) {
            const { company } = user;
            await Purchases.logIn(company._id);
            await checkSubscriptionStatus();
          } else {
            await Purchases.logOut();
            setIsPro(false);
            setCustomerInfo(null);
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isAuthenticated, user, checkSubscriptionStatus]);

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);
      setIsPro(!!restoredInfo.entitlements.active[ENTITLEMENT_ID]);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  const expiryData = useMemo(() => {
    const active = customerInfo?.entitlements.active[ENTITLEMENT_ID];
    if (!active || !active.expirationDate) return { text: null, soon: false };

    const exp = new Date(active.expirationDate).getTime();
    const now = new Date().getTime();
    const days = Math.floor((exp - now) / (1000 * 60 * 60 * 24));

    return {
      text: days <= 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''}`,
      soon: days >= 0 && days <= 3
    };
  }, [customerInfo]);

  const value = useMemo(() => ({
    isPro,
    isLoading,
    isBlocked: isAuthenticated && !isPro,
    customerInfo,
    presentPaywall: () => setShowPaywall(true),
    restorePurchases,
    checkSubscriptionStatus,
    daysRemainingText: expiryData.text,
    isExpiringSoon: expiryData.soon,
  }), [isPro, isLoading, isAuthenticated, customerInfo, restorePurchases, checkSubscriptionStatus, expiryData]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <SubscriptionModal
        visible={showPaywall || value.isBlocked}
        isBlocked={value.isBlocked}
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
