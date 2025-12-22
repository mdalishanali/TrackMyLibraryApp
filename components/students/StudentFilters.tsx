import { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing, radius, typography } from '@/constants/design';

const FILTERS = [
  { value: 'recent', label: 'Recent', icon: 'time-outline' },
  { value: 'paid', label: 'Paid', icon: 'checkmark-done-outline' },
  { value: 'dues', label: 'Dues', icon: 'alert-circle-outline' },
  { value: 'trial', label: 'Trial', icon: 'flask-outline' },
  { value: 'defaulter', label: 'Defaulter', icon: 'alert-circle-outline' },
  { value: 'active', label: 'Active', icon: 'people-outline' },
  { value: 'inactive', label: 'Inactive', icon: 'pause-circle-outline' },
  { value: 'unallocated', label: 'Unallocated', icon: 'cube-outline' },
];

const StudentFilters = memo(({ selected, setSelected, theme }: { selected: string; setSelected: (v: string) => void; theme: any }) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        {FILTERS.map(({ value, label, icon }) => {
          const active = selected === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => setSelected(value)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.surfaceAlt,
                  borderColor: active ? theme.primary : theme.border,
                  shadowColor: active ? theme.primary : 'transparent',
                  shadowOpacity: active ? 0.18 : 0,
                  shadowRadius: active ? 8 : 0,
                  shadowOffset: { width: 0, height: active ? 4 : 0 },
                },
              ]}
            >
              <Ionicons
                name={icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={active ? '#fff' : theme.text}
              />
              <Text
                style={{
                  color: active ? '#fff' : theme.text,
                  fontWeight: '700',
                  fontSize: typography.size.sm,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

export default StudentFilters;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
