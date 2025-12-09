import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { SectionHeader } from '@/components/ui/section-header';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useCreateSeats, useSeatsQuery } from '@/hooks/use-seats';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SeatsScreen() {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const seatsQuery = useSeatsQuery();
  const createSeats = useCreateSeats();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [floor, setFloor] = useState('1');
  const [startSeat, setStartSeat] = useState('1');
  const [endSeat, setEndSeat] = useState('10');

  const onCreateSeats = async () => {
    try {
      await createSeats.mutateAsync({
        floor: Number(floor),
        startSeat: Number(startSeat),
        endSeat: Number(endSeat),
      });
      setIsModalOpen(false);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  if (seatsQuery.isLoading) {
    return <FullScreenLoader message="Loading seats..." />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SectionHeader>Seats</SectionHeader>
      <View style={styles.actionsRow}>
        <AppButton onPress={() => setIsModalOpen(true)}>Add Seats</AppButton>
      </View>
      <FlatList
        data={seatsQuery.data ?? []}
        keyExtractor={(item) => `${item.floor}-${item.seatNumber}`}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ paddingBottom: spacing.lg, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={seatsQuery.isRefetching} onRefresh={seatsQuery.refetch} />}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Seat {item.seatNumber}</Text>
            <Text style={[styles.cardMeta, { color: theme.muted }]}>Floor {item.floor}</Text>
            <AppBadge tone={item.seatNumber === 0 ? 'warning' : 'success'}>
              {item.seatNumber === 0 ? 'Unallocated' : 'Available'}
            </AppBadge>
          </AppCard>
        )}
      />

      <Modal animationType="slide" visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <ScrollView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
          contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Create seats</Text>
          <Text style={[styles.label, { color: theme.text }]}>Floor</Text>
          <TextInput
            value={floor}
            onChangeText={setFloor}
            keyboardType="numeric"
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
            ]}
          />
          <Text style={[styles.label, { color: theme.text }]}>Start seat</Text>
          <TextInput
            value={startSeat}
            onChangeText={setStartSeat}
            keyboardType="numeric"
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
            ]}
          />
          <Text style={[styles.label, { color: theme.text }]}>End seat</Text>
          <TextInput
            value={endSeat}
            onChangeText={setEndSeat}
            keyboardType="numeric"
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
            ]}
          />
          <View style={styles.modalActions}>
            <AppButton variant="outline" onPress={() => setIsModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton onPress={onCreateSeats} loading={createSeats.isPending}>
              Save
            </AppButton>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  card: {
    flex: 1,
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: typography.size.sm,
  },
  modalContainer: { flex: 1 },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
