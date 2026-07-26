import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/utils/format';
import { CUSTOM_SHIFT_TEMPLATE, SHIFT_PRESETS } from '../constants';

type Template = { name: string; startTime: string; endTime: string };

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
};

/**
 * Templates only seed a new card — every field stays editable afterwards, so
 * picking the closest match is always safe.
 */
export function ShiftTemplateSheet({ isVisible, onClose, onSelect }: Props) {
  const theme = useTheme();

  const handleSelect = (template: Template) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(template);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Add a shift</Text>

            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={theme.muted} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Pick a starting point — you can rename it and change the times after.
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => handleSelect(CUSTOM_SHIFT_TEMPLATE)}
              accessibilityRole="button"
              accessibilityLabel="Add a custom shift"
              style={({ pressed }) => [
                styles.row,
                styles.customRow,
                { borderColor: theme.primary, backgroundColor: theme.primary + '0D' },
                pressed && { backgroundColor: theme.surfaceAlt },
              ]}
            >
              <View style={styles.rowLabel}>
                <Text style={[styles.rowName, { color: theme.primary }]}>Custom shift</Text>
                <Text style={[styles.rowTime, { color: theme.muted }]}>
                  Set your own name and timings
                </Text>
              </View>

              <Ionicons name="create-outline" size={22} color={theme.primary} />
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerLabel, { color: theme.muted }]}>OR START FROM</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {SHIFT_PRESETS.map((preset) => (
              <Pressable
                key={preset.name}
                onPress={() => handleSelect(preset)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${preset.name}`}
                style={({ pressed }) => [
                  styles.row,
                  { borderColor: theme.border },
                  pressed && { backgroundColor: theme.surfaceAlt },
                ]}
              >
                <View style={styles.rowLabel}>
                  <Text style={[styles.rowName, { color: theme.text }]}>{preset.name}</Text>
                  <Text style={[styles.rowTime, { color: theme.muted }]}>
                    {formatTime(preset.startTime)} – {formatTime(preset.endTime)}
                  </Text>
                </View>

                <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.xs,
  },
  customRow: {
    borderStyle: 'dashed',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rowLabel: {
    gap: 2,
  },
  rowName: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  rowTime: {
    fontSize: typography.size.xs,
    fontWeight: '500',
  },
});
