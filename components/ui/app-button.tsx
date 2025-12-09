import { PropsWithChildren } from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';

type Props = PropsWithChildren<{
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
}>;

export function AppButton({
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  fullWidth,
}: Props) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  const background =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.danger
        : variant === 'outline' || variant === 'ghost'
          ? 'transparent'
          : theme.primary;

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
          opacity: disabled || loading || pressed ? 0.8 : 1,
          width: fullWidth ? '100%' : undefined,
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
