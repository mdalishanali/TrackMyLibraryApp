import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { gradientFor, spacing, typography } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateProfile } from '@/hooks/use-profile';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { showToast } from '@/lib/toast';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber ?? '');
  const [businessName, setBusinessName] = useState(
    typeof user?.company === 'object' ? (user.company as any)?.businessName ?? '' : ''
  );
  const [businessAddress, setBusinessAddress] = useState(
    typeof user?.company === 'object' ? (user.company as any)?.businessAddress ?? '' : ''
  );

  const onSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ name, email, contactNumber, businessName, businessAddress });
      showToast('Profile updated', 'success');
    } catch (error) {
      showToast((error as Error).message || 'Unable to update profile', 'error');
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={gradientFor(colorScheme, 'panel')}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderColor: theme.border }]}
          >
            <View style={styles.heroTop}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="chevron-back" size={18} color={theme.text} />
              </Pressable>
              <Text style={[styles.heroTitle, { color: theme.text }]}>Profile</Text>
              <View style={[styles.iconButton, { opacity: 0 }]} />
            </View>

            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                <Text style={[styles.avatarText, { color: theme.text }]}>
                  {(name || user?.name || 'A').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {name || 'Your Name'}
                </Text>
                <Text style={[styles.subText, { color: theme.muted }]} numberOfLines={1}>
                  {email || user?.email || 'Add an email to receive receipts'}
                </Text>
                <View style={[styles.badge, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={theme.text} />
                  <Text style={{ color: theme.text, fontWeight: '700' }}>Account Owner</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <AppCard style={[styles.card, { borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Info</Text>
            <Field label="Name" value={name} onChangeText={setName} theme={theme} placeholder="Enter your name" />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              theme={theme}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@company.com"
            />
            <Field
              label="Phone"
              value={contactNumber}
              onChangeText={setContactNumber}
              theme={theme}
              keyboardType="phone-pad"
              placeholder="Contact number"
            />

            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: spacing.md }]}>Business</Text>
            <Field
              label="Business Name"
              value={businessName}
              onChangeText={setBusinessName}
              theme={theme}
              placeholder="Library / Institution name"
            />
            <Field
              label="Business Address"
              value={businessAddress}
              onChangeText={setBusinessAddress}
              theme={theme}
              placeholder="Street, City"
            />

            <AppButton onPress={onSaveProfile} loading={updateProfile.isPending} style={{ marginTop: spacing.lg }}>
              Save Profile
            </AppButton>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  theme: ReturnType<typeof useTheme>;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  placeholder?: string;
};

const Field = ({ label, value, onChangeText, theme, keyboardType = 'default', autoCapitalize, placeholder }: FieldProps) => (
  <View style={{ gap: spacing.xs }}>
    <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      placeholder={placeholder}
      placeholderTextColor={theme.muted}
      style={[
        styles.input,
        {
          borderColor: theme.border,
          color: theme.text,
          backgroundColor: theme.surface,
        },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    borderWidth: 1,
    borderRadius: spacing.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: '800',
  },
  subText: {
    fontSize: typography.size.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  card: {
    gap: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  meta: {
    fontSize: typography.size.md,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: '800',
  },
});
