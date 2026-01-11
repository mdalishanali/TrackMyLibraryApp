import { useState, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { spacing, radius, typography } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateProfile } from '@/hooks/use-profile';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { showToast } from '@/lib/toast';
import { useOTAUpdates } from '@/hooks/use-updates';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const router = useRouter();
  const { checkManual } = useOTAUpdates({ autoCheck: false });

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateProfile.mutateAsync({ name, email, contactNumber, businessName, businessAddress });
      showToast('Profile updated', 'success');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast((error as Error).message || 'Unable to update profile', 'error');
    }
  };

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
              <View style={styles.headerTop}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                  }}
                  style={({ pressed }) => [
                    styles.backBtn,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
                  ]}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
                <View style={{ width: 44 }} />
              </View>

              {/* Premium Hero Card */}
              <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <LinearGradient
                  colors={[theme.primary + '15', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroContent}>
                  <View style={[styles.avatarBox, { backgroundColor: theme.primary + '20', borderColor: theme.border }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {(name || user?.name || 'A').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.heroMeta}>
                    <Text style={[styles.heroName, { color: theme.text }]} numberOfLines={1}>
                      {name || 'Add Name'}
                    </Text>
                    <Text style={[styles.heroEmail, { color: theme.muted }]} numberOfLines={1}>
                      {email || user?.email || 'No email provided'}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: theme.surfaceAlt }]}>
                      <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
                      <Text style={[styles.badgeText, { color: theme.primary }]}>Account Owner</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            <View style={styles.form}>
              <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Info</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.inputGroup}>
                <Field label="Full Name" value={name} onChangeText={setName} theme={theme} placeholder="Enter your name" icon="person-outline" />
                <Field
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  theme={theme}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@company.com"
                  icon="mail-outline"
                />
                <Field
                  label="Phone Number"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  theme={theme}
                  keyboardType="phone-pad"
                  placeholder="Contact number"
                  icon="call-outline"
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Business Details</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.inputGroup}>
                <Field
                  label="Library Name"
                  value={businessName}
                  onChangeText={setBusinessName}
                  theme={theme}
                  placeholder="Library / Institution name"
                  icon="business-outline"
                />
                <Field
                  label="Full Address"
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                  theme={theme}
                  placeholder="Street, City, State"
                  icon="location-outline"
                  multiline
                />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(600).duration(600)}
                style={{ marginTop: spacing.xl, marginBottom: 40 }}
              >
                <AppButton
                  onPress={onSaveProfile}
                  loading={updateProfile.isPending}
                  fullWidth
                >
                  Save Profile Changes
                </AppButton>
              </Animated.View>
            </View>

            <View style={styles.form}>
              <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800).duration(600)}>
                <AppButton
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    checkManual();
                  }}
                  variant="outline"
                >
                  Check for Updates
                </AppButton>
                <Text style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: theme.muted }}>
                  Version 1.0.7
                </Text>
              </Animated.View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
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
  icon?: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
};

const Field = ({ label, value, onChangeText, theme, keyboardType = 'default', autoCapitalize, placeholder, icon, multiline }: FieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: 8, marginBottom: 4 }}>
      <Text style={[styles.label, { color: theme.muted }]}>{label.toUpperCase()}</Text>
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: theme.surface,
          borderColor: isFocused ? theme.primary : theme.border,
        }
      ]}>
        {icon && <Ionicons name={icon} size={20} color={isFocused ? theme.primary : theme.muted} style={{ marginLeft: 12 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={placeholder}
          placeholderTextColor={theme.muted + '80'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          style={[
            styles.input,
            { color: theme.text, height: multiline ? 80 : 50 }
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroCard: {
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  form: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  sectionHeader: {
    marginBottom: -8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  inputGroup: {
    gap: spacing.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.5,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
  },
});
