import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { radius, spacing, typography } from '@/constants/design';

import { COMMUNITY_BENEFITS, WHATSAPP_DARK_GREEN, WHATSAPP_GREEN } from '../constants';

/**
 * WhatsApp-branded pitch for the official owners' group: header plus the
 * benefit list, rendered as one compact gradient card.
 */
export function CommunityPitchCard() {
  return (
    <LinearGradient
      colors={[WHATSAPP_GREEN, WHATSAPP_DARK_GREEN]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="logo-whatsapp" size={28} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Join the Owners&apos; Community</Text>
          <Text style={styles.subtitle}>
            Official WhatsApp group — direct support from our team.
          </Text>
        </View>
      </View>

      {COMMUNITY_BENEFITS.map((benefit) => (
        <View key={benefit.title} style={styles.benefitRow}>
          <Ionicons name={benefit.icon} size={18} color="#fff" />
          <Text style={styles.benefitText}>
            <Text style={styles.benefitTitle}>{benefit.title}</Text>
            {' — '}
            {benefit.description}
          </Text>
        </View>
      ))}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: WHATSAPP_GREEN,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.size.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  benefitText: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.size.sm,
    fontWeight: '500',
    lineHeight: 19,
  },
  benefitTitle: {
    color: '#fff',
    fontWeight: '800',
  },
});
