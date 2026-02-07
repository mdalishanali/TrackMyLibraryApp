import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E1E9EE',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ theme }: { theme: any }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Skeleton width={56} height={56} borderRadius={20} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonMetricCard({ theme }: { theme: any }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Skeleton width={40} height={40} borderRadius={12} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="50%" height={24} />
        <Skeleton width="70%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3, theme }: { count?: number; theme: any }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} theme={theme} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E9EE20',
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 16,
  },
});
