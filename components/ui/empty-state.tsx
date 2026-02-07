import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  image?: any;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  theme: any;
}

export function EmptyState({
  title,
  subtitle,
  image,
  icon,
  actionLabel,
  onAction,
  theme,
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(600)}
      style={[styles.container, { borderColor: theme.border }]}
    >
      {image ? (
        <Image
          source={image}
          style={styles.image}
          contentFit="contain"
        />
      ) : icon ? (
        <View style={[styles.iconBox, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name={icon} size={64} color={theme.muted + '40'} />
        </View>
      ) : null}

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAction();
          }}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.primary + '10' },
            pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={[styles.actionText, { color: theme.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 24,
    padding: 40,
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 8,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  actionButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
