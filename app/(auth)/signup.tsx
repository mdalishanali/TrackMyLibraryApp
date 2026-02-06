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
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { spacing, radius } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage, useSignupMutation } from '@/hooks/use-auth-mutations';
import { useTheme } from '@/hooks/use-theme';
import { SignupFormValues, signupSchema } from '@/schemas/auth';

const { width } = Dimensions.get('window');

// Steps definition
const TOTAL_STEPS = 2;

export default function Signup() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  // Animation values
  const progress = useSharedValue(1);
  const logoScale = useSharedValue(0);

  // Setup form
  const {
    control,
    handleSubmit,
    trigger,
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
    mode: 'onChange'
  });

  const signupMutation = useSignupMutation();

  useEffect(() => {
    logoScale.value = withDelay(300, withSpring(1, { damping: 12 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }]
  }));

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${(step / TOTAL_STEPS) * 100}%`, { duration: 500 })
    };
  });

  const handleNextStep = async () => {
    const isStep1Valid = await trigger(['businessName', 'businessAddress']);
    if (isStep1Valid) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(2);
      progress.value = withTiming(2);
    }
  };

  const handlePrevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
    progress.value = withTiming(1);
  };

  const onSubmit = async (values: SignupFormValues) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await signupMutation.mutateAsync({ ...values, platform: Platform.OS });
      router.replace('/onboarding/setup');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
              borderColor: errors[name] ? '#ef4444' : focusedField === name ? theme.primary : theme.border,
              borderWidth: 1.5,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: focusedField === name ? 0.2 : 0,
              shadowRadius: 8,
            }
          ]}>
            <Ionicons name={icon as any} size={20} color={focusedField === name ? theme.primary : theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder={placeholder}
              placeholderTextColor={theme.muted}
              onFocus={() => {
                setFocusedField(name);
                Haptics.selectionAsync();
              }}
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

            {!errors[name] && value && value.length > 2 && focusedField !== name && (
              <Animated.View entering={FadeInRight.duration(300)}>
                <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
              </Animated.View>
            )}
          </View>
        )}
      />
      {errors[name] && (
        <Animated.Text entering={FadeInUp} style={styles.errorText}>{errors[name]?.message}</Animated.Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          // Dynamic background shift based on step? 
          // Keeping it consistent for now but could be cool to shift hue
          theme.primary, theme.primary, theme.background
        ]}
        locations={[0, 0.3, 0.8]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: '40%' }]}
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
              <Text style={styles.title}>
                {step === 1 ? 'Workspace Setup' : 'Your Profile'}
              </Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                {step === 1
                  ? 'First, let\'s give your library a home.'
                  : 'Almost there! Who will be managing this space?'}
              </Text>
            </Animated.View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Animated.View style={[styles.bar, { backgroundColor: '#fff' }, progressBarStyle]} />
            </View>
            <Text style={styles.stepIndicator}>Step {step} of {TOTAL_STEPS}</Text>
          </View>

          {/* Signup Card */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(800)}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface === '#ffffff' ? 'rgba(255,255,255,0.94)' : 'rgba(30,41,59,0.95)',
                borderColor: 'rgba(255,255,255,0.3)'
              }
            ]}
          >
            {step === 1 && (
              <Animated.View
                entering={FadeInRight}
                exiting={FadeOutLeft}
                style={styles.formSection}
              >
                <Text style={[styles.cardTitle, { color: theme.text }]}>Library Details</Text>

                <View style={styles.form}>
                  {renderInputField('businessName', 'Library Name', 'Patna Central Library', 'business-outline', {
                    autoCapitalize: 'words',
                    returnKeyType: 'next',
                  })}

                  {renderInputField('businessAddress', 'Location', 'City Center, Main St', 'location-outline', {
                    autoCapitalize: 'words',
                    returnKeyType: 'next',
                  })}

                  <Pressable
                    onPress={handleNextStep}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      {
                        backgroundColor: theme.primary,
                        transform: [{ scale: pressed ? 0.98 : 1 }]
                      }
                    ]}
                  >
                    <Text style={styles.actionBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View
                entering={FadeInRight}
                exiting={FadeOutRight}
                style={styles.formSection}
              >
                <View style={styles.cardHeaderRow}>
                  <Pressable onPress={handlePrevStep} hitSlop={10}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Administrator</Text>
                  <View style={{ width: 24 }} />
                </View>

                <View style={[styles.form, { marginTop: spacing.xl }]}>
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

                  <Pressable
                    onPress={handleSubmit(onSubmit)}
                    disabled={signupMutation.isPending}
                    style={({ pressed }) => [
                      styles.actionBtn,
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
                        <Text style={styles.actionBtnText}>Create Account</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* Login Link - always visible at bottom of card */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.muted }]}>Already have an account?</Text>
              <Link href="/(auth)/login" replace={isAuthenticated} asChild>
                <Pressable>
                  <Text style={[styles.signInLink, { color: theme.primary }]}>Sign In</Text>
                </Pressable>
              </Link>
            </View>

          </Animated.View>

          {/* Security Indicator */}
          <Animated.View
            entering={FadeInDown.delay(1000).duration(800)}
            style={styles.securityInfo}
          >
            <Ionicons
              name="lock-closed"
              size={12}
              color={theme.surface === '#ffffff' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
            />
            <Text style={[
              styles.securityText,
              { color: theme.surface === '#ffffff' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)' }
            ]}>
              Secure 256-bit Encryption
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
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    marginBottom: spacing.md,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.9,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  stepIndicator: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.12,
    shadowRadius: 35,
    minHeight: 400, // Ensure height stability
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
  },
  form: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
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
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  actionBtn: {
    height: 56,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: 6,
    opacity: 0.8,
  },
  securityText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});