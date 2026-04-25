import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { radius, shadows, spacing, themeFor } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CardProps = PropsWithChildren<ViewProps> & {
  padded?: boolean;
};

export function AppCard({ children, style, padded = true, ...rest }: CardProps) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        padded && styles.padded,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  padded: {
    padding: spacing.md,
  },
});
