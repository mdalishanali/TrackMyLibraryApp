import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  message?: string;
};

export function FullScreenLoader({ message = 'Loading...' }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  return (
    <View style={styles.container} accessible accessibilityLabel={message}>
      <ActivityIndicator size="large" color={tint} />
      <Text style={[styles.text, { color: Colors[colorScheme].text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});
