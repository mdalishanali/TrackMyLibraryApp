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
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, radius, typography } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage, useLoginMutation } from '@/hooks/use-auth-mutations';
import { useTheme } from '@/hooks/use-theme';
import { LoginFormValues, loginSchema } from '@/schemas/auth';

const { width } = Dimensions.get('window');

export default function Login() {
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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const loginMutation = useLoginMutation();

  // Animation values
  const logoScale = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(300, withSpring(1, { damping: 12 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }]
  }));

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login failed', getErrorMessage(error));
    }
  };

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
                <Ionicons name="library" size={32} color={theme.primary} />
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(800)}>
              <Text style={styles.kicker}>SECURE ACCESS</Text>
              <Text style={styles.title}>Track My Library</Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                Experience the next generation of library management.
              </Text>
            </Animated.View>
          </View>

          {/* Login Card */}
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
            <Text style={[styles.cardTitle, { color: theme.text }]}>Welcome Back</Text>

            <View style={styles.form}>
              {/* Identifier Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.muted }]}>Identifier</Text>
                <Controller
                  control={control}
                  name="identifier"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: errors.identifier ? '#ef4444' : focusedField === 'identifier' ? theme.primary : 'transparent',
                        borderWidth: 1.5
                      }
                    ]}>
                      <Ionicons name="mail-outline" size={20} color={focusedField === 'identifier' ? theme.primary : theme.muted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Email or phone number"
                        placeholderTextColor={theme.muted}
                        autoCapitalize="none"
                        onFocus={() => setFocusedField('identifier')}
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
                {errors.identifier && (
                  <Text style={styles.errorText}>{errors.identifier.message}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.muted }]}>Password</Text>
                  <Pressable>
                    <Text style={[styles.forgotLabel, { color: theme.primary }]}>Forgot?</Text>
                  </Pressable>
                </View>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: errors.password ? '#ef4444' : focusedField === 'password' ? theme.primary : 'transparent',
                        borderWidth: 1.5
                      }
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? theme.primary : theme.muted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Enter password"
                        placeholderTextColor={theme.muted}
                        secureTextEntry={!showPassword}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        onSubmitEditing={handleSubmit(onSubmit)}
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={theme.muted}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                )}
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={loginMutation.isPending}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { 
                    backgroundColor: theme.primary,
                    opacity: loginMutation.isPending ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </Pressable>

              {/* Signup Link */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.muted }]}>New here?</Text>
                <Link href="/(auth)/signup" replace={isAuthenticated} asChild>
                  <Pressable>
                    <Text style={[styles.signUpLink, { color: theme.primary }]}>Create Account</Text>
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
            <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.securityText}>AES-256 Bit Encrypted Connection</Text>
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
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotLabel: {
    fontSize: 13,
    fontWeight: '700',
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
    elevation: 8,
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
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signUpLink: {
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
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});