import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing, themeFor, typography } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const { user, logout } = useAuth();
  const [showSheet, setShowSheet] = useState(true);
  const router = useRouter();

  useFocusEffect(() => {
    setShowSheet(true);
  });

  return (
    <SafeScreen>
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SectionHeader>Profile</SectionHeader>
      <AppCard style={styles.card}>
        <Text style={[styles.title, { color: theme.text }]}>{user?.name ?? 'User'}</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>{user?.email}</Text>
        {user?.contactNumber ? <Text style={[styles.meta, { color: theme.muted }]}>{user.contactNumber}</Text> : null}
        <Text style={[styles.meta, { color: theme.muted }]}>
          Company: {typeof user?.company === 'object' ? (user.company as any)?.businessName : '—'}
        </Text>
        <View style={styles.actions}>
          <AppButton variant="outline" onPress={logout}>
            Logout
          </AppButton>
        </View>
      </AppCard>

      <SectionHeader>More Options</SectionHeader>
      <AppCard style={styles.listCard}>
        <AppButton onPress={() => setShowSheet(true)} fullWidth tone="info">
          Open More Options
        </AppButton>
      </AppCard>
      </View>

      <Modal visible={showSheet} animationType="fade" transparent>
        <Pressable style={styles.overlay} onPress={() => setShowSheet(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>More Options</Text>
              <Pressable
                style={[styles.iconButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => setShowSheet(false)}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.sheetList}>
              <Pressable style={styles.sheetRow} onPress={() => { setShowSheet(false); router.push('/analytics'); }}>
                <Ionicons name="stats-chart" size={20} color={theme.text} />
                <Text style={[styles.sheetText, { color: theme.text }]}>Analytics</Text>
              </Pressable>
              <Pressable style={styles.sheetRow} onPress={() => { setShowSheet(false); router.push('/profile'); }}>
                <Ionicons name="person-circle" size={20} color={theme.text} />
                <Text style={[styles.sheetText, { color: theme.text }]}>Profile</Text>
              </Pressable>
              <Pressable style={styles.sheetRow} onPress={() => { setShowSheet(false); router.push('/users'); }}>
                <Ionicons name="people" size={20} color={theme.text} />
                <Text style={[styles.sheetText, { color: theme.text }]}>Users</Text>
              </Pressable>
              <Pressable style={styles.sheetRow} onPress={() => { setShowSheet(false); router.push('/payment-dashboard'); }}>
                <Ionicons name="card" size={20} color={theme.text} />
                <Text style={[styles.sheetText, { color: theme.text }]}>Payment Dashboard</Text>
              </Pressable>
              <Pressable style={styles.sheetRow} onPress={() => { setShowSheet(false); logout(); }}>
                <Ionicons name="log-out" size={20} color={theme.danger} />
                <Text style={[styles.sheetText, { color: theme.danger }]}>Logout</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md },
  card: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  meta: {
    fontSize: typography.size.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  listCard: {
    gap: spacing.md,
  },
  optionRow: {
    paddingVertical: spacing.sm,
  },
  option: {
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: typography.size.xl,
    fontWeight: '800',
  },
  sheetList: {
    gap: spacing.sm,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.md,
  },
  sheetText: {
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
