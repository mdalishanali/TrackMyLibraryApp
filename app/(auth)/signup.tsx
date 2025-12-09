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

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage, useSignupMutation } from '@/hooks/use-auth-mutations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SignupFormValues, signupSchema } from '@/schemas/auth';

export default function Signup() {
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated } = useAuth();

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
  const surface = colorScheme === 'dark' ? '#0f172a' : '#f8fafc';
  const inputBackground = colorScheme === 'dark' ? '#111827' : '#fff';
  const borderColor = colorScheme === 'dark' ? '#334155' : '#d4d4d8';
  const mutedText = colorScheme === 'dark' ? '#cbd5e1' : '#475569';
  const textColor = Colors[colorScheme].text;

  const onSubmit = async (values: SignupFormValues) => {
    try {
      await signupMutation.mutateAsync(values);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Signup failed', getErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme].background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={32}>
        <ScrollView contentContainerStyle={styles.contentContainer} bounces={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: surface }]}>
            <Text style={[styles.kicker, { color: textColor }]}>Track My Library</Text>
            <Text style={[styles.title, { color: textColor }]}>Create your account</Text>
            <Text style={[styles.subtitle, { color: mutedText }]}>
              We set up your workspace, company, and the default unallocated seat.
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: textColor }]}>Business name</Text>
              <Controller
                control={control}
                name="businessName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.businessName ? '#ef4444' : borderColor,
                        color: textColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    placeholder="Track My Library"
                    placeholderTextColor="#9ca3af"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.businessName?.message && <Text style={styles.error}>{errors.businessName.message}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: textColor }]}>Business address</Text>
              <Controller
                control={control}
                name="businessAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.businessAddress ? '#ef4444' : borderColor,
                        color: textColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    placeholder="123 Main Street"
                    placeholderTextColor="#9ca3af"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.businessAddress?.message && <Text style={styles.error}>{errors.businessAddress.message}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: textColor }]}>Your name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.name ? '#ef4444' : borderColor,
                        color: textColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    placeholder="Alex Manager"
                    placeholderTextColor="#9ca3af"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                )}
              />
              {errors.name?.message && <Text style={styles.error}>{errors.name.message}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: textColor }]}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.email ? '#ef4444' : borderColor,
                        color: textColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.email?.message && <Text style={styles.error}>{errors.email.message}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: textColor }]}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.password ? '#ef4444' : borderColor,
                        color: textColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    textContentType="newPassword"
                    returnKeyType="next"
                  />
                )}
              />
              {errors.password?.message && <Text style={styles.error}>{errors.password.message}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: textColor }]}>Contact number</Text>
              <Controller
                control={control}
                name="contactNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.contactNumber ? '#ef4444' : borderColor,
                        color: textColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    placeholder="+1 555 123 4567"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="done"
                  />
                )}
              />
              {errors.contactNumber?.message && <Text style={styles.error}>{errors.contactNumber.message}</Text>}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit(onSubmit)}
              disabled={signupMutation.isPending}
              style={({ pressed }) => [
                styles.button,
                { opacity: signupMutation.isPending || pressed ? 0.85 : 1 },
              ]}>
              {signupMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: mutedText }]}>Already onboard?</Text>
              <Link href="/(auth)/login" replace={isAuthenticated} asChild>
                <Pressable>
                  <Text style={[styles.footerLink, { color: colorScheme === 'dark' ? '#34d399' : '#0f766e' }]}>
                    Sign in
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
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
    padding: 24,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 20,
    gap: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
  },
  button: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#475569',
  },
  footerLink: {
    color: '#0f766e',
    fontWeight: '700',
  },
});
