import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing, themeFor, typography } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useChangePassword, useUpdateProfile } from '@/hooks/use-profile';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber ?? '');
  const [businessName, setBusinessName] = useState(
    typeof user?.company === 'object' ? (user.company as any)?.businessName ?? '' : ''
  );
  const [businessAddress, setBusinessAddress] = useState(
    typeof user?.company === 'object' ? (user.company as any)?.businessAddress ?? '' : ''
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const onSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ name, email, contactNumber, businessName, businessAddress });
      Alert.alert('Success', 'Profile updated');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const onChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Provide current and new password');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      Alert.alert('Success', 'Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SectionHeader>Profile</SectionHeader>
        <AppCard style={styles.card} padded>
          <Text style={[styles.label, { color: theme.text }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            autoCapitalize="none"
          />
          <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
          <TextInput
            value={contactNumber}
            onChangeText={setContactNumber}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <Text style={[styles.label, { color: theme.text }]}>Business Name</Text>
          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <Text style={[styles.label, { color: theme.text }]}>Business Address</Text>
          <TextInput
            value={businessAddress}
            onChangeText={setBusinessAddress}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <AppButton onPress={onSaveProfile} loading={updateProfile.isPending}>
            Save Profile
          </AppButton>
        </AppCard>

        <SectionHeader>Change Password</SectionHeader>
        <AppCard style={styles.card} padded>
          <Text style={[styles.label, { color: theme.text }]}>Current Password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <AppButton onPress={onChangePassword} loading={changePassword.isPending}>
            Change Password
          </AppButton>
        </AppCard>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  meta: {
    fontSize: typography.size.md,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
});
