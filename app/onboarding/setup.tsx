import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useLibrarySetup } from '@/hooks/use-onboarding';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { showToast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function SetupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setupMutation = useLibrarySetup();
  const scale = useSharedValue(1);

  const [seats, setSeats] = useState('');

  const textInputRef =  useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus keyboard on mount with a slight delay for smooth transition
    const timer = setTimeout(() => {
        textInputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSetup = async () => {
    if (!seats) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await setupMutation.mutateAsync({
        totalSeats: parseInt(seats),
        monthlyFee: 0,
      });
      showToast('Library Created Successfully 🚀', 'success');
      router.replace('/(tabs)');
    } catch (e: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(e.response?.data?.message || 'Setup failed', 'error');
    }
  };

  const animatedInputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Premium Background Gradient */}
      <LinearGradient
        colors={[theme.primary + '30', theme.background, theme.background]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.content}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={styles.topSpacer} />

          {/* Main Question Section */}
          <Animated.View entering={FadeInDown.duration(800).springify()}>
            <Text style={[styles.superTitle, { color: theme.primary }]}>STEP 1 OF 1</Text>
            <Text style={[styles.mainQuestion, { color: theme.text }]}>
              What is your library's capacity?
            </Text>
            <Text style={[styles.subText, { color: theme.muted }]}>
              We will set up your dashboard instantly.
            </Text>
          </Animated.View>

          {/* Big Input Section */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(800).springify()} 
            style={styles.inputContainer}
          >
            <Animated.View style={[styles.inputWrapper, animatedInputStyle]}>
                <TextInput
                    ref={textInputRef}
                    value={seats}
                    onChangeText={(t) => {
                        // Max limit logic
                        if (parseInt(t) > 500) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            setSeats('500');
                        } else {
                            setSeats(t);
                        }
                        
                        if (t.length > 0) {
                            scale.value = withSpring(1.1);
                            setTimeout(() => scale.value = withSpring(1), 100);
                        }
                    }}
                    placeholder="0"
                    placeholderTextColor={theme.muted + '40'}
                    keyboardType="number-pad"
                    autoFocus
                    maxLength={3} // Enough for 500
                    style={[styles.bigInput, { color: theme.text }]}
                    selectionColor={theme.primary}
                />
                <Text style={[styles.seatsLabel, { color: theme.muted }]}>total seats</Text>
            </Animated.View>
          </Animated.View>

          <View style={styles.spacer} />

          {/* Action Area */}
          <Animated.View entering={FadeInUp.delay(400).duration(800).springify()} style={styles.footer}>
            <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={16} color={theme.muted} />
                <Text style={[styles.infoText, { color: theme.muted }]}>
                  You can edit sections, floors & seats later.
                </Text>
            </View>

            <Pressable
              onPress={handleSetup}
              disabled={setupMutation.isPending || !seats}
              style={({ pressed }) => [
                styles.continueBtn,
                { 
                    backgroundColor: theme.primary,
                    opacity: !seats ? 0.3 : 1, // Dim if empty
                    shadowColor: theme.primary,
                },
                pressed && { transform: [{ scale: 0.98 }] }
              ]}
            >
              {setupMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                    <Text style={styles.btnText}>{!seats ? 'Enter Capacity' : 'Create Seats'}</Text>
                    {!seats ? null : <Ionicons name="rocket-outline" size={20} color="#fff" />}
                </>
              )}
            </Pressable>
          </Animated.View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: width < 380 ? 24 : 32 },
  keyboardView: { flex: 1 },
  topSpacer: { flex: 0.15 }, // Push content down a bit
  
  superTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 2,
      marginBottom: 16,
      opacity: 0.8,
  },
  mainQuestion: {
      fontSize: width < 380 ? 28 : 36,
      fontWeight: '900',
      lineHeight: 42,
      letterSpacing: -1,
      marginBottom: 12,
  },
  subText: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '500',
  },

  inputContainer: {
      flex: 0.4,
      alignItems: 'center',
      justifyContent: 'center',
  },
  inputWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
  },
  bigInput: {
      fontSize: width < 380 ? 80 : 120,
      fontWeight: '800',
      textAlign: 'center',
      width: '100%',
      height: 140,
      letterSpacing: -4,
      marginTop: 20,
      padding: 0,
      includeFontPadding: false,
  },
  seatsLabel: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: -10,
      textTransform: 'uppercase',
      opacity: 0.6,
  },

  spacer: { flex: 1 },

  footer: {
      marginBottom: Platform.OS === 'ios' ? 10 : 30,
      gap: 24,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
  },
  infoText: {
      fontSize: 13,
      fontWeight: '500',
  },
  continueBtn: {
      height: 64,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
  },
  btnText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 0.5,
  },
});
