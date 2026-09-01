import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { DueStudentRow } from '@/components/whatsapp/due-student-row';
import { radius, spacing, typography } from '@/constants/design';
import {
  useAutomationSettings,
  useDueStudents,
  useSendSelectedReminders,
  type DueStudent,
} from '@/hooks/use-whatsapp';
import { useScreenView } from '@/hooks/use-screen-view';
import { useTheme } from '@/hooks/use-theme';
import { showToast } from '@/lib/toast';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Due Today' },
  { key: '3day', label: 'In 3 Days' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function WhatsappStudentSelect() {
  const theme = useTheme();
  const router = useRouter();
  const { data: students, isLoading } = useDueStudents();
  const { data: settings } = useAutomationSettings();
  const sendSelected = useSendSelectedReminders();

  useScreenView('WhatsappStudentSelect');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (students ?? []).filter((student) => {
      if (filter !== 'all' && student.reminderType !== filter) return false;
      if (!query) return true;
      return (
        student.name.toLowerCase().includes(query) || student.number.includes(query)
      );
    });
  }, [students, filter, search]);

  const countFor = (key: FilterKey) =>
    key === 'all'
      ? (students ?? []).length
      : (students ?? []).filter((student) => student.reminderType === key).length;

  const isAllVisibleSelected =
    visibleStudents.length > 0 && visibleStudents.every((student) => selectedIds.has(student._id));

  const toggleStudent = (id: string) => {
    Haptics.selectionAsync();
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (isAllVisibleSelected) {
        visibleStudents.forEach((student) => next.delete(student._id));
      } else {
        visibleStudents.forEach((student) => next.add(student._id));
      }
      return next;
    });
  };

  const handleSend = async () => {
    setShowConfirm(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const result = await sendSelected.mutateAsync([...selectedIds]);
      const skippedNote = result.skipped > 0 ? ` (${result.skipped} paid-up, skipped)` : '';
      showToast(`Sending to ${result.queued} students...${skippedNote}`, 'success');
      router.back();
    } catch {
      showToast('Failed to send reminders', 'error');
    }
  };

  const credits = settings?.whatsappCredits ?? 0;
  const selectedCount = selectedIds.size;
  const hasEnoughCredits = credits >= selectedCount;

  const renderRow = ({ item }: { item: DueStudent }) => (
    <DueStudentRow student={item} isSelected={selectedIds.has(item._id)} onToggle={toggleStudent} />
  );

  return (
    <SafeScreen>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Select Students</Text>
        <Pressable onPress={toggleSelectAllVisible} hitSlop={10} disabled={visibleStudents.length === 0}>
          <Text style={[styles.selectAll, { color: theme.primary }]}>
            {isAllVisibleSelected ? 'Clear' : 'Select all'}
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.muted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by name or phone"
          placeholderTextColor={theme.muted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      {/* Filter chips — horizontal scroll so the last chip never clips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroller}
      >
        {FILTERS.map(({ key, label }) => {
          const isActive = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? theme.primary : theme.surfaceAlt,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: isActive ? '#fff' : theme.muted }]}>
                {label} · {countFor(key)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <FlatList
          data={visibleStudents}
          keyExtractor={(item) => item._id}
          renderItem={renderRow}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              theme={theme}
              icon="checkmark-done-circle-outline"
              title="No students due"
              subtitle={
                search || filter !== 'all'
                  ? 'No due students match this search or filter.'
                  : 'Everyone is paid up — nothing to remind. 🎉'
              }
            />
          }
        />
      )}

      {/* Sticky send bar */}
      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <Text style={[styles.creditsHint, { color: hasEnoughCredits ? theme.muted : theme.warning }]}>
          {selectedCount > 0
            ? `Uses ${selectedCount} ${selectedCount === 1 ? 'credit' : 'credits'} · ${credits} available`
            : `${credits} credits available`}
        </Text>
        <AppButton
          fullWidth
          icon="send-outline"
          onPress={() => setShowConfirm(true)}
          disabled={selectedCount === 0 || sendSelected.isPending}
          loading={sendSelected.isPending}
        >
          {selectedCount > 0
            ? `Send to ${selectedCount} ${selectedCount === 1 ? 'Student' : 'Students'}`
            : 'Select students to send'}
        </AppButton>
      </View>

      <ConfirmDialog
        visible={showConfirm}
        title={`Send to ${selectedCount} ${selectedCount === 1 ? 'student' : 'students'}?`}
        description="WhatsApp fee reminders will be sent to the selected students now. This cannot be undone."
        confirmText="Send Now"
        cancelText="Cancel"
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleSend}
        loading={sendSelected.isPending}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  selectAll: {
    fontSize: typography.size.sm,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: '500',
  },
  chipScroller: {
    // The scroller must keep its content height — without flexShrink: 0 the
    // list below squeezes it flat and the chip labels clip away.
    flexGrow: 0,
    flexShrink: 0,
  },
  list: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  loader: {
    marginTop: spacing.xxl,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  creditsHint: {
    textAlign: 'center',
    fontSize: typography.size.xs,
    fontWeight: '600',
  },
});
