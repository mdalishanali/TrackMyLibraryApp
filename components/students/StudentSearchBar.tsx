import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/app-button';
import { spacing, radius, typography } from '@/constants/design';

export default function StudentSearchBar({ search, setSearch, onAdd, theme }) {
  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.muted} />
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
        fullWidth={false}
        variant="primary"
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
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 48,
    alignItems: 'center',
    gap: spacing.sm,
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
  },
});
