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
} from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
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
import { getErrorMessage, useForgotPasswordMutation } from '@/hooks/use-auth-mutations';
import { useTheme } from '@/hooks/use-theme';
import { ForgotPasswordFormValues, forgotPasswordSchema } from '@/schemas/auth';
import { useScreenView } from '@/hooks/use-screen-view';

export default function ForgotPassword() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Track screen view
  useScreenView('Forgot Password');

  // Setup form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const forgotPasswordMutation = useForgotPasswordMutation();

  // Animation values
  const logoScale = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(300, withSpring(1, { damping: 12 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }]
  }));

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPasswordMutation.mutateAsync(values);
      setIsEmailSent(true);
    } catch (error) {
      Alert.alert('Request failed', getErrorMessage(error));
    }
  };

  if (isEmailSent) {
    return (
        <View style={styles.container}>
             <LinearGradient
                colors={[theme.primary, theme.primary, theme.background]}
                locations={[0, 0.3, 0.8]}
                style={StyleSheet.absoluteFill}
            />
             <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'transparent']}
                style={[StyleSheet.absoluteFill, { height: '40%' }]}
            />

             <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }
                ]}
                alwaysBounceVertical={false}
                >
                      {/* Header Section */}
                    <View style={styles.header}>
                        <Animated.View style={[styles.logoBadge, logoAnimatedStyle]}>
                        <LinearGradient
                            colors={['#fff', '#f0f0f0']}
                            style={styles.logoGradient}
                        >
                  <Ionicons name="checkmark-circle-outline" size={32} color={theme.primary} />
                        </LinearGradient>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(500).duration(800)}>
                <Text style={styles.title}>Request Sent!</Text>
                <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.95)' }]}>
                  Your password reset request has been received. Please contact your library admin to get your secure reset link.
                            </Text>
                        </Animated.View>
                    </View>

                      {/* Success Card */}
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
              <View style={styles.form}>
                <Text style={[styles.cardInfo, { color: theme.text }]}>
                  For security, we've notified the admin. They will verify your identity and share the link via WhatsApp or SMS.
                </Text>

                <Pressable
                  onPress={() => Linking.openURL('https://wa.me/918804433157')}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    { 
                      backgroundColor: '#25D366',
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }
                  ]}
                >
                  <Ionicons name="logo-whatsapp" size={22} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Contact Admin</Text>
                </Pressable>

                <Link href="/(auth)/login" asChild>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      {
                        borderColor: theme.primary,
                        transform: [{ scale: pressed ? 0.98 : 1 }]
                      }
                    ]}
                  >
                    <Ionicons name="arrow-back" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>Back to Login</Text>
                                </Pressable>
                            </Link>

                <Pressable
                  onPress={() => Linking.openURL('https://www.trackmylibrary.in')}
                  style={styles.websiteLink}
                >
                  <Text style={[styles.websiteLinkText, { color: theme.muted }]}>Visit trackmylibrary.in</Text>
                  <Ionicons name="open-outline" size={14} color={theme.muted} style={{ marginLeft: 4 }} />
                </Pressable>
                         </View>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
  }

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
        style={[StyleSheet.absoluteFill, { height: '40%' }]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }
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
                <Ionicons name="key-outline" size={32} color={theme.primary} />
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(800)}>
              <Text style={styles.kicker}>ACCOUNT RECOVERY</Text>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>
            </Animated.View>
          </View>

          {/* Form Card */}
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
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.muted }]}>Email Address</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: errors.email ? '#ef4444' : focusedField === 'email' ? theme.primary : 'transparent',
                        borderWidth: 1.5
                      }
                    ]}>
                      <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? theme.primary : theme.muted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="name@example.com"
                        placeholderTextColor={theme.muted}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                      />
                    </View>
                  )}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={forgotPasswordMutation.isPending}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { 
                    backgroundColor: theme.primary,
                    opacity: forgotPasswordMutation.isPending ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                {forgotPasswordMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Send Reset Link</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </Pressable>

              {/* Back to Login */}
              <View style={styles.footer}>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <Text style={[styles.signUpLink, { color: theme.primary }]}>Back to Login</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
  },
  logoGradient: {
    flex: 1,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: '#fff',
    fontSize: 12,
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
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
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
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
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
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
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
  signUpLink: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardInfo: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xs,
    fontWeight: '500',
    opacity: 0.9,
  },
  secondaryBtn: {
    height: 58,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginTop: spacing.xs,
  },
  secondaryBtnText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  websiteLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
