import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
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
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { logErrorToDiscord } from '@/lib/discord';
import { usePostHog } from 'posthog-react-native';

const { width, height } = Dimensions.get('window');
const ILLUSTRATION = require('../../assets/images/subscription_premium_illustration.jpg');

interface CustomPaywallProps {
  onClose?: () => void;
  onPurchaseSuccess: () => void;
  isBlocked?: boolean;
}

export const CustomPaywall: React.FC<CustomPaywallProps> = ({ onClose, onPurchaseSuccess, isBlocked }) => {
  const theme = useTheme();
  const { logout, user } = useAuth();
  const posthog = usePostHog();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trialTimeLeft, setTrialTimeLeft] = useState<string>('');

  // Track paywall view
  useEffect(() => {
    posthog?.capture('paywall_viewed', {
      is_blocked: isBlocked || false,
      trial_time_left: trialTimeLeft || 'none',
    });
  }, []);

  // Animation values
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Start pulse animation
    buttonScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const currentOffering = offerings.all['default'] || offerings.current;

        if (currentOffering) {
          const available = currentOffering.availablePackages;
          setPackages(available);
          const yearly = available.find(p => p.packageType === 'ANNUAL');
          setSelectedPackage(yearly || available[0]);
        }
      } catch (e) {
        // Silently handle
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  useEffect(() => {
    if (!user?.company?.trialEnd) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(user.company!.trialEnd);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTrialTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTrialTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user?.company?.trialEnd]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handlePurchase = async () => {
    if (!selectedPackage || isPurchasing) return;

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    posthog?.capture('purchase_button_clicked', {
      package_id: selectedPackage.identifier,
      package_type: selectedPackage.packageType,
      price: selectedPackage.product.price,
    });

    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (customerInfo.entitlements.active['Library Manager TrackMyLibrary Pro']) {
        posthog?.capture('subscription_purchased', {
          package_id: selectedPackage.identifier,
          package_type: selectedPackage.packageType,
          price: selectedPackage.product.price,
        });
        onPurchaseSuccess();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        posthog?.capture('purchase_failed', {
          package_id: selectedPackage.identifier,
          error: e.message,
        });
        logErrorToDiscord(e, `Purchase Failed: ${selectedPackage.product.identifier}`);
        Alert.alert('Error', 'Failed to process purchase. Please try again.');
      } else {
        posthog?.capture('purchase_cancelled', {
          package_id: selectedPackage.identifier,
        });
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#0F172A' }]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0F172A' }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        <View style={styles.header}>
          <Image source={ILLUSTRATION} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#0F172A']}
            locations={[0, 0.4, 0.7, 1]}
            style={styles.heroGradient}
          />
          <View style={styles.topControls}>
            {isBlocked ? (
              <TouchableOpacity style={styles.topButton} onPress={logout}>
                <Ionicons name="log-out" size={18} color="#fff" />
                <Text style={styles.topButtonText}>Switch Account</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                  <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.headerText}>
            <View style={styles.preTitleContainer}>
              <Text style={styles.preTitle}>PREMIUM ACCESS</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.mainTitle}>TrackMyLibrary</Text>
            <View style={[styles.offerBadge, trialTimeLeft ? { backgroundColor: '#EF4444' } : {}]}>
              <LinearGradient
                colors={trialTimeLeft ? ['#EF4444', '#DC2626'] : ['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
                key="gradient"
              />
              <Ionicons name={trialTimeLeft ? "timer-outline" : "sparkles"} size={16} color={trialTimeLeft ? "#FFF" : "#000"} />
              <Text style={[styles.offerText, trialTimeLeft ? { color: '#FFF' } : {}]}>
                {trialTimeLeft ? `Trial Expires in: ${trialTimeLeft}` : 'Launch Offer: ₹199/mo'}
              </Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.trustBadge}>
            <View style={styles.trustAvatars}>
              {['👨‍🏫', '🏢', '📚'].map((emoji, i) => (
                <View
                  key={i}
                  style={[
                    styles.trustAvatar,
                    {
                      transform: [{ translateX: -i * 12 }],
                      zIndex: 3 - i,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#334155'
                    }
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.trustText, { color: '#94A3B8', marginLeft: -20 }]}>
              Trusted by <Text style={{ color: '#fff', fontWeight: '800' }}>1,000+ Library Owners</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.features}>
            {[
              { icon: 'people', text: 'Add Unlimited Students', sub: 'No limit on students or seats' },
              { icon: 'logo-whatsapp', text: 'Auto WhatsApp Reminders', sub: 'Send fees & due fast', color: '#25D366' },
              { icon: 'receipt', text: 'Send Fee Receipt on WhatsApp', sub: 'Instant proof for parents' },
              { icon: 'shield-checkmark', text: '100% Safe & Secure Data', sub: 'Cloud backup included' },
            ].map((f, i) => (
              <Animated.View
                entering={FadeInDown.delay(400 + i * 100)}
                key={i}
                style={styles.featureItem}
              >
                <View style={styles.featureIconBox}>
                  <Ionicons name={f.icon as any} size={28} color={f.color || '#F8FAFC'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureText}>{f.text}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.plans}>
            {packages.map((pkg, index) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const isYearly = pkg.packageType === 'ANNUAL';

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  activeOpacity={0.8}
                  onPress={() => {
                    posthog?.capture('package_selected', {
                      package_id: pkg.identifier,
                      package_type: pkg.packageType,
                      price: pkg.product.price,
                    });
                    setSelectedPackage(pkg);
                  }}
                >
                  <Animated.View 
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: isSelected ? '#1E293B' : '#0F172A',
                        borderColor: isSelected ? '#FFD700' : '#334155',
                        transform: [{ scale: isSelected ? 1.02 : 1 }]
                      }
                    ]}
                  >
                    <View style={styles.planInfo}>
                      <Text style={[styles.planTitle, { color: isSelected ? '#FFD700' : '#fff' }]}>
                        {isYearly ? 'Yearly Plan (Best Value)' : 'Monthly Plan'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                        <Text style={styles.planPrice}>
                          {pkg.product.priceString}
                        </Text>
                        <Text style={styles.planPeriod}>
                          /{isYearly ? 'year' : 'mo'}
                        </Text>
                      </View>
                      {isYearly && <Text style={{ color: '#4ADE80', fontWeight: '700', marginTop: 4 }}>Less than a chai per day! (₹6/day)</Text>}
                    </View>

                    <View style={[
                      styles.radioButton,
                      {
                        borderColor: isSelected ? '#FFD700' : '#475569',
                        backgroundColor: isSelected ? '#FFD700' : 'transparent'
                      }
                    ]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#000" />}
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          <View style={styles.contactSection}>
            <Text style={[styles.contactTitle, { color: '#fff' }]}>Need Help?</Text>
            <Text style={[styles.contactSubtitle, { color: '#94A3B8' }]}>
              Have questions? Direct chat with our team.
            </Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity
                onPress={() => {
                  posthog?.capture('support_contacted', { method: 'whatsapp', source: 'paywall' });
                  Linking.openURL(`https://wa.me/916391417248?text=${encodeURIComponent('Hello TrackMyLibrary Support, I need help with my account/subscription.')}`);
                }}
                style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  posthog?.capture('support_contacted', { method: 'email', source: 'paywall' });
                  Linking.openURL(`mailto:md.alishanali88@gmail.com?subject=${encodeURIComponent('TrackMyLibrary Support Request')}&body=${encodeURIComponent('Hello Team,\n\nI need help with...')}`);
                }}
                style={[styles.contactBtn, { backgroundColor: '#0EA5E9' }]}
              >
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(800).springify()} style={[styles.footer, { borderTopColor: '#334155', backgroundColor: '#0F172A' }]}>
        <Animated.View style={animatedButtonStyle}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePurchase}
            disabled={isPurchasing}
          >
            <LinearGradient
              colors={['#FFD700', '#F59E0B']}
              style={styles.buyButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buyButtonText}>Unlock Pro Access</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.billingNotice}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#94A3B8" />
          <Text style={[styles.billingText, { color: '#94A3B8' }]}>
            Risk-free. Cancel anytime via Settings.
          </Text>
        </View>

        <TouchableOpacity onPress={() => {
          posthog?.capture('restore_purchases_clicked', { source: 'paywall' });
          Purchases.restorePurchases();
        }} style={styles.restoreBtn}>
          <Text style={[styles.restoreText, { color: '#64748B' }]}>Restore Purchase</Text>
        </TouchableOpacity>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={[styles.legalText, { color: '#64748B' }]}>Terms</Text>
          </TouchableOpacity>
          <Text style={[styles.legalText, { color: '#64748B' }]}> • </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://lumbar-hyssop-0ce.notion.site/Privacy-Policy-2d3ce51ccc32800ea087fc6d0422511c?source=copy_link')}>
            <Text style={[styles.legalText, { color: '#64748B' }]}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const isSmallDevice = height < 700;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },

  // Header
  header: { height: height * (isSmallDevice ? 0.35 : 0.42), width: '100%' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },

  topControls: { position: 'absolute', top: isSmallDevice ? 40 : 50, right: 20, zIndex: 10 },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  topButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  closeIcon: { opacity: 0.9, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 5 },

  headerText: { position: 'absolute', bottom: isSmallDevice ? 16 : 25, left: 24, right: 24 },

  // Title Section
  preTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  preTitle: {
    color: '#FFD700',
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8
  },
  proBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900'
  },

  mainTitle: {
    fontSize: isSmallDevice ? 32 : 40,
    fontWeight: '900',
    color: '#fff',
    lineHeight: isSmallDevice ? 36 : 44,
    marginBottom: isSmallDevice ? 8 : 16,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
  },

  // Offer Badge
  offerBadge: {
    backgroundColor: '#FFD700', // Gold
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 6 : 8,
    borderRadius: 8,
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8
  },
  offerText: {
    color: '#000',
    fontWeight: '900',
    fontSize: isSmallDevice ? 14 : 16,
    textTransform: 'uppercase'
  },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: isSmallDevice ? 16 : 24 },

  // Trust Section
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center', 
    backgroundColor: '#1E293B',
    padding: isSmallDevice ? 8 : 12,
    borderRadius: 16,
    marginBottom: isSmallDevice ? 20 : 32,
    borderWidth: 1,
    borderColor: '#334155'
  },
  trustAvatars: { flexDirection: 'row', marginRight: 12, paddingLeft: 4 },
  trustAvatar: {
    width: isSmallDevice ? 28 : 32,
    height: isSmallDevice ? 28 : 32,
    borderRadius: isSmallDevice ? 14 : 16,
    borderWidth: 2,
    borderColor: '#1E293B',
    backgroundColor: '#475569',
    overflow: 'hidden'
  },
  trustText: { fontSize: isSmallDevice ? 13 : 15, fontWeight: '700', color: '#fff' },

  // Features
  features: { gap: isSmallDevice ? 10 : 16, marginBottom: isSmallDevice ? 24 : 40 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallDevice ? 12 : 16,
    padding: isSmallDevice ? 10 : 16,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderColor: '#334155'
  },
  featureIconBox: {
    width: isSmallDevice ? 40 : 52,
    height: isSmallDevice ? 40 : 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  featureText: { fontSize: isSmallDevice ? 15 : 17, fontWeight: '700', color: '#fff', marginBottom: 2 },
  featureSub: { fontSize: isSmallDevice ? 12 : 13, fontWeight: '500', color: '#94A3B8' },

  // Plans
  plans: { gap: isSmallDevice ? 12 : 16 },
  planCard: {
    flexDirection: 'row', 
    alignItems: 'center',
    padding: isSmallDevice ? 14 : 20,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    justifyContent: 'space-between'
  },
  planInfo: { gap: 4 },
  planTitle: { fontSize: isSmallDevice ? 15 : 18, fontWeight: '800', color: '#fff' },
  planPrice: { fontSize: isSmallDevice ? 22 : 28, fontWeight: '900', color: '#fff', lineHeight: isSmallDevice ? 26 : 32 },
  planPeriod: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },

  badge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10
  },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#000' },

  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12
  },

  // Contact
  contactSection: { marginTop: isSmallDevice ? 24 : 40, alignItems: 'center', paddingBottom: 20 },
  contactTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: isSmallDevice ? 8 : 16 },
  contactSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: isSmallDevice ? 16 : 20 },
  contactButtons: { flexDirection: 'row', gap: 12 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14, 
    gap: 8,
    minWidth: 120,
    justifyContent: 'center'
  },
  contactBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: isSmallDevice ? 24 : 40,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0F172A'
  },
  buyButton: {
    height: isSmallDevice ? 56 : 64,
    borderRadius: 32,
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: '#FFD700'
  },
  buyButtonText: {
    color: '#000',
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  billingNotice: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  billingText: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },

  restoreBtn: { marginTop: 16, alignItems: 'center' },
  restoreText: { fontSize: 13, fontWeight: '600', color: '#64748B' },

  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    opacity: 0.5,
    gap: 16
  },
  legalText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
});
