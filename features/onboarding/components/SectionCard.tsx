import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { MAX_TOTAL_SEATS, SEAT_COUNT_PRESETS } from '../constants';
import type { PlannedSection } from '../types';

type Props = {
  index: number;
  name: string;
  startSeat: string;
  endSeat: string;
  planned: PlannedSection;
  canRemove: boolean;
  autoFocusName: boolean;
  onChangeName: (value: string) => void;
  onChangeStartSeat: (value: string) => void;
  onChangeEndSeat: (value: string) => void;
  onRemove: () => void;
};

/** 500 is the highest valid seat number, so three digits is always enough. */
const SEAT_INPUT_MAX_LENGTH = String(MAX_TOTAL_SEATS).length;

export function SectionCard({
  index,
  name,
  startSeat,
  endSeat,
  planned,
  canRemove,
  autoFocusName,
  onChangeName,
  onChangeStartSeat,
  onChangeEndSeat,
  onRemove,
}: Props) {
  const theme = useTheme();

  const hasSeats = planned.seatCount > 0;

  /** Chips mean "this many seats", so they set the end relative to the start. */
  const handlePresetPress = (seatCount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const start = Number.parseInt(startSeat, 10);
    const safeStart = Number.isNaN(start) || start < 1 ? 1 : start;

    if (Number.isNaN(start) || start < 1) {
      onChangeStartSeat(String(safeStart));
    }

    onChangeEndSeat(String(Math.min(safeStart + seatCount - 1, MAX_TOTAL_SEATS)));
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove();
  };

  return (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.indexBadge, { backgroundColor: theme.primary + '18' }]}>
          <Text style={[styles.indexText, { color: theme.primary }]}>{index + 1}</Text>
        </View>

        <View style={styles.nameGroup}>
          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder="Section name"
            placeholderTextColor={theme.muted + '80'}
            autoFocus={autoFocusName}
            maxLength={40}
            style={[styles.nameInput, { color: theme.text }]}
            selectionColor={theme.primary}
          />

          {/* Signals the name is editable rather than a fixed label. */}
          <Ionicons name="pencil" size={13} color={theme.muted} />
        </View>

        {canRemove ? (
          <Pressable
            onPress={handleRemove}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${name || 'section'}`}
            style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={18} color={theme.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.rangeInputs}>
        <View style={styles.rangeField}>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>START SEAT</Text>
          <TextInput
            value={startSeat}
            onChangeText={onChangeStartSeat}
            placeholder="1"
            placeholderTextColor={theme.muted + '50'}
            keyboardType="number-pad"
            maxLength={SEAT_INPUT_MAX_LENGTH}
            style={[
              styles.seatInput,
              { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
            selectionColor={theme.primary}
          />
        </View>

        <Text style={[styles.rangeDash, { color: theme.muted }]}>–</Text>

        <View style={styles.rangeField}>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>END SEAT</Text>
          <TextInput
            value={endSeat}
            onChangeText={onChangeEndSeat}
            placeholder="0"
            placeholderTextColor={theme.muted + '50'}
            keyboardType="number-pad"
            maxLength={SEAT_INPUT_MAX_LENGTH}
            style={[
              styles.seatInput,
              { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
            selectionColor={theme.primary}
          />
        </View>
      </View>

      <View style={styles.chipRow}>
        {SEAT_COUNT_PRESETS.map((preset) => {
          const isActive = hasSeats && planned.seatCount === preset;

          return (
            <Pressable
              key={preset}
              onPress={() => handlePresetPress(preset)}
              accessibilityRole="button"
              accessibilityLabel={`Set ${preset} seats`}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isActive ? theme.primary : theme.surfaceAlt,
                  borderColor: isActive ? theme.primary : theme.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, { color: isActive ? '#ffffff' : theme.muted }]}>
                {preset}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {hasSeats ? (
        <View style={styles.totalRow}>
          <Ionicons name="grid-outline" size={13} color={theme.primary} />
          <Text style={[styles.totalText, { color: theme.primary }]}>
            {planned.seatCount} {planned.seatCount === 1 ? 'seat' : 'seats'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: typography.size.sm,
    fontWeight: '800',
  },
  nameGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameInput: {
    flexShrink: 1,
    fontSize: typography.size.lg,
    fontWeight: '700',
    padding: 0,
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  rangeField: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  seatInput: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rangeDash: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    paddingBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  chipText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  totalText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
});
