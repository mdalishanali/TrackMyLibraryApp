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
                contentContainerStyle={styles.row}
                bounces={false}
            >
                {FILTERS.map((item) => {
                    const isActive = selected === item;

                    return (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setSelected(item)}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: isActive ? theme.primary : theme.surfaceAlt,
                                    borderColor: isActive ? theme.primary : theme.border
                                }
                            ]}
                        >
                            <Text
                                style={{
                                    color: isActive ? '#fff' : theme.text,
                                    fontWeight: '600',
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
    },
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.xs,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.lg,
        borderWidth: 1,
    },
});
