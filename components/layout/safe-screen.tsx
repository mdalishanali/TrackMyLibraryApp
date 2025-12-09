import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { themeFor } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = PropsWithChildren<{
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}>;

/**
 * Consistent SafeArea wrapper used across screens to avoid notch overlap.
 */
export function SafeScreen({ children, backgroundColor, edges = ['top', 'bottom'] }: Props) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backgroundColor ?? theme.background }]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
