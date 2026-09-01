import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable,
  Switch, ActivityIndicator, Linking
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius } from '@/constants/design';
import { showToast } from '@/lib/toast';
import {
  useAutomationSettings,
  useUpdateAutomationSettings,
  useSendBulkReminders,
  ReminderDaysBefore,
} from '@/hooks/use-whatsapp';

export default function WhatsappSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { data: settings, isLoading } = useAutomationSettings();
  const updateSettings = useUpdateAutomationSettings();
  const sendBulkReminders = useSendBulkReminders();

  // Local state mirrors server state — optimistic UI
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(false);
  const [welcomeMessageEnabled, setWelcomeMessageEnabled] = useState(false);
  const [paymentReceiptEnabled, setPaymentReceiptEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState<ReminderDaysBefore>({
    threeDays: true,
    sameDay: true,
    overdue: true,
  });

  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Sync from server
  useEffect(() => {
    if (settings) {
      setWhatsappEnabled(settings.whatsappEnabled);
      setAutoReminderEnabled(settings.autoReminderEnabled);
      setWelcomeMessageEnabled(settings.welcomeMessageEnabled ?? false);
      setPaymentReceiptEnabled(settings.paymentReceiptEnabled ?? false);
      if (settings.reminderDaysBefore) {
        setReminderDays(settings.reminderDaysBefore);
      }
    }
  }, [settings]);

  const hasCredits = (settings?.whatsappCredits || 0) > 0;

  const handleToggle = async (
    key: 'whatsappEnabled' | 'autoReminderEnabled' | 'welcomeMessageEnabled' | 'paymentReceiptEnabled',
    value: boolean
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    if (key === 'whatsappEnabled') setWhatsappEnabled(value);
    if (key === 'autoReminderEnabled') setAutoReminderEnabled(value);
    if (key === 'welcomeMessageEnabled') setWelcomeMessageEnabled(value);
    if (key === 'paymentReceiptEnabled') setPaymentReceiptEnabled(value);

    try {
      await updateSettings.mutateAsync({ [key]: value });
      showToast(value ? 'Enabled' : 'Disabled', 'success');
    } catch {
      // Rollback on error
      if (key === 'whatsappEnabled') setWhatsappEnabled(!value);
      if (key === 'autoReminderEnabled') setAutoReminderEnabled(!value);
      if (key === 'welcomeMessageEnabled') setWelcomeMessageEnabled(!value);
      if (key === 'paymentReceiptEnabled') setPaymentReceiptEnabled(!value);
      showToast('Failed to update settings', 'error');
    }
  };

  const handleReminderDayToggle = async (
    key: keyof ReminderDaysBefore,
    value: boolean
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...reminderDays, [key]: value };
    setReminderDays(updated);

    try {
      await updateSettings.mutateAsync({ reminderDaysBefore: updated });
    } catch {
      setReminderDays(reminderDays);
      showToast('Failed to update', 'error');
    }
  };

  const handleSendBulkNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBulkConfirm(true);
  };

  if (isLoading) {
    return (
      <SafeScreen edges={['top']}>
        <Stack.Screen options={{ title: 'WhatsApp Automation', headerTransparent: true, headerTintColor: theme.text }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ title: 'WhatsApp Automation', headerTransparent: true, headerTintColor: theme.text }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>WhatsApp Automation</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Control how and when fee reminders are sent to your students.
          </Text>
        </View>

        {/* Credits Card */}
        <Animated.View entering={FadeInDown.delay(50)}>
          <View style={[styles.creditsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.creditsRow}>
              <View style={[styles.iconBox, { backgroundColor: '#25D366' + '15' }]}>
                <Ionicons name="wallet-outline" size={22} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>WhatsApp Credits</Text>
                <Text style={[styles.rowDesc, { color: theme.muted }]}>
                  {settings?.whatsappMessagesSent || 0} messages sent lifetime
                </Text>
              </View>
              <View style={[
                styles.creditsBadge,
                {
                  backgroundColor: (settings?.whatsappCredits || 0) > 0
                    ? theme.success + '20'
                    : theme.danger + '20'
                }
              ]}>
                <Text style={[styles.creditsCount, {
                  color: (settings?.whatsappCredits || 0) > 0 ? theme.success : theme.danger
                }]}>
                  {settings?.whatsappCredits || 0}
                </Text>
                <Text style={[styles.creditsLabel, { color: theme.muted }]}>credits</Text>
              </View>
            </View>

            {/* Buy Credits CTA */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const msg = encodeURIComponent(
                  `Hi, I\'m using TrackMyLibrary and I want to buy WhatsApp credits for my account. Please help me.`
                );
                Linking.openURL(`https://wa.me/917348335273?text=${msg}`);
              }}
              style={({ pressed }) => [
                styles.buyCreditsBtn,
                { backgroundColor: '#25D366' + '15', borderColor: '#25D366' + '40' },
                pressed && { opacity: 0.75 }
              ]}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={[styles.buyCreditsBtnText, { color: '#25D366' }]}>
                Contact us for WhatsApp Credits
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#25D366" />
            </Pressable>

            {(settings?.whatsappCredits || 0) === 0 && (
              <View style={[styles.noCreditsWarning, { backgroundColor: theme.danger + '10', borderColor: theme.danger + '30' }]}>
                <Ionicons name="warning-outline" size={16} color={theme.danger} />
                <Text style={[styles.noCreditsText, { color: theme.danger }]}>
                  No credits remaining. Tap above to purchase more.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Main Toggles */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>CONTROLS</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>

            {/* WhatsApp Enabled */}
            <ToggleRow
              icon="logo-whatsapp"
              iconColor="#25D366"
              label="WhatsApp Notifications"
              description="Enable sending messages via WhatsApp API"
              value={whatsappEnabled}
              onValueChange={(v) => {
                if (!hasCredits && v) {
                  showToast('Purchase credits to enable WhatsApp', 'error');
                  return;
                }
                handleToggle('whatsappEnabled', v);
              }}
              disabled={!hasCredits}
              theme={theme}
            />
            {!hasCredits && (
              <View style={[styles.creditsHint, { backgroundColor: theme.warning + '12', borderColor: theme.warning + '30' }]}>
                <Ionicons name="lock-closed-outline" size={14} color={theme.warning} />
                <Text style={[styles.creditsHintText, { color: theme.warning }]}>
                  Buy credits to unlock WhatsApp features
                </Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />

            {/* Auto Reminder */}
            <ToggleRow
              icon="time-outline"
              iconColor={theme.primary}
              label="Auto Fee Reminders"
              description="Automatically send reminders via Cloud Scheduler daily"
              value={autoReminderEnabled}
              onValueChange={(v) => handleToggle('autoReminderEnabled', v)}
              disabled={!whatsappEnabled}
              theme={theme}
            />
          </View>
        </Animated.View>

        {/* Event Driven */}
        <Animated.View entering={FadeInDown.delay(120)}>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>INSTANT NOTIFICATIONS</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ToggleRow
              icon="person-add-outline"
              iconColor={theme.success}
              label="Automatic Welcome Message"
              description="Send instant welcome note to newly added students"
              value={welcomeMessageEnabled}
              onValueChange={(v) => handleToggle('welcomeMessageEnabled', v)}
              disabled={!whatsappEnabled}
              theme={theme}
            />

            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />

            <ToggleRow
              icon="receipt-outline"
              iconColor={theme.info}
              label="Automatic Payment Receipt"
              description="Send automated confirmation receipt after payment"
              value={paymentReceiptEnabled}
              onValueChange={(v) => handleToggle('paymentReceiptEnabled', v)}
              disabled={!whatsappEnabled}
              theme={theme}
            />
          </View>
        </Animated.View>

        {/* Reminder Timing */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>REMINDER TIMING</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardHelperText, { color: theme.muted }]}>
              Choose when students receive reminders relative to their fee expiry date.
            </Text>

            <ToggleRow
              icon="calendar-outline"
              iconColor="#8B5CF6"
              label="3 Days Before Expiry"
              description="Proactive reminder before fee expires"
              value={reminderDays.threeDays}
              onValueChange={(v) => handleReminderDayToggle('threeDays', v)}
              disabled={!autoReminderEnabled}
              theme={theme}
            />

            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />

            <ToggleRow
              icon="today-outline"
              iconColor={theme.warning}
              label="On Expiry Day"
              description="Reminder sent on the exact day fee expires"
              value={reminderDays.sameDay}
              onValueChange={(v) => handleReminderDayToggle('sameDay', v)}
              disabled={!autoReminderEnabled}
              theme={theme}
            />

            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />

            <ToggleRow
              icon="alert-circle-outline"
              iconColor={theme.danger}
              label="After Expiry (Overdue)"
              description="Students whose fee has already passed"
              value={reminderDays.overdue}
              onValueChange={(v) => handleReminderDayToggle('overdue', v)}
              disabled={!autoReminderEnabled}
              theme={theme}
            />
          </View>
        </Animated.View>

        {/* Manual Bulk Send */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>MANUAL TRIGGER</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.bulkSendRow}>
              <View style={[styles.iconBox, { backgroundColor: '#25D366' + '15' }]}>
                <Ionicons name="send-outline" size={22} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Send Reminders Now</Text>
                <Text style={[styles.rowDesc, { color: theme.muted }]}>
                  Instantly send to all students with due fees
                </Text>
              </View>
            </View>
            <AppButton
              variant="outline"
              onPress={handleSendBulkNow}
              loading={sendBulkReminders.isPending}
              disabled={!whatsappEnabled || sendBulkReminders.isPending}
              style={{ marginTop: spacing.sm }}
            >
              {sendBulkReminders.isPending ? 'Sending...' : 'Send to All Due Students'}
            </AppButton>
            <AppButton
              variant="outline"
              icon="people-outline"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/whatsapp-student-select');
              }}
              disabled={!whatsappEnabled}
              style={{ marginTop: spacing.sm }}
            >
              Choose Specific Students
            </AppButton>
          </View>
        </Animated.View>

        {/* Templates Link */}
        <Animated.View entering={FadeInDown.delay(250)}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/whatsapp-templates');
            }}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
            ]}
          >
            <View style={styles.templateRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="document-text-outline" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Customize Templates</Text>
                <Text style={[styles.rowDesc, { color: theme.muted }]}>
                  Edit welcome, payment & reminder messages
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.muted} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Help */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.helpRow}>
              <Ionicons name="information-circle-outline" size={20} color={theme.muted} />
              <Text style={[styles.helpText, { color: theme.muted }]}>
                Auto reminders run daily at 9 AM via Google Cloud Scheduler. Manual sends happen immediately via the button above.
              </Text>
            </View>
            <AppButton
              variant="outline"
              onPress={() => Linking.openURL('https://wa.me/918434720932')}
              style={{ marginTop: spacing.sm }}
            >
              Contact Support
            </AppButton>
          </View>
        </Animated.View>

      </ScrollView>

      <ConfirmDialog
        visible={showBulkConfirm}
        title="Send Reminders Now?"
        description="This will send WhatsApp fee reminders to all students with due or overdue fees. This cannot be undone."
        confirmText="Send Now"
        cancelText="Cancel"
        onCancel={() => setShowBulkConfirm(false)}
        onConfirm={async () => {
          setShowBulkConfirm(false);
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const result = await sendBulkReminders.mutateAsync('all');
            showToast(`Sending to ${result.queued} students...`, 'success');
          } catch {
            showToast('Failed to send reminders', 'error');
          }
        }}
        loading={sendBulkReminders.isPending}
      />

    </SafeScreen>
  );
}

type ToggleRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  theme: any;
};

function ToggleRow({ icon, iconColor, label, description, value, onValueChange, disabled, theme }: ToggleRowProps) {
  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.45 }]}>
      <View style={[styles.iconBox, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.rowDesc, { color: theme.muted }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary + '80' }}
        thumbColor={value ? theme.primary : theme.muted}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 100,
    gap: spacing.md,
    paddingBottom: 60,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 22,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHelperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleContent: {
    flex: 1,
    gap: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    height: 1,
  },
  bulkSendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  helpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  creditsCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  creditsBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  creditsCount: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  creditsLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noCreditsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  noCreditsText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  buyCreditsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  buyCreditsBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  creditsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  creditsHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
