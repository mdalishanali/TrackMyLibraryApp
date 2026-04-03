import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { themeFor } from '@/constants/design';
import { formatDate } from '@/utils/format';

type Theme = ReturnType<typeof themeFor>;

type StatusEntry = {
  _id?: string;
  status: 'Active' | 'Inactive' | 'Joined';
  date: string;
  comment?: string;
};

type Props = {
  history: StatusEntry[];
  theme: Theme;
  animationDelay?: number;
};

const getStatusColor = (status: string, theme: Theme) => {
  if (status === 'Joined') return theme.primary;
  if (status === 'Active') return theme.success;
  return theme.danger;
};

const getStatusLabel = (status: string) => {
  if (status === 'Joined') return 'ADMISSION';
  return status.toUpperCase();
};

export function StatusTimeline({ history, theme, animationDelay = 300 }: Props) {
  if (!history || history.length === 0) return null;

  const reversed = history.slice().reverse();

  return (
    <Animated.View entering={FadeInDown.delay(animationDelay).duration(600)}>
      <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 4 }]}>Status Timeline</Text>
      <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {reversed.map((item, index) => {
          const color = getStatusColor(item.status, theme);
          const isLast = index === reversed.length - 1;

          return (
            <View key={item._id || index} style={[styles.item, isLast && { borderBottomWidth: 0 }]}>
              <View style={styles.indicator}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                {!isLast && <View style={[styles.line, { backgroundColor: theme.border + '50' }]} />}
              </View>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={[styles.status, { color }]}>{getStatusLabel(item.status)}</Text>
                  <Text style={[styles.date, { color: theme.muted }]}>{formatDate(item.date)}</Text>
                </View>
                {item.comment && (
                  <Text style={[styles.comment, { color: theme.muted }]}>{item.comment}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  container: {
    borderRadius: 32,
    borderWidth: 1.5,
    paddingVertical: 16,
  },
  item: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  indicator: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 16,
    bottom: -12,
    left: 9,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
  },
  comment: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
});
