import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface CustomPaywallProps {
  onClose?: () => void;
  onPurchaseSuccess: () => void;
  isBlocked?: boolean;
}

export const CustomPaywall: React.FC<CustomPaywallProps> = ({ onClose, onPurchaseSuccess, isBlocked }) => {
  const theme = useTheme();
  const { logout } = useAuth();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animation values - MUST be before any returns
  const buttonScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  // Animated styles - MUST be before any returns
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  useEffect(() => {
    fetchOfferings();

    // Pulsing glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const fetchOfferings = async (retries = 3) => {
    try {
      if (!Purchases) {
        setLoading(false);
        return;
      }
      // 1. Wait for configuration if needed
      let isConfigured = await Purchases.isConfigured();
      let waitCount = 0;
      while (!isConfigured && waitCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        isConfigured = await Purchases.isConfigured();
        waitCount++;
      }

      if (!isConfigured) {
        console.warn('RevenueCat not configured after waiting');
        setLoading(false);
        return;
      }

      // 2. Fetch offerings
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        setPackages(offerings.current.availablePackages);
        const yearly = offerings.current.availablePackages.find(p => p.packageType === 'ANNUAL');
        setSelectedPackage(yearly || offerings.current.availablePackages[0]);
        setLoading(false);
      } else if (retries > 0) {
        // Retry after a delay if offerings are empty
        console.log(`Offerings empty, retrying... (${retries} left)`);
        setTimeout(() => fetchOfferings(retries - 1), 1500);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error('Error fetching offerings', e);
      if (retries > 0) {
        setTimeout(() => fetchOfferings(retries - 1), 1500);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSelectPackage = (pkg: PurchasesPackage) => {
    setSelectedPackage(pkg);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    buttonScale.value = withSequence(withSpring(0.95), withSpring(1));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (typeof customerInfo.entitlements.active['Library Manager TrackMyLibrary Pro'] !== 'undefined') {
        onPurchaseSuccess();
      }
    } catch (e: any) {
      if (!e.userCancelled) console.error('Purchase error', e);
    } finally {
      setIsPurchasing(false);
    }
  };

  const features = [
    { icon: 'infinite', text: 'Unlimited Students & Seats', color: '#4FACFE' },
    { icon: 'analytics', text: 'Advanced Revenue Analytics', color: '#00F2FE' },
    { icon: 'cloud-done', text: 'Cloud Backup & Sync', color: '#A8EDEA' },
    { icon: 'notifications', text: 'Due Payment Reminders', color: '#FED06E' },
    { icon: 'shield-checkmark', text: 'Ads Free Experience', color: '#F8A5C2' },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Dynamic Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/subscription_premium_illustration.png')}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', theme.background]}
            style={styles.heroGradient}
          />

          <View style={styles.topControls}>
            {isBlocked ? (
              <Animated.View entering={FadeInRight.delay(200)}>
                <TouchableOpacity style={styles.topButton} onPress={logout}>
                  <Ionicons name="log-out" size={18} color="#fff" />
                  <Text style={styles.topButtonText}>Switch Account</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                  <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerText}>
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Text style={styles.preTitle}>ELEVATE YOUR WORKFLOW</Text>
              <Text style={styles.mainTitle}>TrackMyLibrary <Text style={styles.blueText}>PRO</Text></Text>
            </Animated.View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Animated Features */}
          <View style={styles.featuresSection}>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(400 + (index * 100)).springify()}
                style={styles.featureItem}
              >
                <View style={[styles.iconCircle, { backgroundColor: feature.color + '15' }]}>
                  <Ionicons name={feature.icon as any} size={20} color={feature.color} />
                </View>
                <Text style={[styles.featureLabel, { color: theme.text }]}>{feature.text}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Premium Plan Cards */}
          <View style={styles.plansSection}>
            {packages.length === 0 ? (
              <View style={styles.errorContainer}>
                <Ionicons name="cloud-offline-outline" size={40} color={theme.muted} />
                <Text style={[styles.errorText, { color: theme.text }]}>Unable to load plans</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: theme.primary + '20' }]}
                  onPress={() => {
                    setLoading(true);
                    fetchOfferings();
                  }}
                >
                  <Text style={[styles.retryText, { color: theme.primary }]}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              packages.map((pkg, index) => {
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const isYearly = pkg.packageType === 'ANNUAL';

                return (
                  <Animated.View
                    key={pkg.identifier}
                    entering={FadeInDown.delay(900 + (index * 100)).springify()}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleSelectPackage(pkg)}
                      style={[
                        styles.planCard,
                        {
                          backgroundColor: isSelected ? theme.primary + '08' : theme.surfaceAlt,
                          borderColor: isSelected ? theme.primary : theme.border,
                          borderWidth: isSelected ? 2 : 1.5,
                        }
                      ]}
                    >
                      <View style={styles.planHeader}>
                        <View>
                          <View style={styles.planTitleRow}>
                            <Text style={[styles.planName, { color: theme.text }]}>
                              {pkg.product.title.split(' (')[0]}
                            </Text>
                            {isYearly && (
                              <View style={[styles.bestValueBadge, { backgroundColor: theme.primary }]}>
                                <Text style={styles.bestValueText}>POPULAR</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.planSubtext, { color: theme.muted }]}>
                            {isYearly ? 'Complete security & features' : 'Essential library tools'}
                          </Text>
                        </View>

                        <View style={styles.planPriceInfo}>
                          <Text style={[styles.planPrice, { color: theme.text }]}>{pkg.product.priceString}</Text>
                          {isYearly && (
                            <Text style={[styles.savingsText, { color: theme.success }]}>SAVE 20%</Text>
                          )}
                        </View>
                      </View>

                      {isYearly && isSelected && (
                        <View style={styles.monthlyBreakdown}>
                          <Text style={[styles.breakdownText, { color: theme.muted }]}>
                            Only {(pkg.product.price / 12).toLocaleString(undefined, { style: 'currency', currency: pkg.product.currencyCode })} per month
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Interactive Footer */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Animated.View style={animatedButtonStyle}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePurchase}
            disabled={isPurchasing || !selectedPackage}
            style={[styles.ctaButton, (!selectedPackage || isPurchasing) && { opacity: 0.6 }]}
          >
            <LinearGradient
              colors={[theme.primary, theme.info]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                  <View style={styles.ctaInner}>
                    <Text style={styles.ctaText}>
                      {isBlocked ? 'Unlock Everything' : 'Continue to PRO'}
                  </Text>
                    <Ionicons name="sparkles" size={18} color="#fff" style={styles.sparkleIcon} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => Purchases.restorePurchases()}>
            <Text style={[styles.linkText, { color: theme.muted }]}>Restore purchases</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          {isBlocked ? (
            <TouchableOpacity onPress={logout}>
              <Text style={styles.logoutLink}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose}>
                <Text style={[styles.linkText, { color: theme.muted }]}>Not now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Requirements for App Store/Play Store */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://your-website.com/terms')}>
            <Text style={[styles.legalText, { color: theme.muted }]}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={[styles.legalText, { color: theme.muted }]}>  •  </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://your-website.com/privacy')}>
            <Text style={[styles.legalText, { color: theme.muted }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: height * 0.4,
    width: '100%',
  },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  topButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  closeIcon: { opacity: 0.8 },
  headerText: {
    position: 'absolute',
    bottom: 25,
    left: 24,
    right: 24,
  },
  preTitle: { color: '#4FACFE', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  mainTitle: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  blueText: { color: '#4FACFE' },
  content: { padding: 24, paddingTop: 8 },
  featuresSection: { gap: 18, marginBottom: 35 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  featureLabel: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  plansSection: { gap: 16, marginBottom: 10 },
  planCard: {
    padding: 22,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planName: { fontSize: 20, fontWeight: '900' },
  bestValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bestValueText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  planSubtext: { fontSize: 13, marginTop: 4, fontWeight: '500', opacity: 0.8 },
  planPriceInfo: { alignItems: 'flex-end' },
  planPrice: { fontSize: 20, fontWeight: '900' },
  savingsText: { fontSize: 11, fontWeight: '900', marginTop: 4 },
  monthlyBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  breakdownText: { fontSize: 13, fontWeight: '600' },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 26,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 24,
  },
  ctaButton: { height: 66, borderRadius: 22, overflow: 'hidden' },
  ctaGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctaText: { color: '#fff', fontSize: 19, fontWeight: '900' },
  sparkleIcon: { marginTop: -2 },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    marginTop: 22,
  },
  linkText: { fontSize: 14, fontWeight: '700', opacity: 0.7 },
  divider: { width: 4, height: 4, borderRadius: 2, opacity: 0.3 },
  logoutLink: { color: '#FF5252', fontSize: 14, fontWeight: '800' },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    opacity: 0.6,
  },
  legalText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
