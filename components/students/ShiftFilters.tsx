import { memo } from 'react';
import { ScrollView, Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { spacing } from '@/constants/design';
import { Shift } from '@/types/api';

interface ShiftFiltersProps {
  shifts: Shift[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  theme: any;
}

const ShiftFilters = memo(({ shifts, selectedId, onSelect, theme }: ShiftFiltersProps) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(undefined);
          }}
          style={[
            styles.chip,
            {
              backgroundColor: !selectedId ? theme.primary : theme.surfaceAlt,
              borderColor: !selectedId ? theme.primary : theme.border,
            }
          ]}
        >
          <Text style={[styles.label, { color: !selectedId ? '#fff' : theme.text }]}>ALL SHIFTS</Text>
        </Pressable>

        {shifts.map((shift) => (
          <Pressable
            key={shift._id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(selectedId === shift._id ? undefined : shift._id);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: selectedId === shift._id ? theme.primary : theme.surfaceAlt,
                borderColor: selectedId === shift._id ? theme.primary : theme.border,
              }
            ]}
          >
            <Ionicons 
              name={shift.isFullDay ? "sunny" : "partly-sunny"} 
              size={14} 
              color={selectedId === shift._id ? "#fff" : theme.muted} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.label, { color: selectedId === shift._id ? '#fff' : theme.text }]}>
              {shift.name.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});

export default ShiftFilters;

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 4,
  },
  row: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    gap: 8,
    paddingRight: 40,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
