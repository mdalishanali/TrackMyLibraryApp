import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SectionHeader({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
});
