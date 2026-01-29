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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { logErrorToDiscord } from '@/lib/discord';

const { width, height } = Dimensions.get('window');
const ILLUSTRATION = require('../../assets/images/subscription_premium_illustration.jpg');

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

  useEffect(() => {
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

  const handlePurchase = async () => {
    if (!selectedPackage || isPurchasing) return;

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (customerInfo.entitlements.active['Library Manager TrackMyLibrary Pro']) {
        onPurchaseSuccess();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        logErrorToDiscord(e, `Purchase Failed: ${selectedPackage.product.identifier}`);
        Alert.alert('Error', 'Failed to process purchase. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

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
        <View style={styles.header}>
          <Image source={ILLUSTRATION} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', theme.background]}
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
          <View style={styles.headerText}>
            <Text style={styles.preTitle}>PREMIUM ACCESS</Text>
            <Text style={styles.mainTitle}>TrackMyLibrary <Text style={{ color: theme.primary }}>PRO</Text></Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.features}>
            {[
              { icon: 'infinite', text: 'Unlimited Students & Seats' },
              { icon: 'cloud-done', text: 'Cloud Backup & Auto-Sync' },
              { icon: 'analytics', text: 'Financial Reports & Insights' },
              { icon: 'notifications', text: 'Due Date Reminders' },
            ].map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <Ionicons name={f.icon as any} size={22} color={theme.primary} />
                <Text style={[styles.featureText, { color: theme.text }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plans}>
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const isYearly = pkg.packageType === 'ANNUAL';

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPackage(pkg)}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isSelected ? theme.primary + '10' : theme.surfaceAlt,
                      borderColor: isSelected ? theme.primary : theme.border,
                    }
                  ]}
                >
                  <View style={styles.planInfo}>
                    <Text style={[styles.planTitle, { color: theme.text }]}>
                      {isYearly ? 'Library Manager Pro Yearly' : 'Library Manager Pro Monthly'}
                    </Text>
                    <Text style={[styles.planPrice, { color: theme.text }]}>
                      {pkg.product.priceString}
                    </Text>
                    <Text style={[styles.planPeriod, { color: theme.muted }]}>
                      per {isYearly ? 'year' : 'month'}
                    </Text>
                    {/* Calculated monthly price removed per user request */}
                  </View>
                  {isYearly && (
                    <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.badgeText}>BEST VALUE</Text>
                    </View>
                  )}
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? theme.primary : theme.muted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.contactSection}>
            <Text style={[styles.contactTitle, { color: theme.text }]}>Need Help?</Text>
            <Text style={[styles.contactSubtitle, { color: theme.muted }]}>
              Contact us for bulk pricing, support or custom features.
            </Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`https://wa.me/916391417248?text=${encodeURIComponent('Hello TrackMyLibrary Support, I need help with my account/subscription.')}`)}
                style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:md.alishanali88@gmail.com?subject=${encodeURIComponent('TrackMyLibrary Support Request')}&body=${encodeURIComponent('Hello Team,\n\nI need help with...')}`)}
                style={[styles.contactBtn, { backgroundColor: theme.info || '#4FACFE' }]}
              >
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePurchase}
          disabled={isPurchasing}
          style={[styles.buyButton, { backgroundColor: theme.primary }]}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
              <Text style={styles.buyButtonText}>Unlock Pro Access</Text>
          )}
        </TouchableOpacity>
        <View style={styles.billingNotice}>
          <Text style={[styles.billingText, { color: theme.muted }]}>
            Recurring billing. Cancel anytime.
          </Text>
        </View>

        <TouchableOpacity onPress={() => Purchases.restorePurchases()} style={styles.restoreBtn}>
          <Text style={[styles.restoreText, { color: theme.muted }]}>Restore Enrollment</Text>
        </TouchableOpacity>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={[styles.legalText, { color: theme.muted }]}>Terms of Use (EULA)</Text>
          </TouchableOpacity>
          <Text style={[styles.legalText, { color: theme.muted }]}>  •  </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://lumbar-hyssop-0ce.notion.site/Privacy-Policy-2d3ce51ccc32800ea087fc6d0422511c?source=copy_link')}>
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
  header: { height: height * 0.35, width: '100%' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  topControls: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  topButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20, gap: 8 },
  topButtonText: { color: '#fff', fontWeight: '700' },
  closeIcon: { opacity: 0.8 },
  headerText: { position: 'absolute', bottom: 20, left: 24 },
  preTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#fff' },
  content: { padding: 24 },
  features: { gap: 16, marginBottom: 32 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 16, fontWeight: '600' },
  plans: { gap: 12 },
  planCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2, justifyContent: 'space-between' },
  planInfo: { gap: 4 },
  planTitle: { fontSize: 16, fontWeight: '700', opacity: 0.9, marginBottom: 2 },
  planPrice: { fontSize: 24, fontWeight: '900' },
  planPeriod: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  billingNotice: { marginTop: 16, alignItems: 'center' },
  billingText: { fontSize: 12, fontWeight: '600', opacity: 0.7 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  footer: { padding: 24, paddingBottom: 40, borderTopWidth: 1 },
  buyButton: { height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  buyButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  restoreBtn: { marginTop: 16, alignItems: 'center' },
  restoreText: { fontSize: 14, fontWeight: '700' },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  legalText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactSection: {
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
