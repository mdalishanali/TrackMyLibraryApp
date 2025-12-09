import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

type Props = PropsWithChildren<{
  tone?: Tone;
  style?: ViewStyle;
}>;

export function AppBadge({ children, tone = 'default', style }: Props) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  const background =
    tone === 'success'
      ? theme.primarySoft
      : tone === 'warning'
        ? theme.warning
        : tone === 'danger'
          ? theme.danger
          : tone === 'info'
            ? theme.info
            : theme.border;

  const textColor = tone === 'default' ? theme.text : '#fff';

  return (
    <View style={[styles.container, { backgroundColor: background }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
});
