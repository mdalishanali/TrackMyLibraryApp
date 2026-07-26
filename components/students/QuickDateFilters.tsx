import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { spacing } from '@/constants/design';

interface QuickDateFiltersProps {
  theme: any;
  quickFilter: string | undefined;
  onSelect: (val: string | undefined) => void;
  customAgo: string;
  setCustomAgo: (val: string) => void;
  customIn: string;
  setCustomIn: (val: string) => void;
  onClear: () => void;
}

const QUICK_OPTIONS = [
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'In 3 Days', value: '3' },
  { label: 'In 7 Days', value: '7' },
];

const QuickDateFilters = memo(({ 
  theme, 
  quickFilter, 
  onSelect, 
  customAgo, 
  setCustomAgo, 
  customIn, 
  setCustomIn,
  onClear 
}: QuickDateFiltersProps) => {
  return (
    <View style={[styles.daysFilterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={[styles.px_xl, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="sparkles" size={12} color={theme.primary} />
          <Text style={[styles.daysLabel, { color: theme.muted }]}>QUICK DATE:</Text>
        </View>
        {quickFilter && (
          <TouchableOpacity onPress={onClear}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#ff4444' }}>CLEAR</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScroll}
      >
        {/* 1. PREVIOUS CUSTOM INPUT */}
        <View style={[
          styles.daysChip,
          {
            backgroundColor: (quickFilter?.startsWith('-') && quickFilter !== 'yesterday') ? theme.primary : theme.surfaceAlt,
            borderColor: (quickFilter?.startsWith('-') && quickFilter !== 'yesterday') ? theme.primary : theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            gap: 4
          }
        ]}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: (quickFilter?.startsWith('-') && quickFilter !== 'yesterday') ? '#fff' : theme.muted }}>Previous</Text>
          <TextInput
            placeholder="Days"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
            value={customAgo}
            onChangeText={(v) => {
              const cleanV = v.replace(/[^0-9]/g, '');
              setCustomAgo(cleanV);
              setCustomIn('');
              if (cleanV && !isNaN(parseInt(cleanV, 10))) {
                onSelect('-' + cleanV);
              } else if (!cleanV) {
                onSelect(undefined);
              }
            }}
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: (quickFilter?.startsWith('-') && quickFilter !== 'yesterday') ? '#fff' : theme.text,
              minWidth: 30,
            }}
          />
        </View>

        {/* 2. Yesterday & Today */}
        {QUICK_OPTIONS.slice(0, 2).map(op => (
          <TouchableOpacity
            key={op.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(quickFilter === op.value ? undefined : op.value);
              setCustomAgo('');
              setCustomIn('');
            }}
            style={[
              styles.daysChip,
              {
                backgroundColor: quickFilter === op.value ? theme.primary : theme.surfaceAlt,
                borderColor: quickFilter === op.value ? theme.primary : theme.border,
                minWidth: 80,
                alignItems: 'center',
              }
            ]}
          >
            <Text style={[styles.daysText, { color: quickFilter === op.value ? '#fff' : theme.text }]}>{op.label}</Text>
          </TouchableOpacity>
        ))}

        {/* 3. FUTURE CUSTOM INPUT (Now after Today) */}
        <View style={[
          styles.daysChip,
          {
            backgroundColor: (!QUICK_OPTIONS.some(o => o.value === quickFilter) && quickFilter && !quickFilter.startsWith('-') && quickFilter !== 'yesterday' && quickFilter !== 'tomorrow' && quickFilter !== 'today') ? theme.primary : theme.surfaceAlt,
            borderColor: (!QUICK_OPTIONS.some(o => o.value === quickFilter) && quickFilter && !quickFilter.startsWith('-') && quickFilter !== 'yesterday' && quickFilter !== 'tomorrow' && quickFilter !== 'today') ? theme.primary : theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            gap: 4
          }
        ]}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: (!QUICK_OPTIONS.some(o => o.value === quickFilter) && quickFilter && !quickFilter.startsWith('-') && quickFilter !== 'yesterday' && quickFilter !== 'tomorrow' && quickFilter !== 'today') ? '#fff' : theme.muted }}>Future</Text>
          <TextInput
            placeholder="Days"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
            value={customIn}
            onChangeText={(v) => {
              const cleanV = v.replace(/[^0-9]/g, '');
              setCustomIn(cleanV);
              setCustomAgo('');
              if (cleanV && !isNaN(parseInt(cleanV, 10))) {
                onSelect(cleanV);
              } else if (!cleanV) {
                onSelect(undefined);
              }
            }}
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: (!QUICK_OPTIONS.some(o => o.value === quickFilter) && quickFilter && !quickFilter.startsWith('-') && quickFilter !== 'yesterday' && quickFilter !== 'tomorrow' && quickFilter !== 'today') ? '#fff' : theme.text,
              minWidth: 30,
            }}
          />
        </View>

        {/* 4. Rest of the static options (Tomorrow, In 3 Days, etc.) */}
        {QUICK_OPTIONS.slice(2).map(op => (
          <TouchableOpacity
            key={op.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(quickFilter === op.value ? undefined : op.value);
              setCustomAgo('');
              setCustomIn('');
            }}
            style={[
              styles.daysChip,
              {
                backgroundColor: quickFilter === op.value ? theme.primary : theme.surfaceAlt,
                borderColor: quickFilter === op.value ? theme.primary : theme.border,
                minWidth: 80,
                alignItems: 'center',
              }
            ]}
          >
            <Text style={[styles.daysText, { color: quickFilter === op.value ? '#fff' : theme.text }]}>{op.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

export default QuickDateFilters;

const styles = StyleSheet.create({
  px_xl: { paddingHorizontal: spacing.xl },
  daysFilterContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  daysLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  daysScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    gap: 8,
    paddingRight: 40,
  },
  daysChip: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  daysText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
