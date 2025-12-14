import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRef, useState } from 'react';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage, useSignupMutation } from '@/hooks/use-auth-mutations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SignupFormValues, signupSchema } from '@/schemas/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Signup() {
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated } = useAuth();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const onSubmit = async (values: SignupFormValues) => {
    try {
      await signupMutation.mutateAsync(values);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Signup failed', getErrorMessage(error));
    }
  };

  const renderField = (
    name: keyof SignupFormValues,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'words';
      secureTextEntry?: boolean;
      textContentType?: any;
      returnKeyType?: 'next' | 'done';
    }
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: errors[name]
                    ? '#ef4444'
                    : focusedField === name
                      ? focusBorderColor
                      : borderColor,
                  color: textColor,
                  backgroundColor: inputBackground,
                  borderWidth: focusedField === name ? 2 : 1,
                },
              ]}
              placeholder={placeholder}
              placeholderTextColor={mutedText}
              onFocus={() => setFocusedField(name)}
              onBlur={() => {
                setFocusedField(null);
                onBlur();
              }}
              onChangeText={onChange}
              value={value}
              {...options}
            />
          </View>
        )}
      />
      {errors[name]?.message && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {errors[name]?.message}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: accentColor }]}>
              <Text style={styles.logoText}>📚</Text>
            </View>
            <Text style={[styles.kicker, { color: accentColor }]}>TRACK MY LIBRARY</Text>
            <Text style={[styles.title, { color: textColor }]}>Create your account</Text>
            <Text style={[styles.subtitle, { color: mutedText }]}>
              Set up your workspace in just a few steps
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: surface }]}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Business Details</Text>
              {renderField('businessName', 'Business name', 'Acme Library Inc.', {
                returnKeyType: 'next',
              })}
              {renderField('businessAddress', 'Business address', '123 Main Street, City', {
                returnKeyType: 'next',
              })}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Personal Information</Text>
              {renderField('name', 'Your name', 'Alex Morgan', {
                autoCapitalize: 'words',
                returnKeyType: 'next',
              })}
              {renderField('email', 'Email address', 'alex@example.com', {
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                returnKeyType: 'next',
              })}
              {renderField('password', 'Password', 'At least 6 characters', {
                secureTextEntry: true,
                textContentType: 'newPassword',
                returnKeyType: 'next',
              })}
              {renderField('contactNumber', 'Contact number', '+1 (555) 123-4567', {
                keyboardType: 'phone-pad',
                returnKeyType: 'done',
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit(onSubmit)}
              disabled={signupMutation.isPending}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: accentColor,
                  opacity: signupMutation.isPending ? 0.7 : pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              {signupMutation.isPending ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonText}>Creating account...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Create account →</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: mutedText }]}>Already have an account?</Text>
              <Link href="/(auth)/login" replace={isAuthenticated} asChild>
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
                      Sign in
                    </Text>
                  )}
                </Pressable>
              </Link>
            </View>
          </View>

          <Text style={[styles.disclaimer, { color: mutedText }]}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  logoText: {
    fontSize: 32,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
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
    paddingHorizontal: 20,
  },
});