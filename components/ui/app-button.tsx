import { PropsWithChildren } from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text } from 'react-native';

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
}>;

export function AppButton({
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  fullWidth,
  tone = 'primary',
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
            ? theme.text
            : theme.primary;

  const background =
    variant === 'primary'
      ? toneColor
      : variant === 'danger'
        ? theme.danger
        : variant === 'outline' || variant === 'ghost'
          ? 'transparent'
          : toneColor;

  const borderColor = variant === 'outline' ? theme.border : 'transparent';
  const textColor = variant === 'primary' || variant === 'danger' ? '#fff' : theme.text;

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
      ]}>
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{children}</Text>}
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
  text: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
});
