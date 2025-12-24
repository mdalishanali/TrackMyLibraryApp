import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, radius } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage, useSignupMutation } from '@/hooks/use-auth-mutations';
import { useTheme } from '@/hooks/use-theme';
import { SignupFormValues, signupSchema } from '@/schemas/auth';

const { width } = Dimensions.get('window');

export default function Signup() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Setup form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      businessName: '',
      businessAddress: '',
      name: '',
      email: '',
      password: '',
      contactNumber: '',
    },
  });

  const signupMutation = useSignupMutation();

  // Animation values
  const logoScale = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(300, withSpring(1, { damping: 12 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }]
  }));

  const onSubmit = async (values: SignupFormValues) => {
    try {
      await signupMutation.mutateAsync({ ...values, platform: Platform.OS });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Signup failed', getErrorMessage(error));
    }
  };

  const renderInputField = (
    name: keyof SignupFormValues,
    label: string,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    options?: any
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: errors[name] ? '#ef4444' : focusedField === name ? theme.primary : 'transparent',
              borderWidth: 1.5
            }
          ]}>
            <Ionicons name={icon as any} size={20} color={focusedField === name ? theme.primary : theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder={placeholder}
              placeholderTextColor={theme.muted}
              onFocus={() => setFocusedField(name)}
              onBlur={() => {
                setFocusedField(null);
                onBlur();
              }}
              onChangeText={onChange}
              value={value}
              {...options}
            />
            {name === 'password' && (
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.muted}
                />
              </Pressable>
            )}
          </View>
        )}
      />
      {errors[name] && (
        <Text style={styles.errorText}>{errors[name]?.message}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.primary, theme.primary, theme.background]}
        locations={[0, 0.3, 0.8]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: '30%' }]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Animated.View style={[styles.logoBadge, logoAnimatedStyle]}>
              <LinearGradient
                colors={['#fff', '#f0f0f0']}
                style={styles.logoGradient}
              >
                <Ionicons name="library" size={32} color={theme.primary} />
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(800)}>
              <Text style={styles.kicker}>JOIN THE EXPERTS</Text>
              <Text style={styles.title}>Get Started</Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                Set up your library workspace in seconds.
              </Text>
            </Animated.View>
          </View>

          {/* Signup Card */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(800)}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface === '#ffffff' ? 'rgba(255,255,255,0.92)' : 'rgba(30,41,59,0.95)',
                borderColor: 'rgba(255,255,255,0.2)'
              }
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>Create Account</Text>

            <View style={styles.form}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>Business Details</Text>

              {renderInputField('businessName', 'Library Name', 'Golden Square Library', 'business-outline', {
                autoCapitalize: 'words',
                returnKeyType: 'next',
              })}

              {renderInputField('businessAddress', 'Location', 'City Center, Main St', 'location-outline', {
                autoCapitalize: 'words',
                returnKeyType: 'next',
              })}

              <View style={[styles.divider, { backgroundColor: theme.border, opacity: 0.3 }]} />

              <Text style={[styles.sectionTitle, { color: theme.primary }]}>Personal Info</Text>

              {renderInputField('name', 'Full Name', 'John Doe', 'person-outline', {
                autoCapitalize: 'words',
                returnKeyType: 'next',
              })}

              {renderInputField('email', 'Email Address', 'john@example.com', 'mail-outline', {
                autoCapitalize: 'none',
                keyboardType: 'email-address',
                returnKeyType: 'next',
              })}

              {renderInputField('contactNumber', 'Phone Number', '+91 98765 43210', 'call-outline', {
                keyboardType: 'phone-pad',
                returnKeyType: 'next',
              })}

              {renderInputField('password', 'Password', 'Min. 6 characters', 'lock-closed-outline', {
                secureTextEntry: !showPassword,
                returnKeyType: 'done',
              })}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={signupMutation.isPending}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { 
                    backgroundColor: theme.primary,
                    opacity: signupMutation.isPending ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                {signupMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Create My Workspace</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </Pressable>

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.muted }]}>Have an account?</Text>
                <Link href="/(auth)/login" replace={isAuthenticated} asChild>
                  <Pressable>
                    <Text style={[styles.signInLink, { color: theme.primary }]}>Sign In</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </Animated.View>

          {/* Security Indicator */}
          <Animated.View
            entering={FadeInDown.delay(1000).duration(800)}
            style={styles.securityInfo}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={theme.surface === '#ffffff' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
            />
            <Text style={[
              styles.securityText,
              { color: theme.surface === '#ffffff' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)' }
            ]}>
              AES-256 Bit Encrypted Connection
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    marginBottom: spacing.lg,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.8,
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: -4,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginLeft: 4,
  },
  submitBtn: {
    height: 58,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '800',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: 6,
  },
  securityText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});