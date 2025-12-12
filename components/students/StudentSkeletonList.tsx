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
          width,
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
            <Skeleton height={48} width={48} radiusOverride={24} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Skeleton height={14} width="60%" />
              <Skeleton height={12} width="40%" />
            </View>
            <Skeleton height={24} width={64} radiusOverride={12} />
          </View>
          <View style={styles.metaRow}>
            <Skeleton height={12} width="30%" />
            <Skeleton height={12} width="25%" />
            <Skeleton height={12} width="20%" />
          </View>
          <View style={styles.metaRow}>
            <Skeleton height={12} width="35%" />
            <Skeleton height={12} width="30%" />
          </View>
          <Skeleton height={10} width="100%" />
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
});

export default StudentSkeletonList;
