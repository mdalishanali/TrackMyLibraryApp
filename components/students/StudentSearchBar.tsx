import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/app-button';
import { spacing, radius, typography } from '@/constants/design';

export default function StudentSearchBar({ search, setSearch, onAdd, theme }) {
  return (
    <View style={[styles.wrapper, { backgroundColor: theme.surface }]}>
      <View style={[styles.container, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search students"
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text }]}
        />
        {search?.length ? (
          <Ionicons
            name="close-circle"
            size={18}
            color={theme.muted}
            onPress={() => setSearch('')}
          />
        ) : null}
      </View>

      <AppButton
        onPress={onAdd}
        fullWidth={false}
        variant="primary"
        style={styles.addButton}
      >
        + Add
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  container: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 52,
    alignItems: 'center',
    gap: spacing.sm,
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
  },
  addButton: {
    height: 52,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
