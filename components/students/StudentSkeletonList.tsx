import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { radius, spacing, themeFor } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

const Skeleton = ({ height, width = '100%', radiusOverride }: { height: number; width?: number | string; radiusOverride?: number }) => {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          width: width as any,
          borderRadius: radiusOverride ?? radius.md,
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
          opacity: pulse,
        },
      ]}
    />
  );
};

export const StudentSkeletonList = () => {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Skeleton height={60} width={60} radiusOverride={20} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton height={18} width="60%" />
                <Skeleton height={20} width={70} radiusOverride={8} />
              </View>
              <Skeleton height={14} width="40%" />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border + '50' }]} />

          <View style={styles.metaGrid}>
            <Skeleton height={36} width="48%" radiusOverride={12} />
            <Skeleton height={36} width="48%" radiusOverride={12} />
            <Skeleton height={36} width="48%" radiusOverride={12} />
            <Skeleton height={36} width="48%" radiusOverride={12} />
          </View>

          <View style={styles.actions}>
            <Skeleton height={40} width="30%" radiusOverride={12} />
            <Skeleton height={40} width="30%" radiusOverride={12} />
            <Skeleton height={40} width="30%" radiusOverride={12} />
          </View>
        </View>
      ))}
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    ...{
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 3,
    },
  },
  skeleton: {
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});


export default StudentSkeletonList;
