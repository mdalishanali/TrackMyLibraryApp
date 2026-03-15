import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/constants/design';
import { showToast } from '@/lib/toast';
import { useSwitchLibrary, useAddLibrary } from '@/hooks/use-libraries';

export default function LibrarySwitcherScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  
  const switchLibrary = useSwitchLibrary();
  const addLibrary = useAddLibrary();

  const [isAdding, setIsAdding] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const accessibleCompanies = user?.accessibleCompanies?.length ? user.accessibleCompanies : (user?.company ? [user.company] : []);
  const activeCompanyId = user?.company?._id;

  const handleSwitch = async (companyId: string) => {
    if (companyId === activeCompanyId) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await switchLibrary.mutateAsync(companyId);
      showToast('Switched branch successfully', 'success');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to switch branch');
    }
  };

  const handleCreate = async () => {
    if (!businessName.trim() || !businessAddress.trim() || !contactNumber.trim()) {
      return Alert.alert('Missing Info', 'Please provide library name, address, and contact number.');
    }

    if (contactNumber.trim().length < 10) {
      return Alert.alert('Invalid Number', 'Contact number must be at least 10 digits.');
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addLibrary.mutateAsync({
        businessName,
        businessAddress,
        contactNumber: contactNumber.trim(),
      });
      showToast('New branch created', 'success');
      setIsAdding(false);
      setBusinessName('');
      setBusinessAddress('');
      setContactNumber('');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create branch');
    }
  };

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Your Branches</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>AVAILABLE LIBRARIES</Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {accessibleCompanies.map((company: any, index: number) => {
            const isActive = company._id === activeCompanyId;

            return (
              <View key={company._id || `company-${index}`}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />}
                <Pressable
                  onPress={() => handleSwitch(company._id)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { backgroundColor: theme.surfaceAlt }
                  ]}
                >
                  <View style={[styles.rowIconBox, { backgroundColor: isActive ? theme.primary + '15' : theme.muted + '15' }]}>
                    <Ionicons name={isActive ? "checkmark-circle" : "business"} size={22} color={isActive ? theme.primary : theme.muted} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowLabel, { color: isActive ? theme.primary : theme.text }]}>
                      {company.businessName}
                    </Text>
                    <Text style={[styles.rowDesc, { color: theme.muted }]}>
                      {isActive ? 'Currently Active' : 'Tap to switch'}
                    </Text>
                  </View>
                  {switchLibrary.isPending && switchLibrary.variables === company._id ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.muted + '40'}
                    />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>

        {!isAdding ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsAdding(true);
            }}
            style={[styles.addBtn, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}
          >
            <Ionicons name="add" size={20} color={theme.primary} />
            <Text style={[styles.addBtnText, { color: theme.primary }]}>Add Another Branch</Text>
          </Pressable>
        ) : (
          <Animated.View entering={FadeInDown} style={[styles.addForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>New Branch Details</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Library Name</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Scholar Library - Phase 2"
                placeholderTextColor={theme.muted + '80'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Address</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="e.g. 1st Floor, Main Road..."
                placeholderTextColor={theme.muted + '80'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Contact Number</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                placeholder="e.g. 9876543210"
                placeholderTextColor={theme.muted + '80'}
              />
            </View>

            <View style={styles.formActions}>
              <Pressable
                onPress={() => setIsAdding(false)}
                style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt }]}
              >
                <Text style={[styles.actionBtnText, { color: theme.muted }]}>Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleCreate}
                disabled={addLibrary.isPending}
                style={[styles.actionBtn, { backgroundColor: theme.primary, flex: 2 }]}
              >
                {addLibrary.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>Create Branch</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}

      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  rowIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  addForm: {
    padding: spacing.xl,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: spacing.lg,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
