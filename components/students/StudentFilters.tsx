import { memo } from 'react';
import { ScrollView, Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePostHog } from 'posthog-react-native';

import { spacing, radius, typography } from '@/constants/design';

const FILTERS = [
  { value: 'recent', label: 'Recent', icon: 'time-outline' },
  { value: 'paid', label: 'Paid', icon: 'checkmark-done-outline' },
  { value: 'dues', label: 'Dues', icon: 'alert-circle-outline' },
  { value: 'trial', label: 'Trial', icon: 'flask-outline' },
  { value: 'active', label: 'Active', icon: 'people-outline' },
  { value: 'inactive', label: 'Inactive', icon: 'close-circle-outline' },
  { value: 'unallocated', label: 'Unallocated', icon: 'cube-outline' },
];

const StudentFilters = memo(({ selected, setSelected, theme }: { selected: string; setSelected: (v: string) => void; theme: any }) => {
  const posthog = usePostHog();

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
            <Pressable
              key={value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                posthog?.capture('student_filter_applied', { filter: value });
                setSelected(value);
              }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: active ? theme.primary : '#000',
                  shadowOpacity: active ? 0.2 : 0.03,
                  shadowRadius: active ? 10 : 4,
                  shadowOffset: { width: 0, height: 4 },
                },
                active && styles.activeChip
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
                  fontWeight: '800',
                  fontSize: 13,
                  letterSpacing: 0.3,
                }}
              >
                {label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

export default StudentFilters;

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.xl,
    paddingRight: 40,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  activeChip: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  }
});
