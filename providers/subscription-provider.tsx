import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import Purchases, { CustomerInfo } from 'react-native-purchases';
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
  const [isRcPro, setIsRcPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const isConfigured = await Purchases.isConfigured();
      if (!isConfigured) return;
      
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setIsRcPro(!!info.entitlements.active[ENTITLEMENT_ID]);
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
            await Purchases.logIn(user.company._id);
            await checkSubscriptionStatus();
          } else {
            if (isConfigured) await Purchases.logOut();
            setIsRcPro(false);
            setCustomerInfo(null);
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isAuthenticated, user?.company?._id, checkSubscriptionStatus]);

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);
      setIsRcPro(!!restoredInfo.entitlements.active[ENTITLEMENT_ID]);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isProActive = useMemo(() => {
    const isTrialActive = user?.company?.trialEnd && new Date(user.company.trialEnd) > new Date();
    
    let isDbActive = user?.company?.subscriptionStatus === 'Active';
    if (isDbActive && user?.company?.subscriptionEndDate) {
      if (new Date(user.company.subscriptionEndDate) < new Date()) {
        isDbActive = false;
      }
    }

    return isRcPro || isDbActive || isTrialActive;
  }, [isRcPro, user?.company]);

  const expiryData = useMemo(() => {
    const rcActive = customerInfo?.entitlements.active[ENTITLEMENT_ID];
    const expDateStr = rcActive?.expirationDate || user?.company?.subscriptionEndDate || user?.company?.trialEnd;
    
    if (!expDateStr) return { text: null, soon: false };

    const exp = new Date(expDateStr).getTime();
    const now = new Date().getTime();
    const days = Math.floor((exp - now) / (1000 * 60 * 60 * 24));
    
    return {
      text: days < 0 ? 'Expired' : (days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''}`),
      soon: days >= 0 && days <= 3
    };
  }, [customerInfo, user?.company]);

  const presentCustomerCenter = useCallback(() => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open subscription management. Please check your system settings.');
    });
  }, []);

  const value = useMemo(() => ({
    isPro: isProActive,
    isLoading,
    isBlocked: isAuthenticated && !isProActive,
    customerInfo,
    presentPaywall: () => setShowPaywall(true),
    presentCustomerCenter,
    restorePurchases,
    checkSubscriptionStatus,
    daysRemainingText: expiryData.text,
    isExpiringSoon: expiryData.soon,
  }), [isProActive, isLoading, isAuthenticated, customerInfo, presentCustomerCenter, restorePurchases, checkSubscriptionStatus, expiryData]);

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
