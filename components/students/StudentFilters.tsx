import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { spacing, radius } from '@/constants/design';

const FILTERS = [
    'recent',
    'paid',
    'dues',
    'trial',
    'defaulter',
    'active',
    'inactive',
    'unallocated'
];

export default function StudentFilters({ selected, setSelected, theme }) {
    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.row}
            >
                {FILTERS.map(item => {
                    const active = selected === item;
                    return (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setSelected(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: active ? theme.primary : theme.surfaceAlt,
                                    borderColor: active ? theme.primary : theme.border
                                }
                            ]}
                        >
                            <Text
                                style={{
                                    color: active ? '#fff' : theme.text,
                                    fontWeight: '600'
                                }}
                            >
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.md,
        paddingVertical: spacing.xs
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xs
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
        borderWidth: 1
    }
});
