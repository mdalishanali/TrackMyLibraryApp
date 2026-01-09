import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { radius, spacing, themeFor } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fontFamily } from '@/themes/fontFamily';

const { width } = Dimensions.get('window');

type ToastVariant = 'success' | 'error' | 'info';

type ToastColors = {
  bg: string;
  gradient: string[];
  accent: string;
  iconBg: string;
  text: string;
  muted: string;
};

const getColors = (
  variant: ToastVariant,
  palette: ReturnType<typeof themeFor>,
  isDark: boolean,
): ToastColors => {
  if (variant === 'success') {
    return {
      bg: isDark ? 'rgba(20, 25, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      gradient: isDark
        ? ['rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.05)']
        : ['rgba(209, 250, 229, 0.8)', 'rgba(255, 255, 255, 0.9)'],
      accent: '#10b981',
      iconBg: 'rgba(16, 185, 129, 0.15)',
      text: palette.text,
      muted: palette.muted,
    };
  }

  if (variant === 'error') {
    return {
      bg: isDark ? 'rgba(25, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      gradient: isDark
        ? ['rgba(239, 68, 68, 0.15)', 'rgba(220, 38, 38, 0.05)']
        : ['rgba(254, 226, 226, 0.8)', 'rgba(255, 255, 255, 0.9)'],
      accent: '#ef4444',
      iconBg: 'rgba(239, 68, 68, 0.15)',
      text: palette.text,
      muted: palette.muted,
    };
  }

  return {
    bg: isDark ? 'rgba(20, 22, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    gradient: isDark
      ? ['rgba(59, 130, 246, 0.15)', 'rgba(37, 99, 235, 0.05)']
      : ['rgba(219, 234, 254, 0.8)', 'rgba(255, 255, 255, 0.9)'],
    accent: '#3b82f6',
    iconBg: 'rgba(59, 130, 246, 0.15)',
    text: palette.text,
    muted: palette.muted,
  };
};

const iconMap: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle-outline',
  error: 'alert-circle-outline',
  info: 'information-circle-outline',
};

export function AppToast({
  text1,
  text2,
  variant,
}: BaseToastProps & {
  variant: ToastVariant;
}) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const isDark = colorScheme === 'dark';
  const colors = getColors(variant, theme, isDark);

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      style={styles.outerContainer}
    >
      <View style={[styles.innerCard, { backgroundColor: colors.bg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <LinearGradient
          colors={colors.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientFill}
        />

        <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />

        <View style={styles.content}>
          <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
            <Ionicons name={iconMap[variant]} size={20} color={colors.accent} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {text1}
            </Text>
            {text2 ? (
              <Text style={[styles.subtitle, { color: theme.muted }]} numberOfLines={2}>
                {text2}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => Toast.hide()}
            style={({ pressed }) => [
              styles.closeBtn,
              { opacity: pressed ? 0.5 : 1 }
            ]}
          >
            <Ionicons name="close-circle" size={20} color={theme.muted} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: width,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
      }
    })
  },
  innerCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 18,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
});
