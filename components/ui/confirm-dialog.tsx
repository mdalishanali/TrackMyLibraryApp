import { Modal, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
};

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive,
  loading,
}: Props) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {description ? <Text style={[styles.description, { color: theme.muted }]}>{description}</Text> : null}
          <View style={styles.actions}>
            <AppButton variant="outline" onPress={onCancel} fullWidth>
              {cancelText}
            </AppButton>
            <AppButton
              onPress={onConfirm}
              fullWidth
              tone={destructive ? 'danger' : 'primary'}
              loading={loading}
              disabled={loading}
            >
              {confirmText}
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  description: {
    fontSize: typography.size.md,
  },
  actions: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
