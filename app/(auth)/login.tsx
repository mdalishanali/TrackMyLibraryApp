import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage, useLoginMutation } from '@/hooks/use-auth-mutations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoginFormValues, loginSchema } from '@/schemas/auth';

export default function Login() {
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated } = useAuth();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const loginMutation = useLoginMutation();

  // Enhanced color scheme
  const isDark = colorScheme === 'dark';
  const surface = isDark ? '#1e293b' : '#ffffff';
  const background = isDark ? '#0f172a' : '#f8fafc';
  const inputBackground = isDark ? '#334155' : '#f1f5f9';
  const borderColor = isDark ? '#475569' : '#e2e8f0';
  const focusBorderColor = isDark ? '#10b981' : '#0d9488';
  const mutedText = isDark ? '#94a3b8' : '#64748b';
  const textColor = Colors[colorScheme].text;
  const accentColor = isDark ? '#10b981' : '#0d9488';

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login failed', getErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>

          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: accentColor }]}>
              <Text style={styles.logoText}>📚</Text>
            </View>
            <Text style={[styles.kicker, { color: accentColor }]}>TRACK MY LIBRARY</Text>
            <Text style={[styles.title, { color: textColor }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: mutedText }]}>
              Sign in to access your dashboard and manage your library
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: surface }]}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: textColor }]}>Email or phone number</Text>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: errors.identifier
                            ? '#ef4444'
                            : focusedField === 'identifier'
                              ? focusBorderColor
                              : borderColor,
                          color: textColor,
                          backgroundColor: inputBackground,
                          borderWidth: focusedField === 'identifier' ? 2 : 1,
                        },
                      ]}
                      placeholder="you@example.com or 5551234567"
                      placeholderTextColor={mutedText}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => setFocusedField('identifier')}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      textContentType="username"
                      returnKeyType="next"
                    />
                  </View>
                )}
              />
              {errors.identifier?.message && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {errors.identifier.message}</Text>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: textColor }]}>Password</Text>
                {/* <Pressable onPress={() => Alert.alert('Forgot Password', 'Password reset feature coming soon!')}>
                  {({ pressed }) => (
                    <Text style={[styles.forgotLink, { color: accentColor, opacity: pressed ? 0.7 : 1 }]}>
                      Forgot?
                    </Text>
                  )}
                </Pressable> */}
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        {
                          borderColor: errors.password
                            ? '#ef4444'
                            : focusedField === 'password'
                              ? focusBorderColor
                              : borderColor,
                          color: textColor,
                          backgroundColor: inputBackground,
                          borderWidth: focusedField === 'password' ? 2 : 1,
                        },
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor={mutedText}
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      textContentType="password"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      hitSlop={8}>
                      <Text style={[styles.eyeText, { color: accentColor }]}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              />
              {errors.password?.message && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {errors.password.message}</Text>
                </View>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit(onSubmit)}
              disabled={loginMutation.isPending}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: accentColor,
                  opacity: loginMutation.isPending ? 0.7 : pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              {loginMutation.isPending ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Sign in →</Text>
              )}
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <Text style={[styles.dividerText, { color: mutedText }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: mutedText }]}>Don't have an account?</Text>
              <Link href="/(auth)/signup" replace={isAuthenticated} asChild>
                <Pressable>
                  {({ pressed }) => (
                    <Text
                      style={[
                        styles.footerLink,
                        {
                          color: accentColor,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}>
                      Create account
                    </Text>
                  )}
                </Pressable>
              </Link>
            </View>
          </View>

          <Text style={[styles.disclaimer, { color: mutedText }]}>
            Protected by industry-standard encryption
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  logoText: {
    fontSize: 36,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
  },
  eyeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});