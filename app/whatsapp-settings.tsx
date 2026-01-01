import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius } from '@/constants/design';
import {
  useWhatsappTemplates
} from '@/hooks/use-whatsapp';

export default function WhatsappSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ title: 'WhatsApp Settings', headerTransparent: true, headerTintColor: theme.text }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>WhatsApp Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
              We've switched to manual sending to ensure 100% delivery and better control.
          </Text>
        </View>



          {/* Info Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.iconRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.success + '15' }]}>
                <Ionicons name="shield-checkmark" size={24} color={theme.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Direct Messaging Flow</Text>
                <Text style={[styles.cardDesc, { color: theme.muted }]}>
                  1. Add a Student or Record a Payment.{"\n"}
                  2. WhatsApp opens immediately with your message.{"\n"}
                  3. If needed, click the Share icon to send the PDF invoice.
                </Text>
              </View>
            </View>
        </View>

        {/* Link to Templates */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/whatsapp-templates');
          }}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]}
        >
          <View style={styles.templateLinkRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="document-text-outline" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Customize Templates</Text>
                <Text style={[styles.cardDesc, { color: theme.muted }]}>Edit your welcome, payment, and reminder messages.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.muted} />
          </View>
        </Pressable>

          {/* Help Section */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: spacing.xl }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Why Manual Sending?</Text>
            <Text style={[styles.cardDesc, { color: theme.muted }]}>
              Server-side automation often gets blocked by WhatsApp. Manual sending uses your own WhatsApp app, making it safer and more personal for your members.
            </Text>
            <AppButton 
              variant="outline" 
              onPress={() => Linking.openURL('https://wa.me/918434720932')}
              style={{ marginTop: spacing.sm }}
            >
              Contact Support for Help
            </AppButton>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 100,
    gap: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  queueCard: {
    padding: spacing.xl,
    borderRadius: radius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  queueIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  queueTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  queueDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  templateLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
