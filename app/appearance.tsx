import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { spacing } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { useAppearanceStore, AppearanceMode } from '@/hooks/use-appearance';

export default function AppearanceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { mode, setMode } = useAppearanceStore();

  const modes: { value: AppearanceMode; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    { value: 'light', label: 'Light', icon: 'sunny', description: 'Always use light theme' },
    { value: 'dark', label: 'Dark', icon: 'moon', description: 'Always use dark theme' },
    { value: 'system', label: 'System', icon: 'phone-portrait', description: 'Match device settings' },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeScreen edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Appearance</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Choose your theme preference</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Theme Mode Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme Mode</Text>
            <Text style={[styles.sectionDesc, { color: theme.muted }]}>
              Select how the app should appear. System mode will automatically switch between light and dark based on your device settings.
            </Text>
          </View>

          {/* Theme Cards */}
          <View style={styles.cardsContainer}>
            {modes.map((item, index) => {
              const isSelected = mode === item.value;
              return (
                <Animated.View
                  key={item.value}
                  entering={FadeInDown.delay(index * 100).duration(600)}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setMode(item.value);
                    }}
                    style={({ pressed }) => [
                      styles.themeCard,
                      {
                        backgroundColor: isSelected ? theme.primary + '10' : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <View style={styles.cardContent}>
                      <View style={[styles.iconBox, { backgroundColor: isSelected ? theme.primary : theme.surfaceAlt }]}>
                        <Ionicons name={item.icon} size={32} color={isSelected ? '#fff' : theme.text} />
                      </View>
                      <View style={styles.cardText}>
                        <Text style={[styles.cardLabel, { color: isSelected ? theme.primary : theme.text }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.cardDesc, { color: theme.muted }]}>
                          {item.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Info Note */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={[styles.infoBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          >
            <View style={[styles.infoIconBox, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="information-circle" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.infoText, { color: theme.muted }]}>
              Your theme preference is saved and will persist across app restarts. Changes take effect immediately.
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionDesc: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  cardsContainer: {
    gap: spacing.md,
  },
  themeCard: {
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
    position: 'relative',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
