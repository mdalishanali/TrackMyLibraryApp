import { View, TextInput, StyleSheet } from 'react-native';
import { AppButton } from '@/components/ui/app-button';
import { spacing, radius } from '@/constants/design';

export default function StudentSearchBar({ search, setSearch, onAdd, theme }) {
    return (
        <View style={styles.row}>
            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search students"
                placeholderTextColor={theme.muted}
                style={[
                    styles.input,
                    {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: theme.border,
                        color: theme.text
                    }
                ]}
            />

            <AppButton
                onPress={onAdd}
                style={styles.addButton}
            >
                Add
            </AppButton>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        height: 44,
        fontSize: 15,
    },
    addButton: {
        height: 44,
        borderRadius: radius.lg,
    }
});
