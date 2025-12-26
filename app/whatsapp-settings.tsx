import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';
import {
  useWhatsappStatus,
  usePairingCode,
  useSendTestMessage,
  useDisconnect,
  useWhatsappTemplates,
  useUpdateTemplates
} from '@/hooks/use-whatsapp';
import { showToast } from '@/lib/toast';

export default function WhatsappSettingsScreen() {
  const theme = useTheme();
  const { data: status, isLoading: isStatusLoading } = useWhatsappStatus();
  const pairingCodeMutation = usePairingCode();
  const sendTestMutation = useSendTestMessage();
  const disconnectMutation = useDisconnect();
  const { data: templates, isLoading: isTemplatesLoading } = useWhatsappTemplates();
  const updateTemplatesMutation = useUpdateTemplates();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [localTemplates, setLocalTemplates] = useState<any>(null);

  // Sync server templates to local state when loaded
  React.useEffect(() => {
    if (templates && !localTemplates) {
      setLocalTemplates(templates);
    }
  }, [templates]);

  const handleUpdateTemplate = (key: string, value: string) => {
    setLocalTemplates((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveTemplates = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateTemplatesMutation.mutateAsync(localTemplates);
      showToast('Templates updated', 'success');
    } catch (error) {
      showToast('Failed to update templates', 'error');
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

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://');
  };

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ title: 'WhatsApp Settings', headerTransparent: true }} />
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
            <View style={[styles.statusIndicator, { backgroundColor: status?.status === 'CONNECTED' ? theme.success : theme.danger }]} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {status?.status === 'CONNECTED' ? 'Connected' : 
               status?.status === 'WAITING_FOR_SCAN' ? 'Waiting for Link' : 'Disconnected'}
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
              {status?.qr && !pairingCodeMutation.data && (
                <View style={styles.qrContainer}>
                  <Text style={[styles.qrTitle, { color: theme.text }]}>Scan QR Code</Text>
                  <View style={styles.qrWrapper}>
                    <QRCode value={status.qr} size={200} />
                  </View>
                  <Text style={[styles.qrHint, { color: theme.muted }]}>
                    Scan this code with WhatsApp {'>'} Linked Devices
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
                    Open WhatsApp {'>'} Linked Devices {'>'} Link with phone number instead
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

        {/* Templates Section */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Manage Templates</Text>
            <AppBadge tone="info">Dynamic Tags</AppBadge>
          </View>
          <Text style={[styles.cardDesc, { color: theme.muted }]}>
            Tags: {'{student_name}'}, {'{business_name}'}, {'{start_date}'}, {'{end_date}'}, {'{amount}'}.
          </Text>

          {isTemplatesLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <View style={{ gap: spacing.lg }}>
              <TemplateInput
                label="Welcome Message"
                value={localTemplates?.welcome}
                onChange={(v: string) => handleUpdateTemplate('welcome', v)}
                theme={theme}
              />
              <TemplateInput
                label="Payment Confirmation"
                value={localTemplates?.payment}
                onChange={(v: string) => handleUpdateTemplate('payment', v)}
                theme={theme}
              />
              <TemplateInput
                label="Fee Reminder"
                value={localTemplates?.reminder}
                onChange={(v: string) => handleUpdateTemplate('reminder', v)}
                theme={theme}
              />
              <TemplateInput
                label="Inactive Alert"
                value={localTemplates?.inactive}
                onChange={(v: string) => handleUpdateTemplate('inactive', v)}
                theme={theme}
              />

              <AppButton
                onPress={handleSaveTemplates}
                loading={updateTemplatesMutation.isPending}
                style={{ marginTop: spacing.sm }}
              >
                Save All Templates
              </AppButton>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

function TemplateInput({ label, value, onChange, theme }: any) {
  return (
    <View style={styles.templateGroup}>
      <Text style={[styles.templateLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
        value={value}
        onChangeText={onChange}
        multiline
        placeholder={`Enter ${label} template...`}
        placeholderTextColor={theme.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 80,
    gap: spacing.lg,
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
    borderWidth: 1,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateGroup: {
    gap: 8,
  },
  templateLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
});
