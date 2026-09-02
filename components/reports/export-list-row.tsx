import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  isBusy?: boolean;
  disabled?: boolean;
  /** Rows after the first draw a top divider so lists read as one card. */
  showDivider?: boolean;
};

/** One export entry inside a Reports & Exports card: icon, labels, action. */
export function ExportListRow({
  icon,
  color,
  title,
  subtitle,
  onPress,
  isBusy,
  disabled,
  showDivider,
}: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isBusy}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
      </View>
      {isBusy ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : (
        <Ionicons name="download-outline" size={22} color={theme.primary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.size.xs,
    fontWeight: '500',
  },
});
