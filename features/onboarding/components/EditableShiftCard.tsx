import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/utils/format';

type Props = {
  index: number;
  name: string;
  startTime: string;
  endTime: string;
  price: string;
  onChangeName: (value: string) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onChangePrice: (value: string) => void;
  onRemove: () => void;
};

const MAX_NAME_LENGTH = 30;
const MAX_PRICE_LENGTH = 6;

const toPickerDate = (time: string) => {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
};

const toTimeString = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function EditableShiftCard({
  index,
  name,
  startTime,
  endTime,
  price,
  onChangeName,
  onChangeStartTime,
  onChangeEndTime,
  onChangePrice,
  onRemove,
}: Props) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const [openPicker, setOpenPicker] = useState<'start' | 'end' | null>(null);

  const handleTimeChange = (_event: unknown, selected?: Date) => {
    if (selected) {
      const time = toTimeString(selected);

      if (openPicker === 'start') {
        onChangeStartTime(time);
      } else {
        onChangeEndTime(time);
      }
    }

    if (Platform.OS === 'android') {
      setOpenPicker(null);
    }
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove();
  };

  const openTimePicker = (which: 'start' | 'end') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenPicker((current) => (current === which ? null : which));
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.indexBadge, { backgroundColor: theme.primary + '18' }]}>
          <Text style={[styles.indexText, { color: theme.primary }]}>{index + 1}</Text>
        </View>

        <View style={styles.nameGroup}>
          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder="Shift name"
            placeholderTextColor={theme.muted + '80'}
            maxLength={MAX_NAME_LENGTH}
            style={[styles.nameInput, { color: theme.text }]}
            selectionColor={theme.primary}
          />

          {/* Signals the name is editable — without it the card reads as a
              fixed label rather than a form field. */}
          <Ionicons name="pencil" size={13} color={theme.muted} />
        </View>

        <Pressable
          onPress={handleRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name || 'shift'}`}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={18} color={theme.muted} />
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.timeRow}>
        {(['start', 'end'] as const).map((which) => {
          const isOpen = openPicker === which;

          return (
            <Pressable
              key={which}
              onPress={() => openTimePicker(which)}
              accessibilityRole="button"
              accessibilityLabel={`Change ${which} time`}
              style={({ pressed }) => [
                styles.timeField,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: isOpen ? theme.primary : theme.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>
                {which === 'start' ? 'STARTS' : 'ENDS'}
              </Text>
              <Text style={[styles.timeValue, { color: theme.text }]}>
                {formatTime(which === 'start' ? startTime : endTime)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {openPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            value={toPickerDate(openPicker === 'start' ? startTime : endTime)}
            onChange={handleTimeChange}
          />

          {Platform.OS === 'ios' ? (
            <AppButton variant="outline" onPress={() => setOpenPicker(null)} fullWidth>
              Done
            </AppButton>
          ) : null}
        </View>
      ) : null}

      <View style={styles.priceRow}>
        <Text style={[styles.fieldLabel, { color: theme.muted }]}>MONTHLY FEE</Text>

        <View style={styles.priceInputGroup}>
          <Text style={[styles.currency, { color: theme.muted }]}>₹</Text>
          <TextInput
            value={price}
            onChangeText={(value) => onChangePrice(value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            placeholderTextColor={theme.muted + '50'}
            keyboardType="number-pad"
            maxLength={MAX_PRICE_LENGTH}
            style={[styles.priceInput, { color: theme.text }]}
            selectionColor={theme.primary}
          />
        </View>
      </View>
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
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timeValue: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  pickerWrap: {
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  currency: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  priceInput: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 70,
    padding: 0,
  },
});
