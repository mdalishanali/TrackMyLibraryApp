import { memo, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';

import { spacing, radius, typography } from '@/constants/design';

interface StudentSearchBarProps {
  search: string;
  setSearch: (text: string) => void;
  theme: any;
}

const StudentSearchBar = memo(({ search, setSearch, theme }: StudentSearchBarProps) => {
  const posthog = usePostHog();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Debounce search tracking - only track after user stops typing for 500ms
    if (search && search.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        posthog?.capture('student_searched', { query_length: search.length });
      }, 500);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, posthog]);

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceAlt + '40', borderColor: theme.border }]}>
      <Ionicons name="search" size={20} color={theme.primary} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search members by name..."
        placeholderTextColor={theme.muted}
        style={[styles.input, { color: theme.text }]}
        selectionColor={theme.primary}
      />
      {search?.length ? (
        <TouchableOpacity 
          onPress={() => {
            posthog?.capture('search_cleared');
            setSearch('');
          }}
          style={styles.clearBtn}
        >
          <Ionicons name="close-circle" size={20} color={theme.muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

export default StudentSearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 4,
  },
});
