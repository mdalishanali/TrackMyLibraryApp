import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Linking, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';
import {
  useWhatsappStatus,
  usePairingCode,
  useSendTestMessage,
  useDisconnect,
  useWhatsappAutomation,
  useUpdateWhatsappAutomation,
  useForceReset
} from '@/hooks/use-whatsapp';
import { showToast } from '@/lib/toast';

export default function WhatsappSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: status, isLoading: isStatusLoading } = useWhatsappStatus();
  const pairingCodeMutation = usePairingCode();
  const sendTestMutation = useSendTestMessage();
  const disconnectMutation = useDisconnect();
  const { data: automation } = useWhatsappAutomation();
  const updateAutomation = useUpdateWhatsappAutomation();
  const forceResetMutation = useForceReset();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testPhone, setTestPhone] = useState('');

  const handleToggleAutomation = async (key: string, value: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newAutomation = { ...automation, [key]: value };
      await updateAutomation.mutateAsync(newAutomation);
      showToast('Setting updated', 'success');
    } catch (error) {
      showToast('Failed to update setting', 'error');
    }
  };

  const handleRequestPairingCode = async () => {
    if (!phoneNumber) {
      showToast('Please enter your phone number', 'error');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await pairingCodeMutation.mutateAsync(phoneNumber);
      showToast('Pairing code requested', 'success');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to request pairing code';
      showToast(message, 'error');
    }
  };

  const handleSendTest = async () => {
    if (!testPhone) {
      showToast('Please enter a test phone number', 'error');
      return;
    }
    try {
      await sendTestMutation.mutateAsync({
        phone: testPhone,
        message: 'Hello! This is a test message from TrackMyLibrary WhatsApp integration. 📚'
      });
      showToast('Test message sent!', 'success');
    } catch (error) {
      showToast('Failed to send test message', 'error');
    }
  };

  const handleDisconnect = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await disconnectMutation.mutateAsync();
      showToast('Disconnected from WhatsApp', 'success');
    } catch (error) {
      showToast('Failed to disconnect', 'error');
    }
  };

  const handleForceReset = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await forceResetMutation.mutateAsync();
      showToast('Service reset successfully', 'success');
    } catch (error) {
      showToast('Failed to reset service', 'error');
    }
  };

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://');
  };

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ title: 'WhatsApp Settings', headerTransparent: true }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>WhatsApp Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Automate messages for admissions, fees, and reminders.
          </Text>
        </View>

        {/* Connection Status Card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statusHeader}>
              <View style={[styles.statusIndicator, {
                backgroundColor: status?.status === 'CONNECTED' ? theme.success :
                  status?.status === 'BUSY' ? theme.warning : theme.danger
              }]} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {status?.status === 'CONNECTED' ? 'Connected' : 
                  status?.status === 'WAITING_FOR_SCAN' ? 'Waiting for Link' :
                    status?.status === 'BUSY' ? 'Server Busy' : 'Disconnected'}
            </Text>
          </View>

          {status?.status === 'CONNECTED' ? (
            <View style={styles.connectedView}>
              <Ionicons name="checkmark-circle" size={48} color={theme.success} />
              <Text style={[styles.infoText, { color: theme.muted }]}>
                Your WhatsApp is successfully linked and ready to send notifications.
              </Text>
              <AppButton 
                variant="outline" 
                onPress={handleDisconnect}
                loading={disconnectMutation.isPending}
                style={{ marginTop: spacing.md }}
                tone="danger"
              >
                Disconnect
              </AppButton>
            </View>
          ) : (
            <View style={styles.disconnectedView}>
                  {status?.status === 'BUSY' && (
                    <View style={styles.busyView}>
                      <View style={[styles.busyIcon, { backgroundColor: theme.warning + '15' }]}>
                        <Ionicons name="time" size={48} color={theme.warning} />
                      </View>
                      <Text style={[styles.qrTitle, { color: theme.text }]}>Server is Busy</Text>
                      <Text style={[styles.infoText, { color: theme.muted }]}>
                        The WhatsApp service is currently being used by another library location for a connection.
                      </Text>
                      <View style={[styles.busyNotice, { backgroundColor: theme.surfaceAlt }]}>
                        <Ionicons name="information-circle" size={20} color={theme.primary} />
                        <Text style={[styles.busyNoticeText, { color: theme.text }]}>
                          Please wait a few minutes. This page will auto-refresh when the slot is free.
                        </Text>
                      </View>
                      <AppButton
                        variant="ghost"
                        tone="danger"
                        onPress={handleForceReset}
                        loading={forceResetMutation.isPending}
                        style={{ marginTop: spacing.sm }}
                      >
                        Force Reset Service
                      </AppButton>
                    </View>
                  )}

                  {status?.status === 'DISCONNECTED' && !pairingCodeMutation.data && !status?.qr && (
                    <View style={styles.idleView}>
                      <View style={[styles.busyIcon, { backgroundColor: theme.primary + '10' }]}>
                        <Ionicons name="link-outline" size={48} color={theme.primary} />
                      </View>
                      <Text style={[styles.qrTitle, { color: theme.text }]}>Start Linking</Text>
                      <Text style={[styles.infoText, { color: theme.muted, textAlign: 'center' }]}>
                        Initialize the WhatsApp service to generate a pairing code or QR code.
                      </Text>
                      <AppButton
                        onPress={() => pairingCodeMutation.mutate('INIT')}
                        loading={pairingCodeMutation.isPending}
                        variant="outline"
                        style={{ marginTop: spacing.sm, width: '100%' }}
                      >
                        Initialize Service
                      </AppButton>
                    </View>
                  )}

                  {status?.status !== 'BUSY' && status?.status !== 'DISCONNECTED' && status?.qr && !pairingCodeMutation.data && (
                <View style={styles.qrContainer}>
                  <Text style={[styles.qrTitle, { color: theme.text }]}>Scan QR Code</Text>
                  <View style={styles.qrWrapper}>
                        <QRCode value={status?.qr || ''} size={200} />
                  </View>
                  <Text style={[styles.qrHint, { color: theme.muted }]}>
                        Scan this code with WhatsApp {' > '} Linked Devices
                  </Text>
                </View>
              )}

              {pairingCodeMutation.data && (
                <View style={styles.pairingCodeView}>
                  <Text style={[styles.qrTitle, { color: theme.text }]}>Pairing Code</Text>
                  <View style={[styles.codeContainer, { backgroundColor: theme.surfaceAlt }]}>
                    <Text style={[styles.codeText, { color: theme.primary }]}>{pairingCodeMutation.data}</Text>
                  </View>
                  <Text style={[styles.qrHint, { color: theme.muted }]}>
                        Open WhatsApp {' > '} Linked Devices {' > '} Link with phone number instead
                  </Text>
                  <AppButton 
                    onPress={openWhatsApp}
                    style={{ marginTop: spacing.md }}
                  >
                    Open WhatsApp
                  </AppButton>
                </View>
              )}

              {!pairingCodeMutation.data && !status?.qr && isStatusLoading && (
                <ActivityIndicator size="large" color={theme.primary} />
              )}
            </View>
          )}
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
              <Text style={[styles.cardTitle, { color: theme.text }]}>Message Templates</Text>
              <Text style={[styles.cardDesc, { color: theme.muted }]}>Customize your welcome, payment, and reminder messages.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.muted} />
          </View>
        </Pressable>

        {/* Automation Toggles */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Automation Settings</Text>
          <Text style={[styles.cardDesc, { color: theme.muted }]}>Choose which messages should be sent automatically.</Text>

          <View style={styles.toggleList}>
            <AutomationToggle
              label="Welcome Message"
              description="Sent when a new student is admitted"
              value={automation?.welcome}
              onValueChange={(val: boolean) => handleToggleAutomation('welcome', val)}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />
            <AutomationToggle
              label="Payment Confirmation"
              description="Sent after a payment is recorded"
              value={automation?.payment}
              onValueChange={(val: boolean) => handleToggleAutomation('payment', val)}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />
            <AutomationToggle
              label="Inactive Alert"
              description="Sent when a student is marked inactive"
              value={automation?.inactive}
              onValueChange={(val: boolean) => handleToggleAutomation('inactive', val)}
              theme={theme}
            />
          </View>
        </View>

        {/* Pairing Code Section */}
        {status?.status !== 'CONNECTED' && !pairingCodeMutation.data && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Link with Phone Number</Text>
            <Text style={[styles.cardDesc, { color: theme.muted }]}>
              If you are on the same device, use a pairing code instead of scanning.
            </Text>
            
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Enter phone number (e.g. 91XXXXXXXXXX)"
              placeholderTextColor={theme.muted}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            
            <AppButton 
              loading={pairingCodeMutation.isPending}
              onPress={handleRequestPairingCode}
            >
              Get Pairing Code
            </AppButton>
          </View>
        )}

        {/* Test Section */}
        {status?.status === 'CONNECTED' && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Test Notification</Text>
            <Text style={[styles.cardDesc, { color: theme.muted }]}>
              Send a test message to verify the connection.
            </Text>
            
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Test phone number"
              placeholderTextColor={theme.muted}
              value={testPhone}
              onChangeText={setTestPhone}
              keyboardType="phone-pad"
            />
            
            <AppButton 
              loading={sendTestMutation.isPending}
              onPress={handleSendTest}
              variant="outline"
            >
              Send Test Message
            </AppButton>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

function AutomationToggle({ label, description, value, onValueChange, theme }: any) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: theme.muted }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.primary + '80' }}
        thumbColor={value ? theme.primary : '#f4f3f4'}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 80,
    gap: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  connectedView: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  disconnectedView: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  qrContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
  },
  qrHint: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 200,
  },
  pairingCodeView: {
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  codeContainer: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    width: '100%',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  templateLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 18,
  },
  toggleList: {
    marginTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  toggleText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  busyView: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
    width: '100%',
  },
  busyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  busyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  busyNoticeText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  idleView: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    width: '100%',
  },
});
