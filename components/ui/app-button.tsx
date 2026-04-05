import { PropsWithChildren } from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Tone = 'primary' | 'info' | 'success' | 'danger' | 'neutral';

type Props = PropsWithChildren<{
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
  tone?: Tone;
  style?: any;
  icon?: keyof typeof Ionicons.glyphMap;
}>;

export function AppButton({
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  fullWidth,
  tone = 'primary',
  style,
  icon,
}: Props) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  const toneColor =
    tone === 'info'
      ? theme.info
      : tone === 'success'
        ? theme.success
        : tone === 'danger'
          ? theme.danger
          : tone === 'neutral'
            ? theme.surfaceAlt
            : theme.primary;

  const background =
    variant === 'primary'
      ? toneColor
      : variant === 'danger'
        ? theme.danger
        : variant === 'outline' || variant === 'ghost'
          ? 'transparent'
          : toneColor;

  const borderColor = variant === 'outline' ? theme.border : tone === 'neutral' ? theme.border : 'transparent';
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? tone === 'neutral'
        ? theme.text
        : '#fff'
      : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor,
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
          shadowOpacity: variant === 'primary' && !disabled ? 0.15 : 0,
          shadowColor: background,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 14,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={18} color={textColor} style={{ marginRight: 8 }} />}
          <Text style={[styles.text, { color: textColor }]}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
});
