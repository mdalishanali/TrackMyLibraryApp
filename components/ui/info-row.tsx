import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  icon?: ReactNode;
  label: string;
  value?: string | number | null;
};

export function InfoRow({ icon, label, value }: Props) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  return (
    <View style={styles.row}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  icon: {
    width: 16,
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  value: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
});
