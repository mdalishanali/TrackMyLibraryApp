import { View, TextInput, StyleSheet } from 'react-native';
import { AppButton } from '@/components/ui/app-button';
import { spacing, radius } from '@/constants/design';

export default function StudentSearchBar({ search, setSearch, onAdd, theme }) {
    return (
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: theme.border
                    }
                ]}
            >
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search students"
                    placeholderTextColor={theme.muted}
                    style={[styles.input, { color: theme.text }]}
                />
            </View>

            <AppButton
                onPress={onAdd}
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                textStyle={{ fontSize: 15 }}
            >
                Add
            </AppButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xs,
        marginBottom: spacing.sm
    },
    inputWrapper: {
        flex: 1,
        borderRadius: radius.lg,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        height: 48,
        justifyContent: 'center'
    },
    input: {
        fontSize: 15
    },
    addButton: {
        height: 48,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.lg,
        justifyContent: 'center'
    }
});
