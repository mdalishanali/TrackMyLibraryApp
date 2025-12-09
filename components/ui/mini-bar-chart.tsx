import { View, StyleSheet, Text } from 'react-native';

import { spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Datum = { label: string; value: number };

type Props = {
  data: Datum[];
  height?: number;
};

export function MiniBarChart({ data, height = 140 }: Props) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.container, { height }]}>
      {data.map((item) => {
        const barHeight = Math.max((item.value / max) * (height - 32), 4);
        return (
          <View key={item.label} style={styles.barItem}>
            <View style={[styles.bar, { height: barHeight, backgroundColor: theme.primary }]} />
            <Text style={[styles.label, { color: theme.muted }]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  barItem: {
    alignItems: 'center',
    width: 32,
  },
  bar: {
    width: 22,
    borderRadius: 8,
  },
  label: {
    marginTop: 4,
    fontSize: typography.size.xs,
  },
});
