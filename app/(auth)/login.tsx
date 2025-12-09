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
import { getErrorMessage, useLoginMutation } from '@/hooks/use-auth-mutations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoginFormValues, loginSchema } from '@/schemas/auth';

export default function Login() {
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const loginMutation = useLoginMutation();
  const surface = colorScheme === 'dark' ? '#0f172a' : '#f8fafc';
  const inputBackground = colorScheme === 'dark' ? '#111827' : '#fff';
  const borderColor = colorScheme === 'dark' ? '#334155' : '#d4d4d8';
  const mutedText = colorScheme === 'dark' ? '#cbd5e1' : '#475569';

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login failed', getErrorMessage(error));
    }
  };

  const textColor = Colors[colorScheme].text;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme].background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={32}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View style={[styles.card, { backgroundColor: surface }]}>
            <Text style={[styles.kicker, { color: textColor }]}>Track My Library</Text>
            <Text style={[styles.title, { color: textColor }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: mutedText }]}>
              Access your dashboard to manage students, seats and billing.
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: textColor }]}>Email or phone number</Text>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.identifier ? '#ef4444' : borderColor,
                        color: textColor,
                        backgroundColor: inputBackground,
                      },
                    ]}
                    placeholder="you@example.com or 5551234567"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    textContentType="username"
                    returnKeyType="next"
                  />
                )}
              />
              {errors.identifier?.message && <Text style={styles.error}>{errors.identifier.message}</Text>}
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
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    textContentType="password"
                    returnKeyType="done"
                  />
                )}
              />
              {errors.password?.message && <Text style={styles.error}>{errors.password.message}</Text>}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit(onSubmit)}
              disabled={loginMutation.isPending}
              style={({ pressed }) => [
                styles.button,
                { opacity: loginMutation.isPending || pressed ? 0.8 : 1 },
              ]}>
              {loginMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: mutedText }]}>New here?</Text>
              <Link href="/(auth)/signup" replace={isAuthenticated} asChild>
                <Pressable>
                  <Text style={[styles.footerLink, { color: colorScheme === 'dark' ? '#34d399' : '#0f766e' }]}>
                    Create an account
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
