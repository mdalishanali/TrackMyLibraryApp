import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing, typography } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { useCreateUser, useDeleteUser, useUsersQuery } from '@/hooks/use-users';

export default function UsersScreen() {
  const theme = useTheme();
  const usersQuery = useUsersQuery();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const onAddUser = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      await createUser.mutateAsync({ name, email, contactNumber: phone, password });
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const onDeleteUser = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SectionHeader>Users</SectionHeader>
        <AppCard style={styles.form}>
          <Text style={[styles.label, { color: theme.text }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
          <TextInput value={phone} onChangeText={setPhone} style={[styles.input, { borderColor: theme.border, color: theme.text }]} />
          <Text style={[styles.label, { color: theme.text }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <AppButton onPress={onAddUser} loading={createUser.isPending}>
            Add User
          </AppButton>
        </AppCard>

        <FlatList
          data={usersQuery.data ?? []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md }}
          renderItem={({ item }) => (
            <AppCard padded style={{ gap: spacing.xs }}>
              <Text style={[styles.title, { color: theme.text }]}>{item.name}</Text>
              <Text style={{ color: theme.muted }}>{item.email}</Text>
              <Text style={{ color: theme.muted }}>{item.contactNumber}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <AppButton variant="outline" onPress={() => onDeleteUser(item._id)} loading={deleteUser.isPending}>
                  Delete
                </AppButton>
              </View>
            </AppCard>
          )}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
});
