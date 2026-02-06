import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { useAuth } from '@/hooks/use-auth';
import { useProfileQuery } from '@/hooks/use-profile';
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
  expiresAt: string | null;
  isTrial: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const API_KEYS = {
  ios: 'appl_fKJxVnsqhCzpfTTKOvXnAdqPgfU',
  android: 'goog_acnKwMqitQTdKOvrzsNPRpHJvpT',
};

const ENTITLEMENT_ID = 'Library Manager TrackMyLibrary Pro';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { isLoading: isProfileLoading } = useProfileQuery();
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
    const isTrialActive = !!(user?.company?.trialEnd && new Date(user.company.trialEnd) > new Date());
    
    let isDbActive = user?.company?.subscriptionStatus === 'Active';
    if (isDbActive && user?.company?.subscriptionEndDate) {
      if (new Date(user.company.subscriptionEndDate) < new Date()) {
        isDbActive = false;
      }
    }

    return !!(isRcPro || isDbActive || isTrialActive);
  }, [isRcPro, user?.company]);

  const expiryData = useMemo(() => {
    const expDateStr = user?.company?.subscriptionEndDate || user?.company?.trialEnd;
    
    if (!expDateStr) return { text: null, soon: false, expiresAt: null, isTrial: false };

    const exp = new Date(expDateStr);
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();

    // Safety check for invalid dates
    if (isNaN(exp.getTime())) return { text: null, soon: false, expiresAt: null, isTrial: false };

    // Calculate hours remaining
    const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let text = '';
    if (diffMs <= 0) text = 'Expired';
    else if (hoursRemaining < 24) text = `${Math.max(1, hoursRemaining)}h remaining`;
    else text = `${days} day${days > 1 ? 's' : ''}`;

    return {
      text,
      soon: diffMs > 0 && days <= 3, // Show soon if active and less than 3 days
      expiresAt: exp.toISOString(),
      isTrial: !!(!user?.company?.subscriptionEndDate && user?.company?.trialEnd && new Date(user.company.trialEnd) > now)
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

  const combinedLoading = isLoading || (isAuthenticated && isProfileLoading);

  const value = useMemo(() => ({
    isPro: isProActive,
    isLoading: combinedLoading,
    isBlocked: isAuthenticated && !isProActive && !combinedLoading,
    customerInfo,
    presentPaywall: () => setShowPaywall(true),
    presentCustomerCenter,
    restorePurchases,
    checkSubscriptionStatus,
    daysRemainingText: expiryData.text,
    isExpiringSoon: expiryData.soon,
    expiresAt: expiryData.expiresAt,
    isTrial: expiryData.isTrial,
  }), [isProActive, combinedLoading, isAuthenticated, customerInfo, presentCustomerCenter, restorePurchases, checkSubscriptionStatus, expiryData]);

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
