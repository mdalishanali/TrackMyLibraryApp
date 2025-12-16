import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast, { BaseToastProps } from 'react-native-toast-message';

import { radius, spacing, themeFor } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fontFamily } from '@/themes/fontFamily';

type ToastVariant = 'success' | 'error' | 'info';

type ToastColors = {
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
      gradient: [
        isDark ? 'rgba(74, 222, 128, 0.18)' : 'rgba(52, 211, 153, 0.22)',
        isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(34, 197, 94, 0.14)',
      ],
      accent: palette.success,
      iconBg: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(34, 197, 94, 0.12)',
      text: palette.text,
      muted: palette.muted,
    };
  }

  if (variant === 'error') {
    return {
      gradient: [
        isDark ? 'rgba(248, 113, 113, 0.22)' : 'rgba(248, 113, 113, 0.18)',
        isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(248, 113, 113, 0.12)',
      ],
      accent: palette.danger,
      iconBg: isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(248, 113, 113, 0.14)',
      text: palette.text,
      muted: palette.muted,
    };
  }

  return {
    gradient: [
      isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(59, 130, 246, 0.18)',
      isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(59, 130, 246, 0.12)',
    ],
    accent: palette.info,
    iconBg: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(59, 130, 246, 0.12)',
    text: palette.text,
    muted: palette.muted,
  };
};

const iconMap: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
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
    <View style={styles.shadowWrapper}>
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { borderColor: colors.accent }]}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.iconBg }]}>
          <Ionicons name={iconMap[variant]} size={22} color={colors.accent} />
        </View>
        <View style={styles.textWrapper}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {text1}
          </Text>
          {text2 ? (
            <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={3}>
              {text2}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={() => Toast.hide()} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color={colors.muted} />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});
