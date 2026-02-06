import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeInDown
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { SafeScreen } from '@/components/layout/safe-screen';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: "Smart Seat\nManagement",
    subtitle: "Assign and track seats effortlessly with our visual floor plan system.",
    icon: "grid",
    color: "#4F46E5", // Indigo
  },
  {
    id: 2,
    title: "Automated\nFee Reminders",
    subtitle: "Send professional receipts and payment alerts via WhatsApp in one click.",
    icon: "logo-whatsapp",
    color: "#25D366", // WhatsApp Green
  },
  {
    id: 3,
    title: "Complete\nStudent Insights",
    subtitle: "Track attendance, payments, and shift renewals from a single dashboard.",
    icon: "people",
    color: "#F59E0B", // Amber
  },
  {
    id: 4,
    title: "100% Secure\n& Private",
    subtitle: "Trusted by 5,000+ libraries. Your data is fully encrypted and safe.",
    icon: "shield-checkmark",
    color: "#0EA5E9", // Sky Blue
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated, hydrated } = useAuth();
  const scrollX = useSharedValue(0);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      // Use setTimeout to ensure router is fully mounted
      const timeout = setTimeout(() => {
        if (router.canGoBack?.() !== undefined) {
          router.replace('/(tabs)');
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [hydrated, isAuthenticated]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(auth)/login');
  };

  if (!hydrated) return null;

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          bounces={false}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {SLIDES.map((slide, index) => {
              const inputRange = [
                  (index - 1) * width,
                  index * width,
                  (index + 1) * width,
              ];

              const animatedImageStyle = useAnimatedStyle(() => {
                  const translateY = interpolate(
                      scrollX.value,
                      inputRange,
                      [100, 0, 100],
                      Extrapolation.CLAMP
                  );
                  const scale = interpolate(
                      scrollX.value,
                      inputRange,
                      [0.5, 1, 0.5],
                      Extrapolation.CLAMP
                  );
                  return {
                      transform: [{ translateY }, { scale }],
                  };
              });

              const animatedTextStyle = useAnimatedStyle(() => {
                  const translateY = interpolate(
                      scrollX.value,
                      inputRange,
                      [50, 0, 50],
                      Extrapolation.CLAMP
                  );
                  const opacity = interpolate(
                      scrollX.value,
                      inputRange,
                      [0, 1, 0],
                      Extrapolation.CLAMP
                  );
                  return {
                      transform: [{ translateY }],
                      opacity,
                  };
               });

            return (
              <View key={slide.id} style={{ width, height: height * 0.7, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  {/* Background Blobs - subtle */}
                  <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: -1 }]}>
                      <LinearGradient
                          colors={[slide.color + '30', 'transparent']}
                          style={{ position: 'absolute', top: -50, left: -50, width: 300, height: 300, borderRadius: 150 }}
                      />
                       <LinearGradient
                          colors={[slide.color + '15', 'transparent']}
                          style={{ position: 'absolute', bottom: 0, right: -50, width: 250, height: 250, borderRadius: 125 }}
                      />
                  </View>

                <View style={{ marginBottom: 40, alignItems: 'center' }}>
                  <Animated.View style={[
                      styles.iconCircle, 
                      { backgroundColor: theme.surface, borderColor: slide.color },
                      animatedImageStyle
                  ]}>
                    <Ionicons name={slide.icon as any} size={80} color={slide.color} />
                  </Animated.View>
                </View>

                <Animated.View style={[{ alignItems: 'center', gap: 16, maxWidth: '85%' }, animatedTextStyle]}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {slide.title}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.muted }]}>
                    {slide.subtitle}
                  </Text>
                </Animated.View>
              </View>
            );
          })}
        </Animated.ScrollView>

        <View style={styles.bottomContainer}>
            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {SLIDES.map((_, index) => {
                const animatedDotStyle = useAnimatedStyle(() => {
                  const inputRange = [
                      (index - 1) * width,
                      index * width,
                      (index + 1) * width,
                  ];
                  const widthAnim = interpolate(
                      scrollX.value,
                      inputRange,
                      [8, 32, 8],
                      Extrapolation.CLAMP
                  );
                  const opacity = interpolate(
                      scrollX.value,
                      inputRange,
                      [0.3, 1, 0.3],
                      Extrapolation.CLAMP
                  );
                  return {
                      width: widthAnim,
                      opacity,
                  };
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      { backgroundColor: theme.primary },
                      animatedDotStyle,
                    ]}
                  />
                );
              })}
            </View>

            {/* Footer / CTA */}
            <Animated.View entering={FadeInDown.delay(300).springify()} style={{ width: '100%', paddingHorizontal: 24, paddingBottom: 10, gap: 12 }}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/(auth)/signup');
                    }}
                    style={({ pressed }) => [
                        styles.button,
                        { backgroundColor: theme.primary },
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                    ]}
                >
                    <Text style={styles.buttonText}>Create New Library</Text>
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                </Pressable>

                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/(auth)/login');
                    }}
                    style={({ pressed }) => [
                        styles.secondaryBtn,
                        pressed && { opacity: 0.7, backgroundColor: theme.surfaceAlt }
                    ]}
                >
                    <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
                        Already a member? <Text style={{ color: theme.primary }}>Log in</Text>
                    </Text>
                </Pressable>

                <Text style={{ textAlign: 'center', fontSize: 11, color: theme.muted, marginTop: 4 }}>
                    By counting, you agree to our Terms & Privacy Policy
                </Text>
            </Animated.View>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    opacity: 0.8,
  },
  bottomContainer: {
    height: '25%', // Explicitly reserve bottom area
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  button: {
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  }
});
