import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AddUserModal } from '@/components/users/add-user-modal';
import { spacing } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { useScreenView } from '@/hooks/use-screen-view';
import {
  useCreateUser,
  useDeleteUser,
  useUsersQuery,
  UserPayload,
  UserRecord,
  UserRole,
} from '@/hooks/use-users';
import { getErrorMessage } from '@/hooks/use-auth-mutations';
import { showToast } from '@/lib/toast';

const ROLE_TINTS: Record<UserRole, string> = {
  Admin: '#6366F1',
  Manager: '#F97316',
};

export default function UsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const usersQuery = useUsersQuery();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  useScreenView('Users');

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.contactNumber ?? '').includes(query)
    );
  }, [usersQuery.data, searchTerm]);

  const handleAddUser = async (payload: UserPayload) => {
    try {
      await createUser.mutateAsync(payload);
      setIsAddModalOpen(false);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser.mutateAsync(userToDelete._id);
      showToast('User deleted', 'success');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <SafeScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={[theme.primary + '10', 'transparent']} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>User Management</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
              Control who can access this library
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsAddModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <View
          style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="search" size={18} color={theme.muted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users..."
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <Pressable onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={18} color={theme.muted} />
            </Pressable>
          )}
        </View>

        {usersQuery.isLoading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconBox, { backgroundColor: theme.primary + '10' }]}>
                  <Ionicons name="people-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {searchTerm ? 'No users found' : 'No team members yet'}
                </Text>
                <Text style={[styles.emptyDesc, { color: theme.muted }]}>
                  {searchTerm
                    ? 'Try adjusting your search.'
                    : 'Add staff so they can manage this library with you.'}
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <UserCard
                user={item}
                index={index}
                onDelete={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setUserToDelete(item);
                }}
              />
            )}
          />
        )}

        <AddUserModal
          visible={isAddModalOpen}
          isSubmitting={createUser.isPending}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddUser}
        />

        <ConfirmDialog
          visible={!!userToDelete}
          title="Delete user?"
          description={`${userToDelete?.name ?? 'This user'} will lose access to this library. This action cannot be undone.`}
          confirmText="Delete"
          onCancel={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteUser.isPending}
          destructive
        />
      </View>
    </SafeScreen>
  );
}

type UserCardProps = {
  user: UserRecord;
  index: number;
  onDelete: () => void;
};

function UserCard({ user, index, onDelete }: UserCardProps) {
  const theme = useTheme();
  const roleTint = ROLE_TINTS[user.role] ?? theme.primary;
  const ENTER_STAGGER_MS = 60;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * ENTER_STAGGER_MS)}
      style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={[styles.avatarBox, { backgroundColor: roleTint + '15' }]}>
        <Text style={[styles.avatarText, { color: roleTint }]}>
          {(user.name || 'U').slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userMeta}>
        <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={[styles.userDetail, { color: theme.muted }]} numberOfLines={1}>
          {user.email}
        </Text>
        <Text style={[styles.userDetail, { color: theme.muted }]} numberOfLines={1}>
          {user.contactNumber || 'N/A'}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: roleTint + '15' }]}>
          <Text style={[styles.roleText, { color: roleTint }]}>{(user.role || 'Admin').toUpperCase()}</Text>
        </View>
      </View>
      <Pressable
        onPress={onDelete}
        style={({ pressed }) => [
          styles.deleteBtn,
          { backgroundColor: theme.danger + '10' },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="trash-outline" size={18} color={theme.danger} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  userMeta: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
  },
  userDetail: {
    fontSize: 13,
    fontWeight: '500',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
